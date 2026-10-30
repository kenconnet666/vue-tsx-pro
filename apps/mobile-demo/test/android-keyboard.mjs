// 安卓模拟器里验证键盘弹起时的布局（CI 的 android-emulator 任务调用，应用已装好并打开首页）：
// 进表单页，把一个输入框滚到可视区最底部（最容易被键盘挡住的位置）再真的点下去，
// 输入法弹出后页面要变矮，这个框还要完整地露在可视区里。
// 网页元素不在 uiautomator 的界面树里（WebView 只有一个节点），所以页面里的事经 Chrome 调试协议（调试包默认开着），
// 点击与输入法经 adb；屏幕坐标 = WebView 在屏幕上的位置（界面树）+ 元素在页面里的位置 × 设备像素比
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const APP = 'dev.zerodep.vuetsxpro.demo';
const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8' });

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

/** 连上 WebView 的调试端口，返回在页面里求值的函数 */
async function connectPage() {
  const pid = adb('shell', 'pidof', APP).trim();
  adb('forward', 'tcp:9222', `localabstract:webview_devtools_remote_${pid}`);
  const [target] = await (await fetch('http://127.0.0.1:9222/json')).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    pending.get(message.id)?.(message.result?.result?.value);
    pending.delete(message.id);
  };
  let id = 0;
  return (expression) =>
    new Promise((resolve) => {
      pending.set(++id, resolve);
      socket.send(
        JSON.stringify({
          id,
          method: 'Runtime.evaluate',
          params: { expression, returnByValue: true },
        }),
      );
    });
}

/** WebView 在屏幕上的左上角 */
function webviewOrigin() {
  adb('shell', 'uiautomator', 'dump', '/sdcard/ui.xml');
  const tree = adb('shell', 'cat', '/sdcard/ui.xml');
  writeFileSync('android-ui.xml', tree);
  const match = /class="android\.webkit\.WebView"[^>]*bounds="\[(\d+),(\d+)\]/.exec(tree);
  if (!match) fail('界面树里找不到 WebView（见 android-ui.xml）');
  return { left: Number(match[1]), top: Number(match[2]) };
}

const evaluate = await connectPage();

await evaluate(`location.hash = 'form'`);
await sleep(2000);

// 页面里记下这个框（window.__field），之后再读它的位置
const before = await evaluate(`(() => {
  // 最后一个输入框：页面够长才滚得到可视区底部（第一个在页面顶上，键盘本来就挡不到）
  const field = [...document.querySelectorAll('input')].findLast(
    (input) =>
      !input.disabled &&
      !input.readOnly &&
      !['checkbox', 'radio', 'file', 'hidden'].includes(input.type) &&
      input.getBoundingClientRect().width > 0,
  );
  if (!field) return null;
  window.__field = field;
  field.scrollIntoView({ block: 'end' });
  const rect = field.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, innerHeight, ratio: devicePixelRatio };
})()`);
if (!before) fail('表单页上找不到输入框');
await sleep(500);

const origin = webviewOrigin();
adb(
  'shell',
  'input',
  'tap',
  String(Math.round(origin.left + before.x * before.ratio)),
  String(Math.round(origin.top + before.y * before.ratio)),
);
await sleep(3000);

writeFileSync(
  'android-keyboard.png',
  execFileSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 1 << 26 }),
);
const after = await evaluate(`(() => {
  const rect = window.__field.getBoundingClientRect();
  return { focused: document.activeElement === window.__field, top: rect.top, bottom: rect.bottom, innerHeight };
})()`);
console.log('键盘弹起前', before, '弹起后', after);

if (!after.focused) fail('点下去之后焦点不在输入框上（坐标算错了？见 android-keyboard.png）');
if (!adb('shell', 'dumpsys', 'input_method').includes('mInputShown=true'))
  fail('点了输入框，输入法没有弹出');
if (after.innerHeight >= before.innerHeight) fail('键盘弹起后页面没有变矮：底部的内容会被键盘挡住');
// 框原本就在键盘盖不到的地方时，下一条断言什么也没验证
if (before.y <= after.innerHeight) fail('输入框原本不在键盘会盖住的位置：这次验证不算数');
if (after.top < 0 || after.bottom > after.innerHeight) fail('键盘弹起后正在输入的框不在可视区里');
process.exit(0);
