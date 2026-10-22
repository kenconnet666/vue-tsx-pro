/** 地址不对：说明并给出回首页的链接 */
import { _component } from '@vue-tsx-pro/tsx';
import { LinkButton, Result } from '@vue-tsx-pro/ui';
import { paths } from '../../app/paths';

export default _component(() => () => (
  <Result
    tone="warning"
    title="页面不存在"
    description="地址可能写错了，或者这一页已经挪走。"
    action={<LinkButton href={paths.dashboard()}>回首页</LinkButton>}
  />
));
