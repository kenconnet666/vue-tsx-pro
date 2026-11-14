// 视频：原生控制条、定比例的外框、封面。示例里的片段是在浏览器里现录的（一段两秒的动画），不依赖外部文件；
// 实际使用时 src 就是视频文件的地址
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { ClientOnly, Figure, Skeleton, Video } from '@zerodep-dev/vue-tsx-pro-ui';
import { onBeforeUnmount, onMounted } from 'vue';

/** 在画布上画两秒的动画并录下来，返回片段与第一帧（封面）的地址 */
async function record(): Promise<{ src: string; poster: string } | null> {
  if (typeof MediaRecorder === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext('2d')!;
  const draw = (progress: number) => {
    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, 640, 360);
    context.fillStyle = '#6366f1';
    context.beginPath();
    context.arc(
      80 + progress * 480,
      180 + Math.sin(progress * Math.PI * 4) * 60,
      36,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.fillStyle = '#e2e8f0';
    context.font = '20px system-ui, sans-serif';
    context.fillText(`${(progress * 2).toFixed(1)} s`, 24, 40);
  };
  draw(0);
  const poster = canvas.toDataURL('image/png');
  const recorder = new MediaRecorder(canvas.captureStream(30));
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => chunks.push(event.data);
  const stopped = new Promise((resolve) => (recorder.onstop = resolve));
  recorder.start();
  const started = performance.now();
  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const progress = Math.min((now - started) / 2000, 1);
      draw(progress);
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
  recorder.stop();
  await stopped;
  return { src: URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })), poster };
}

const Clip = _component(() => {
  let clip = _state.raw<{ src: string; poster: string } | null>(null);
  onMounted(async () => (clip = await record()));
  onBeforeUnmount(() => clip && URL.revokeObjectURL(clip.src));
  return () => (
    <Figure caption="原生的控制条；宽高比 16 / 9，加载前就占好位置">
      {clip ? (
        <Video src={clip.src} poster={clip.poster} aria-label="小球移动的动画" loop />
      ) : (
        <Skeleton shape="image" />
      )}
    </Figure>
  );
});

// 录制只能在浏览器里做：整个示例只在浏览器里画
export default _component(() => () => (
  <ClientOnly>
    <Clip />
  </ClientOnly>
));
