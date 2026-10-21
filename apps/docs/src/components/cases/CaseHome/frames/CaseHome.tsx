// 案例：联合降本管理的首页（介绍与导航）。一个数只在一处完整展示（条数在台账的页签上、统计在看板里），首页不重复放数字，
// 只做三件事：模块入口（与侧栏同一份数据：做什么、谁用、几期，没做好的标“建设中”）、业务流程（每一步在哪个模块办）、
// 统计口径的要点。数据是虚构的
import {
  ArrowRight,
  ChevronRight,
  CircleAlert,
  Coins,
  Layers,
  Scale,
  SplitSquareHorizontal,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  Flex,
  H1,
  H2,
  Icon,
  LinkButton,
  Paragraph,
  Small,
  Text,
  type IconData,
} from '@vue-tsx-pro/ui';
import { CaseShell, casePath, navGroups, type CasePage, type NavEntry } from '../../shell';

const phases = { 1: '一期', 2: '二期', 3: '三期' } as const;

/** 业务流程：两条渠道提出 → 任务池推进 → 认定、商务 → 兑现关闭；每步在哪办、谁办 */
const flow: { title: string; text: string; where: string; page?: CasePage }[] = [
  {
    title: '提出',
    text: '供应商提交建议（渠道一），项目团队提出方案（渠道二）',
    where: '两条渠道 · 二期',
  },
  {
    title: '评估与派单',
    text: '技术评估、测算预期收益，通过后进入任务池，指定主办',
    where: '收件箱（认领制）',
  },
  {
    title: '方案与验证',
    text: '方案设计、验证，三个里程碑各自上传交付证据',
    where: '单机降本台账、降 DMC 台账',
    page: 'UnitLedger',
  },
  {
    title: '收益认定',
    text: '验证达标后由成本团队认定，锁定测算金额 A',
    where: '收益认定',
  },
  {
    title: '商务洽谈',
    text: '与供应商谈定，回填商务金额 B，差额 D 归因',
    where: '项目详情 · 收益',
  },
  {
    title: '兑现与关闭',
    text: '调价生效即兑现；验证窗结论、认定意见、商务记录三材料齐全后关闭',
    where: '台账的“可关闭”页签',
    page: 'UnitLedger',
  },
];

/** 统计口径的要点（完整的在设计规格里） */
const rules: { icon: IconData; title: string; text: string }[] = [
  {
    icon: Layers,
    title: '四种收益分开挂账',
    text: '机会、预测、承诺、实现分栏，不跨状态合计；同一笔收益只在实现值出现一次',
  },
  {
    icon: SplitSquareHorizontal,
    title: '任务池三桶互斥',
    text: '已确认收益、挂账待定、方案待定，三桶加起来等于任务池总数',
  },
  {
    icon: Coins,
    title: '两种单位分开统计',
    text: '单机降本按万元、降 DMC 按美元 / FH，一个视图只有一种单位',
  },
  {
    icon: Scale,
    title: '金额口径三栏',
    text: '硬节约、成本规避、软节约分三栏，不混成一个总数',
  },
  {
    icon: CircleAlert,
    title: '挂账待定写“待定价”',
    text: '还没定价的不写 0，也不写估算值',
  },
];

const styles = stylex.create({
  page: { display: 'flex', flexDirection: 'column', gap: '2rem', paddingBlock: '_md' },
  intro: { display: 'flex', flexDirection: 'column', gap: '_sm', maxWidth: '56rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '_md' },
  // 模块入口：按侧栏的顺序平铺（每张卡上写所属的组），各组项数不同也不会一列长一列短
  modules: {
    display: 'grid',
    // 21rem：1920 宽时正好五列两行（十项）
    gridTemplateColumns: 'repeat(auto-fill, minmax(21rem, 1fr))',
    gap: '_md',
  },
  // 入口卡片：做好的整张可点（标题链接盖住卡片），悬停浮起；建设中的淡一些
  entry: {
    position: 'relative',
    boxSizing: 'border-box',
    height: '_full',
    display: 'flex',
    gap: '_md',
    alignItems: 'flex-start',
    padding: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: { default: '_border', ':hover': '_borderStrong' },
    borderRadius: '_md',
    backgroundColor: '_surface',
    transition:
      'box-shadow _durations.md _easings.standard, border-color _durations.md _easings.standard',
    boxShadow: { default: 'none', ':hover': '_sm' },
  },
  pending: { borderStyle: 'dashed', backgroundColor: 'transparent', boxShadow: 'none' },
  entryLink: {
    color: '_text',
    fontWeight: '_semibold',
    textDecoration: 'none',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
  entryText: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
  entryHead: { display: 'flex', alignItems: 'center', gap: '_sm', flexWrap: 'wrap' },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '_md',
    backgroundColor: '_accentSoft',
    color: '_accentText',
  },
  iconMuted: { backgroundColor: '_fill', color: '_textMuted' },
  // 业务流程：一行六步，步与步之间是箭头；窄了换行
  flow: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '_xs',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    flexWrap: 'wrap',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '_xs',
    flexGrow: 1,
    flexBasis: '12rem',
    minWidth: 0,
  },
  stepCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_xs',
    flexGrow: 1,
    alignSelf: 'stretch',
    minWidth: 0,
    padding: '_md',
    borderRadius: '_md',
    backgroundColor: '_fill',
  },
  stepNo: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '_full',
    backgroundColor: '_accent',
    color: '_accentContrast',
    fontSize: '_sm',
    fontWeight: '_semibold',
  },
  arrow: { color: '_textMuted', flexShrink: 0 },
  rules: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
    gap: '_md',
  },
  rule: { display: 'flex', gap: '_sm', alignItems: 'flex-start' },
  ruleIcon: { color: '_accentText', flexShrink: 0, marginBlockStart: '0.15em' },
});

