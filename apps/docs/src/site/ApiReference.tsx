/**
 * 组件页的 API 小节：从类型与 JSDoc 生成的数据（virtual:api/XxxProps）按种类分表列出：属性、事件、内容、部件。
 *
 *   import api from 'virtual:api/ButtonProps';
 *   <ApiReference api={api} />
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Flex,
  H2,
  H3,
  Paragraph,
  PropsTable,
  type ApiPropKinds,
  type ComponentApi,
} from '@vue-tsx-pro/ui';

/** 各种类的小节标题与顺序 */
const KINDS: [keyof ApiPropKinds, string][] = [
  ['prop', '属性'],
  ['event', '事件'],
  ['content', '内容'],
  ['part', '部件属性'],
];

const styles = stylex.create({
  // API 表在页面底部，打开页面时在视口外：滚到附近才排版、绘制（大组件的几张表有几千个节点）。
  // auto 记住排过一次的高度，滚回来时滚动条不跳
  table: { contentVisibility: 'auto', containIntrinsicSize: 'auto 24rem' },
});

/** ApiReference 的属性 */
export interface ApiReferenceProps {
  /** 一个或几个组件的 API 数据（复合组件各部分依次列出） */
  api: ComponentApi | ComponentApi[];
}

/** API 小节：每个组件一组表格 */
export const ApiReference = _component(({ api }: ApiReferenceProps) => () => {
  const apis = Array.isArray(api) ? api : [api];
  return (
    <Flex direction="column" gap="lg">
      <H2 id="api" size="xl" anchor>
        API
      </H2>
      {apis.map((item) => (
        <Flex key={item.name} direction="column" gap="md">
          {apis.length > 1 && (
            <H3 id={`api-${item.name}`} size="lg" anchor>
              {item.component}
            </H3>
          )}
          {item.description && <Paragraph tone="muted">{item.description}</Paragraph>}
          {KINDS.map(([kind, label]) => {
            const props = item.props.filter((prop) => prop.kind === kind);
            return (
              props.length > 0 && (
                <div key={kind} {...stylex.attrs(styles.table)}>
                  <PropsTable props={props} caption={label} />
                </div>
              )
            );
          })}
        </Flex>
      ))}
    </Flex>
  );
});
