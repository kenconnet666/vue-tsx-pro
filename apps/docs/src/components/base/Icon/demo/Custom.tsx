import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Icon, type IconData } from '@vue-tsx-pro/ui';

/** 自己的图标：按 Lucide 的格式写节点，画布默认 24 */
const logo: IconData = {
  node: [
    ['path', { d: 'M4 6l8 12 8-12', key: 'v' }],
    ['circle', { cx: 12, cy: 4, r: 1.5, key: 'dot' }],
  ],
};

/** 实心的部分写 fill="currentColor"：颜色仍跟随文字 */
const badge: IconData = {
  node: [
    ['circle', { cx: 12, cy: 12, r: 9, key: 'ring' }],
    ['path', { d: 'M8 12l3 3 5-6', key: 'check' }],
    ['circle', { cx: 18.5, cy: 5.5, r: 2.5, fill: 'currentColor', key: 'dot' }],
  ],
};

/** 画布不是 24 时写 size（或 width、height） */
const wave: IconData = {
  size: 32,
  node: [['path', { d: 'M2 16c4-8 8-8 12 0s8 8 12 0 4-4 4-4', key: 'wave' }]],
};

export default _component(() => () => (
  <Flex gap="xl" align="center">
    <Icon icon={logo} size={40} aria-label="站点标志" />
    <Icon icon={badge} size={40} tone="accent" aria-label="已认证" />
    <Icon icon={wave} size={40} tone="info" aria-label="信号" />
  </Flex>
));
