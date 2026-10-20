import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/AvatarProps';
import groupApi from 'virtual:api/AvatarGroupProps';
import indicatorApi from 'virtual:api/IndicatorProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Group from './demo/Group.tsx?demo';
import Indicators from './demo/Indicators.tsx?demo';

export const meta = {
  title: 'Avatar 头像',
  description:
    '用户、团队的头像：图片加载失败时显示首字母；头像组叠放并折叠成“+N”；角标（Indicator）标出未读数与在线状态。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Avatar, AvatarGroup, Indicator } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <Example id="basic" title="基础用法" demo={Basic}>
        <Code>name</Code> 是读屏念的名称，也用来生成首字母；图片还没加载好、加载失败时显示后备内容。
        <Code>radius="md"</Code> 用于团队、组织；后备内容的 <Code>variant</Code> 与{' '}
        <Code>tone</Code> 同 Badge。
      </Example>
      <Example id="group" title="头像组" demo={Group}>
        <Code>AvatarGroup</Code> 把头像叠放，超过 <Code>max</Code> 的折叠成“+N”，读屏念“还有 N
        人”；列表只拿到一部分时用 <Code>total</Code> 算 N。组里头像的大小随组的 <Code>size</Code>。
      </Example>
      <Example id="indicator" title="角标" demo={Indicators}>
        <Code>Indicator</Code> 包住要标记的元素：计数超过 <Code>max</Code> 显示“99+”，0 时不显示；
        <Code>dot</Code> 是小圆点。数字对读屏隐藏，另有一句完整的 <Code>label</Code>。
      </Example>
    </Examples>
    <ApiReference api={[api, groupApi, indicatorApi]} />
  </DocPage>
));
