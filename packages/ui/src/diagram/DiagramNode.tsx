/**
 * 画布的标准节点：填满 Diagram 给的节点框的卡片，流程步骤、组织架构、关系图的节点不必各自写样式。
 * Diagram 没给 children 时每个节点就画成它（标题是 getNodeLabel）。
 *
 *   <Diagram nodes={steps} …>{(step) => <DiagramNode title={step.name} />}</Diagram>
 *   <DiagramNode start={<Avatar name={person.name} size="sm" />} title={person.name} description={person.title} align="start" />
 *   <DiagramNode start={<Icon icon={Warehouse} />} tone="success" title="华东仓" description="仓库" align="start" />
 *   <DiagramNode title="部门审批" tone="accent" active />
 *
 * 形状默认取节点数据的 shape（Diagram 经上下文给），连线也按它接到轮廓上；选中、焦点的描边由 Diagram 画在节点框外，
 * 胶囊、圆的描边跟着形状，菱形的是节点框。
 *
 * 部件（data-scope="diagram-node"）：Root（div）、Shape（菱形的 svg）、Start、Body、Title、Description、End。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { t } from '../config/theme/tokens';
import { partAttrs } from '../config/styles';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';
import type { DiagramNodeShape } from './geometry';
import { relativeFontSizes } from '../utils/style/typography';

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
   * 色调：底色、边框与起始边的颜色。neutral 是普通的卡片，别的色调用来区分类型或标出状态（正在处理、走过的、出错）
   * @default 'neutral'
   */
  tone?: StatusTone;
  /** 形状：默认取节点数据的 shape（在 Diagram 里），都没有时是 rect */
  shape?: DiagramNodeShape;
  /** 正在进行：边框加粗、外面一圈色调的光晕（流程的当前步骤） */
  active?: boolean;
  /** 虚线边框：草稿、停用、还没走到的 */
  dashed?: boolean;
  /**
   * 内容的对齐：center 居中（流程步骤），start 靠起始边（名片式：头像、图标在前）
   * @default 'center'
   */
  align?: 'center' | 'start';
  /** 说明下面的更多内容 */
  children?: VNodeChild;
  /** 起始边那一格的部件属性 */
  propsStart?: PartProps<'span'>;
  /** 标题、说明那一列的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'div'>;
  /** 结束边那一格的部件属性 */
  propsEnd?: PartProps<'span'>;
}

/** 部件的标记（data-scope="diagram-node"） */
const nodePart = (part: string) => partAttrs({ name: 'DiagramNode' }, part);

/** Diagram 的节点框给里面的 DiagramNode 的：节点数据的形状 @internal */
export const DiagramNodeFrameContext = createContext<{ readonly shape?: DiagramNodeShape }>(
  'DiagramNodeFrame',
);

/** DiagramNode 的样式：root、pill、circle、diamond、dashed、alignStart、body、title、description、start、end（测试要用，不进入口） @internal */
export const diagramNodeStyles = css.create({
  root: {
    position: 'relative',
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
  circle: { borderRadius: '50%', paddingInline: '_space.xs' },
  // 菱形由底下的 SVG 画（边框、底色），节点框本身透明；内容只占中间一半宽
  diamond: {
    overflow: 'visible',
    paddingInline: '25%',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    boxShadow: 'none',
  },
  dashed: { borderStyle: 'dashed', boxShadow: 'none' },
  active: { borderWidth: '_sm' },
  alignStart: { justifyContent: 'flex-start' },
  body: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '_xxs',
    minWidth: 0,
    textAlign: 'center',
  },
  bodyStart: { textAlign: 'start' },
  title: { fontWeight: '_medium', overflowWrap: 'anywhere' },
  description: { fontSize: relativeFontSizes.xs, color: '_textMuted', overflowWrap: 'anywhere' },
  start: { position: 'relative', display: 'flex', flexShrink: 0 },
  end: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    marginInlineStart: 'auto',
  },
  diamondShape: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
    strokeWidth: 1,
    pointerEvents: 'none',
  },
  diamondDashed: { strokeDasharray: '5 4' },
  diamondActive: { strokeWidth: 2 },
});

/** 色调：节点的底色与边框 */
const diagramNodeToneStyles = css.create({
  neutral: { backgroundColor: '_surfaceRaised', borderColor: '_borderStrong' },
  accent: { backgroundColor: '_accentSoft', borderColor: '_accentBorder' },
  info: { backgroundColor: '_infoSoft', borderColor: '_infoBorder' },
  success: { backgroundColor: '_successSoft', borderColor: '_successBorder' },
  warning: { backgroundColor: '_warningSoft', borderColor: '_warningBorder' },
  danger: { backgroundColor: '_dangerSoft', borderColor: '_dangerBorder' },
});

/** 色调：菱形（SVG）的底色与边框，同上 */
const diamondToneStyles = css.create({
  neutral: { fill: '_surfaceRaised', stroke: '_borderStrong' },
  accent: { fill: '_accentSoft', stroke: '_accentBorder' },
  info: { fill: '_infoSoft', stroke: '_infoBorder' },
  success: { fill: '_successSoft', stroke: '_successBorder' },
  warning: { fill: '_warningSoft', stroke: '_warningBorder' },
  danger: { fill: '_dangerSoft', stroke: '_dangerBorder' },
});

