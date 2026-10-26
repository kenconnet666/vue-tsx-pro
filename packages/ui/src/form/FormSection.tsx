/**
 * 表单里的一组字段：标题、说明、右侧的操作，下面一条细线，再下面是字段的栅格。长表单按主题分组（基本信息、计划与实施……）。
 *
 *   <FormSection title="项目基本信息" columns={2}>
 *     <Field label="项目名称">…</Field>
 *     <Field label="任务类别">…</Field>
 *     <GridItem span="full"><Field label="简要描述">…</Field></GridItem>
 *   </FormSection>
 *
 * columns 是最多几列：每列不窄于 minColumnWidth，容器窄时自动减少列数，不需要断点；跨列用 GridItem（多列时用 span="full"）。
 * 也是一层字段布局（field-layout）：标签位置、宽度、对齐、只读、不可用写在这里只作用于这一组，没写的沿用 Form 的。
 * collapsible 时标题是展开收起的按钮（aria-expanded），收起的字段不能被 Tab 到。
 * 给了 id 就能当锚点：长表单旁边放一个 TableOfContents（items 用各组的 id 与标题）做分节导航，跳过来时让开粘性顶栏。
 * 语义：role="group" 以标题为名称、说明为描述，标题是 h2–h6（headingLevel），读屏能按标题跳转。
 *
 * 部件：Root（div）、Header（div）、Heading（h2–h6）、Trigger（ButtonBase，collapsible 时）、Chevron（Icon）、
 * Description（Text）、Extra（div）、Body（div，字段的栅格）、Collapse（collapsible 时包住 Body）。
 */
import { ChevronDown } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { h, useId, type VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon, type IconProps } from '../base/Icon';
import { Text, type TextProps } from '../base/Text';
import { space, t } from '../config/theme/tokens';
import { Collapse, type CollapseProps } from '../display/Collapse';
import { provideGridColumns } from '../layout/Grid';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { disclosureStyles } from '../utils/style/transitions';
import { layoutVars } from '../utils/style/vars';
import { provideFieldLayout, type FieldLayout } from './field-layout';

/** 角色与关联由组件管理；原生的 title 属性让给标题内容 */
export type FormSectionManaged = 'role' | 'title' | 'aria-labelledby' | 'aria-describedby';

/** 未声明的属性落到外层 div 上 */
export interface FormSectionProps extends PartProps<'div', FormSectionManaged>, FieldLayout {
  /** 标题；不写时没有标题栏，只是一层栅格与字段布局 */
  title?: VNodeChild;
  /** 标题下面的说明 */
  description?: VNodeChild;
  /** 标题栏结束边的内容：链接、按钮（“查看关联明细”“添加”） */
  extra?: VNodeChild;
  /** 标题的级别（h2–h6），默认 3 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** 最多几列，默认 1；容器窄时按 minColumnWidth 自动减少 */
  columns?: number;
  /** 每列的最小宽度（CSS 长度），默认 `'26em'`：标签在起始边时放得下标签、控件与横排的三四个选项 */
  minColumnWidth?: string;
  /** 可以展开收起：标题变成按钮 */
  collapsible?: boolean;
  /** 是否展开（collapsible 时）：父级写 _open={x}，默认展开 */
  _open?: boolean;
  /** 标题栏的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 标题（h2–h6）的部件属性 */
  propsHeading?: PartProps<'h3'>;
  /** 展开收起按钮的部件属性 */
  propsTrigger?: Omit<Partial<ButtonBaseProps>, 'aria-expanded' | 'aria-controls'>;
  /** 展开箭头的部件属性 */
  propsChevron?: Partial<IconProps>;
  /** 说明的部件属性 */
  propsDescription?: Partial<TextProps>;
  /** 标题栏结束边内容的部件属性 */
  propsExtra?: PartProps<'div'>;
  /** 字段栅格的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 展开收起层的部件属性（collapsible 时） */
  propsCollapse?: Partial<CollapseProps>;
  /** 字段 */
  children?: VNodeChild;
}

/** FormSection 的样式：root、header、headerText、heading、trigger、chevron、description、extra、body、singleColumn */
export const formSectionStyles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_lg',
    minWidth: 0,
    // 分节导航（TableOfContents、锚点）跳过来时让开粘性顶栏，再留一点空
    scrollMarginBlockStart: `calc(${layoutVars.stickyOffset} + ${space.lg})`,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    columnGap: '_lg',
    rowGap: '_xs',
    paddingBlockEnd: '_sm',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
  },
  headerText: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
  heading: {
    margin: 0,
    fontSize: '_md',
    fontWeight: '_semibold',
    lineHeight: '_tight',
    color: '_text',
  },
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
    marginInline: `calc(-1 * ${t.space.xs})`,
    paddingInline: '_xs',
    borderRadius: '_sm',
    fontWeight: 'inherit',
    color: 'inherit',
    textAlign: 'start',
    backgroundColor: { default: 'transparent', ':hover': '_fill' },
  },
  chevron: { flexShrink: 0, color: '_textMuted' },
  chevronClosed: { rotate: '-90deg' },
  description: { fontSize: '_sm', lineHeight: '_normal' },
  extra: { display: 'flex', alignItems: 'center', gap: '_sm', flexShrink: 0 },
  // 多列时列间距比行间距大：一眼看出哪几项是同一列
  body: {
    '--form-section-column-gap': '_space.xl',
    display: 'grid',
    columnGap: 'var(--form-section-column-gap)',
    rowGap: '_md',
    gridTemplateColumns: 'minmax(0, 1fr)',
    alignItems: 'start',
  },
});

