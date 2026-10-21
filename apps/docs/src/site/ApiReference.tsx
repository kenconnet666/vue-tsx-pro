/**
 * 组件页的 API 小节：从类型与 JSDoc 生成的数据（virtual:api/XxxProps）按种类分表列出：属性、事件、内容、部件。
 *
 *   import api from 'virtual:api/ButtonProps';
 *   <ApiReference api={api} />
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Flex, H2, H3, Paragraph } from '@vue-tsx-pro/ui';
import { PropsTable, type ApiPropKinds, type ComponentApi } from '@vue-tsx-pro/ui/docs-kit';
import { onBeforeUnmount, onMounted } from 'vue';
import { afterFirstPaint, whenIdle } from './idle';

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

/** 一个组件的 API 按种类分成的几张表 */
const tablesOf = (item: ComponentApi) =>
  KINDS.map(([kind, label]) => ({
    kind,
    label,
    props: item.props.filter((prop) => prop.kind === kind),
  })).filter((table) => table.props.length > 0);

/** API 小节：每个组件一组表格 */
export const ApiReference = _component(({ api }: ApiReferenceProps) => {
  const apis = () => (Array.isArray(api) ? api : [api]);
  // 表格在页面底部，打开页面时看不见，却占了换页时三四成的渲染（一页上千个单元格）：
  // 标题、说明先渲染（本页目录与 #api 锚点照常），首帧画出来以后，空闲时一张一张补上
  let shown = _state(0);
  let cancel = () => {};
  onMounted(() => {
    const total = apis().reduce((sum, item) => sum + tablesOf(item).length, 0);
    const next = () => {
      shown++;
      if (shown < total) cancel = whenIdle(next);
    };
    cancel = afterFirstPaint(next);
  });
  onBeforeUnmount(() => cancel());

  return () => {
    const list = apis();
    // 每张表在整页里排第几（按序号补上）：先算好，不在渲染里累加——下面是 Flex 的插槽，
    // shown 变了只重新渲染插槽，外面的计数器不会归零
    let offset = 0;
    const groups = list.map((item) => {
      const tables = tablesOf(item);
      const start = offset;
      offset += tables.length;
      return { item, tables, start };
    });
    return (
      <Flex direction="column" gap="lg">
        <H2 id="api" size="xl" anchor>
          API
        </H2>
        {groups.map(({ item, tables, start }) => (
          <Flex key={item.name} direction="column" gap="md">
            {list.length > 1 && (
              <H3 id={`api-${item.name}`} size="lg" anchor>
                {item.component}
              </H3>
            )}
            {item.description && <Paragraph tone="muted">{item.description}</Paragraph>}
            {tables.map(
              ({ kind, label, props }, index) =>
                start + index < shown && (
                  <div key={kind} {...stylex.attrs(styles.table)}>
                    <PropsTable props={props} caption={label} />
                  </div>
                ),
            )}
          </Flex>
        ))}
      </Flex>
    );
  };
});
