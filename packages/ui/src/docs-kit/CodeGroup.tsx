/**
 * 一组代码，用标签页切换：安装命令（pnpm / npm / yarn）、同一段逻辑的几个文件。由 Tabs 与 CodeBlock 组合，
 * 标签栏就是代码块的标题栏。
 *
 *   <CodeGroup items={[
 *     { label: 'pnpm', code: 'pnpm add @vue-tsx-pro/ui', lang: 'bash' },
 *     { label: 'npm', code: 'npm i @vue-tsx-pro/ui', lang: 'bash' },
 *   ]} />
 *
 * 选中哪一个可以双向绑定（value={_bind(manager)}），几组代码绑同一个变量就一起切换。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { CodeBlock, type CodeBlockProps } from '../base/CodeBlock';
import { Tab, TabList, TabPanel, Tabs, type TabListProps } from '../navigation/Tabs';
import { mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { t } from '../config/theme/tokens';

/** 一组代码里的一段 */
export interface CodeGroupItem extends Omit<CodeBlockProps, 'title'> {
  /** 标签上的文字；也是这一段的值（没给 value 时） */
  label: string;
  /** 这一段的值，默认等于 label */
  value?: string;
}

/** 未声明的属性落到外层的 div 上 */
export interface CodeGroupProps extends PartProps<'div'> {
  /** 各段代码 */
  items: readonly CodeGroupItem[];
  /** 选中的那一段的值：父级可以写 value={_bind(x)}；默认第一段 */
  value?: string;
  /** 标签栏的部件属性；名称（aria-label）默认是各段标签连起来 */
  propsList?: Partial<TabListProps>;
}

/** CodeGroup 的样式：外框与标签栏；代码块去掉自己的外框 */
export const codeGroupStyles = stylex.create({
  root: {
    minWidth: 0,
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
    backgroundColor: '_surface',
    overflow: 'hidden',
  },
  list: { paddingInline: '_sm', backgroundColor: '_surfaceMuted', fontSize: '_sm' },
  panel: { outlineOffset: `calc(-1 * ${t.borderWidths.sm})` },
  block: { borderWidth: 0, borderRadius: 0 },
});

const keyOf = (item: CodeGroupItem) => item.value ?? item.label;

/** 一组代码，标签页切换 */
export const CodeGroup = _component(
  ({
    items,
    value = _bindable<string | undefined>(undefined),
    propsList,
    ...rest
  }: CodeGroupProps) =>
    () => {
      const selected = value ?? (items[0] && keyOf(items[0]));
      return (
        <div {...mergeAttrs<'div'>({ sx: codeGroupStyles.root }, rest)}>
          <Tabs
            value={selected}
            // 默认选第一段时 value 是 undefined，不能直接 _bind：选中时写回
            {...{ 'onUpdate:value': (next: string) => (value = next) }}
            size="sm"
          >
            <TabList
              {...mergePartProps<TabListProps>(
                {
                  sx: codeGroupStyles.list,
                  'aria-label': items.map((item) => item.label).join(' / '),
                },
                propsList,
              )}
            >
              {items.map((item) => (
                <Tab key={keyOf(item)} value={keyOf(item)}>
                  {item.label}
                </Tab>
              ))}
            </TabList>
            {items.map((item) => {
              const { label: _label, value: _value, propsRoot, ...block } = item;
              return (
                <TabPanel key={keyOf(item)} value={keyOf(item)} sx={codeGroupStyles.panel}>
                  <CodeBlock
                    {...block}
                    propsRoot={mergeProps<'div'>({ sx: codeGroupStyles.block }, propsRoot)}
                  />
                </TabPanel>
              );
            })}
          </Tabs>
        </div>
      );
    },
);
