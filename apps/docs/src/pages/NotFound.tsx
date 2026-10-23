import { _component } from '@vue-tsx-pro/tsx';
import { LinkButton, Result } from '@vue-tsx-pro/ui';

/** 找不到页面 */
export default _component(() => () => (
  <Result status="404" action={<LinkButton href="/">回到首页</LinkButton>} />
));
