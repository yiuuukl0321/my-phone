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
  var FINANCE_NAME = '理财经理'

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

})();


/* ============================================================
   银行 · 黑白图标（自绘 SVG，替换 Font Awesome）
   ============================================================ */
(function(){
  if (window.__bkIcon) return;
  window.__bkIcon = 1;

  var W = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  function sv(p, s){ return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" ' + W + '>' + p + '</svg>'; }
  function fl(p, s){ return '<svg width="' + (s || 13) + '" height="' + (s || 13) + '" viewBox="0 0 24 24"><path d="' + p + '" fill="currentColor"/></svg>'; }

  var IC = {
    back:      sv('<path d="M14.6 5.4 8 12l6.6 6.6"/>', 20),
    right:     sv('<path d="M9.4 5.4 16 12l-6.6 6.6"/>', 15),
    down:      sv('<path d="M6 9.4 12 15.4l6-6"/>', 15),
    caretUp:   fl('M12 8.4 17.4 15.6H6.6z'),
    caretDown: fl('M12 15.6 6.6 8.4h10.8z'),
    transfer:  sv('<path d="M3.8 8.6h12.8"/><path d="M13.6 5.6l3 3-3 3"/><path d="M20.2 15.4H7.4"/><path d="M10.4 12.4l-3 3 3 3"/>', 16),
    arrow:     sv('<path d="M4.2 12h15"/><path d="M14.2 7.2 19 12l-4.8 4.8"/>', 16),
    moneyOut:  sv('<path d="M12 19V5.4"/><path d="M6.6 10.8 12 5.4l5.4 5.4"/>', 15),
    moneyIn:   sv('<path d="M12 5v13.6"/><path d="M17.4 13.2 12 18.6l-5.4-5.4"/>', 15),
    plus:      sv('<path d="M12 5.4v13.2"/><path d="M5.4 12h13.2"/>', 15),
    cash:      sv('<rect x="3" y="6.6" width="18" height="12" rx="2.6"/><path d="M3 10.6h18"/><circle cx="16.6" cy="14.8" r="1.1" fill="currentColor" stroke="none"/>'),
    checking:  sv('<rect x="2.8" y="6.8" width="18.4" height="10.4" rx="2.2"/><circle cx="12" cy="12" r="2.4"/>'),
    saving:    sv('<ellipse cx="12" cy="7.4" rx="6" ry="2.6"/><path d="M6 7.4v4.2c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7.4"/><path d="M6 11.6v4.2c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4.2"/>'),
    huabei:    sv('<path d="M4.2 16.4h2.8l3 2.1h4.1a1.3 1.3 0 0 0 0-2.6h-2.5"/><path d="M4.2 20.5h15.6"/><circle cx="13.8" cy="8.8" r="3.4"/><path d="M13.8 6.9v3.8"/><path d="M12.3 7.9h3"/>'),
    fund:      sv('<path d="M3.6 19.4h16.8"/><path d="M3.6 19.4V5"/><path d="M6.6 15.4l3.4-4 2.9 2.3 4-5.2"/>'),
    deposit:   sv('<rect x="3.6" y="5" width="16.8" height="14" rx="2.4"/><circle cx="11.2" cy="12" r="3.2"/><path d="M11.2 8.8v6.4"/><path d="M18 9.8v4.4"/>'),
    gold:      sv('<path d="M8.2 4.8h7.6l3.4 4.6L12 19.4 2.8 9.4z"/><path d="M2.8 9.4h18.4"/><path d="M12 19.4 9.4 9.4l1.6-4.6"/><path d="M12 19.4l2.6-10-1.6-4.6"/>'),
    buy:       sv('<path d="M12 4.6v10.2"/><path d="M7.6 10.4 12 14.8l4.4-4.4"/><path d="M5 19.4h14"/>', 16),
    sell:      sv('<path d="M12 19.4V9.2"/><path d="M16.4 13.6 12 9.2l-4.4 4.4"/><path d="M5 4.6h14"/>', 16),
    repay:     sv('<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4.6V10h-5.4"/>', 16),
    open:      sv('<circle cx="12" cy="12" r="8"/><path d="M12 8.4v7.2"/><path d="M8.4 12h7.2"/>', 16),
    claim:     sv('<path d="M5 12.6V19h14v-6.4"/><path d="M12 4.6v9.2"/><path d="M8 10 12 14l4-4"/>', 16),
    takeout:   sv('<path d="M5 5h14"/><path d="M12 19.4V10"/><path d="M8 14 12 10l4 4"/>', 16)
  };

  var MAP = {
    'fa-angle-left': 'back',
    'fa-angle-right': 'right',
    'fa-angle-down': 'down',
    'fa-caret-up': 'caretUp',
    'fa-caret-down': 'caretDown',
    'fa-arrow-right-arrow-left': 'transfer',
    'fa-arrow-right': 'arrow',
    'fa-arrow-up': 'moneyOut',
    'fa-arrow-down': 'moneyIn',
    'fa-plus': 'plus',
    'fa-piggy-bank': 'cash',
    'fa-money-bill': 'checking',
    'fa-coins': 'saving',
    'fa-hand-holding-dollar': 'huabei',
    'fa-chart-line': 'fund',
    'fa-vault': 'deposit',
    'fa-gem': 'gold'
  };

  function make(name, extra){
    var s = document.createElement('span');
    s.className = 'bk-ico' + (extra ? ' ' + extra : '');
    s.setAttribute('data-ic', name);
    s.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;vertical-align:-.14em';
    s.innerHTML = IC[name];
    return s;
  }

  function swap(root){
    var list = (root || document).querySelectorAll('i.fa, i.fa-solid, i.fas, i.far');
    for (var i = 0; i < list.length; i++){
      var el = list[i];
      var cls = el.getAttribute('class') || '';
      var keys = cls.match(/fa-[a-z0-9-]+/g) || [];
      var hit = '';
      for (var k = 0; k < keys.length; k++){ if (MAP[keys[k]]){ hit = MAP[keys[k]]; break; } }
      if (!hit) continue;
      var extra = cls.replace(/fa-[a-z0-9-]+/g, '').replace(/\b(fa|fas|far|fab)\b/g, '').replace(/\s+/g, ' ').trim();
      el.parentNode.replaceChild(make(hit, extra), el);
    }
  }

  var BTNS = [
    ['#huabei-repay-btn', 'repay'],
    ['#huabei-activate-btn', 'open'],
    ['#fund-buy-btn', 'buy'],
    ['#fund-sell-btn', 'sell'],
    ['#gold-buy-btn', 'buy'],
    ['#gold-sell-btn', 'sell'],
    ['.deposit-claim-btn', 'claim'],
    ['.deposit-withdraw-btn', 'takeout']
  ];

  function buttons(){
    for (var i = 0; i < BTNS.length; i++){
      var els = document.querySelectorAll(BTNS[i][0]);
      for (var j = 0; j < els.length; j++){
        var el = els[j];
        if (el.querySelector('.bk-ico')) continue;
        var s = make(BTNS[i][1]);
        s.style.marginRight = '7px';
        el.insertBefore(s, el.firstChild);
      }
    }
  }

  function run(){ try { swap(document); buttons(); } catch(e){} }

  var pend = 0;
  function soon(){ if (pend) return; pend = setTimeout(function(){ pend = 0; run(); }, 80); }

  run();
  if (document.body) new MutationObserver(soon).observe(document.body, { childList: true, subtree: true });
  setInterval(run, 1500);
})();


/* ---------- ② 外壳：toast / 页面栈 / modal 容器 ---------- */
(function(){
  if (window.__bkShell) return;
  window.__bkShell = 1;

  window.toast = function(msg){
    var el = document.getElementById('xmToast');
    if (!el){
      el = document.createElement('div');
      el.id = 'xmToast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(el._t);
    el._t = setTimeout(function(){ el.classList.remove('on'); }, 1800);
  };

  if (!document.getElementById('app')){
    var ap = document.createElement('div');
    ap.id = 'app';
    document.body.appendChild(ap);
  }

  var stack = [];

  function layer(){
    var l = document.getElementById('xmBankLayer');
    if (!l){
      l = document.createElement('div');
      l.id = 'xmBankLayer';
      document.body.appendChild(l);
    }
    return l;
  }

  function paint(anim){
    var l = layer();
    l.innerHTML = '';
    if (!stack.length){
      l.classList.remove('on');
      setTimeout(function(){ if (!stack.length) l.innerHTML = ''; }, 320);
      return;
    }
    for (var i = 0; i < stack.length; i++){
      var p = stack[i];
      p.style.zIndex = String(i + 1);
      if (anim && i === stack.length - 1) p.classList.add('slide');
      else p.classList.remove('slide');
      l.appendChild(p);
    }
    l.classList.add('on');
  }

  window.openPage = function(el){
    if (!el) return;
    var i = stack.indexOf(el);
    if (i > -1) stack.splice(i, 1);
    stack.push(el);
    paint(true);
  };

  window.closePage = function(id){
    if (!id){ stack = []; paint(); return; }
    for (var i = stack.length - 1; i >= 0; i--){
      if (stack[i].id === id){ stack = stack.slice(0, i); paint(); return; }
    }
    stack = [];
    paint();
  };

  window.closeAllBankPages = function(){ stack = []; paint(); };
})();


/* ---------- ③ 样式（黑白灰，跟咩&砚一套） ---------- */
(function(){
  if (document.getElementById('xmBankCss')) return;
  var st = document.createElement('style');
  st.id = 'xmBankCss';
  st.textContent = `
#xmBankLayer{position:fixed;inset:0;z-index:120;background:#f4f4f2;
transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);pointer-events:none}
#xmBankLayer.on{transform:translateX(0);pointer-events:auto}
#xmBankLayer>.full-page{position:absolute;inset:0;display:flex;flex-direction:column;
background:#f4f4f2;overflow:hidden}
.full-page.slide{animation:bkIn .28s cubic-bezier(.4,0,.2,1)}
@keyframes bkIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
#xmToast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%) translateY(8px);
z-index:9999;max-width:78vw;padding:10px 18px;border-radius:20px;background:rgba(0,0,0,.82);
color:#fff;font-size:13.5px;line-height:1.5;text-align:center;opacity:0;pointer-events:none;
transition:opacity .2s,transform .2s}
#xmToast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.full-page .page-header{flex:0 0 auto;display:flex;align-items:center;gap:8px;
padding:calc(env(safe-area-inset-top) + 8px) 10px 10px;border-bottom:1px solid rgba(0,0,0,.06);
background:#f4f4f2;position:relative;z-index:3}
.full-page .header-back{width:38px;height:38px;display:grid;place-items:center;border:0;
background:none;color:#0b0b0b;border-radius:50%;padding:0}
.full-page .header-back:active{background:rgba(0,0,0,.06)}
.full-page .header-title{font-size:16px;font-weight:600;color:#0b0b0b}
.full-page .header-action{margin-left:auto;border:0;background:none;display:inline-flex;
align-items:center;gap:5px}
.bank-overview-scroll,.bank-detail-scroll{flex:1;min-height:0;overflow-y:auto;
-webkit-overflow-scrolling:touch;padding:16px 16px calc(env(safe-area-inset-bottom) + 26px)}
.bank-overview-section-label{font-size:10.5px;letter-spacing:.18em;color:#a0a09c;
text-transform:uppercase;margin:4px 0 12px}
.bank-asset-card{width:100%;display:flex;align-items:center;justify-content:space-between;
gap:12px;background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:15px 16px;
margin-bottom:10px;text-align:left;color:#0b0b0b;box-shadow:0 1px 3px rgba(0,0,0,.03)}
button.bank-asset-card{cursor:pointer}
button.bank-asset-card:active{background:#fafaf8}
.bank-asset-left{display:flex;align-items:center;gap:12px;min-width:0}
.bank-asset-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;
flex:0 0 auto;background:#f2f2ef;color:#0b0b0b}
.bank-icon-cash{background:#f0efec}
.bank-icon-checking{background:#eeeef0}
.bank-icon-saving{background:#f1f0ed}
.bank-asset-info{min-width:0}
.bank-asset-name{font-size:15px;font-weight:600;line-height:1.2}
.bank-asset-sub{font-size:11.5px;color:#a0a09c;margin-top:3px}
.bank-asset-right{display:flex;align-items:center;gap:8px;flex:0 0 auto}
.bank-asset-amount{font-size:16px;font-weight:500;letter-spacing:-.2px;
font-variant-numeric:tabular-nums}
.bank-asset-arrow{color:#c8c8c4}
.bank-card-visual{border-radius:20px;padding:18px;color:#fff;position:relative;overflow:hidden;
background:linear-gradient(140deg,#1b1b1d,#3d3d40);box-shadow:0 6px 18px rgba(0,0,0,.14)}
.bank-card-visual.saving{background:linear-gradient(140deg,#2a2a2d,#5b5b60)}
.bank-card-top{display:flex;align-items:center;justify-content:space-between}
.bank-card-bank-name{display:inline-flex;align-items:center;gap:7px;font-size:13px;opacity:.94}
.bank-card-type-badge{font-size:9.5px;letter-spacing:.18em;padding:3px 9px;border-radius:20px;
background:rgba(255,255,255,.16)}
.bank-card-chip{width:34px;height:25px;border-radius:6px;margin:18px 0 12px;
background:linear-gradient(140deg,#dcdcd8,#b6b6b1)}
.bank-card-number{font-size:16.5px;letter-spacing:.14em;font-variant-numeric:tabular-nums}
.bank-card-bottom{display:flex;align-items:flex-end;justify-content:space-between;margin-top:16px}
.bank-card-holder{font-size:11.5px;letter-spacing:.1em;opacity:.85}
.bank-card-brand{font-size:11px;letter-spacing:.16em;opacity:.7}
.bank-balance-block{padding:22px 2px 20px;text-align:center}
.bank-balance-label{font-size:11px;letter-spacing:.16em;color:#a0a09c;text-transform:uppercase}
.bank-balance-value{font-size:32px;font-weight:300;letter-spacing:-1px;margin-top:8px;
font-variant-numeric:tabular-nums}
.bank-section-title{font-size:11px;letter-spacing:.16em;color:#a0a09c;text-transform:uppercase;
margin:22px 2px 10px}
.bank-list-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;
overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.03)}
.bank-empty-hint{font-size:12.5px;color:#a0a09c;padding:22px 16px;text-align:center}
.bank-feature-row{display:flex;align-items:center;gap:12px;padding:14px 15px;
border-bottom:1px solid rgba(0,0,0,.06);cursor:pointer}
.bank-feature-row:last-child{border-bottom:0}
.bank-feature-row:active{background:#fafaf8}
.bank-feature-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;
flex:0 0 auto;background:#f2f2ef;color:#0b0b0b}
.bank-feature-icon.fund{background:#f1f1ee}
.bank-feature-icon.deposit{background:#efefec}
.bank-feature-icon.gold{background:#f3f1ec}
.bank-feature-info{flex:1;min-width:0}
.bank-feature-name{font-size:14.5px;font-weight:500}
.bank-feature-sub{font-size:11.5px;color:#a0a09c;margin-top:2px}
.bank-feature-arrow{color:#c8c8c4}
.bank-bill-item{display:flex;align-items:center;gap:12px;padding:13px 15px;
border-bottom:1px solid rgba(0,0,0,.06)}
.bank-bill-item:last-child{border-bottom:0}
.bank-bill-icon{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;
flex:0 0 auto;background:#f2f2ef;color:#0b0b0b}
.bank-bill-main{flex:1;min-width:0}
.bank-bill-desc{font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bank-bill-date{font-size:11px;color:#b0b0ac;margin-top:2px}
.bank-bill-amount{font-size:14.5px;font-weight:500;font-variant-numeric:tabular-nums;flex:0 0 auto}
.bank-bills-expand{width:100%;border:0;background:none;padding:14px;font-size:12.5px;
color:#8a8a86;display:flex;align-items:center;justify-content:center;gap:6px;
border-top:1px solid rgba(0,0,0,.06)}
.bank-bills-expand:active{background:#fafaf8}
.bank-sparkline{width:100%;height:80px;display:block}
.bank-chart-empty{font-size:12.5px;color:#a0a09c;text-align:center;padding:26px 0}
.invest-hero{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:22px 18px;
text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.03)}
.invest-hero-label{font-size:11px;letter-spacing:.16em;color:#a0a09c;text-transform:uppercase}
.invest-hero-amount{font-size:32px;font-weight:300;letter-spacing:-1px;margin-top:8px;
font-variant-numeric:tabular-nums}
.invest-hero-return{font-size:13.5px;margin-top:8px;color:#8a8a86}
.invest-info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.invest-info-cell{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;
padding:14px 8px;text-align:center}
.invest-info-val{font-size:15px;font-weight:500;font-variant-numeric:tabular-nums}
.invest-info-label{font-size:10.5px;color:#a0a09c;margin-top:5px}
.invest-actions{display:flex;gap:10px;margin-top:22px}
.invest-btn{flex:1;border:0;border-radius:16px;padding:15px;font-size:15px;background:#111;color:#fff}
.invest-btn:disabled{background:#e6e6e2;color:#b0b0ac}
.invest-btn-sell{background:#fff;color:#0b0b0b;border:1px solid rgba(0,0,0,.12)}
.invest-btn-sell:disabled{background:#f4f4f2;color:#b0b0ac;border-color:rgba(0,0,0,.06)}
.sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.34);opacity:0;transition:opacity .2s}
.sheet-overlay.show{opacity:1}
.center-modal{position:fixed;left:50%;top:50%;width:calc(100% - 40px);max-width:400px;
transform:translate(-50%,-46%) scale(.96);opacity:0;
transition:opacity .2s,transform .24s cubic-bezier(.2,.9,.3,1);background:#fff;border-radius:22px;
padding:20px 18px;box-shadow:0 18px 50px rgba(0,0,0,.2);max-height:82vh;overflow-y:auto;
-webkit-overflow-scrolling:touch}
.center-modal.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
.sheet-title{font-size:16.5px;font-weight:600;text-align:center;margin-bottom:16px}
.invest-modal-info{background:#f7f7f5;border-radius:14px;padding:12px 14px;margin-bottom:14px}
.invest-modal-row{display:flex;justify-content:space-between;gap:12px;font-size:13px;
color:#8a8a86;padding:5px 0}
.invest-modal-row span:last-child{color:#0b0b0b;font-variant-numeric:tabular-nums}
.bank-transfer-input-wrap{display:flex;align-items:center;gap:10px;border:1px solid rgba(0,0,0,.1);
border-radius:16px;padding:14px 16px;margin-bottom:14px;background:#fbfbfa}
.bank-transfer-yen{font-size:20px;color:#a0a09c}
.bank-transfer-input{flex:1;min-width:0;border:0;background:transparent;font-size:19px;
color:#0b0b0b;outline:none;font-variant-numeric:tabular-nums}
.bank-transfer-input::placeholder{color:#c9c9c5;font-size:15px}
.bank-modal-actions{display:flex;gap:10px;margin-top:6px}
.bank-modal-btn{flex:1;border:0;border-radius:15px;padding:14px;font-size:15px}
.bank-modal-btn-cancel{background:#f2f2ef;color:#6a6a66}
.bank-modal-btn-confirm{background:#111;color:#fff}
.bank-transfer-info{text-align:center;padding:4px 0 16px}
.bank-transfer-direction{display:flex;align-items:center;justify-content:center;font-size:14px;
font-weight:500}
.bank-transfer-avail{font-size:12px;color:#a0a09c;margin-top:8px}
.huabei-hero{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:22px 18px;
text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.03)}
.huabei-hero-label{font-size:11px;letter-spacing:.16em;color:#a0a09c;text-transform:uppercase}
.huabei-hero-amount{font-size:34px;font-weight:300;letter-spacing:-1.2px;margin-top:8px;
font-variant-numeric:tabular-nums}
.huabei-hero-sub{font-size:12px;color:#a0a09c;margin-top:6px}
.huabei-progress-track{height:6px;border-radius:6px;background:#eee;margin-top:16px;overflow:hidden}
.huabei-progress-fill{height:100%;border-radius:6px;background:#111;transition:width .3s}
.huabei-bill-card{padding:16px}
.huabei-bill-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:13.5px}
.huabei-bill-label{color:#8a8a86}
.huabei-bill-val{font-weight:500;font-variant-numeric:tabular-nums}
.huabei-bill-val.is-overdue{color:#c0392b}
.huabei-overdue-badge{font-size:10px;padding:2px 6px;border-radius:8px;background:#fdeceb;
color:#c0392b;margin-left:5px;font-weight:400}
.huabei-repay-btn{width:100%;margin-top:14px;border:0;border-radius:14px;padding:14px;
background:#111;color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center}
.huabei-repay-info{background:#f7f7f5;border-radius:14px;padding:12px 14px;margin-bottom:14px}
.huabei-repay-row{display:flex;justify-content:space-between;gap:12px;font-size:13px;
color:#8a8a86;padding:5px 0}
.huabei-repay-row span:last-child{font-variant-numeric:tabular-nums}
.huabei-repay-owed{font-weight:600}
.huabei-repay-shortcuts{display:flex;gap:10px;margin-bottom:14px}
.huabei-repay-shortcut{flex:1;border:1px solid rgba(0,0,0,.1);background:#fff;border-radius:12px;
padding:10px;font-size:12.5px}
.huabei-pending-card{display:flex;justify-content:space-between;align-items:center;padding:16px}
.huabei-pending-label{font-size:13.5px;color:#8a8a86}
.huabei-pending-val{font-size:15px;font-weight:500;font-variant-numeric:tabular-nums}
.huabei-activate-icon{width:76px;height:76px;border-radius:26px;background:#fff;
border:1px solid rgba(0,0,0,.07);display:grid;place-items:center;color:#0b0b0b;
box-shadow:0 2px 10px rgba(0,0,0,.05)}
.huabei-activate-icon svg{width:36px;height:36px}
.huabei-activate-title{font-size:22px;font-weight:600;margin-top:18px}
.huabei-activate-desc{font-size:13px;color:#a0a09c;margin-top:6px}
.huabei-activate-limit{font-size:11px;letter-spacing:.16em;color:#a0a09c;
text-transform:uppercase;margin-top:36px}
.huabei-activate-amount{font-size:40px;font-weight:300;letter-spacing:-1.5px;margin-top:8px;
font-variant-numeric:tabular-nums}
.huabei-activate-info{font-size:12px;color:#a0a09c;margin-top:10px}
.huabei-activate-btn{margin-top:36px;border:0;border-radius:16px;padding:15px 56px;background:#111;
color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center}
.deposit-list{display:flex;flex-direction:column;gap:10px}
.deposit-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:15px 16px;
box-shadow:0 1px 3px rgba(0,0,0,.03)}
.deposit-card.is-matured{border-color:rgba(0,0,0,.16)}
.deposit-card-top{display:flex;justify-content:space-between;align-items:center}
.deposit-term{font-size:14.5px;font-weight:600}
.deposit-rate{font-size:12.5px;background:#f2f2ef;padding:3px 9px;border-radius:10px}
.deposit-card-mid{margin:12px 0 14px}
.deposit-principal{font-size:13px;color:#8a8a86}
.deposit-interest{font-size:12.5px;color:#a0a09c;margin-top:4px}
.deposit-card-bottom{display:flex;justify-content:space-between;align-items:center;
border-top:1px solid rgba(0,0,0,.06);padding-top:12px}
.deposit-status{font-size:12px;color:#a0a09c}
.deposit-status.is-matured{color:#0b0b0b;font-weight:500}
.deposit-claim-btn,.deposit-withdraw-btn{border:0;border-radius:12px;padding:9px 18px;font-size:13px;
background:#111;color:#fff;display:inline-flex;align-items:center;justify-content:center}
.deposit-withdraw-btn{background:#f2f2ef;color:#0b0b0b}
.deposit-product-row{display:flex;align-items:center;gap:10px;padding:13px 15px;font-size:13px;
border-bottom:1px solid rgba(0,0,0,.06)}
.deposit-product-row:last-child{border-bottom:0}
.deposit-product-term{width:56px}
.deposit-product-rate{width:56px;font-weight:600;font-variant-numeric:tabular-nums}
.deposit-product-example{flex:1;text-align:right;color:#a0a09c;font-size:12px}
.deposit-term-selector{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.deposit-term-option{border:1px solid rgba(0,0,0,.1);background:#fff;border-radius:14px;
padding:12px 6px;font-size:13px;line-height:1.5}
.deposit-term-option.is-selected{background:#111;color:#fff;border-color:#111}
.deposit-term-rate{font-size:11px;color:#a0a09c}
.deposit-term-option.is-selected .deposit-term-rate{color:rgba(255,255,255,.7)}
.deposit-preview{font-size:12.5px;color:#8a8a86;text-align:center;margin:-4px 0 14px}
.gold-hero{padding:20px 18px 16px;text-align:center}
.gold-price-now{display:flex;align-items:baseline;justify-content:center;gap:8px;flex-wrap:wrap}
.gold-price-label{font-size:11px;letter-spacing:.16em;color:#a0a09c;text-transform:uppercase;
width:100%;margin-bottom:6px}
.gold-price-value{font-size:32px;font-weight:300;letter-spacing:-1px;
font-variant-numeric:tabular-nums}
.gold-price-unit{font-size:13px;color:#a0a09c;margin-left:2px}
.gold-price-arrow{display:inline-flex;color:#8a8a86}
.gold-countdown{font-size:11.5px;color:#a0a09c;margin-top:10px}
`;
  document.head.appendChild(st);
})();


/* ---------- ④ 桌面入口 + 图标 ---------- */
(function(){
  if (window.__bkEntry) return;
  window.__bkEntry = 1;

  var svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>` +
    `<rect width='512' height='512' fill='#F0EBE2'/>` +
    `<path d='M256 108L426 228H86Z' fill='#35322E'/>` +
    `<rect x='130' y='240' width='42' height='146' rx='19' fill='#35322E'/>` +
    `<rect x='235' y='240' width='42' height='146' rx='19' fill='#35322E'/>` +
    `<rect x='340' y='240' width='42' height='146' rx='19' fill='#35322E'/>` +
    `<rect x='98' y='400' width='316' height='40' rx='20' fill='#35322E'/>` +
    `</svg>`;

  var st = document.createElement('style');
  st.id = 'xmBankEntryCss';
  st.textContent = '.tile[data-k=bank] .ico{background-image:url(data:image/svg+xml,' +
    encodeURIComponent(svg) +
    ') !important;background-size:cover !important;background-position:center !important;' +
    'opacity:1 !important}';
  document.head.appendChild(st);

  var _open = window.openApp;
  if (typeof _open === 'function' && !_open.__bk){
    var f = function(k){
      if (k === 'bank'){
        if (window.showBankPage) window.showBankPage(window.__bankUser);
        else window.toast('银行还在加载，等一下再点');
        return;
      }
      return _open.apply(this, arguments);
    };
    f.__bk = 1;
    window.openApp = f;
  }

  function tile(){
    try {
      if (typeof APPS === 'undefined' || typeof GRID === 'undefined') return;
      if (!APPS.bank) return;
      if (GRID.indexOf('bank') > -1 || DOCK.indexOf('bank') > -1) return;
      GRID.push('bank');
      if (typeof saveAll === 'function') saveAll();
      if (typeof renderHome === 'function') renderHome();
    } catch(e){}
  }
  tile();
  setTimeout(tile, 600);
  setTimeout(tile, 2000);
})();
