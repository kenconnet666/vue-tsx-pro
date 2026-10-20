import { _component } from '@vue-tsx-pro/tsx';
import { Icon, type IconData } from '@vue-tsx-pro/ui';

/** 自己的图标：按 Lucide 的格式写节点，画布默认 24 */
const logo: IconData = {
  node: [
    ['path', { d: 'M4 6l8 12 8-12', key: 'v' }],
    ['circle', { cx: 12, cy: 4, r: 1.5, key: 'dot' }],
  ],
};

export default _component(() => () => <Icon icon={logo} size={40} aria-label="站点标志" />);