/** 正在进行时边框用色调的实色，外面一圈半透明的光晕 */
const ACTIVE_COLORS: Record<StatusTone, string> = {
  neutral: t.colors.textMuted,
  accent: t.colors.accent,
  info: t.colors.info,
  success: t.colors.success,
  warning: t.colors.warning,
  danger: t.colors.danger,
};
const halo = (color: string) => `0 0 0 4px color-mix(in srgb, ${color} 24%, transparent)`;
const activeTones = css.create({
  neutral: { borderColor: ACTIVE_COLORS.neutral, boxShadow: halo(ACTIVE_COLORS.neutral) },
  accent: { borderColor: ACTIVE_COLORS.accent, boxShadow: halo(ACTIVE_COLORS.accent) },
  info: { borderColor: ACTIVE_COLORS.info, boxShadow: halo(ACTIVE_COLORS.info) },
  success: { borderColor: ACTIVE_COLORS.success, boxShadow: halo(ACTIVE_COLORS.success) },
  warning: { borderColor: ACTIVE_COLORS.warning, boxShadow: halo(ACTIVE_COLORS.warning) },
  danger: { borderColor: ACTIVE_COLORS.danger, boxShadow: halo(ACTIVE_COLORS.danger) },
});
/** 菱形的 box-shadow 是方的：光晕改用跟着轮廓的 drop-shadow */
const glow = (color: string) =>
  `drop-shadow(0 0 3px color-mix(in srgb, ${color} 60%, transparent))`;
const diamondActiveTones = css.create({
  neutral: { stroke: ACTIVE_COLORS.neutral, filter: glow(ACTIVE_COLORS.neutral) },
  accent: { stroke: ACTIVE_COLORS.accent, filter: glow(ACTIVE_COLORS.accent) },
  info: { stroke: ACTIVE_COLORS.info, filter: glow(ACTIVE_COLORS.info) },
  success: { stroke: ACTIVE_COLORS.success, filter: glow(ACTIVE_COLORS.success) },
  warning: { stroke: ACTIVE_COLORS.warning, filter: glow(ACTIVE_COLORS.warning) },
  danger: { stroke: ACTIVE_COLORS.danger, filter: glow(ACTIVE_COLORS.danger) },
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
    shape,
    active = false,
    dashed = false,
    align = 'center',
    children,
    propsStart,
    propsBody,
    propsTitle,
    propsDescription,
    propsEnd,
    ...rest
  }: DiagramNodeProps) => {
    const frame = DiagramNodeFrameContext.inject(null);
    return () => {
      const form = shape ?? frame?.shape ?? 'rect';
      const diamond = form === 'diamond';
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                diagramNodeStyles.root,
                diagramNodeToneStyles[tone],
                dashed && diagramNodeStyles.dashed,
                active && diagramNodeStyles.active,
                active && activeTones[tone],
                // 放在色调、正在进行之后：菱形要把节点框的边框、阴影都去掉
                form !== 'rect' && diagramNodeStyles[form],
                align === 'start' && diagramNodeStyles.alignStart,
              ],
              ...nodePart('root'),
            },
            rest,
            // Diagram 按它把选中、焦点的描边画成同样的形状
            dataAttrs({ 'data-diagram-shape': form, 'data-active': active || undefined }),
          )}
        >
          {diamond && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              {...nodePart('shape')}
              {...css.attrs(
                diagramNodeStyles.diamondShape,
                diamondToneStyles[tone],
                dashed && diagramNodeStyles.diamondDashed,
                active && diagramNodeStyles.diamondActive,
                active && diamondActiveTones[tone],
              )}
            >
              <polygon points="50,0 100,50 50,100 0,50" vector-effect="non-scaling-stroke" />
            </svg>
          )}
          {hasContent(start) && (
            <span
              {...mergeAttrs<'span'>(
                { sx: [diagramNodeStyles.start, startTones[tone]], ...nodePart('start') },
                propsStart,
              )}
            >
              {start}
            </span>
          )}
          {/* 标题、说明是块级元素：读屏与无障碍检查从内容取文字时两段之间有停顿，不会连成一串 */}
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [diagramNodeStyles.body, align === 'start' && diagramNodeStyles.bodyStart],
                ...nodePart('body'),
              },
              propsBody,
            )}
          >
            {hasContent(title) && (
              <div
                {...mergeAttrs<'div'>(
                  { sx: diagramNodeStyles.title, ...nodePart('title') },
                  propsTitle,
                )}
              >
                {title}
              </div>
            )}
            {hasContent(description) && (
              <div
                {...mergeAttrs<'div'>(
                  { sx: diagramNodeStyles.description, ...nodePart('description') },
                  propsDescription,
                )}
              >
                {description}
              </div>
            )}
            {children}
          </div>
          {hasContent(end) && (
            <span
              {...mergeAttrs<'span'>({ sx: diagramNodeStyles.end, ...nodePart('end') }, propsEnd)}
            >
              {end}
            </span>
          )}
        </div>
      );
    };
  },
);
