// 拼图滑块验证：这里在浏览器里自己出题、自己判对错，只为演示；真实应用的图和答案都在服务端。
// 题目在挂载后才出（同真实应用挂载后去取），服务端渲染的是还没拿到题目的样子，随机的图不会和水合对不上
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { onMounted } from 'vue';
import { Button, Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import {
  SlideCaptcha,
  type SlideChallenge,
  type SlideResult,
  type SlideStatus,
} from '@zerodep-dev/vue-tsx-pro-ui/patterns';

const W = 320;
const H = 160;
const SIZE = 46;
const PIECE_WIDTH = SIZE + 11;
const TOLERANCE = 4;

const dataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** 随机色相的渐变加几个圆；缺口的左边缘位置作为答案一起返回 */
function makeChallenge(): { challenge: SlideChallenge; answer: number } {
  const hue = Math.round(Math.random() * 360);
  const x = Math.round(PIECE_WIDTH + 40 + Math.random() * (W - 2 * PIECE_WIDTH - 52));
  const y = Math.round(12 + Math.random() * (H - SIZE - 24));
  const circles = Array.from({ length: 8 }, () => {
    const radius = 10 + Math.random() * 28;
    return `<circle cx="${(Math.random() * W).toFixed(0)}" cy="${(Math.random() * H).toFixed(0)}" r="${radius.toFixed(0)}" fill="hsl(${Math.round(Math.random() * 360)} 80% 70%)" fill-opacity="0.35"/>`;
  }).join('');
  const scene =
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 58%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360} 70% 40%)"/></linearGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="url(#g)"/>${circles}`;
  const shape = `<rect x="${x}" y="${y}" width="${SIZE}" height="${SIZE}" rx="6"/>`;
  const background =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><mask id="m"><rect width="${W}" height="${H}" fill="white"/><rect x="${x}" y="${y}" width="${SIZE}" height="${SIZE}" rx="6" fill="black"/></mask></defs>` +
    `<g mask="url(#m)">${scene}</g><rect x="${x}" y="${y}" width="${SIZE}" height="${SIZE}" rx="6" fill="rgb(0 0 0 / 0.32)" stroke="white" stroke-opacity="0.7"/></svg>`;
  const piece =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PIECE_WIDTH}" height="${H}" viewBox="${x} 0 ${PIECE_WIDTH} ${H}">` +
    `<defs><clipPath id="c">${shape}</clipPath></defs><g clip-path="url(#c)">${scene}</g>` +
    `<rect x="${x}" y="${y}" width="${SIZE}" height="${SIZE}" rx="6" fill="none" stroke="white" stroke-opacity="0.9"/></svg>`;
  return {
    answer: x,
    challenge: {
      id: String(Math.random()),
      background: dataUrl(background),
      piece: dataUrl(piece),
      width: W,
      height: H,
      pieceWidth: PIECE_WIDTH,
    },
  };
}

export default _component(() => {
  let current: ReturnType<typeof makeChallenge> | undefined;
  let challenge = _state<SlideChallenge | null>(null);
  let status = _state<SlideStatus>('idle');
  let message = _state('');

  const next = () => {
    current = makeChallenge();
    challenge = current.challenge;
    status = 'idle';
    message = '';
  };

  // 真实应用在这里把 result 发给服务端，服务端按位置和轨迹判定
  const verify = (result: SlideResult) => {
    status = 'verifying';
    setTimeout(() => {
      const answer = current!.answer;
      const ok = Math.abs(result.x - answer) <= TOLERANCE && result.duration >= 280;
      status = ok ? 'success' : 'error';
      message = `位置 ${result.x}px（答案 ${answer}px），用时 ${result.duration}ms，轨迹 ${result.track.length} 点`;
      if (!ok) setTimeout(next, 900);
    }, 400);
  };

  onMounted(next);

  return () => (
    <Flex direction="column" gap="md" align="start">
      <SlideCaptcha challenge={challenge} status={status} onRelease={verify} onRefresh={next} />
      <Small tone="muted">{message || '拖动滑块，让拼图对准缺口'}</Small>
      {status === 'success' && (
        <Button variant="outline" size="sm" onClick={next}>
          再来一次
        </Button>
      )}
    </Flex>
  );
});