/** FormSection 的样式：columns（最多几列、每列不窄于多少） */
export const formSectionColumnStyles = css.create({
  columns: (count: number, minWidth: string) => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(max(min(${minWidth}, 100%), calc((100% - ${count - 1} * var(--form-section-column-gap)) / ${count})), 1fr))`,
  }),
});

/** 表单里的一组字段：标题栏、字段栅格，可折叠；这一组的标签布局、只读、不可用 */
export const FormSection = _component(
  ({
    title,
    description,
    extra,
    headingLevel = 3,
    columns = 1,
    minColumnWidth = '26em',
    collapsible = false,
    _open: open = _bindable(true),
    labelPlacement,
    labelWidth,
    labelAlign,
    disabled,
    readonly,
    propsHeader,
    propsHeading,
    propsTrigger,
    propsChevron,
    propsDescription,
    propsExtra,
    propsBody,
    propsCollapse,
    children,
    ...rest
  }: FormSectionProps) => {
    const id = useId();
    const ids = { title: `${id}-title`, description: `${id}-description`, body: `${id}-body` };
    provideFieldLayout(() => ({ labelPlacement, labelWidth, labelAlign, disabled, readonly }));
    const bodyRef = provideGridColumns(() =>
      columns > 1 ? { columns, minItemWidth: minColumnWidth } : { columns: 1 },
    );

    return () => {
      const expanded = !collapsible || open;
      const state = expanded ? 'open' : 'closed';
      const titleContent = collapsible ? (
        <ButtonBase
          {...mergePartProps<ButtonBaseProps>({ sx: formSectionStyles.trigger }, propsTrigger, {
            id: ids.title,
            'aria-expanded': open,
            'aria-controls': ids.body,
            onClick: () => (open = !open),
          })}
          data-state={state}
        >
          <span>{title}</span>
          <Icon
            {...mergePartProps<IconProps>(
              {
                icon: ChevronDown,
                sx: [
                  formSectionStyles.chevron,
                  disclosureStyles.icon,
                  !open && formSectionStyles.chevronClosed,
                ],
              },
              propsChevron,
            )}
          />
        </ButtonBase>
      ) : (
        <span id={ids.title}>{title}</span>
      );
      const body = (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                formSectionStyles.body,
                columns > 1 && formSectionColumnStyles.columns(columns, minColumnWidth),
              ],
            },
            propsBody,
            { ref: bodyRef, ...(collapsible ? {} : { id: ids.body }) },
          )}
        >
          {children}
        </div>
      );
      return (
        <div
          {...mergeAttrs<'div'>({ sx: formSectionStyles.root }, rest, {
            role: hasContent(title) ? 'group' : undefined,
            'aria-labelledby': hasContent(title) ? ids.title : undefined,
            'aria-describedby': hasContent(description) ? ids.description : undefined,
          })}
          data-state={collapsible ? state : undefined}
        >
          {(title != null || extra != null) && (
            <div {...mergeAttrs<'div'>({ sx: formSectionStyles.header }, propsHeader)}>
              <div {...css.attrs(formSectionStyles.headerText)}>
                {hasContent(title) &&
                  h(
                    `h${headingLevel}`,
                    mergeAttrs<'h3'>({ sx: formSectionStyles.heading }, propsHeading),
                    [titleContent],
                  )}
                {hasContent(description) && (
                  <Text
                    {...mergePartProps<TextProps>(
                      { tone: 'muted', sx: formSectionStyles.description },
                      propsDescription,
                      { id: ids.description },
                    )}
                  >
                    {description}
                  </Text>
                )}
              </div>
              {hasContent(extra) && (
                <div {...mergeAttrs<'div'>({ sx: formSectionStyles.extra }, propsExtra)}>
                  {extra}
                </div>
              )}
            </div>
          )}
          {collapsible ? (
            <Collapse
              {...mergePartProps<CollapseProps>({}, propsCollapse, { id: ids.body })}
              _open={open}
            >
              {body}
            </Collapse>
          ) : (
            body
          )}
        </div>
      );
    };
  },
);
