/**
 * 组件页的 API 小节：从类型与 JSDoc 生成的数据（virtual:api/XxxProps）按种类分表列出：属性、事件、内容、部件。
 *
 *   import api from 'virtual:api/ButtonProps';
 *   <ApiReference api={api} />
 */
import { _component } from '@vue-tsx-pro/tsx';
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
              {item.name.replace(/Props$/, '')}
            </H3>
          )}
          {item.description && <Paragraph tone="muted">{item.description}</Paragraph>}
          {KINDS.map(([kind, label]) => {
            const props = item.props.filter((prop) => prop.kind === kind);
            return props.length > 0 && <PropsTable key={kind} props={props} caption={label} />;
          })}
        </Flex>
      ))}
    </Flex>
  );
});
