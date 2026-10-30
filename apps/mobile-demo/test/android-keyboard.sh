#!/usr/bin/env bash
# 安卓模拟器里验证键盘弹起时的布局（CI 的 android-emulator 任务调用，应用已装好并打开首页）：
# 进表单页、点第一个输入框，输入法弹出后 WebView 的下边界要上移——页面被压矮，正在输入的框与底部固定的元素露在键盘上方。
# 元素位置取自 uiautomator 的界面树（WebView 里的网页元素也在树里），不靠猜坐标；每次的界面树存成 android-ui-*.xml 一起上传
set -uo pipefail

# 界面树存到 android-ui-$1.xml 并输出；uiautomator 的提示（如等不到界面静止）打到日志里
dump() {
  adb shell uiautomator dump /sdcard/ui.xml >&2
  adb shell cat /sdcard/ui.xml | tee "android-ui-$1.xml"
}

# 第一个属性里含 $1 的节点的边界："x1 y1 x2 y2"；没有时输出空
bounds() {
  grep -o "<node [^>]*$1[^>]*>" | head -1 | grep -o 'bounds="[^"]*"' |
    sed -E 's/bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"/\1 \2 \3 \4/' || true
}

tap_center() {
  read -r x1 y1 x2 y2 <<<"$1"
  adb shell input tap $(((x1 + x2) / 2)) $(((y1 + y2) / 2))
}

fail() {
  echo "::error::$1"
  exit 1
}

form=$(dump index | bounds 'text="表单"')
[ -n "$form" ] || fail "首页的界面树里找不到「表单」（见 android-ui-index.xml）"
tap_center "$form"
sleep 3

before=$(dump form)
webview=$(bounds 'class="android.webkit.WebView"' <<<"$before")
field=$(bounds 'class="android.widget.EditText"' <<<"$before")
[ -n "$webview" ] || fail "表单页的界面树里找不到 WebView（见 android-ui-form.xml）"
[ -n "$field" ] || fail "表单页的界面树里找不到输入框（见 android-ui-form.xml）"
tap_center "$field"
sleep 3

adb shell dumpsys input_method | grep -q 'mInputShown=true' || fail "点了输入框，输入法没有弹出"
adb exec-out screencap -p >android-keyboard.png
after=$(dump keyboard | bounds 'class="android.webkit.WebView"')
[ -n "$after" ] || fail "键盘弹起后找不到 WebView（见 android-ui-keyboard.xml）"

read -r _ _ _ bottom_before <<<"$webview"
read -r _ _ _ bottom_after <<<"$after"
echo "WebView 下边界：键盘弹起前 $bottom_before，弹起后 $bottom_after"
[ "$bottom_after" -lt "$bottom_before" ] || fail "键盘弹起后 WebView 没有变矮：底部的内容会被键盘挡住"
