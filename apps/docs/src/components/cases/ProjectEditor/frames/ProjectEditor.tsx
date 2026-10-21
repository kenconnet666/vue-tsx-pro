// 案例：编辑单机降本项目（长表单）。字段来自《降本项目信息表》的单机降本主表；机型、单位、人员都是虚构的。
// FormSection 分组、两列、标签在左侧；条件必填（选了降本类型才要填对应的金额）；选联络人后带出工号；
// 金额以元保存、按万元输入；底部的 ActionBar 吸在窗口底边，滚动时随时能保存
import {
  Archive,
  Calculator,
  ChartColumn,
  ClipboardList,
  FilePen,
  Inbox,
  Plane,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  ActionBar,
  AppShell,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Checkbox,
  CheckboxGroup,
  Combobox,
  Container,
  DatePicker,
  decimalSchema,
  Flex,
  Form,
  FormSection,
  GridItem,
  H1,
  Icon,
  NavItem,
  NavList,
  NavSection,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  Small,
  TagsInput,
  Text,
  Textarea,
  TextField,
  useForm,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import * as z from 'zod';

const people = [
  { value: 'E10732', label: '林小满', description: '复合材料中心 · 结构设计' },
  { value: 'E20418', label: '周一航', description: '制造工程部 · 工艺' },
  { value: 'E31056', label: '陈默', description: '采购部 · 供应商管理' },
  { value: 'E40287', label: '许悠', description: '总装制造中心 · 计划' },
];
const orgs = ['总装制造中心', '复合材料中心', '制造工程部', '采购部'];
const teams = ['总体技术集成团队', '复合材料结构集成团队', '起落架液压系统集成团队'];
const sources = [
  { value: 'supplier', label: '供应商建议', description: '渠道一：供应商提交的降本建议' },
  { value: 'team', label: '项目团队方案', description: '渠道二：PEMO 派单、产品团队出方案' },
  { value: 'review', label: '年度成本评审', description: '成本团队在评审中识别' },
];
const forms = ['MI 批准', 'QSL 入册', 'ECP 批准', '文件', '实施'];
const suppliers = ['供应商甲', '供应商乙', '供应商丙', '供应商丁'];

const amount = decimalSchema({ min: 0, scale: 2 }).nullable();
const schema = z
  .object({
    name: z.string().min(1, '请填写项目名称').max(200),
    category: z.string().min(1, '请选择任务类别'),
    source: z.string().min(1, '请选择任务来源'),
    org: z.string().min(1, '请选择提出单位'),
    contact: z.string().min(1, '请选择联络人'),
    team: z.string().min(1, '请选择责任一级团队'),
    install: z.string(),
    types: z.array(z.string()).min(1, '至少选一种降本类型'),
    unitSaving: amount,
    dmcSaving: amount,
    description: z.string().min(10, '至少写 10 个字：更改内容、计算依据').max(1000),
    model: z.string().max(60),
    suppliers: z.array(z.string()),
    year: z.string().min(4, '请选择完成年度'),
    flights: z.number().int().min(0).nullable(),
    form: z.string().min(1, '请选择完成形式'),
    needSb: z.string(),
    funding: z.array(z.string()),
    proposalNo: z.string().max(40),
    remark: z.string().max(1000),
  })
  // 条件必填：选了哪种降本类型，就要填对应的预期收益
  .superRefine((values, ctx) => {
    if (values.types.includes('unit') && values.unitSaving == null)
      ctx.addIssue({ code: 'custom', path: ['unitSaving'], message: '请填写单机降本目标' });
    if (values.types.includes('dmc') && values.dmcSaving == null)
      ctx.addIssue({ code: 'custom', path: ['dmcSaving'], message: '请填写降 DMC 目标' });
  });

const styles = stylex.create({
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_sm',
    marginInlineEnd: 'auto',
    fontWeight: '_semibold',
    fontSize: '_lg',
  },
  brandMark: { color: '_accentText' },
  code: { fontFamily: '_mono', fontSize: '_sm' },
});