/** 一张入口卡：所属的组、名称（做好的是链接，没做好的标“建设中”）、做什么、谁用 */
function entry(item: NavEntry, group: string) {
  const done = item.page != null;
  return (
    <div key={item.key} {...stylex.attrs(styles.entry, !done && styles.pending)}>
      <span {...stylex.attrs(styles.icon, !done && styles.iconMuted)}>
        <Icon icon={item.icon} size="lg" />
      </span>
      <div {...stylex.attrs(styles.entryText)}>
        <Small tone="muted">{group}</Small>
        <div {...stylex.attrs(styles.entryHead)}>
          {done ? (
            <a href={casePath(item.page!)} {...stylex.attrs(styles.entryLink)}>
              {item.label}
            </a>
          ) : (
            <Text weight="semibold" tone="muted">
              {item.label}
            </Text>
          )}
          <Badge tone={item.phase === 1 ? 'accent' : 'neutral'}>{phases[item.phase]}</Badge>
          {!done && <Badge variant="outline">建设中</Badge>}
        </div>
        <Small tone="muted">{item.description}</Small>
        <Small tone="muted">岗位：{item.roles}</Small>
      </div>
    </div>
  );
}

export default _component(() => () => (
  <CaseShell current="home">
    <div {...stylex.attrs(styles.page)}>
      <header {...stylex.attrs(styles.intro)}>
        <H1 size="xl">联合降本管理</H1>
        <Paragraph tone="muted">
          供应商建议（渠道一）与项目团队方案（渠道二）两条渠道汇入同一个任务池；任务经方案设计、验证、收益认定、商务洽谈推进到兑现与关闭，收益在一本账里按机会、预测、承诺、实现四种状态分开挂账。单机降本按万元、降
          DMC 按美元 / FH，分开管理。
        </Paragraph>
        <Flex gap="sm" wrap>
          <LinkButton href={casePath('UnitLedger')} iconEnd={ArrowRight}>
            进入单机降本台账
          </LinkButton>
          <LinkButton href={casePath('CostDashboard')} variant="soft">
            看统计看板
          </LinkButton>
          <LinkButton href={`${import.meta.env.BASE_URL}components/overview`} variant="ghost">
            设计规格
          </LinkButton>
        </Flex>
      </header>

      <section {...stylex.attrs(styles.section)} aria-labelledby="case-home-modules">
        <H2 id="case-home-modules" size="lg">
          模块
        </H2>
        <div {...stylex.attrs(styles.modules)}>
          {navGroups.flatMap((group) => group.items.map((item) => entry(item, group.label)))}
        </div>
      </section>

      <section {...stylex.attrs(styles.section)} aria-labelledby="case-home-flow">
        <H2 id="case-home-flow" size="lg">
          业务流程
        </H2>
        <ol {...stylex.attrs(styles.flow)}>
          {flow.map((step, index) => (
            <li key={step.title} {...stylex.attrs(styles.step)}>
              <div {...stylex.attrs(styles.stepCard)}>
                <Flex align="center" gap="sm">
                  <span {...stylex.attrs(styles.stepNo)} aria-hidden="true">
                    {index + 1}
                  </span>
                  <Text weight="semibold">{step.title}</Text>
                </Flex>
                <Small>{step.text}</Small>
                <Small tone="muted">
                  在哪办：
                  {step.page ? <a href={casePath(step.page)}>{step.where}</a> : step.where}
                </Small>
              </div>
              {index < flow.length - 1 && (
                <Icon icon={ChevronRight} sx={styles.arrow} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section {...stylex.attrs(styles.section)} aria-labelledby="case-home-rules">
        <H2 id="case-home-rules" size="lg">
          统计口径
        </H2>
        <div {...stylex.attrs(styles.rules)}>
          {rules.map((rule) => (
            <div key={rule.title} {...stylex.attrs(styles.rule)}>
              <Icon icon={rule.icon} sx={styles.ruleIcon} />
              <Flex direction="column" gap="xs">
                <Text size="sm" weight="semibold">
                  {rule.title}
                </Text>
                <Small tone="muted">{rule.text}</Small>
              </Flex>
            </div>
          ))}
        </div>
      </section>
    </div>
  </CaseShell>
));
