// 本机的时间与时区：服务端不知道访客在哪个时区、此刻几点，渲染出来的和浏览器的对不上；包在 ClientOnly 里，
// 服务端渲染与水合时先画骨架，挂载后才画真正的内容
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { ClientOnly, Descriptions, SkeletonText, useFormat } from '@zerodep-dev/vue-tsx-pro-ui';
import { onBeforeUnmount, onMounted } from 'vue';

const LocalTime = _component(() => {
  const format = useFormat();
  let now = _state(new Date());
  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => (timer = setInterval(() => (now = new Date()), 1000)));
  onBeforeUnmount(() => clearInterval(timer));
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return () => (
    <Descriptions
      columns={1}
      items={[
        { label: '此刻', value: format.date(now, { timeStyle: 'medium' }) },
        { label: '时区', value: zone },
        { label: '浏览器语言', value: navigator.language },
      ]}
    />
  );
});

export default _component(() => () => (
  <ClientOnly fallback={<SkeletonText lines={3} />}>
    <LocalTime />
  </ClientOnly>
));