export default _component(() => {
  let status = _state('');
  const form = useForm({
    schema,
    initial: {
      name: '机型 A 平尾翼根整流罩设计优化',
      category: 'design',
      source: 'team',
      org: '复合材料中心',
      contact: 'E10732',
      team: '复合材料结构集成团队',
      install: 'required',
      types: ['unit'],
      unitSaving: new Decimal('155353.2') as Decimal | null,
      dmcSaving: null as Decimal | null,
      description:
        '整流罩由两件合并为一件，减少紧固件 36 个；材料由 T300 换为 T700，单件减重 2.3 kg。材料降本 9.24 万元、工时降本 6.30 万元，计算方法见三级项目建议书。',
      model: 'C1H02-5513-002 R03',
      suppliers: ['供应商甲'],
      year: '2026',
      flights: 40 as number | null,
      form: 'MI 批准',
      needSb: 'no',
      funding: ['quality'],
      proposalNo: '',
      remark: '',
    },
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      status = '已保存并提交';
      form.reset(form.values);
    },
  });
  const contact = () => people.find((person) => person.value === form.values.contact);
  const visibleErrors = () =>
    Object.keys(form.errors).filter((path) => form.visibleError(path) != null).length;

  async function saveDraft() {
    await new Promise((resolve) => setTimeout(resolve, 400));
    status = '草稿已保存';
    form.reset(form.values);
  }

  return () => {
    const types = form.values.types;
    const errors = visibleErrors();
    return (
      <AppShell
        header={
          <>
            <span {...stylex.attrs(styles.brand)}>
              <Icon icon={Plane} sx={styles.brandMark} />
              联合降本管理
            </span>
            <Avatar size="sm" name="林小满" />
          </>
        }
        sidebar={
          <NavList aria-label="联合降本管理">
            <NavSection label="工作台">
              <NavItem href="#inbox" icon={Inbox} end={<Badge radius="full">3</Badge>}>
                我的收件箱
              </NavItem>
            </NavSection>
            <NavSection label="降本管理">
              <NavItem href="#tasks" icon={ClipboardList} active>
                降本任务
              </NavItem>
              <NavItem href="#details" icon={FilePen}>
                降本明细
              </NavItem>
              <NavItem href="#model" icon={Calculator}>
                测算模型
              </NavItem>
              <NavItem href="#reserve" icon={Archive}>
                储备库
              </NavItem>
              <NavItem href="#stats" icon={ChartColumn}>
                统计分析
              </NavItem>
            </NavSection>
          </NavList>
        }
      >
        {/* 两列的表单在宽屏上限宽居中：一行太长，眼睛从标签扫到控件太远 */}
        <Container size="lg" padding="none">
          <Flex direction="column" gap="xl">
            <Flex direction="column" gap="sm">
              <Breadcrumbs
                items={[{ label: '降本任务', href: '#tasks' }, { label: '编辑降本项目' }]}
              />
              <Flex align="center" gap="sm" wrap>
                <H1 size="xxl">编辑降本项目</H1>
                <Badge tone="neutral">草稿</Badge>
              </Flex>
              <Text tone="muted" size="sm">
                项目编码 <span {...stylex.attrs(styles.code)}>DJ-2026-FC-1</span>
                ，保存后按“完成年度 + 团队”生成，不能手改
              </Text>
            </Flex>

            <Form controller={form} labelPlacement="start" labelWidth="7.5em">
              <Flex direction="column" gap="xl">
                <FormSection id="basic" title="项目基本信息" columns={2}>
                  <GridItem span="full">
                    <form.Field name="name" label="项目名称">
                      <TextField value={_bind(form.values.name)} showCount />
                    </form.Field>
                  </GridItem>
                  <form.Field name="category" label="任务类别" required>
                    <RadioGroup value={_bind(form.values.category)} orientation="horizontal">
                      <Radio value="design">设计优化</Radio>
                      <Radio value="source">多货源</Radio>
                      <Radio value="process">工艺优化</Radio>
                    </RadioGroup>
                  </form.Field>
                  <form.Field name="source" label="任务来源" required>
                    <Select
                      items={sources}
                      value={_bind(form.values.source)}
                      placeholder="请选择"
                    />
                  </form.Field>
                  <form.Field name="org" label="提出单位" required>
                    <Select items={orgs} value={_bind(form.values.org)} placeholder="请选择" />
                  </form.Field>
                  <form.Field name="team" label="责任一级团队" required>
                    <Select items={teams} value={_bind(form.values.team)} placeholder="请选择" />
                  </form.Field>
                  <form.Field name="contact" label="联络人" required>
                    <Combobox
                      items={people}
                      value={_bind(form.values.contact)}
                      placeholder="输入姓名搜索"
                    />
                  </form.Field>
                  <form.Field label="联络人工号" description="选了联络人后自动带出">
                    <TextField value={contact()?.value ?? ''} readonly />
                  </form.Field>
                </FormSection>

                <FormSection
                  id="saving"
                  title="降本信息"
                  description="降本类型可以都选；选了哪种，就要填对应的预期收益"
                  columns={2}
                >
                  <form.Field name="install" label="安装类型">
                    <RadioGroup value={_bind(form.values.install)} orientation="horizontal">
                      <Radio value="required">必装</Radio>
                      <Radio value="optional">选装</Radio>
                    </RadioGroup>
                  </form.Field>
                  <form.Field name="types" label="降本类型">
                    <CheckboxGroup value={_bind(form.values.types)} orientation="horizontal">
                      <Checkbox value="unit">单机降本</Checkbox>
                      <Checkbox value="dmc">降 DMC</Checkbox>
                    </CheckboxGroup>
                  </form.Field>
                  <form.Field
                    name="unitSaving"
                    label="单机降本目标"
                    required={types.includes('unit')}
                    disabled={!types.includes('unit')}
                  >
                    <NumberField
                      value={_bind(form.values.unitSaving)}
                      valueType={Decimal}
                      format={{ scale: 10_000, maximumFractionDigits: 2 }}
                      step={100}
                      suffix="万元"
                    />
                  </form.Field>
                  <form.Field
                    name="dmcSaving"
                    label="降 DMC 目标"
                    required={types.includes('dmc')}
                    disabled={!types.includes('dmc')}
                  >
                    <NumberField
                      value={_bind(form.values.dmcSaving)}
                      valueType={Decimal}
                      step={new Decimal('0.01')}
                      format={{ minimumFractionDigits: 2 }}
                      suffix="美元/FH"
                    />
                  </form.Field>
                  <GridItem span="full">
                    <form.Field
                      name="description"
                      label="简要描述"
                      description="写明更改内容、降本金额的计算依据、材料与工时降本，以及三级项目建议书编号或计算方法"
                    >
                      <Textarea value={_bind(form.values.description)} rows={3} showCount />
                    </form.Field>
                  </GridItem>
                </FormSection>

                <FormSection id="tech" title="技术及供应商信息" columns={2}>
                  <form.Field name="model" label="数模编号 + 版本">
                    <TextField
                      value={_bind(form.values.model)}
                      placeholder="如 C1H02-5513-002 R03"
                    />
                  </form.Field>
                  <form.Field name="suppliers" label="涉及供应商">
                    <TagsInput
                      items={suppliers}
                      value={_bind(form.values.suppliers)}
                      allowCustomValue={false}
                      placeholder="选择供应商"
                    />
                  </form.Field>
                </FormSection>

                <FormSection id="plan" title="计划及实施信息" columns={2}>
                  <form.Field name="year" label="完成年度">
                    <DatePicker granularity="year" value={_bind(form.values.year)} />
                  </form.Field>
                  <form.Field name="form" label="完成形式">
                    <Select items={forms} value={_bind(form.values.form)} placeholder="请选择" />
                  </form.Field>
                  <form.Field name="flights" label="贯彻架次">
                    <NumberField value={_bind(form.values.flights)} min={0} suffix="架" />
                  </form.Field>
                  <form.Field name="needSb" label="SB 贯彻" description="是否需要 SB 贯彻航线架次">
                    <RadioGroup value={_bind(form.values.needSb)} orientation="horizontal">
                      <Radio value="yes">需要</Radio>
                      <Radio value="no">不需要</Radio>
                    </RadioGroup>
                  </form.Field>
                </FormSection>

                <FormSection id="funding" title="经费及项目依据" columns={2} collapsible>
                  <GridItem span="full">
                    <form.Field name="funding" label="经费来源" description="可多选">
                      <CheckboxGroup value={_bind(form.values.funding)} orientation="horizontal">
                        <Checkbox value="quality">精品工程</Checkbox>
                        <Checkbox value="certification">适航取证</Checkbox>
                        <Checkbox value="plateau">高原型项目</Checkbox>
                        <Checkbox value="self">其他自筹</Checkbox>
                      </CheckboxGroup>
                    </form.Field>
                  </GridItem>
                  <form.Field name="proposalNo" label="项目建议书编号">
                    <TextField value={_bind(form.values.proposalNo)} placeholder="有建议书时填写" />
                  </form.Field>
                  <GridItem span="full">
                    <form.Field name="remark" label="备注">
                      <Textarea value={_bind(form.values.remark)} rows={2} />
                    </form.Field>
                  </GridItem>
                </FormSection>

                <ActionBar
                  start={
                    errors > 0 ? (
                      <Small tone="danger">还有 {errors} 项要处理</Small>
                    ) : form.dirty ? (
                      '有未保存的改动'
                    ) : (
                      status
                    )
                  }
                >
                  <Button variant="ghost" tone="neutral">
                    取消
                  </Button>
                  <Button variant="outline" tone="neutral" onClick={() => void saveDraft()}>
                    保存草稿
                  </Button>
                  <Button type="submit" loading={form.submitting}>
                    保存并提交
                  </Button>
                </ActionBar>
              </Flex>
            </Form>
          </Flex>
        </Container>
      </AppShell>
    );
  };
});
