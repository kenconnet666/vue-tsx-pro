import { _component } from '@vue-tsx-pro/tsx';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import CaseHome from './frames/CaseHome.tsx?demo';

export const meta = {
  title: 'Case Home 降本管理首页',
  description:
    '联合降本管理的首页：模块入口（做什么、谁用、几期，没做好的标建设中）、从提出到关闭的业务流程、统计口径要点；不重复放统计数字。',
  order: 0.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { AppShell, Badge, LinkButton, NavList } from '@vue-tsx-pro/ui';"
  >
    <Example id="home" title="降本管理首页" demo={CaseHome} frame="48rem">
      侧栏是盖在页面上的抽屉、默认收起，首页就是导航：模块入口与侧栏同一份数据（各项的说明、使用岗位与分期），做好的整张卡片可点，没做好的用虚线框、标“建设中”。业务流程一行六步，每一步写清在哪个模块办；统计口径列出最容易算错的五条。条数在台账的页签上、统计在看板里，首页不重复放数字。
    </Example>
  </DocPage>
));
