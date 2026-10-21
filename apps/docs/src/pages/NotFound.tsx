import { _component } from '@vue-tsx-pro/tsx';
import { LinkButton, Result } from '@vue-tsx-pro/ui';

/** 找不到页面 */
export default _component(() => () => (
  <Result
    tone="warning"
    title="找不到这个页面"
    description="地址可能写错了，或者页面已经移走。"
    action={<LinkButton href="/">回到首页</LinkButton>}
  />
));
