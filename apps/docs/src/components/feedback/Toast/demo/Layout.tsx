import { BellRing } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  createToaster,
  Field,
  Flex,
  Grid,
  NumberField,
  Select,
  Switch,
  Toaster,
  type StatusTone,
  type ToastPlacements,
} from '@zerodep-dev/vue-tsx-pro-ui';

// 这个示例自己的控制器与显示区域：位置、叠放这些设置不影响页面上别的示例
const toaster = createToaster({ duration: 6000 });

const placements: { value: keyof ToastPlacements; label: string }[] = [
  { value: 'top-start', label: '左上' },
  { value: 'top', label: '顶部居中' },
  { value: 'top-end', label: '右上' },
  { value: 'bottom-start', label: '左下' },
  { value: 'bottom', label: '底部居中' },
  { value: 'bottom-end', label: '右下' },
];

const samples: [StatusTone, string][] = [
  ['success', '报表已导出'],
  ['info', '林小满评论了你的文档'],
  ['warning', '登录状态将在 5 分钟后过期'],
  ['neutral', '已复制到剪贴板'],
];

export default _component(() => {
  let placement = _state<keyof ToastPlacements>('top-end');
  let stack = _state(true);
  let progress = _state(true);
  let max = _state<number | null>(3);
  let count = 0;
  const notify = () => {
    const [tone, title] = samples[count++ % samples.length]!;
    toaster.show({ tone, title, description: `第 ${count} 条通知` });
  };
  return () => (
    <Flex direction="column" gap="lg">
      <Grid minItemWidth="10rem" gap="md">
        <Field label="位置">
          <Select items={placements} _value={placement} />
        </Field>
        <Field label="最多同时显示">
          <NumberField _value={max} min={1} max={6} />
        </Field>
      </Grid>
      <Flex gap="lg" wrap>
        <Switch _checked={stack}>叠成一摞</Switch>
        <Switch _checked={progress}>剩余时间条</Switch>
      </Flex>
      <Flex gap="sm" wrap>
        <Button icon={BellRing} onClick={notify}>
          发一条通知
        </Button>
        <Button variant="soft" tone="neutral" onClick={() => toaster.dismiss()}>
          全部关闭
        </Button>
      </Flex>
      <Toaster
        controller={toaster}
        placement={placement}
        stack={stack}
        progress={progress}
        max={max ?? 1}
      />
    </Flex>
  );
});
