// bank.js — 银行系统（花呗 + 理财）
// 依赖：db.js, main.js, wallet.js, imessage.js

(function() {

  var BILLS_COLLAPSED_MAX = 4
  var HUABEI_STATE_PREFIX = 'huabei_state_'
  var INVEST_STATE_PREFIX = 'investment_state_'
  var WALLET_DATA_PREFIX = 'wechat_wallet_'
  var WORK_STATE_PREFIX = 'work_state_'

  var HUABEI_PHONE = 'HUABEI_ASSISTANT'
  var HUABEI_NAME = '花呗助手'
  var FINANCE_PHONE = 'WANWAN_FINANCE'
  var FINANCE_NAME = '弯弯理财经理'

  var LEVEL_MULTIPLIER = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 5.0 }
  var FUND_UPDATE_MS = 2 * 3600 * 1000
  var GOLD_UPDATE_MS = 0.5 * 3600 * 1000
  var _bankAutoRefreshTimers = {}

  var DEPOSIT_PRODUCTS = [
    { term: 7,   rate: 0.020, label: '7天' },
    { term: 30,  rate: 0.035, label: '30天' },
    { term: 90,  rate: 0.042, label: '90天' },
    { term: 180, rate: 0.048, label: '180天' },
    { term: 365, rate: 0.055, label: '365天' }
  ]

  // ===== 工具函数 =====
  function bankEscape(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
    })
  }

  function formatAmount(num) {
    return Number(num).toFixed(2).replace(/\B(?=(\d{3})+\.)/g, ',')
  }

  function formatBillDate(ts) {
    var d = new Date(ts)
    var mm = d.getMonth() + 1
    var dd = d.getDate()
    var hh = d.getHours().toString().padStart(2, '0')
    var mi = d.getMinutes().toString().padStart(2, '0')
    return mm + '/' + dd + ' ' + hh + ':' + mi
  }

  function formatDateShort(ts) {
    var d = new Date(ts)
    return (d.getMonth() + 1) + '/' + d.getDate()
  }

  function formatTime(ms) {
    if (ms <= 0) return '00:00:00'
    var s = Math.floor(ms / 1000)
    var h = Math.floor(s / 3600)
    var m = Math.floor((s % 3600) / 60)
    return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0') + ':' + (s % 60).toString().padStart(2, '0')
  }

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)) }

  // ===== 数据存储 =====
  async function getWalletData(userId) {
    var row = await db.config.get(WALLET_DATA_PREFIX + userId)
    return row ? row.value : null
  }

  async function saveWalletData(userId, data) {
    await db.config.put({ key: WALLET_DATA_PREFIX + userId, value: data })
  }

  async function getHuabeiState(userId) {
    var row = await db.config.get(HUABEI_STATE_PREFIX + userId)
    return row ? row.value : null
  }

  async function saveHuabeiState(userId, state) {
    await db.config.put({ key: HUABEI_STATE_PREFIX + userId, value: state })
  }

  async function getInvestState(userId) {
    var row = await db.config.get(INVEST_STATE_PREFIX + userId)
    return row ? row.value : null
  }

  async function saveInvestState(userId, state) {
    await db.config.put({ key: INVEST_STATE_PREFIX + userId, value: state })
  }

  async function getWorkLevel(userId) {
    var row = await db.config.get(WORK_STATE_PREFIX + userId)
    var exp = row ? (row.value.exp || 0) : 0
    if (exp >= 200) return 5
    if (exp >= 150) return 4
    if (exp >= 100) return 3
    if (exp >= 50) return 2
    return 1
  }

  function getDefaultInvestState() {
    return {
      funds: { shares: 0, currentNav: 1.0000, lastNavUpdate: null, navHistory: [], transactions: [] },
      deposits: [],
      gold: { holdingGrams: 0, avgCostPerGram: 0, currentPrice: 580.00, lastPriceUpdate: null, priceHistory: [], transactions: [] },
      notified: {},
      autoRefreshStarted: { fund: false, gold: false }
    }
  }

  function normalizeInvestState(state) {
    var base = getDefaultInvestState()
    state = state || base
    state.funds = state.funds || base.funds
    state.deposits = state.deposits || []
    state.gold = state.gold || base.gold
    state.notified = state.notified || {}
    state.autoRefreshStarted = state.autoRefreshStarted || {}
    state.autoRefreshStarted.fund = !!state.autoRefreshStarted.fund
    state.autoRefreshStarted.gold = !!state.autoRefreshStarted.gold
    return state
  }

  // ===== 信息发送（iMessage 联动）=====
  async function getUserPhone(userId) {
    var char = await db.characters.get(userId)
    return (char && char.identity && char.identity.phone) || null
  }

  async function sendFinanceSMS(ownerPhone, senderPhone, senderName, messageText) {
    if (!ownerPhone) return
    var conv = await db.smsConversations
      .where('[ownerPhone+remotePhone]')
      .equals([ownerPhone, senderPhone])
      .first()

    var now = Date.now()
    var convId
    var avatar = (typeof SMS_DEFAULT_AVATAR !== 'undefined') ? SMS_DEFAULT_AVATAR : ''

    if (conv) {
      convId = conv.id
      await db.smsConversations.update(convId, {
        lastMessage: messageText,
        lastMessageAt: now,
        unreadCount: (conv.unreadCount || 0) + 1,
        updatedAt: now
      })
    } else {
      convId = await db.smsConversations.add({
        ownerPhone: ownerPhone,
        remotePhone: senderPhone,
        remoteAvatar: avatar,
        remoteName: senderName,
        lastMessage: messageText,
        lastMessageAt: now,
        unreadCount: 1,
        updatedAt: now
      })
    }

    await db.smsMessages.add({
      conversationId: convId,
      direction: 'in',
      body: messageText,
      createdAt: now,
      read: false
    })
  }

  // ===== 花呗额度计算 =====
  function calcCreditLimit(totalAssets, workLevel) {
    var base = totalAssets * 0.3
    var mult = LEVEL_MULTIPLIER[workLevel] || 1.0
    var limit = clamp(base * mult, 500, 500000)
    return Math.round(limit / 100) * 100
  }

  // ===== 花呗账单懒计算 =====
  async function huabeiLazyEval(state, userId) {
    var now = new Date()
    var changed = false

    // 出账：每月1号
    if (state.pendingCharges && state.pendingCharges.length > 0) {
      var lastBillMonth = state.currentBill && state.currentBill.generatedAt
        ? new Date(state.currentBill.generatedAt).getMonth()
        : -1
      var lastBillYear = state.currentBill && state.currentBill.generatedAt
        ? new Date(state.currentBill.generatedAt).getFullYear()
        : -1

      if (now.getDate() >= 1 && (now.getMonth() !== lastBillMonth || now.getFullYear() !== lastBillYear)) {
        var billAmount = 0
        for (var i = 0; i < state.pendingCharges.length; i++) {
          billAmount += state.pendingCharges[i].amount
        }
        if (billAmount > 0) {
          var dueDate = new Date(now.getFullYear(), now.getMonth(), 10, 23, 59, 59)
          if (dueDate < now) {
            dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10, 23, 59, 59)
          }
          state.currentBill = {
            amount: billAmount,
            generatedAt: Date.now(),
            dueAt: dueDate.getTime(),
            paid: false,
            paidAmount: 0
          }
          state.pendingCharges = []
          state.overdueDays = 0
          state.overdueAccumulated = 0
          if (state.notified) {
            state.notified.dueSoon = false
            state.notified.overdue = false
            state.notified.lowCredit = false
          }
          changed = true
        }
      }
    }

    // 逾期检查
    if (state.currentBill && !state.currentBill.paid && state.currentBill.dueAt) {
      if (now.getTime() > state.currentBill.dueAt) {
        var remaining = state.currentBill.amount - (state.currentBill.paidAmount || 0)
        if (remaining > 0) {
          var msOverdue = now.getTime() - state.currentBill.dueAt
          var daysOverdue = Math.floor(msOverdue / 86400000)
          if (daysOverdue > (state.overdueDays || 0)) {
            var newDays = daysOverdue - (state.overdueDays || 0)
            state.overdueAccumulated = (state.overdueAccumulated || 0) + remaining * 0.0005 * newDays
            state.overdueDays = daysOverdue
            changed = true
          }
        }
      }
    }

    // 通知检查
    var phone = await getUserPhone(userId)
    if (phone && state.notified) {
      // 即将逾期（还款日前3天）
      if (!state.notified.dueSoon && state.currentBill && !state.currentBill.paid && state.currentBill.dueAt) {
        var daysUntilDue = (state.currentBill.dueAt - now.getTime()) / 86400000
        if (daysUntilDue <= 3 && daysUntilDue > 0) {
          var dueStr = formatDateShort(state.currentBill.dueAt)
          var billRemaining = state.currentBill.amount - (state.currentBill.paidAmount || 0)
          await sendFinanceSMS(phone, HUABEI_PHONE, HUABEI_NAME,
            '【花呗】您本月账单¥' + formatAmount(billRemaining) + '将于' + dueStr + '到期，请确保 Checking 账户余额充足并及时还款，避免产生逾期费用。')
          state.notified.dueSoon = true
          changed = true
        }
      }

      // 逾期提醒（只发一次）
      if (!state.notified.overdue && state.overdueDays > 0) {
        var totalOwed = (state.currentBill.amount - (state.currentBill.paidAmount || 0)) + (state.overdueAccumulated || 0)
        await sendFinanceSMS(phone, HUABEI_PHONE, HUABEI_NAME,
          '【花呗】您的花呗账单已逾期，当前应还¥' + formatAmount(totalOwed) + '（含逾期费¥' + formatAmount(state.overdueAccumulated || 0) + '）。逾期将持续产生每日0.05%的利息，请尽快还款。')
        state.notified.overdue = true
        changed = true
      }
    }

    if (changed) await saveHuabeiState(userId, state)
    return state
  }

  // ===== 基金净值更新 =====
  function updateFundNav(funds) {
    var now = Date.now()

    // 首次：初始化 lastNavUpdate，记录起点，立即生成首个净值
    if (!funds.lastNavUpdate) {
      funds.lastNavUpdate = now
      funds.navHistory.push({ nav: funds.currentNav, ts: now })
      return true
    }

    var hoursSince = (now - funds.lastNavUpdate) / (3600 * 1000)
    if (hoursSince < 2) return false

    var currentNav = funds.currentNav || 1.0
    var slot = Math.floor(now / (2 * 3600 * 1000))
    var seed = (slot * 2654435761) >>> 0
    var random = ((seed >> 16) & 0xFFFF) / 65536

    var dailyDrift = 0.0003
    var dailyVolatility = 0.015
    var change = dailyDrift + (random - 0.5) * dailyVolatility * 2
    var scaledChange = change * Math.min(hoursSince / 24, 1)

    var newNav = Math.max(0.5, currentNav * (1 + scaledChange))
    newNav = Math.round(newNav * 10000) / 10000

    funds.currentNav = newNav
    funds.lastNavUpdate = now
    funds.navHistory.push({ nav: newNav, ts: now })
    if (funds.navHistory.length > 90) funds.navHistory.shift()
    return true
  }

  // ===== 黄金价格更新 =====
  function updateGoldPrice(gold) {
    var now = Date.now()

    // 首次：初始化 lastPriceUpdate，记录起点
    if (!gold.lastPriceUpdate) {
      gold.lastPriceUpdate = now
      gold.priceHistory.push({ price: gold.currentPrice, ts: now })
      return true
    }

    var hoursSince = (now - gold.lastPriceUpdate) / (3600 * 1000)
    if (hoursSince < 0.5) return false

    var currentPrice = gold.currentPrice || 580
    var hourSlot = Math.floor(now / (0.5 * 3600 * 1000))
    var seed = (hourSlot * 2654435761) >>> 0
    var random = ((seed >> 16) & 0xFFFF) / 65536

    var meanPrice = 580
    var reversion = (meanPrice - currentPrice) * 0.002
    var volatility = currentPrice * 0.025
    var change = reversion + (random - 0.5) * volatility * 2

    var newPrice = clamp(currentPrice + change, 400, 800)
    newPrice = Math.round(newPrice * 100) / 100

    gold.currentPrice = newPrice
    gold.lastPriceUpdate = now
    gold.priceHistory.push({ price: newPrice, ts: now })
    if (gold.priceHistory.length > 90) gold.priceHistory.shift()
    return true
  }

  async function updateFundNavForUser(userId, investState) {
    investState = normalizeInvestState(investState || await getInvestState(userId))
    var funds = investState.funds
    var navUpdated = updateFundNav(funds)
    if (navUpdated) {
      if (funds.shares > 0 && funds.navHistory.length >= 2) {
        var prev = funds.navHistory[funds.navHistory.length - 2].nav
        var curr = funds.currentNav
        var pctChange = ((curr - prev) / prev) * 100
        if (Math.abs(pctChange) >= 3) {
          var notifyKey = 'fund_volatility_' + funds.lastNavUpdate
          if (!investState.notified[notifyKey]) {
            var phone = await getUserPhone(userId)
            if (phone) {
              var dir = pctChange > 0 ? '上涨' : '下跌'
              var value = funds.shares * curr
              await sendFinanceSMS(phone, FINANCE_PHONE, FINANCE_NAME,
                '【弯弯理财】市场波动提醒：您持有的基金净值' + dir + Math.abs(pctChange).toFixed(2) + '%，当前净值' + curr.toFixed(4) + '，持仓市值¥' + formatAmount(value) + '。请合理评估风险。')
              investState.notified[notifyKey] = true
            }
          }
        }
      }
      await saveInvestState(userId, investState)
    }
    return investState
  }

  async function updateGoldPriceForUser(userId, investState) {
    investState = normalizeInvestState(investState || await getInvestState(userId))
    var gold = investState.gold
    var priceUpdated = updateGoldPrice(gold)
    if (priceUpdated) {
      if (gold.holdingGrams > 0 && gold.priceHistory.length >= 2) {
        var prevPrice = gold.priceHistory[gold.priceHistory.length - 2].price
        var currPrice = gold.currentPrice
        var pctChange = ((currPrice - prevPrice) / prevPrice) * 100
        if (Math.abs(pctChange) >= 5) {
          var notifyKey = 'gold_volatility_' + gold.lastPriceUpdate
          if (!investState.notified[notifyKey]) {
            var phone = await getUserPhone(userId)
            if (phone) {
              var dir = pctChange > 0 ? '上涨' : '下跌'
              var pnl = (currPrice - gold.avgCostPerGram) * gold.holdingGrams
              var pnlStr = pnl >= 0 ? '盈利¥' + formatAmount(pnl) : '亏损¥' + formatAmount(Math.abs(pnl))
              await sendFinanceSMS(phone, FINANCE_PHONE, FINANCE_NAME,
                '【弯弯理财】金价异动提醒：黄金价格' + dir + '至¥' + formatAmount(currPrice) + '/克，您的持仓' + pnlStr + '。请注意风险管理。')
              investState.notified[notifyKey] = true
            }
          }
        }
      }
      await saveInvestState(userId, investState)
    }
    return investState
  }

  // ===== SVG 折线图 =====
  function buildSparkline(points, width, height, color) {
    if (!points || points.length < 2) return '<div class="bank-chart-empty">暂无数据</div>'
    var vals = points.map(function(p) { return p.nav !== undefined ? p.nav : p.price })
    var min = Math.min.apply(null, vals)
    var max = Math.max.apply(null, vals)
    var range = max - min || 1

    var pathPoints = vals.map(function(v, i) {
      var x = (i / (vals.length - 1)) * width
      var y = height - ((v - min) / range) * (height - 4) - 2
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)
    }).join(' ')

    var isUp = vals[vals.length - 1] >= vals[0]
    var strokeColor = color || (isUp ? '#4caf50' : '#e91e63')
    var fillId = 'grad_' + Math.random().toString(36).substr(2, 6)

    return '<svg class="bank-sparkline" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="' + fillId + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + strokeColor + '" stop-opacity="0.15"/>' +
        '<stop offset="100%" stop-color="' + strokeColor + '" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + pathPoints + ' L' + width + ',' + height + ' L0,' + height + ' Z" fill="url(#' + fillId + ')"/>' +
      '<path d="' + pathPoints + '" fill="none" stroke="' + strokeColor + '" stroke-width="1.5"/>' +
    '</svg>'
  }

  // ===== 账单列表构建 =====
  function buildBillItem(bill) {
    var isIncome = bill.type === 'income'
    var sign = isIncome ? '+' : '-'
    var amountClass = isIncome ? 'income' : 'expense'
    var icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up'
    var dateStr = bill.createdAt ? formatBillDate(bill.createdAt) : ''
    return '<div class="bank-bill-item">' +
      '<div class="bank-bill-icon ' + amountClass + '"><i class="fa ' + icon + '"></i></div>' +
      '<div class="bank-bill-main">' +
        '<div class="bank-bill-desc">' + bankEscape(bill.desc || '转账') + '</div>' +
        '<div class="bank-bill-date">' + dateStr + '</div>' +
      '</div>' +
      '<div class="bank-bill-amount ' + amountClass + '">' + sign + '¥' + formatAmount(bill.amount) + '</div>' +
    '</div>'
  }

  async function getUserById(userId) {
    if (window.getCharacter) {
      var cached = await window.getCharacter(userId)
      if (cached) return cached
    }
    return await db.characters.get(userId)
  }

  function clearBankPageTimer(page) {
    if (page && page._bankTimer) {
      clearInterval(page._bankTimer)
      page._bankTimer = null
    }
  }

  async function refreshBankOverviewSurface(user) {
    var page = document.getElementById('bank-overview-page')
    if (!page) return
    var walletData = await getWalletData(user.id)
    var hasBalance = walletData && walletData.wechatBalance !== undefined
    var amounts = page.querySelectorAll('.bank-asset-amount')
    if (amounts[0]) amounts[0].textContent = hasBalance ? '¥' + formatAmount(walletData.wechatBalance) : '¥ --'
    if (amounts[1]) amounts[1].textContent = hasBalance ? '¥' + formatAmount(walletData.checkingBalance) : '¥ --'
    if (amounts[2]) amounts[2].textContent = hasBalance ? '¥' + formatAmount(walletData.savingBalance) : '¥ --'
  }

  async function refreshBankCheckingSurface(user) {
    var page = document.getElementById('bank-checking-page')
    if (!page) return
    var walletData = await getWalletData(user.id)
    var balanceEl = page.querySelector('.bank-balance-value')
    if (balanceEl) balanceEl.textContent = walletData ? '¥' + formatAmount(walletData.checkingBalance) : '¥ --'
    await loadCheckingBills(page, user.id)
  }

  async function refreshBankSavingSurface(user) {
    var page = document.getElementById('bank-saving-page')
    if (!page) return
    var walletData = await getWalletData(user.id)
    var balanceEl = page.querySelector('.bank-balance-value')
    if (balanceEl) balanceEl.textContent = walletData ? '¥' + formatAmount(walletData.savingBalance) : '¥ --'
    await loadSavingBills(page, user.id)
  }

  async function refreshVisibleBankSurfaces(user) {
    await refreshBankOverviewSurface(user)
    await refreshBankCheckingSurface(user)
    await refreshBankSavingSurface(user)
    if (document.getElementById('bank-huabei-page')) await renderHuabeiPage(user, document.getElementById('bank-huabei-page'))
    if (document.getElementById('bank-fund-page')) await renderFundPage(user, document.getElementById('bank-fund-page'))
    if (document.getElementById('bank-deposit-page')) await renderDepositPage(user, document.getElementById('bank-deposit-page'))
    if (document.getElementById('bank-gold-page')) await renderGoldPage(user, document.getElementById('bank-gold-page'))
  }

  async function markInvestAutoRefreshStarted(userId, kind) {
    var investState = normalizeInvestState(await getInvestState(userId))
    if (!investState.autoRefreshStarted[kind]) {
      investState.autoRefreshStarted[kind] = true
      await saveInvestState(userId, investState)
    }
    startInvestAutoRefreshTimer(userId)
    return investState
  }

  function startInvestAutoRefreshTimer(userId) {
    if (_bankAutoRefreshTimers[userId]) return
    _bankAutoRefreshTimers[userId] = setInterval(function() {
      runInvestAutoRefresh(userId)
    }, 60000)
    runInvestAutoRefresh(userId)
  }

  async function runInvestAutoRefresh(userId) {
    var investState = await getInvestState(userId)
    if (!investState) return
    investState = normalizeInvestState(investState)
    var changed = false
    if (investState.autoRefreshStarted.fund) {
      var beforeFundUpdate = investState.funds.lastNavUpdate
      investState = await updateFundNavForUser(userId, investState)
      changed = changed || beforeFundUpdate !== investState.funds.lastNavUpdate
    }
    if (investState.autoRefreshStarted.gold) {
      var beforeGoldUpdate = investState.gold.lastPriceUpdate
      investState = await updateGoldPriceForUser(userId, investState)
      changed = changed || beforeGoldUpdate !== investState.gold.lastPriceUpdate
    }
    if (changed) {
      var user = await getUserById(userId)
      if (user) await refreshVisibleBankSurfaces(user)
    }
  }

  async function startPersistedInvestAutoRefreshTimers() {
    if (!window.db || !db.config) return
    var rows = await db.config.toArray()
    rows = rows.filter(function(row) { return row.key && row.key.indexOf(INVEST_STATE_PREFIX) === 0 })
    rows.forEach(function(row) {
      var state = normalizeInvestState(row.value)
      if (state.autoRefreshStarted.fund || state.autoRefreshStarted.gold) {
        var userId = row.key.slice(INVEST_STATE_PREFIX.length)
        var numericId = parseInt(userId, 10)
        startInvestAutoRefreshTimer(isNaN(numericId) ? userId : numericId)
      }
    })
  }

  // ===== Modal 工具 =====
  function createOverlay() {
    var el = document.createElement('div')
    el.className = 'sheet-overlay'
    el.style.zIndex = '200'
    return el
  }

  function createSheet(html) {
    var el = document.createElement('div')
    el.className = 'center-modal'
    el.style.zIndex = '201'
    el.innerHTML = html
    return el
  }

  function showModal(html, onClose) {
    var overlay = createOverlay()
    var sheet = createSheet(html)
    document.getElementById('app').appendChild(overlay)
    document.getElementById('app').appendChild(sheet)
    requestAnimationFrame(function() { overlay.classList.add('show'); sheet.classList.add('show') })

    var close = function() {
      overlay.classList.remove('show'); sheet.classList.remove('show')
      setTimeout(function() { overlay.remove(); sheet.remove() }, 200)
      if (onClose) onClose()
    }
    overlay.addEventListener('click', close)
    return { overlay: overlay, sheet: sheet, close: close }
  }

  // ===== 银行系统入口 =====
  window.showBankPage = function(user) {
    showBankOverviewPage(user)
  }

  // ===== 账户总览页 =====
  async function showBankOverviewPage(user) {
    var walletData = await getWalletData(user.id)
    var hasBalance = walletData && walletData.wechatBalance !== undefined

    var cashAmount = hasBalance ? '¥' + formatAmount(walletData.wechatBalance) : '¥ --'
    var checkingAmount = hasBalance ? '¥' + formatAmount(walletData.checkingBalance) : '¥ --'
    var savingAmount = hasBalance ? '¥' + formatAmount(walletData.savingBalance) : '¥ --'

    var page = document.createElement('div')
    page.id = 'bank-overview-page'
    page.className = 'full-page bank-overview-page'

    page.innerHTML =
      '<div class="page-header">' +
        '<button class="header-back" id="bank-overview-back">' +
          '<i class="fa fa-angle-left"></i>' +
        '</button>' +
        '<span class="header-title">银行</span>' +
      '</div>' +
      '<div class="bank-overview-scroll">' +
        '<div class="bank-overview-section-label">我的资产</div>' +

        '<div class="bank-asset-card bank-asset-cash">' +
          '<div class="bank-asset-left">' +
            '<div class="bank-asset-icon bank-icon-cash"><i class="fa-solid fa-piggy-bank"></i></div>' +
            '<div class="bank-asset-info">' +
              '<div class="bank-asset-name">零钱</div>' +
              '<div class="bank-asset-sub">余额账户</div>' +
            '</div>' +
          '</div>' +
          '<div class="bank-asset-right">' +
            '<span class="bank-asset-amount">' + cashAmount + '</span>' +
          '</div>' +
        '</div>' +

        '<button class="bank-asset-card bank-asset-checking" id="bank-go-checking">' +
          '<div class="bank-asset-left">' +
            '<div class="bank-asset-icon bank-icon-checking"><i class="fa-solid fa-money-bill"></i></div>' +
            '<div class="bank-asset-info">' +
              '<div class="bank-asset-name">CHECKING</div>' +
              '<div class="bank-asset-sub">活期账户</div>' +
            '</div>' +
          '</div>' +
          '<div class="bank-asset-right">' +
            '<span class="bank-asset-amount">' + checkingAmount + '</span>' +
            '<i class="fa fa-angle-right bank-asset-arrow"></i>' +
          '</div>' +
        '</button>' +

        '<button class="bank-asset-card bank-asset-saving" id="bank-go-saving">' +
          '<div class="bank-asset-left">' +
            '<div class="bank-asset-icon bank-icon-saving"><i class="fa-solid fa-coins"></i></div>' +
            '<div class="bank-asset-info">' +
              '<div class="bank-asset-name">SAVING</div>' +
              '<div class="bank-asset-sub">储蓄账户</div>' +
            '</div>' +
          '</div>' +
          '<div class="bank-asset-right">' +
            '<span class="bank-asset-amount">' + savingAmount + '</span>' +
            '<i class="fa fa-angle-right bank-asset-arrow"></i>' +
          '</div>' +
        '</button>' +

      '</div>'

    window.openPage(page)

    page.querySelector('#bank-overview-back').addEventListener('click', function() {
      window.closePage('bank-overview-page')
    })

    page.querySelector('#bank-go-checking').addEventListener('click', function() {
      showBankCheckingPage(user)
    })

    page.querySelector('#bank-go-saving').addEventListener('click', function() {
      showBankSavingPage(user)
    })
  }

  // ===== 加载 checking 账单 =====
  async function loadCheckingBills(page, userId) {
    var listEl = page.querySelector('#bank-bills-list')
    if (!listEl) return

    var allBills = await db.finance.where('charId').equals(userId).toArray()
    var bills = allBills.filter(function(b) { return b.source === 'checking' })
    bills.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0) })

    if (!bills.length) {
      listEl.innerHTML = '<div class="bank-empty-hint">暂无账单记录</div>'
      return
    }

    var collapsed = bills.length > BILLS_COLLAPSED_MAX
    var visibleBills = collapsed ? bills.slice(0, BILLS_COLLAPSED_MAX) : bills

    listEl.innerHTML = visibleBills.map(buildBillItem).join('')

    if (collapsed) {
      var expandBtn = document.createElement('button')
      expandBtn.className = 'bank-bills-expand'
      expandBtn.innerHTML = '查看全部 ' + bills.length + ' 条账单 <i class="fa fa-angle-down"></i>'
      listEl.appendChild(expandBtn)

      expandBtn.addEventListener('click', function() {
        listEl.innerHTML = bills.map(buildBillItem).join('')
      })
    }
  }

  // ===== 加载 saving 账单 =====
  async function loadSavingBills(page, userId) {
    var listEl = page.querySelector('#bank-saving-bills-list')
    if (!listEl) return

    var allBills = await db.finance.where('charId').equals(userId).toArray()
    var bills = allBills.filter(function(b) {
      return b.source === 'saving' || b.source === 'fund' || b.source === 'deposit' || b.source === 'gold'
    })
    bills.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0) })

    if (!bills.length) {
      listEl.innerHTML = '<div class="bank-empty-hint">暂无账单记录</div>'
      return
    }

    var collapsed = bills.length > BILLS_COLLAPSED_MAX
    var visibleBills = collapsed ? bills.slice(0, BILLS_COLLAPSED_MAX) : bills
    listEl.innerHTML = visibleBills.map(buildBillItem).join('')

    if (collapsed) {
      var expandBtn = document.createElement('button')
      expandBtn.className = 'bank-bills-expand'
      expandBtn.innerHTML = '查看全部 ' + bills.length + ' 条账单 <i class="fa fa-angle-down"></i>'
      listEl.appendChild(expandBtn)
      expandBtn.addEventListener('click', function() {
        listEl.innerHTML = bills.map(buildBillItem).join('')
      })
    }
  }

  // ===== CHECKING 账户页 =====
  async function showBankCheckingPage(user) {
    var walletData = await getWalletData(user.id)
    var hasBalance = walletData && walletData.wechatBalance !== undefined

    var cardNumber = (hasBalance && walletData.checkingCardNumber)
      ? walletData.checkingCardNumber
      : (user.identity && user.identity.bankCard || '')
    var last4 = cardNumber ? cardNumber.slice(-4) : '****'
    var balanceText = hasBalance ? '¥' + formatAmount(walletData.checkingBalance) : '¥ --'

    var page = document.createElement('div')
    page.id = 'bank-checking-page'
    page.className = 'full-page bank-detail-page'

    page.innerHTML =
      '<div class="page-header">' +
        '<button class="header-back" id="bank-checking-back">' +
          '<i class="fa fa-angle-left"></i>' +
        '</button>' +
        '<span class="header-title">CHECKING</span>' +
        '<button class="header-action" id="bank-transfer-btn" style="font-size:13px;color:#606e82;padding:0 12px">' +
          '<i class="fa-solid fa-arrow-right-arrow-left"></i> 转账' +
        '</button>' +
      '</div>' +
      '<div class="bank-detail-scroll">' +

        '<div class="bank-card-visual checking">' +
          '<div class="bank-card-top">' +
            '<div class="bank-card-bank-name"><i class="fa-solid fa-money-bill"></i> WanWan Bank</div>' +
            '<div class="bank-card-type-badge">CHECKING</div>' +
          '</div>' +
          '<div class="bank-card-chip"></div>' +
          '<div class="bank-card-number">•••• •••• •••• ' + bankEscape(last4) + '</div>' +
          '<div class="bank-card-bottom">' +
            '<div class="bank-card-holder">' + bankEscape(String(user.name || '未命名').toUpperCase()) + '</div>' +
            '<div class="bank-card-brand">UNIONPAY</div>' +
          '</div>' +
        '</div>' +

        '<div class="bank-balance-block">' +
          '<div class="bank-balance-label">账户余额</div>' +
          '<div class="bank-balance-value">' + balanceText + '</div>' +
        '</div>' +

        '<div class="bank-section-title">近期账单</div>' +
        '<div class="bank-list-card" id="bank-bills-list">' +
          '<div class="bank-empty-hint">加载中...</div>' +
        '</div>' +

        '<div class="bank-section-title">花呗</div>' +
        '<div class="bank-list-card">' +
          '<div class="bank-feature-row" id="bank-huabei-entry">' +
            '<div class="bank-feature-icon huabei"><i class="fa-solid fa-hand-holding-dollar"></i></div>' +
            '<div class="bank-feature-info">' +
              '<div class="bank-feature-name">花呗</div>' +
              '<div class="bank-feature-sub">先消费，后付款</div>' +
            '</div>' +
            '<i class="fa fa-angle-right bank-feature-arrow"></i>' +
          '</div>' +
        '</div>' +

      '</div>'

    window.openPage(page)

    page.querySelector('#bank-checking-back').addEventListener('click', function() {
      window.closePage('bank-checking-page')
    })

    page.querySelector('#bank-huabei-entry').addEventListener('click', function() {
      showHuabeiPage(user)
    })

    page.querySelector('#bank-transfer-btn').addEventListener('click', function() {
      showTransferModal(user, 'checking')
    })

    loadCheckingBills(page, user.id)
  }

  // ===== SAVING 账户页 =====
  async function showBankSavingPage(user) {
    var walletData = await getWalletData(user.id)
    var hasBalance = walletData && walletData.wechatBalance !== undefined

    var cardNumber = (hasBalance && walletData.savingCardNumber)
      ? walletData.savingCardNumber
      : (user.identity && user.identity.bankCard || '')
    var last4 = cardNumber ? cardNumber.slice(-4) : '****'
    var balanceText = hasBalance ? '¥' + formatAmount(walletData.savingBalance) : '¥ --'

    var page = document.createElement('div')
    page.id = 'bank-saving-page'
    page.className = 'full-page bank-detail-page'

    page.innerHTML =
      '<div class="page-header">' +
        '<button class="header-back" id="bank-saving-back">' +
          '<i class="fa fa-angle-left"></i>' +
        '</button>' +
        '<span class="header-title">SAVING</span>' +
        '<button class="header-action" id="bank-saving-transfer-btn" style="font-size:13px;color:#9a8260;padding:0 12px">' +
          '<i class="fa-solid fa-arrow-right-arrow-left"></i> 转账' +
        '</button>' +
      '</div>' +
      '<div class="bank-detail-scroll">' +

        '<div class="bank-card-visual saving">' +
          '<div class="bank-card-top">' +
            '<div class="bank-card-bank-name"><i class="fa-solid fa-coins"></i> WanWan Bank</div>' +
            '<div class="bank-card-type-badge">SAVING</div>' +
          '</div>' +
          '<div class="bank-card-chip"></div>' +
          '<div class="bank-card-number">•••• •••• •••• ' + bankEscape(last4) + '</div>' +
          '<div class="bank-card-bottom">' +
            '<div class="bank-card-holder">' + bankEscape(String(user.name || '未命名').toUpperCase()) + '</div>' +
            '<div class="bank-card-brand">UNIONPAY</div>' +
          '</div>' +
        '</div>' +

        '<div class="bank-balance-block">' +
          '<div class="bank-balance-label">账户余额</div>' +
          '<div class="bank-balance-value">' + balanceText + '</div>' +
        '</div>' +

        '<div class="bank-section-title">近期账单</div>' +
        '<div class="bank-list-card" id="bank-saving-bills-list">' +
          '<div class="bank-empty-hint">加载中...</div>' +
        '</div>' +

        '<div class="bank-section-title">理财产品</div>' +
        '<div class="bank-list-card">' +
          '<div class="bank-feature-row" id="bank-fund-entry">' +
            '<div class="bank-feature-icon fund"><i class="fa-solid fa-chart-line"></i></div>' +
            '<div class="bank-feature-info">' +
              '<div class="bank-feature-name">基金理财</div>' +
              '<div class="bank-feature-sub">稳健收益，灵活申赎</div>' +
            '</div>' +
            '<i class="fa fa-angle-right bank-feature-arrow"></i>' +
          '</div>' +
          '<div class="bank-feature-row" id="bank-deposit-entry">' +
            '<div class="bank-feature-icon deposit"><i class="fa-solid fa-vault"></i></div>' +
            '<div class="bank-feature-info">' +
              '<div class="bank-feature-name">定期存款</div>' +
              '<div class="bank-feature-sub">安全稳定，利率优惠</div>' +
            '</div>' +
            '<i class="fa fa-angle-right bank-feature-arrow"></i>' +
          '</div>' +
          '<div class="bank-feature-row" id="bank-gold-entry">' +
            '<div class="bank-feature-icon gold"><i class="fa-solid fa-gem"></i></div>' +
            '<div class="bank-feature-info">' +
              '<div class="bank-feature-name">黄金投资</div>' +
              '<div class="bank-feature-sub">实物黄金与积存金</div>' +
            '</div>' +
            '<i class="fa fa-angle-right bank-feature-arrow"></i>' +
          '</div>' +
        '</div>' +

      '</div>'

    window.openPage(page)

    page.querySelector('#bank-saving-back').addEventListener('click', function() {
      window.closePage('bank-saving-page')
    })

    page.querySelector('#bank-fund-entry').addEventListener('click', function() {
      showFundPage(user)
    })

    page.querySelector('#bank-deposit-entry').addEventListener('click', function() {
      showDepositPage(user)
    })

    page.querySelector('#bank-gold-entry').addEventListener('click', function() {
      showGoldPage(user)
    })

    page.querySelector('#bank-saving-transfer-btn').addEventListener('click', function() {
      showTransferModal(user, 'saving')
    })

    loadSavingBills(page, user.id)
  }

  // ===== 账户转账 Modal =====
  async function showTransferModal(user, fromAccount) {
    var walletData = await getWalletData(user.id)
    if (!walletData) {
      window.toast && window.toast('请先生成余额')
      return
    }

    var fromLabel = fromAccount === 'checking' ? 'CHECKING' : 'SAVING'
    var toLabel = fromAccount === 'checking' ? 'SAVING' : 'CHECKING'
    var fromBalance = fromAccount === 'checking' ? (walletData.checkingBalance || 0) : (walletData.savingBalance || 0)

    var modal = showModal(
      '<div class="sheet-title">转账</div>' +
      '<div class="bank-transfer-info">' +
        '<div class="bank-transfer-direction">' +
          '<span class="bank-transfer-from">' + fromLabel + '</span>' +
          '<i class="fa-solid fa-arrow-right" style="color:#c0c0c0;margin:0 12px"></i>' +
          '<span class="bank-transfer-to">' + toLabel + '</span>' +
        '</div>' +
        '<div class="bank-transfer-avail">可转金额：¥' + formatAmount(fromBalance) + '</div>' +
      '</div>' +
      '<div class="bank-transfer-input-wrap">' +
        '<span class="bank-transfer-yen">¥</span>' +
        '<input type="number" class="bank-transfer-input" id="bank-transfer-amount" placeholder="请输入金额" step="0.01" min="0.01" max="' + fromBalance + '">' +
      '</div>' +
      '<div class="bank-modal-actions">' +
        '<button class="bank-modal-btn bank-modal-btn-cancel" id="bank-transfer-cancel">取消</button>' +
        '<button class="bank-modal-btn bank-modal-btn-confirm" id="bank-transfer-confirm">确认转账</button>' +
      '</div>'
    )

    modal.sheet.querySelector('#bank-transfer-cancel').addEventListener('click', modal.close)
    modal.sheet.querySelector('#bank-transfer-confirm').addEventListener('click', async function() {
      var input = modal.sheet.querySelector('#bank-transfer-amount')
      var amount = parseFloat(input.value)
      if (!amount || amount <= 0) { window.toast && window.toast('请输入有效金额'); return }
      if (amount > fromBalance) { window.toast && window.toast('余额不足'); return }

      var wd = await getWalletData(user.id)
      var freshFromBalance = fromAccount === 'checking' ? (wd.checkingBalance || 0) : (wd.savingBalance || 0)
      if (amount > freshFromBalance) { window.toast && window.toast('余额不足'); return }
      if (fromAccount === 'checking') {
        wd.checkingBalance = (wd.checkingBalance || 0) - amount
        wd.savingBalance = (wd.savingBalance || 0) + amount
      } else {
        wd.savingBalance = (wd.savingBalance || 0) - amount
        wd.checkingBalance = (wd.checkingBalance || 0) + amount
      }
      await saveWalletData(user.id, wd)

      await db.finance.add({ charId: user.id, amount: amount, desc: fromLabel + ' → ' + toLabel + ' 转账', type: 'expense', source: fromAccount, createdAt: Date.now() })
      await db.finance.add({ charId: user.id, amount: amount, desc: fromLabel + ' → ' + toLabel + ' 转账', type: 'income', source: fromAccount === 'checking' ? 'saving' : 'checking', createdAt: Date.now() })

      modal.close()
      window.toast && window.toast('¥' + formatAmount(amount) + ' 转账成功')
      await refreshVisibleBankSurfaces(user)
    })
  }

  // ================================================================
  //                     花呗系统
  // ================================================================

  async function renderHuabeiPage(user, page) {
    clearBankPageTimer(page)
    var state = await getHuabeiState(user.id)
    if (!state || !state.activated) return
    state = await huabeiLazyEval(state, user.id)

    var walletData = await getWalletData(user.id)
    var totalAssets = walletData ? ((walletData.checkingBalance || 0) + (walletData.savingBalance || 0)) : 0
    var workLevel = await getWorkLevel(user.id)
    var creditLimit = calcCreditLimit(totalAssets, workLevel)
    if (creditLimit < (state.usedCredit || 0)) creditLimit = Math.ceil(state.usedCredit / 100) * 100
    state.creditLimit = creditLimit
    await saveHuabeiState(user.id, state)

    var available = creditLimit - (state.usedCredit || 0)
    var hasBill = state.currentBill && state.currentBill.amount > 0 && !state.currentBill.paid
    var billRemaining = hasBill ? (state.currentBill.amount - (state.currentBill.paidAmount || 0)) : 0
    var totalOwed = billRemaining + (state.overdueAccumulated || 0)
    var pendingTotal = 0
    if (state.pendingCharges) {
      for (var i = 0; i < state.pendingCharges.length; i++) pendingTotal += state.pendingCharges[i].amount
    }

    var billHtml = ''
    if (hasBill) {
      var isOverdue = state.overdueDays > 0
      billHtml =
        '<div class="bank-section-title">本月账单</div>' +
        '<div class="bank-list-card">' +
          '<div class="huabei-bill-card">' +
            '<div class="huabei-bill-row">' +
              '<span class="huabei-bill-label">应还金额</span>' +
              '<span class="huabei-bill-val ' + (isOverdue ? 'is-overdue' : '') + '">¥' + formatAmount(totalOwed) + '</span>' +
            '</div>' +
            '<div class="huabei-bill-row">' +
              '<span class="huabei-bill-label">还款日</span>' +
              '<span class="huabei-bill-val">' + formatDateShort(state.currentBill.dueAt) + (isOverdue ? ' <span class="huabei-overdue-badge">已逾期' + state.overdueDays + '天</span>' : '') + '</span>' +
            '</div>' +
            (state.overdueAccumulated > 0 ? '<div class="huabei-bill-row"><span class="huabei-bill-label">逾期费</span><span class="huabei-bill-val is-overdue">¥' + formatAmount(state.overdueAccumulated) + '</span></div>' : '') +
            '<button class="huabei-repay-btn" id="huabei-repay-btn">立即还款</button>' +
          '</div>' +
        '</div>'
    }

    page.innerHTML =
      '<div class="page-header">' +
        '<button class="header-back" id="huabei-back"><i class="fa fa-angle-left"></i></button>' +
        '<span class="header-title">花呗</span>' +
      '</div>' +
      '<div class="bank-detail-scroll">' +
        '<div class="huabei-hero">' +
          '<div class="huabei-hero-label">可用额度</div>' +
          '<div class="huabei-hero-amount">¥' + formatAmount(available) + '</div>' +
          '<div class="huabei-hero-sub">总额度 ¥' + formatAmount(creditLimit) + '</div>' +
          '<div class="huabei-progress-track"><div class="huabei-progress-fill" style="width:' + Math.round(available / creditLimit * 100) + '%"></div></div>' +
        '</div>' +
        billHtml +
        (pendingTotal > 0
          ? '<div class="bank-section-title">待出账</div>' +
            '<div class="bank-list-card"><div class="huabei-pending-card">' +
              '<span class="huabei-pending-label">本月累计消费</span>' +
              '<span class="huabei-pending-val">¥' + formatAmount(pendingTotal) + '</span>' +
            '</div></div>'
          : '') +
        '<div class="bank-section-title">消费记录</div>' +
        '<div class="bank-list-card" id="huabei-records-list">' +
          '<div class="bank-empty-hint">加载中...</div>' +
        '</div>' +
      '</div>'

    page.querySelector('#huabei-back').addEventListener('click', function() {
      window.closePage('bank-huabei-page')
    })

    var repayBtn = page.querySelector('#huabei-repay-btn')
    if (repayBtn) {
      repayBtn.addEventListener('click', function() {
        showRepayModal(user, state, totalOwed, billRemaining)
      })
    }

    var allBills = await db.finance.where('charId').equals(user.id).toArray()
    var huabeiBills = allBills.filter(function(b) { return b.source === 'huabei' })
    huabeiBills.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0) })
    var listEl = page.querySelector('#huabei-records-list')
    if (!huabeiBills.length) {
      listEl.innerHTML = '<div class="bank-empty-hint">暂无消费记录</div>'
    } else {
      var visible = huabeiBills.length > BILLS_COLLAPSED_MAX ? huabeiBills.slice(0, BILLS_COLLAPSED_MAX) : huabeiBills
      listEl.innerHTML = visible.map(buildBillItem).join('')
      if (huabeiBills.length > BILLS_COLLAPSED_MAX) {
        var expandBtn = document.createElement('button')
        expandBtn.className = 'bank-bills-expand'
        expandBtn.innerHTML = '查看全部 ' + huabeiBills.length + ' 条记录 <i class="fa fa-angle-down"></i>'
        listEl.appendChild(expandBtn)
        expandBtn.addEventListener('click', function() {
          listEl.innerHTML = huabeiBills.map(buildBillItem).join('')
        })
      }
    }

    if (state.notified && !state.notified.lowCredit && available < creditLimit * 0.2 && available >= 0) {
      var phone = await getUserPhone(user.id)
      if (phone) {
        await sendFinanceSMS(phone, HUABEI_PHONE, HUABEI_NAME,
          '【花呗】温馨提示：您的花呗可用额度仅剩¥' + formatAmount(available) + '，总额度¥' + formatAmount(creditLimit) + '。请合理安排消费或及时还款释放额度。')
        state.notified.lowCredit = true
        await saveHuabeiState(user.id, state)
      }
    }
  }

  async function showHuabeiPage(user) {
    var state = await getHuabeiState(user.id)

    if (!state || !state.activated) {
      showHuabeiActivatePage(user)
      return
    }

    var page = document.createElement('div')
    page.id = 'bank-huabei-page'
    page.className = 'full-page bank-detail-page'
    await renderHuabeiPage(user, page)
    window.openPage(page)
  }

  // ===== 花呗开通页 =====
  async function showHuabeiActivatePage(user) {
    var walletData = await getWalletData(user.id)
    if (!walletData) {
      window.toast && window.toast('请先在微信钱包中生成余额')
      return
    }
    var totalAssets = (walletData.checkingBalance || 0) + (walletData.savingBalance || 0)
    var workLevel = await getWorkLevel(user.id)
    var creditLimit = calcCreditLimit(totalAssets, workLevel)

    var page = document.createElement('div')
    page.id = 'bank-huabei-activate-page'
    page.className = 'full-page bank-detail-page'

    page.innerHTML =
      '<div class="page-header">' +
        '<button class="header-back" id="huabei-activate-back"><i class="fa fa-angle-left"></i></button>' +
        '<span class="header-title">开通花呗</span>' +
      '</div>' +
      '<div class="bank-detail-scroll" style="display:flex;flex-direction:column;align-items:center;padding-top:60px">' +
        '<div class="huabei-activate-icon"><i class="fa-solid fa-hand-holding-dollar"></i></div>' +
        '<div class="huabei-activate-title">花呗</div>' +
        '<div class="huabei-activate-desc">先消费，后付款</div>' +
        '<div class="huabei-activate-limit">您的预估额度</div>' +
        '<div class="huabei-activate-amount">¥' + formatAmount(creditLimit) + '</div>' +
        '<div class="huabei-activate-info">每月1号出账，10号还款</div>' +
        '<button class="huabei-activate-btn" id="huabei-activate-btn">开通花呗</button>' +
      '</div>'

    window.openPage(page)

    page.querySelector('#huabei-activate-back').addEventListener('click', function() {
      window.closePage('bank-huabei-activate-page')
    })

    page.querySelector('#huabei-activate-btn').addEventListener('click', async function() {
      var state = {
        creditLimit: creditLimit,
        usedCredit: 0,
        activated: true,
        activatedAt: Date.now(),
        currentBill: null,
        pendingCharges: [],
        overdueDays: 0,
        overdueAccumulated: 0,
        repaymentHistory: [],
        notified: { activated: true, lowCredit: false, dueSoon: false, overdue: false }
      }
      await saveHuabeiState(user.id, state)

      // 发送开通成功通知
      var phone = await getUserPhone(user.id)
      if (phone) {
        await sendFinanceSMS(phone, HUABEI_PHONE, HUABEI_NAME,
          '【花呗】恭喜您成功开通花呗！您的信用额度为¥' + formatAmount(creditLimit) + '，享受先消费后付款的便捷体验。请按时还款，保持良好信用。')
      }

      window.toast && window.toast('花呗开通成功！')
      window.closePage('bank-huabei-activate-page')
      showHuabeiPage(user)
    })
  }

  // ===== 花呗还款 Modal =====
  async function showRepayModal(user, huabeiState, totalOwed, billRemaining) {
    var walletData = await getWalletData(user.id)
    var checkingBalance = walletData ? (walletData.checkingBalance || 0) : 0
    var minPay = Math.max(100, Math.round(totalOwed * 0.1 * 100) / 100)
    if (minPay > totalOwed) minPay = totalOwed

    var modal = showModal(
      '<div class="sheet-title">花呗还款</div>' +
      '<div class="huabei-repay-info">' +
        '<div class="huabei-repay-row"><span>应还金额</span><span class="huabei-repay-owed">¥' + formatAmount(totalOwed) + '</span></div>' +
        '<div class="huabei-repay-row"><span>Checking 余额</span><span>¥' + formatAmount(checkingBalance) + '</span></div>' +
        '<div class="huabei-repay-row"><span>最低还款</span><span>¥' + formatAmount(minPay) + '</span></div>' +
      '</div>' +
      '<div class="bank-transfer-input-wrap">' +
        '<span class="bank-transfer-yen">¥</span>' +
        '<input type="number" class="bank-transfer-input" id="huabei-repay-amount" value="' + totalOwed.toFixed(2) + '" step="0.01" min="' + minPay.toFixed(2) + '" max="' + totalOwed.toFixed(2) + '">' +
      '</div>' +
      '<div class="huabei-repay-shortcuts">' +
        '<button class="huabei-repay-shortcut" data-amount="' + totalOwed.toFixed(2) + '">全额还款</button>' +
        '<button class="huabei-repay-shortcut" data-amount="' + minPay.toFixed(2) + '">最低还款</button>' +
      '</div>' +
      '<div class="bank-modal-actions">' +
        '<button class="bank-modal-btn bank-modal-btn-cancel" id="huabei-repay-cancel">取消</button>' +
        '<button class="bank-modal-btn bank-modal-btn-confirm" id="huabei-repay-confirm">确认还款</button>' +
      '</div>'
    )

    modal.sheet.querySelectorAll('.huabei-repay-shortcut').forEach(function(btn) {
      btn.addEventListener('click', function() {
        modal.sheet.querySelector('#huabei-repay-amount').value = btn.dataset.amount
      })
    })

    modal.sheet.querySelector('#huabei-repay-cancel').addEventListener('click', modal.close)
    modal.sheet.querySelector('#huabei-repay-confirm').addEventListener('click', async function() {
      var amount = parseFloat(modal.sheet.querySelector('#huabei-repay-amount').value)
      if (!amount || amount < minPay) { window.toast && window.toast('还款金额不能低于最低还款¥' + formatAmount(minPay)); return }
      if (amount > totalOwed) amount = totalOwed

      var wd = await getWalletData(user.id)
      if (!wd || (wd.checkingBalance || 0) < amount) { window.toast && window.toast('Checking 余额不足'); return }

      wd.checkingBalance -= amount
      await saveWalletData(user.id, wd)

      var freshState = await getHuabeiState(user.id)
      // 先扣逾期费
      var overdueDeduction = Math.min(amount, freshState.overdueAccumulated || 0)
      freshState.overdueAccumulated = (freshState.overdueAccumulated || 0) - overdueDeduction
      var billDeduction = amount - overdueDeduction

      freshState.usedCredit = Math.max(0, (freshState.usedCredit || 0) - billDeduction)
      if (freshState.currentBill) {
        freshState.currentBill.paidAmount = (freshState.currentBill.paidAmount || 0) + billDeduction
        if (freshState.currentBill.paidAmount >= freshState.currentBill.amount) {
          freshState.currentBill.paid = true
          freshState.overdueDays = 0
          freshState.overdueAccumulated = 0
        }
      }

      freshState.repaymentHistory = freshState.repaymentHistory || []
      freshState.repaymentHistory.unshift({ amount: amount, paidAt: Date.now(), fromAccount: 'checking' })
      if (freshState.repaymentHistory.length > 10) freshState.repaymentHistory.pop()

      // 还款后重置低额度通知
      if (freshState.notified) freshState.notified.lowCredit = false

      await saveHuabeiState(user.id, freshState)

      await db.finance.add({ charId: user.id, amount: amount, desc: '花呗还款', type: 'expense', source: 'checking', createdAt: Date.now() })

      modal.close()
      window.toast && window.toast('还款成功 ¥' + formatAmount(amount))
      await refreshVisibleBankSurfaces(user)
    })
  }

  // ===== 花呗消费接口（供 wechat.js 调用）=====
  window.huabeiSpend = async function(userId, amount, desc) {
    var state = await getHuabeiState(userId)
    if (!state || !state.activated) return { ok: false, msg: '花呗未开通' }

    var available = (state.creditLimit || 0) - (state.usedCredit || 0)
    if (amount > available) return { ok: false, msg: '花呗额度不足' }

    state.usedCredit = (state.usedCredit || 0) + amount
    state.pendingCharges = state.pendingCharges || []
    state.pendingCharges.push({ amount: amount, desc: desc, createdAt: Date.now() })
    await saveHuabeiState(userId, state)

    await db.finance.add({ charId: userId, amount: amount, desc: desc, type: 'expense', source: 'huabei', createdAt: Date.now() })

    // 检查额度过低
    var newAvailable = state.creditLimit - state.usedCredit
    if (state.notified && !state.notified.lowCredit && newAvailable < state.creditLimit * 0.2) {
      var phone = await getUserPhone(userId)
      if (phone) {
        await sendFinanceSMS(phone, HUABEI_PHONE, HUABEI_NAME,
          '【花呗】温馨提示：您的花呗可用额度仅剩¥' + formatAmount(newAvailable) + '，总额度¥' + formatAmount(state.creditLimit) + '。请合理安排消费或及时还款释放额度。')
        state.notified.lowCredit = true
        await saveHuabeiState(userId, state)
      }
    }

    return { ok: true }
  }

  window.huabeiRefund = async function(userId, amount, desc) {
    var state = await getHuabeiState(userId)
    if (!state || !state.activated) return { ok: false, msg: '花呗未开通' }

    amount = Number(amount) || 0
    if (amount <= 0) return { ok: false, msg: '退款金额无效' }

    state.usedCredit = Math.max(0, Math.round(((state.usedCredit || 0) - amount) * 100) / 100)
    state.pendingCharges = state.pendingCharges || []

    var refundIndex = -1
    for (var i = state.pendingCharges.length - 1; i >= 0; i--) {
      var charge = state.pendingCharges[i]
      if (Math.abs((Number(charge.amount) || 0) - amount) < 0.005) {
        refundIndex = i
        break
      }
    }
    if (refundIndex >= 0) state.pendingCharges.splice(refundIndex, 1)

    if (state.notified) state.notified.lowCredit = false
    await saveHuabeiState(userId, state)
    await db.finance.add({ charId: userId, amount: amount, desc: desc || '花呗转账被退回', type: 'income', source: 'huabei', createdAt: Date.now() })
    return { ok: true }
  }

  window.getHuabeiInfo = async function(userId) {
    var state = await getHuabeiState(userId)
    if (!state || !state.activated) return null
    state = await huabeiLazyEval(state, userId)
    return { creditLimit: state.creditLimit, usedCredit: state.usedCredit, available: state.creditLimit - state.usedCredit }
  }

  // ================================================================
  //                     基金理财
  // ================================================================

  async function renderFundPage(user, page) {
    clearBankPageTimer(page)
    var walletData = await getWalletData(user.id)
    if (!walletData) { window.toast && window.toast('请先生成余额'); return }

    var investState = await updateFundNavForUser(user.id, normalizeInvestState(await getInvestState(user.id)))
    var funds = investState.funds

    var holdingValue = funds.shares * funds.currentNav
    var avgBuyNav = funds.transactions.length > 0
      ? funds.transactions.filter(function(t) { return t.type === 'buy' }).reduce(function(sum, t) { return sum + t.nav * t.shares }, 0) /
        Math.max(1, funds.transactions.filter(function(t) { return t.type === 'buy' }).reduce(function(sum, t) { return sum + t.shares }, 0))
      : funds.currentNav
    var totalReturn = funds.shares > 0 ? ((funds.currentNav - avgBuyNav) / avgBuyNav * 100) : 0

    var nextUpdateIn = funds.lastNavUpdate
      ? Math.max(0, (funds.lastNavUpdate + FUND_UPDATE_MS) - Date.now())
      : 0

    page.innerHTML =
      '<div class="page-header">' +
        '<button class="header-back" id="fund-back"><i class="fa fa-angle-left"></i></button>' +
        '<span class="header-title">基金理财</span>' +
      '</div>' +
      '<div class="bank-detail-scroll">' +

        '<div class="invest-hero">' +
          '<div class="invest-hero-label">持仓市值</div>' +
          '<div class="invest-hero-amount">¥' + formatAmount(holdingValue) + '</div>' +
          '<div class="invest-hero-return ' + (totalReturn >= 0 ? 'is-up' : 'is-down') + '">' +
            (totalReturn >= 0 ? '+' : '') + totalReturn.toFixed(2) + '%' +
          '</div>' +
        '</div>' +

        '<div class="invest-info-grid">' +
          '<div class="invest-info-cell"><div class="invest-info-val">' + funds.currentNav.toFixed(4) + '</div><div class="invest-info-label">当前净值</div></div>' +
          '<div class="invest-info-cell"><div class="invest-info-val">' + funds.shares.toFixed(2) + '</div><div class="invest-info-label">持有份额</div></div>' +
          '<div class="invest-info-cell"><div class="invest-info-val" id="fund-countdown">' + formatTime(nextUpdateIn) + '</div><div class="invest-info-label">下次更新</div></div>' +
        '</div>' +

        '<div class="bank-section-title">净值走势</div>' +
        '<div class="bank-list-card" style="padding:16px">' +
          buildSparkline(funds.navHistory, 300, 80) +
        '</div>' +

        '<div class="invest-actions">' +
          '<button class="invest-btn invest-btn-buy" id="fund-buy-btn">买入</button>' +
          '<button class="invest-btn invest-btn-sell" id="fund-sell-btn" ' + (funds.shares <= 0 ? 'disabled' : '') + '>卖出</button>' +
        '</div>' +

        '<div class="bank-section-title">交易记录</div>' +
        '<div class="bank-list-card" id="fund-records">' +
          (funds.transactions.length === 0 ? '<div class="bank-empty-hint">暂无交易记录</div>' :
            funds.transactions.slice(0, 10).map(function(t) {
              return buildBillItem({
                type: t.type === 'buy' ? 'expense' : 'income',
                amount: t.amount,
                desc: (t.type === 'buy' ? '申购基金' : '赎回基金') + ' ' + t.shares.toFixed(2) + '份',
                createdAt: t.ts
              })
            }).join('')) +
        '</div>' +

      '</div>'

    var countdownEl = page.querySelector('#fund-countdown')
    page._bankTimer = setInterval(function() {
      var remaining = funds.lastNavUpdate
        ? Math.max(0, (funds.lastNavUpdate + FUND_UPDATE_MS) - Date.now())
        : 0
      if (countdownEl) countdownEl.textContent = formatTime(remaining)
      if (remaining <= 0) {
        runInvestAutoRefresh(user.id)
      }
    }, 1000)

    page.querySelector('#fund-back').addEventListener('click', function() {
      clearBankPageTimer(page)
      window.closePage('bank-fund-page')
    })

    page.querySelector('#fund-buy-btn').addEventListener('click', function() {
      showFundBuyModal(user, investState)
    })

    var sellBtn = page.querySelector('#fund-sell-btn')
    if (sellBtn && !sellBtn.disabled) {
      sellBtn.addEventListener('click', function() {
        showFundSellModal(user, investState)
      })
    }
  }

  async function showFundPage(user) {
    var walletData = await getWalletData(user.id)
    if (!walletData) { window.toast && window.toast('请先生成余额'); return }
    await markInvestAutoRefreshStarted(user.id, 'fund')
    var page = document.createElement('div')
    page.id = 'bank-fund-page'
    page.className = 'full-page bank-detail-page'
    await renderFundPage(user, page)
    window.openPage(page)
  }

  async function showFundBuyModal(user, investState) {
    var walletData = await getWalletData(user.id)
    var savingBalance = walletData ? (walletData.savingBalance || 0) : 0
    var nav = investState.funds.currentNav

    var modal = showModal(
      '<div class="sheet-title">买入基金</div>' +
      '<div class="invest-modal-info">' +
        '<div class="invest-modal-row"><span>当前净值</span><span>' + nav.toFixed(4) + '</span></div>' +
        '<div class="invest-modal-row"><span>SAVING 余额</span><span>¥' + formatAmount(savingBalance) + '</span></div>' +
      '</div>' +
      '<div class="bank-transfer-input-wrap">' +
        '<span class="bank-transfer-yen">¥</span>' +
        '<input type="number" class="bank-transfer-input" id="fund-buy-amount" placeholder="最低100元" step="1" min="100">' +
      '</div>' +
      '<div class="bank-modal-actions">' +
        '<button class="bank-modal-btn bank-modal-btn-cancel" id="fund-buy-cancel">取消</button>' +
        '<button class="bank-modal-btn bank-modal-btn-confirm" id="fund-buy-confirm">确认买入</button>' +
      '</div>'
    )

    modal.sheet.querySelector('#fund-buy-cancel').addEventListener('click', modal.close)
    modal.sheet.querySelector('#fund-buy-confirm').addEventListener('click', async function() {
      var amount = parseFloat(modal.sheet.querySelector('#fund-buy-amount').value)
      if (!amount || amount < 100) { window.toast && window.toast('最低买入¥100'); return }

      var wd = await getWalletData(user.id)
      if (!wd || (wd.savingBalance || 0) < amount) { window.toast && window.toast('SAVING 余额不足'); return }

      wd.savingBalance -= amount
      await saveWalletData(user.id, wd)

      var shares = amount / investState.funds.currentNav
      investState.funds.shares = (investState.funds.shares || 0) + shares
      investState.funds.transactions.unshift({ type: 'buy', amount: amount, shares: shares, nav: investState.funds.currentNav, ts: Date.now() })
      if (investState.funds.transactions.length > 20) investState.funds.transactions.pop()

      // 首次购买通知
      if (!investState.notified['fund_first_buy']) {
        var phone = await getUserPhone(user.id)
        if (phone) {
          await sendFinanceSMS(phone, FINANCE_PHONE, FINANCE_NAME,
            '【弯弯理财】恭喜您成功申购基金！当前净值' + investState.funds.currentNav.toFixed(4) + '，持有' + investState.funds.shares.toFixed(2) + '份。基金净值每2小时更新，请关注收益变化。')
          investState.notified['fund_first_buy'] = true
        }
      }

      await saveInvestState(user.id, investState)
      await db.finance.add({ charId: user.id, amount: amount, desc: '申购基金 ' + shares.toFixed(2) + '份', type: 'expense', source: 'saving', createdAt: Date.now() })

      modal.close()
      window.toast && window.toast('买入成功 ' + shares.toFixed(2) + ' 份')
      await refreshVisibleBankSurfaces(user)
    })
  }

  async function showFundSellModal(user, investState) {
    var shares = investState.funds.shares || 0
    var nav = investState.funds.currentNav
    var maxAmount = shares * nav

    var modal = showModal(
      '<div class="sheet-title">卖出基金</div>' +
      '<div class="invest-modal-info">' +
        '<div class="invest-modal-row"><span>当前净值</span><span>' + nav.toFixed(4) + '</span></div>' +
        '<div class="invest-modal-row"><span>持有份额</span><span>' + shares.toFixed(2) + '</span></div>' +
        '<div class="invest-modal-row"><span>预估金额</span><span>¥' + formatAmount(maxAmount) + '</span></div>' +
      '</div>' +
      '<div class="bank-transfer-input-wrap">' +
        '<span class="bank-transfer-yen" style="font-size:13px">份额</span>' +
        '<input type="number" class="bank-transfer-input" id="fund-sell-shares" placeholder="卖出份额" step="0.01" min="0.01" max="' + shares.toFixed(2) + '" value="' + shares.toFixed(2) + '">' +
      '</div>' +
      '<div class="bank-modal-actions">' +
        '<button class="bank-modal-btn bank-modal-btn-cancel" id="fund-sell-cancel">取消</button>' +
        '<button class="bank-modal-btn bank-modal-btn-confirm" id="fund-sell-confirm">确认卖出</button>' +
      '</div>'
    )

    modal.sheet.querySelector('#fund-sell-cancel').addEventListener('click', modal.close)
    modal.sheet.querySelector('#fund-sell-confirm').addEventListener('click', async function() {
      var sellShares = parseFloat(modal.sheet.querySelector('#fund-sell-shares').value)
      if (!sellShares || sellShares <= 0) { window.toast && window.toast('请输入卖出份额'); return }

      var freshState = normalizeInvestState(await getInvestState(user.id))
      if (sellShares > freshState.funds.shares) sellShares = freshState.funds.shares

      var amount = sellShares * freshState.funds.currentNav
      freshState.funds.shares -= sellShares
      if (freshState.funds.shares < 0.001) freshState.funds.shares = 0

      freshState.funds.transactions.unshift({ type: 'sell', amount: amount, shares: sellShares, nav: freshState.funds.currentNav, ts: Date.now() })
      if (freshState.funds.transactions.length > 20) freshState.funds.transactions.pop()
      await saveInvestState(user.id, freshState)

      var wd = await getWalletData(user.id)
      wd.savingBalance = (wd.savingBalance || 0) + amount
      await saveWalletData(user.id, wd)

      await db.finance.add({ charId: user.id, amount: amount, desc: '赎回基金 ' + sellShares.toFixed(2) + '份', type: 'income', source: 'saving', createdAt: Date.now() })

      modal.close()
      window.toast && window.toast('赎回成功 ¥' + formatAmount(amount))
      await refreshVisibleBankSurfaces(user)
    })
  }

  // ================================================================
  //                     定期存款
  // ================================================================

  async function renderDepositPage(user, page) {
    clearBankPageTimer(page)
    var walletData = await getWalletData(user.id)
    if (!walletData) { window.toast && window.toast('请先生成余额'); return }

    var investState = normalizeInvestState(await getInvestState(user.id))
    var deposits = investState.deposits || []

    // 懒计算到期检查 + 通知
    var phone = await getUserPhone(user.id)
    for (var i = 0; i < deposits.length; i++) {
      var dep = deposits[i]
      var maturedAt = dep.startTime + dep.term * 86400000
      if (Date.now() >= maturedAt && !dep.matured) {
        dep.matured = true
        dep.interest = dep.principal * (dep.rate / 365) * dep.term
        // 到期通知
        var notifyKey = 'deposit_matured_' + dep.id
        if (!investState.notified[notifyKey] && phone) {
          var total = dep.principal + dep.interest
          await sendFinanceSMS(phone, FINANCE_PHONE, FINANCE_NAME,
            '【弯弯理财】您的' + dep.term + '天定期存款已到期！本金¥' + formatAmount(dep.principal) + '，利息¥' + formatAmount(dep.interest) + '，合计¥' + formatAmount(total) + '已可领取，请及时操作。')
          investState.notified[notifyKey] = true
        }
      }
    }
    await saveInvestState(user.id, investState)

    var depositsHtml = ''
    if (deposits.length === 0) {
      depositsHtml = '<div class="bank-empty-hint">暂无存款</div>'
    } else {
      for (var i = 0; i < deposits.length; i++) {
        var dep = deposits[i]
        var maturedAt = dep.startTime + dep.term * 86400000
        var isMatured = dep.matured || Date.now() >= maturedAt
        var interest = dep.principal * (dep.rate / 365) * dep.term
        var daysLeft = isMatured ? 0 : Math.ceil((maturedAt - Date.now()) / 86400000)

        depositsHtml +=
          '<div class="deposit-card ' + (isMatured ? 'is-matured' : '') + '">' +
            '<div class="deposit-card-top">' +
              '<span class="deposit-term">' + dep.term + '天定期</span>' +
              '<span class="deposit-rate">' + (dep.rate * 100).toFixed(1) + '%</span>' +
            '</div>' +
            '<div class="deposit-card-mid">' +
              '<div class="deposit-principal">本金 ¥' + formatAmount(dep.principal) + '</div>' +
              '<div class="deposit-interest">预计利息 ¥' + formatAmount(interest) + '</div>' +
            '</div>' +
            '<div class="deposit-card-bottom">' +
              (isMatured
                ? '<span class="deposit-status is-matured">已到期</span>' +
                  '<button class="deposit-claim-btn" data-deposit-id="' + dep.id + '">领取</button>'
                : '<span class="deposit-status">剩余 ' + daysLeft + ' 天</span>' +
                  '<button class="deposit-withdraw-btn" data-deposit-id="' + dep.id + '">提前支取</button>') +
            '</div>' +
          '</div>'
      }
    }

    page.innerHTML =
      '<div class="page-header">' +
        '<button class="header-back" id="deposit-back"><i class="fa fa-angle-left"></i></button>' +
        '<span class="header-title">定期存款</span>' +
      '</div>' +
      '<div class="bank-detail-scroll">' +
        '<div class="bank-section-title">我的存款 (' + deposits.length + '/10)</div>' +
        '<div class="deposit-list">' + depositsHtml + '</div>' +
        (deposits.length < 10
          ? '<div class="invest-actions"><button class="invest-btn invest-btn-buy" id="deposit-new-btn"><i class="fa-solid fa-plus"></i> 新建存款</button></div>'
          : '') +

        '<div class="bank-section-title">产品介绍</div>' +
        '<div class="bank-list-card">' +
          DEPOSIT_PRODUCTS.map(function(p) {
            var example = (10000 * (p.rate / 365) * p.term)
            return '<div class="deposit-product-row">' +
              '<span class="deposit-product-term">' + p.label + '</span>' +
              '<span class="deposit-product-rate">' + (p.rate * 100).toFixed(1) + '%</span>' +
              '<span class="deposit-product-example">万元收益 ¥' + example.toFixed(2) + '</span>' +
            '</div>'
          }).join('') +
        '</div>' +
      '</div>'

    page.querySelector('#deposit-back').addEventListener('click', function() {
      window.closePage('bank-deposit-page')
    })

    // 领取到期存款
    page.querySelectorAll('.deposit-claim-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var depId = parseInt(btn.dataset.depositId)
        var freshState = normalizeInvestState(await getInvestState(user.id))
        var idx = freshState.deposits.findIndex(function(d) { return d.id === depId })
        if (idx < 0) return

        var dep = freshState.deposits[idx]
        var interest = dep.principal * (dep.rate / 365) * dep.term
        var total = dep.principal + interest

        var wd = await getWalletData(user.id)
        wd.savingBalance = (wd.savingBalance || 0) + total
        await saveWalletData(user.id, wd)

        freshState.deposits.splice(idx, 1)
        await saveInvestState(user.id, freshState)

        await db.finance.add({ charId: user.id, amount: total, desc: dep.term + '天定期到期 本金+利息', type: 'income', source: 'saving', createdAt: Date.now() })

        window.toast && window.toast('领取成功 ¥' + formatAmount(total))
        await refreshVisibleBankSurfaces(user)
      })
    })

    // 提前支取
    page.querySelectorAll('.deposit-withdraw-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var depId = parseInt(btn.dataset.depositId)
        var freshState = normalizeInvestState(await getInvestState(user.id))
        var idx = freshState.deposits.findIndex(function(d) { return d.id === depId })
        if (idx < 0) return

        var dep = freshState.deposits[idx]
        var actualDays = Math.floor((Date.now() - dep.startTime) / 86400000)
        var penaltyInterest = dep.principal * (0.005 / 365) * actualDays
        var total = dep.principal + penaltyInterest

        var confirmModal = showModal(
          '<div class="sheet-title">提前支取</div>' +
          '<div class="invest-modal-info">' +
            '<div class="invest-modal-row"><span>本金</span><span>¥' + formatAmount(dep.principal) + '</span></div>' +
            '<div class="invest-modal-row"><span>已存天数</span><span>' + actualDays + '天</span></div>' +
            '<div class="invest-modal-row"><span>原利率</span><span>' + (dep.rate * 100).toFixed(1) + '%</span></div>' +
            '<div class="invest-modal-row"><span>提前支取利率</span><span style="color:#e91e63">0.5%</span></div>' +
            '<div class="invest-modal-row"><span>实际利息</span><span>¥' + formatAmount(penaltyInterest) + '</span></div>' +
            '<div class="invest-modal-row" style="font-weight:600"><span>到手金额</span><span>¥' + formatAmount(total) + '</span></div>' +
          '</div>' +
          '<div class="bank-modal-actions">' +
            '<button class="bank-modal-btn bank-modal-btn-cancel" id="withdraw-cancel">取消</button>' +
            '<button class="bank-modal-btn bank-modal-btn-confirm" id="withdraw-confirm" style="background:#e91e63">确认支取</button>' +
          '</div>'
        )

        confirmModal.sheet.querySelector('#withdraw-cancel').addEventListener('click', confirmModal.close)
        confirmModal.sheet.querySelector('#withdraw-confirm').addEventListener('click', async function() {
          var wd = await getWalletData(user.id)
          wd.savingBalance = (wd.savingBalance || 0) + total
          await saveWalletData(user.id, wd)

          var latestState = normalizeInvestState(await getInvestState(user.id))
          var latestIdx = latestState.deposits.findIndex(function(d) { return d.id === depId })
          if (latestIdx >= 0) latestState.deposits.splice(latestIdx, 1)
          await saveInvestState(user.id, latestState)

          await db.finance.add({ charId: user.id, amount: total, desc: dep.term + '天定期提前支取', type: 'income', source: 'saving', createdAt: Date.now() })

          confirmModal.close()
          window.toast && window.toast('提前支取 ¥' + formatAmount(total))
          await refreshVisibleBankSurfaces(user)
        })
      })
    })

    // 新建存款
    var newBtn = page.querySelector('#deposit-new-btn')
    if (newBtn) {
      newBtn.addEventListener('click', function() {
        showNewDepositModal(user)
      })
    }
  }

  async function showDepositPage(user) {
    var walletData = await getWalletData(user.id)
    if (!walletData) { window.toast && window.toast('请先生成余额'); return }
    var page = document.createElement('div')
    page.id = 'bank-deposit-page'
    page.className = 'full-page bank-detail-page'
    await renderDepositPage(user, page)
    window.openPage(page)
  }

  async function showNewDepositModal(user) {
    var walletData = await getWalletData(user.id)
    var savingBalance = walletData ? (walletData.savingBalance || 0) : 0

    var productOptions = DEPOSIT_PRODUCTS.map(function(p, i) {
      return '<button class="deposit-term-option' + (i === 0 ? ' is-selected' : '') + '" data-index="' + i + '">' + p.label + '<br><span class="deposit-term-rate">' + (p.rate * 100).toFixed(1) + '%</span></button>'
    }).join('')

    var modal = showModal(
      '<div class="sheet-title">新建定期存款</div>' +
      '<div class="invest-modal-info">' +
        '<div class="invest-modal-row"><span>SAVING 余额</span><span>¥' + formatAmount(savingBalance) + '</span></div>' +
      '</div>' +
      '<div class="deposit-term-selector">' + productOptions + '</div>' +
      '<div class="bank-transfer-input-wrap">' +
        '<span class="bank-transfer-yen">¥</span>' +
        '<input type="number" class="bank-transfer-input" id="deposit-amount" placeholder="最低1,000元" step="100" min="1000">' +
      '</div>' +
      '<div class="deposit-preview" id="deposit-preview">预计利息：--</div>' +
      '<div class="bank-modal-actions">' +
        '<button class="bank-modal-btn bank-modal-btn-cancel" id="deposit-cancel">取消</button>' +
        '<button class="bank-modal-btn bank-modal-btn-confirm" id="deposit-confirm">确认存入</button>' +
      '</div>'
    )

    var selectedIdx = 0
    var amountInput = modal.sheet.querySelector('#deposit-amount')
    var previewEl = modal.sheet.querySelector('#deposit-preview')

    function updatePreview() {
      var amount = parseFloat(amountInput.value) || 0
      var product = DEPOSIT_PRODUCTS[selectedIdx]
      if (amount >= 1000) {
        var interest = amount * (product.rate / 365) * product.term
        previewEl.textContent = '预计利息：¥' + interest.toFixed(2) + '（' + product.label + '，' + (product.rate * 100).toFixed(1) + '%）'
      } else {
        previewEl.textContent = '预计利息：--'
      }
    }

    modal.sheet.querySelectorAll('.deposit-term-option').forEach(function(btn) {
      btn.addEventListener('click', function() {
        modal.sheet.querySelectorAll('.deposit-term-option').forEach(function(b) { b.classList.remove('is-selected') })
        btn.classList.add('is-selected')
        selectedIdx = parseInt(btn.dataset.index)
        updatePreview()
      })
    })
    amountInput.addEventListener('input', updatePreview)

    modal.sheet.querySelector('#deposit-cancel').addEventListener('click', modal.close)
    modal.sheet.querySelector('#deposit-confirm').addEventListener('click', async function() {
      var amount = parseFloat(amountInput.value)
      if (!amount || amount < 1000) { window.toast && window.toast('最低存入¥1,000'); return }

      var wd = await getWalletData(user.id)
      if (!wd || (wd.savingBalance || 0) < amount) { window.toast && window.toast('SAVING 余额不足'); return }

      var investState = normalizeInvestState(await getInvestState(user.id))
      if (investState.deposits.length >= 10) { window.toast && window.toast('最多同时持有10笔定期'); return }

      wd.savingBalance -= amount
      await saveWalletData(user.id, wd)

      var product = DEPOSIT_PRODUCTS[selectedIdx]
      var depId = Date.now()
      investState.deposits.push({
        id: depId,
        principal: amount,
        rate: product.rate,
        term: product.term,
        startTime: Date.now(),
        matured: false
      })
      await saveInvestState(user.id, investState)

      await db.finance.add({ charId: user.id, amount: amount, desc: '定期存款 ' + product.label, type: 'expense', source: 'saving', createdAt: Date.now() })

      modal.close()
      window.toast && window.toast('存入成功 ¥' + formatAmount(amount) + ' ' + product.label + '定期')
      await refreshVisibleBankSurfaces(user)
    })
  }

  // ================================================================
  //                     黄金投资
  // ================================================================

  async function renderGoldPage(user, page) {
    clearBankPageTimer(page)
    var walletData = await getWalletData(user.id)
    if (!walletData) { window.toast && window.toast('请先生成余额'); return }

    var investState = await updateGoldPriceForUser(user.id, normalizeInvestState(await getInvestState(user.id)))
    var gold = investState.gold

    var holdingValue = gold.holdingGrams * gold.currentPrice
    var pnl = gold.holdingGrams > 0 ? (gold.currentPrice - gold.avgCostPerGram) * gold.holdingGrams : 0
    var pnlPct = gold.holdingGrams > 0 && gold.avgCostPerGram > 0 ? ((gold.currentPrice - gold.avgCostPerGram) / gold.avgCostPerGram * 100) : 0

    var priceDir = gold.priceHistory.length >= 2
      ? (gold.priceHistory[gold.priceHistory.length - 1].price >= gold.priceHistory[gold.priceHistory.length - 2].price ? 'up' : 'down')
      : 'up'

    var nextUpdateIn = gold.lastPriceUpdate
      ? Math.max(0, (gold.lastPriceUpdate + GOLD_UPDATE_MS) - Date.now())
      : 0

    page.innerHTML =
      '<div class="page-header">' +
        '<button class="header-back" id="gold-back"><i class="fa fa-angle-left"></i></button>' +
        '<span class="header-title">黄金投资</span>' +
      '</div>' +
      '<div class="bank-detail-scroll">' +

        '<div class="invest-hero gold-hero">' +
          '<div class="gold-price-now">' +
            '<span class="gold-price-label">实时金价</span>' +
            '<span class="gold-price-value">¥' + formatAmount(gold.currentPrice) + '<span class="gold-price-unit">/克</span></span>' +
            '<span class="gold-price-arrow ' + priceDir + '"><i class="fa fa-caret-' + priceDir + '"></i></span>' +
          '</div>' +
          '<div class="gold-countdown" id="gold-countdown">下次更新 ' + formatTime(nextUpdateIn) + '</div>' +
        '</div>' +

        (gold.holdingGrams > 0
          ? '<div class="invest-info-grid">' +
              '<div class="invest-info-cell"><div class="invest-info-val">' + gold.holdingGrams.toFixed(2) + 'g</div><div class="invest-info-label">持有克数</div></div>' +
              '<div class="invest-info-cell"><div class="invest-info-val">¥' + formatAmount(holdingValue) + '</div><div class="invest-info-label">持仓市值</div></div>' +
              '<div class="invest-info-cell"><div class="invest-info-val ' + (pnl >= 0 ? 'is-up' : 'is-down') + '">' + (pnl >= 0 ? '+' : '') + formatAmount(pnl) + '</div><div class="invest-info-label">盈亏</div></div>' +
            '</div>'
          : '') +

        '<div class="bank-section-title">价格走势</div>' +
        '<div class="bank-list-card" style="padding:16px">' +
          buildSparkline(gold.priceHistory, 300, 80, '#f9a825') +
        '</div>' +

        '<div class="invest-actions">' +
          '<button class="invest-btn invest-btn-buy" id="gold-buy-btn">买入</button>' +
          '<button class="invest-btn invest-btn-sell" id="gold-sell-btn" ' + (gold.holdingGrams <= 0 ? 'disabled' : '') + '>卖出</button>' +
        '</div>' +

        '<div class="bank-section-title">交易记录</div>' +
        '<div class="bank-list-card" id="gold-records">' +
          (gold.transactions.length === 0 ? '<div class="bank-empty-hint">暂无交易记录</div>' :
            gold.transactions.slice(0, 10).map(function(t) {
              return buildBillItem({
                type: t.type === 'buy' ? 'expense' : 'income',
                amount: t.amount,
                desc: (t.type === 'buy' ? '买入黄金' : '卖出黄金') + ' ' + t.grams.toFixed(2) + 'g @¥' + formatAmount(t.price),
                createdAt: t.ts
              })
            }).join('')) +
        '</div>' +

      '</div>'

    var countdownEl = page.querySelector('#gold-countdown')
    page._bankTimer = setInterval(function() {
      var remaining = gold.lastPriceUpdate
        ? Math.max(0, (gold.lastPriceUpdate + GOLD_UPDATE_MS) - Date.now())
        : 0
      if (countdownEl) countdownEl.textContent = '下次更新 ' + formatTime(remaining)
      if (remaining <= 0) {
        runInvestAutoRefresh(user.id)
      }
    }, 1000)

    page.querySelector('#gold-back').addEventListener('click', function() {
      clearBankPageTimer(page)
      window.closePage('bank-gold-page')
    })

    page.querySelector('#gold-buy-btn').addEventListener('click', function() {
      showGoldBuyModal(user, investState)
    })

    var sellBtn = page.querySelector('#gold-sell-btn')
    if (sellBtn && !sellBtn.disabled) {
      sellBtn.addEventListener('click', function() {
        showGoldSellModal(user, investState)
      })
    }
  }

  async function showGoldPage(user) {
    var walletData = await getWalletData(user.id)
    if (!walletData) { window.toast && window.toast('请先生成余额'); return }
    await markInvestAutoRefreshStarted(user.id, 'gold')
    var page = document.createElement('div')
    page.id = 'bank-gold-page'
    page.className = 'full-page bank-detail-page'
    await renderGoldPage(user, page)
    window.openPage(page)
  }

  async function showGoldBuyModal(user, investState) {
    var walletData = await getWalletData(user.id)
    var savingBalance = walletData ? (walletData.savingBalance || 0) : 0
    var price = investState.gold.currentPrice

    var modal = showModal(
      '<div class="sheet-title">买入黄金</div>' +
      '<div class="invest-modal-info">' +
        '<div class="invest-modal-row"><span>当前金价</span><span>¥' + formatAmount(price) + '/克</span></div>' +
        '<div class="invest-modal-row"><span>SAVING 余额</span><span>¥' + formatAmount(savingBalance) + '</span></div>' +
      '</div>' +
      '<div class="bank-transfer-input-wrap">' +
        '<span class="bank-transfer-yen">¥</span>' +
        '<input type="number" class="bank-transfer-input" id="gold-buy-amount" placeholder="输入金额" step="1" min="1">' +
      '</div>' +
      '<div class="deposit-preview" id="gold-buy-preview">预计购入：-- 克</div>' +
      '<div class="bank-modal-actions">' +
        '<button class="bank-modal-btn bank-modal-btn-cancel" id="gold-buy-cancel">取消</button>' +
        '<button class="bank-modal-btn bank-modal-btn-confirm" id="gold-buy-confirm">确认买入</button>' +
      '</div>'
    )

    var amountInput = modal.sheet.querySelector('#gold-buy-amount')
    var previewEl = modal.sheet.querySelector('#gold-buy-preview')
    amountInput.addEventListener('input', function() {
      var amount = parseFloat(amountInput.value) || 0
      if (amount > 0) {
        previewEl.textContent = '预计购入：' + (amount / price).toFixed(4) + ' 克'
      } else {
        previewEl.textContent = '预计购入：-- 克'
      }
    })

    modal.sheet.querySelector('#gold-buy-cancel').addEventListener('click', modal.close)
    modal.sheet.querySelector('#gold-buy-confirm').addEventListener('click', async function() {
      var amount = parseFloat(amountInput.value)
      if (!amount || amount <= 0) { window.toast && window.toast('请输入金额'); return }

      var wd = await getWalletData(user.id)
      if (!wd || (wd.savingBalance || 0) < amount) { window.toast && window.toast('SAVING 余额不足'); return }

      var grams = amount / investState.gold.currentPrice
      wd.savingBalance -= amount
      await saveWalletData(user.id, wd)

      var gold = investState.gold
      var totalCost = gold.avgCostPerGram * gold.holdingGrams + amount
      gold.holdingGrams += grams
      gold.avgCostPerGram = gold.holdingGrams > 0 ? totalCost / gold.holdingGrams : 0

      gold.transactions.unshift({ type: 'buy', grams: grams, price: gold.currentPrice, amount: amount, ts: Date.now() })
      if (gold.transactions.length > 20) gold.transactions.pop()

      // 首次购买通知
      if (!investState.notified['gold_first_buy']) {
        var phone = await getUserPhone(user.id)
        if (phone) {
          await sendFinanceSMS(phone, FINANCE_PHONE, FINANCE_NAME,
            '【弯弯理财】恭喜您成功购入' + grams.toFixed(2) + '克黄金，成交价¥' + formatAmount(gold.currentPrice) + '/克。金价每30分钟更新，祝您投资顺利！')
          investState.notified['gold_first_buy'] = true
        }
      }

      await saveInvestState(user.id, investState)
      await db.finance.add({ charId: user.id, amount: amount, desc: '买入黄金 ' + grams.toFixed(2) + 'g', type: 'expense', source: 'saving', createdAt: Date.now() })

      modal.close()
      window.toast && window.toast('买入成功 ' + grams.toFixed(2) + '克')
      await refreshVisibleBankSurfaces(user)
    })
  }

  async function showGoldSellModal(user, investState) {
    var gold = investState.gold
    var maxGrams = gold.holdingGrams
    var maxAmount = maxGrams * gold.currentPrice

    var modal = showModal(
      '<div class="sheet-title">卖出黄金</div>' +
      '<div class="invest-modal-info">' +
        '<div class="invest-modal-row"><span>当前金价</span><span>¥' + formatAmount(gold.currentPrice) + '/克</span></div>' +
        '<div class="invest-modal-row"><span>持有克数</span><span>' + maxGrams.toFixed(2) + '克</span></div>' +
        '<div class="invest-modal-row"><span>持仓市值</span><span>¥' + formatAmount(maxAmount) + '</span></div>' +
      '</div>' +
      '<div class="bank-transfer-input-wrap">' +
        '<span class="bank-transfer-yen" style="font-size:13px">克</span>' +
        '<input type="number" class="bank-transfer-input" id="gold-sell-grams" placeholder="卖出克数" step="0.01" min="0.01" max="' + maxGrams.toFixed(2) + '" value="' + maxGrams.toFixed(2) + '">' +
      '</div>' +
      '<div class="deposit-preview" id="gold-sell-preview">预计到账：¥' + formatAmount(maxAmount) + '</div>' +
      '<div class="bank-modal-actions">' +
        '<button class="bank-modal-btn bank-modal-btn-cancel" id="gold-sell-cancel">取消</button>' +
        '<button class="bank-modal-btn bank-modal-btn-confirm" id="gold-sell-confirm">确认卖出</button>' +
      '</div>'
    )

    var gramsInput = modal.sheet.querySelector('#gold-sell-grams')
    var previewEl = modal.sheet.querySelector('#gold-sell-preview')
    gramsInput.addEventListener('input', function() {
      var g = parseFloat(gramsInput.value) || 0
      previewEl.textContent = '预计到账：¥' + formatAmount(g * gold.currentPrice)
    })

    modal.sheet.querySelector('#gold-sell-cancel').addEventListener('click', modal.close)
    modal.sheet.querySelector('#gold-sell-confirm').addEventListener('click', async function() {
      var grams = parseFloat(gramsInput.value)
      if (!grams || grams <= 0) { window.toast && window.toast('请输入克数'); return }

      var freshState = normalizeInvestState(await getInvestState(user.id))
      if (grams > freshState.gold.holdingGrams) grams = freshState.gold.holdingGrams

      var amount = grams * freshState.gold.currentPrice
      freshState.gold.holdingGrams -= grams
      if (freshState.gold.holdingGrams < 0.001) {
        freshState.gold.holdingGrams = 0
        freshState.gold.avgCostPerGram = 0
      }

      freshState.gold.transactions.unshift({ type: 'sell', grams: grams, price: freshState.gold.currentPrice, amount: amount, ts: Date.now() })
      if (freshState.gold.transactions.length > 20) freshState.gold.transactions.pop()
      await saveInvestState(user.id, freshState)

      var wd = await getWalletData(user.id)
      wd.savingBalance = (wd.savingBalance || 0) + amount
      await saveWalletData(user.id, wd)

      await db.finance.add({ charId: user.id, amount: amount, desc: '卖出黄金 ' + grams.toFixed(2) + 'g', type: 'income', source: 'saving', createdAt: Date.now() })

      modal.close()
      window.toast && window.toast('卖出成功 ¥' + formatAmount(amount))
      await refreshVisibleBankSurfaces(user)
    })
  }

  function bootBankAutoRefresh() {
    var waited = 0
    var timer = setInterval(function() {
      waited += 100
      if (window.db && db.config) {
        clearInterval(timer)
        startPersistedInvestAutoRefreshTimers()
      } else if (waited >= 8000) {
        clearInterval(timer)
      }
    }, 100)
  }

  bootBankAutoRefresh()

})()
