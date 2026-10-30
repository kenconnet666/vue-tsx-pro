#!/usr/bin/env bash
# 安卓模拟器里验证键盘弹起时的布局（CI 的 android-emulator 任务调用，应用已装好并打开首页）：
# 进表单页、点第一个输入框，输入法弹出后 WebView 的下边界要上移——页面被压矮，正在输入的框与底部固定的元素露在键盘上方。
# 元素位置取自 uiautomator 的界面树（WebView 里的网页元素也在树里），不靠猜坐标
set -euo pipefail

dump() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null
  adb shell cat /sdcard/ui.xml
}

# 第一个属性里含 $1 的节点的边界："x1 y1 x2 y2"
bounds() {
  grep -o "<node [^>]*$1[^>]*>" | head -1 | grep -o 'bounds="[^"]*"' |
    sed -E 's/bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"/\1 \2 \3 \4/'
}

tap_center() {
  read -r x1 y1 x2 y2 <<<"$1"
  adb shell input tap $(((x1 + x2) / 2)) $(((y1 + y2) / 2))
}

form=$(dump | bounds 'text="表单"')
[ -n "$form" ] || { echo "首页上找不到「表单」"; exit 1; }
tap_center "$form"
sleep 3

before=$(dump)
webview=$(bounds 'class="android.webkit.WebView"' <<<"$before")
field=$(bounds 'class="android.widget.EditText"' <<<"$before")
[ -n "$field" ] || { echo "表单页上找不到输入框"; exit 1; }
tap_center "$field"
sleep 3

adb shell dumpsys input_method | grep -q 'mInputShown=true' || { echo "点了输入框，输入法没有弹出"; exit 1; }
adb exec-out screencap -p >android-keyboard.png
after=$(dump | bounds 'class="android.webkit.WebView"')

read -r _ _ _ bottom_before <<<"$webview"
read -r _ _ _ bottom_after <<<"$after"
echo "WebView 下边界：键盘弹起前 $bottom_before，弹起后 $bottom_after"
if [ "$bottom_after" -ge "$bottom_before" ]; then
  echo "键盘弹起后 WebView 没有变矮：底部的内容会被键盘挡住"
  exit 1
fi
