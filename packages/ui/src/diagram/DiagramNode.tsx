/**
 * 画布的标准节点：填满 Diagram 给的节点框的卡片，流程步骤、组织架构、关系图的节点不必各自写样式。
 * Diagram 没给 children 时每个节点就画成它（标题是 getNodeLabel）。
 *
 *   <Diagram nodes={steps} …>{(step) => <DiagramNode title={step.name} shape={step.end ? 'pill' : 'rect'} />}</Diagram>
 *   <DiagramNode start={<Avatar name={person.name} size="sm" />} title={person.name} description={person.title} align="start" />
 *   <DiagramNode start={<Icon icon={Warehouse} />} tone="success" title="华东仓" description="仓库" align="start" />
 *
 * 选中、焦点的描边由 Diagram 画在节点框外，shape="pill" 时描边也是胶囊形。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';

/** 节点的形状 */
export interface DiagramNodeShapes {
  /** 圆角矩形，默认 */
  rect: unknown;
  /** 胶囊形：开始、结束 */
  pill: unknown;
}

/** 未声明的属性落到外层 div 上；原生的 title 属性让给标题 */
export interface DiagramNodeProps extends PartProps<'div', 'title'> {
  /** 标题：节点的名字 */
  title?: VNodeChild;
  /** 标题下的说明（次要文字）：岗位、类型、处理人 */
  description?: VNodeChild;
  /** 起始边：图标、头像；图标的颜色跟着 tone */
  start?: VNodeChild;
  /** 结束边：标记、数字 */
  end?: VNodeChild;
  /**
   * 色调：底色、边框与起始边的颜色。neutral 是普通的卡片，别的色调用来区分类型或标出状态（当前步骤、已完成、被退回）
   * @default 'neutral'
   */
  tone?: StatusTone;
  /**
   * 形状
   * @default 'rect'
   */
  shape?: keyof DiagramNodeShapes;
  /** 虚线边框：草稿、停用、还没走到的 */
  dashed?: boolean;
  /**
   * 内容的对齐：center 居中（流程步骤），start 靠起始边（名片式：头像、图标在前）
   * @default 'center'
   */
  align?: 'center' | 'start';
  /** 说明下面的更多内容 */
  children?: VNodeChild;
}

/** DiagramNode 的样式：root、pill、dashed、alignStart、body、title、description、start、end */
export const diagramNodeStyles = css.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_space.sm',
    minWidth: 0,
    boxSizing: 'border-box',
    paddingInline: '_space.sm',
    overflow: 'hidden',
    lineHeight: '_tight',
    color: '_text',
    borderWidth: '_sm',
    borderStyle: 'solid',
    borderRadius: '_md',
    boxShadow: '_xs',
  },
  pill: { borderRadius: '_full', paddingInline: '_space.md' },
  dashed: { borderStyle: 'dashed', boxShadow: 'none' },
  alignStart: { justifyContent: 'flex-start' },
  body: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, textAlign: 'center' },
  bodyStart: { textAlign: 'start' },
  title: { fontWeight: '_medium', overflowWrap: 'anywhere' },
  description: { fontSize: '0.85em', color: '_textMuted', overflowWrap: 'anywhere' },
  start: { display: 'flex', flexShrink: 0 },
  end: { display: 'flex', alignItems: 'center', flexShrink: 0, marginInlineStart: 'auto' },
});

/** 色调：节点的底色与边框 */
export const diagramNodeToneStyles = css.create({
  neutral: { backgroundColor: '_surfaceRaised', borderColor: '_borderStrong' },
  accent: { backgroundColor: '_accentSoft', borderColor: '_accentBorder' },
  info: { backgroundColor: '_infoSoft', borderColor: '_infoBorder' },
  success: { backgroundColor: '_successSoft', borderColor: '_successBorder' },
  warning: { backgroundColor: '_warningSoft', borderColor: '_warningBorder' },
  danger: { backgroundColor: '_dangerSoft', borderColor: '_dangerBorder' },
});

/** 色调：起始边（图标）的颜色 */
const startTones = css.create({
  neutral: { color: '_textMuted' },
  accent: { color: '_accentText' },
  info: { color: '_infoText' },
  success: { color: '_successText' },
  warning: { color: '_warningText' },
  danger: { color: '_dangerText' },
});

/** 画布的标准节点 */
export const DiagramNode = _component(
  ({
    title,
    description,
    start,
    end,
    tone = 'neutral',
    shape = 'rect',
    dashed = false,
    align = 'center',
    children,
    ...rest
  }: DiagramNodeProps) =>
    () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              diagramNodeStyles.root,
              diagramNodeToneStyles[tone],
              shape === 'pill' && diagramNodeStyles.pill,
              dashed && diagramNodeStyles.dashed,
              align === 'start' && diagramNodeStyles.alignStart,
            ],
          },
          rest,
          // Diagram 按它把选中、焦点的描边画成同样的形状
          dataAttrs({ 'data-diagram-shape': shape }),
        )}
      >
        {hasContent(start) && (
          <span {...css.attrs(diagramNodeStyles.start, startTones[tone])}>{start}</span>
        )}
        {/* 标题、说明是块级元素：读屏与无障碍检查从内容取文字时两段之间有停顿，不会连成一串 */}
        <div
          {...css.attrs(diagramNodeStyles.body, align === 'start' && diagramNodeStyles.bodyStart)}
        >
          {hasContent(title) && <div {...css.attrs(diagramNodeStyles.title)}>{title}</div>}
          {hasContent(description) && (
            <div {...css.attrs(diagramNodeStyles.description)}>{description}</div>
          )}
          {children}
        </div>
        {hasContent(end) && <span {...css.attrs(diagramNodeStyles.end)}>{end}</span>}
      </div>
    ),
);
