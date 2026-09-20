# -*- coding: utf-8 -*-
"""
咩&砚 · 代码整理脚本
=====================================================
用法：
  1. 把本文件保存成   整理.py
  2. 放进仓库根目录（和 index.html 同一层）
  3. 双击运行，或在该文件夹里执行： python 整理.py

它会做四件事：
  · 先把要动的文件全部备份到 _backup_原始/
  · 删掉已知的废代码块（找不到就跳过，绝不乱删）
  · 给每个 js 文件加上统一的标题头
  · 顶层函数之间保证空两行、连续空行最多两行
  · 顺手把 index.html 里 ?v= 的数字加一

跑完不对：把 _backup_原始/ 里的文件复制回去覆盖，就完全复原了。
"""

import os
import re
import shutil
import datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
BACK = os.path.join(ROOT, '_backup_原始')

FILES = ['index.html', 'sw.js',
         'js/core.js', 'js/chat.js', 'js/voice.js',
         'js/calendar.js', 'js/wechat.js', 'js/settings.js', 'js/tools.js']

TITLES = {
    'js/core.js':     '壁纸 · 锁屏比例 · 桌面图标 · 禁用缩放',
    'js/chat.js':     '聊天页 · 深度思考 · 操作栏 · 后台生成 · 输入栏 · + 面板 · 收藏',
    'js/voice.js':    '语音朗读 · 语音设置 · 翻译框',
    'js/calendar.js': '日历 · 日程进聊天上下文 · 周末配色',
    'js/wechat.js':   '微信 · 朋友圈 · 我页面 · 键盘与消息贴底',
    'js/settings.js': '设置页 · 保存 · 推送 · 记忆 · 外观 · 中继 · AI',
    'js/tools.js':    '记忆档案 · 抓网页 · MCP · 主动消息 · token 统计',
    'sw.js':          'Service Worker · 缓存与推送',
}

DEAD = {
    'index.html':  [('服务端 AI 调用', '一整段 Cloudflare Worker 的服务端代码，网页里是语法错误')],
    'js/core.js':  [('键盘弹出时只压内容区', '旧键盘补丁，已被 wechat.js 里的新版取代')],
    'js/chat.js':  [('干掉键盘上那条 AutoFill 栏', '和 tools.js 的输入框补丁重复')],
    'js/tools.js': [('顶栏钉死', '旧顶栏补丁，已被 wechat.js 里的新版取代'),
                    ('自检：点屏幕任意处', '点哪儿都弹黑框的调试代码')],
}

report = []


def note(s):
    print(s)
    report.append(s)


def cut_iife(text, marker, limit=2600):
    """删掉包含 marker 的那个 IIFE 块（跨度太大就不动，防止误删）"""
    i = text.find(marker)
    if i < 0:
        return text, False
    s = text.rfind('\n(function', 0, i)
    if s < 0:
        s = text.rfind('\n/*', 0, i)
    if s < 0:
        return text, False
    e = text.find('\n})();', i)
    if e < 0 or e - s > limit:
        return text, False
    return text[:s] + text[e + 6:], True


def cut_script(text, marker, limit=20000):
    """删掉包含 marker 的整个 <script>…</script> 块"""
    i = text.find(marker)
    if i < 0:
        return text, False
    s = text.rfind('<script', 0, i)
    e = text.find('</script>', i)
    if s < 0 or e < 0 or e - s > limit:
        return text, False
    return text[:s] + text[e + len('</script>'):], True


def process(path):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        note('跳过（文件不存在）：' + path)
        return
    with open(full, 'r', encoding='utf-8') as f:
        src = f.read()
    out = src

    # 1. 删废块
    for marker, why in DEAD.get(path, []):
        while True:
            if path == 'index.html':
                new, done = cut_script(out, marker)
            else:
                new, done = cut_iife(out, marker)
            if not done:
                break
            out = new
            note('删废块：' + path + '  ←  ' + marker + '（' + why + '）')

    # 2. 统一标题头
    title = TITLES.get(path)
    if title and '咩&砚 ·' not in out[:400]:
        head = ('/* ============================================================\n'
                '   咩&砚 · ' + path + '\n'
                '   ' + title + '\n'
                '   ============================================================ */\n\n\n')
        out = head + out.lstrip('\n')
        note('加统一标题：' + path)

    # 3. 排版：连续空行最多两行，顶层函数前空两行
    before = out
    out = re.sub(r'\n{4,}', '\n\n\n', out)
    res = []
    for ln in out.split('\n'):
        if re.match(r'^(async\s+function\s+\w+\s*\(|function\s+\w+\s*\(|\(function\s*\(|const\s+\w+\s*=\s*\(function)', ln):
            while res and res[-1].strip() == '':
                res.pop()
            if res:
                res += ['', '']
        res.append(ln)
    out = '\n'.join(res)
    if out != before:
        note('排版整理：' + path)

    # 4. 清掉指向不存在的 js/keyboard.js 的引用
    if path == 'index.html' and not os.path.exists(os.path.join(ROOT, 'js', 'keyboard.js')):
        new = re.sub(r'\n\s*<script src="js/keyboard\.js[^"]*"></script>', '', out)
        if new != out:
            out = new
            note('删掉多余引用：js/keyboard.js（文件不存在，代码已在 wechat.js 里）')

    # 5. 版本号加一
    if path == 'index.html':
        def bump(m):
            return '?v=' + str(int(m.group(1)) + 1)
        new = re.sub(r'\?v=(\d+)', bump, out)
        if new != out:
            out = new
            note('版本号加一：index.html 里的 ?v=')

    if out != src:
        if not os.path.isdir(BACK):
            os.makedirs(BACK)
        shutil.copy2(full, os.path.join(BACK, path.replace('/', '__')))
        with open(full, 'w', encoding='utf-8') as f:
            f.write(out)
        note('已写回：' + path)


def main():
    note('咩&砚 · 代码整理   ' + datetime.datetime.now().strftime('%Y-%m-%d %H:%M'))
    note('-' * 50)
    for p in FILES:
        process(p)
    note('-' * 50)
    note('备份在 _backup_原始/，出问题把里面的文件复制回去覆盖即可。')
    with open(os.path.join(ROOT, '整理报告.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    print('\n完成。详细报告写在 整理报告.txt')


if __name__ == '__main__':
    main()
