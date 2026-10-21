// 案例：编辑单机降本项目（长表单）。字段来自《降本项目信息表》的单机降本主表；机型、单位、人员都是虚构的。
// FormSection 分组、两列、标签在左侧；条件必填（选了降本类型才要填对应的金额）；选联络人后带出工号；
// 金额以元保存、按万元输入；底部的 ActionBar 吸在窗口底边，滚动时随时能保存。
// 新建、编辑共用这一页：地址上带 code 时编辑那张任务卡，不带时新建；“任务卡”一组是任务池要的型号、工作包、主办与计划，
// 其余是信息表的单机降本主表。保存后去任务卡详情
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  ActionBar,
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
  LinkButton,
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
import {
  addDays,
  CURRENT_USER,
  models,
  nextTaskCode,
  orgs,
  people,
  saveTask,
  sources,
  suppliers,
  taskStore,
  teams,
  TODAY,
  workPackages,
  type CostTask,
} from '../../data';
import { CaseShell, casePath, useCaseNavigate, useCaseQuery } from '../../shell';

const forms = ['MI 批准', 'QSL 入册', 'ECP 批准', '文件', '实施'];

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
    aircraft: z.string().min(1, '请选择型号'),
    workPackage: z.string().min(1, '请选择工作包'),
    owner: z.string().min(1, '请选择主办责任人'),
    due: z.string().min(10, '请选择计划完成时间'),
  })
  // 条件必填：选了哪种降本类型，就要填对应的预期收益
  .superRefine((values, ctx) => {
    if (values.types.includes('unit') && values.unitSaving == null)
      ctx.addIssue({ code: 'custom', path: ['unitSaving'], message: '请填写单机降本目标' });
    if (values.types.includes('dmc') && values.dmcSaving == null)
      ctx.addIssue({ code: 'custom', path: ['dmcSaving'], message: '请填写降 DMC 目标' });
  });

const styles = stylex.create({
  code: { fontFamily: '_mono', fontSize: '_sm' },
});

/** 表单的值 */
type Values = z.input<typeof schema>;

/** 新建时的空表 */
const blank = (): Values => ({
  name: '',
  category: '',
  source: '',
  org: '',
  contact: CURRENT_USER,
  team: '',
  install: 'required',
  types: ['unit'],
  unitSaving: null,
  dmcSaving: null,
  description: '',
  model: '',
  suppliers: [],
  year: TODAY.slice(0, 4),
  flights: null,
  form: '',
  needSb: 'no',
  funding: [],
  proposalNo: '',
  remark: '',
  aircraft: models[0]!,
  workPackage: '',
  owner: CURRENT_USER,
  due: addDays(TODAY, 90),
});

/** 编辑时：任务卡上的值 */
const fromTask = (task: CostTask): Values => ({
  name: task.name,
  category: task.category,
  source: task.channel === 'two' ? 'team' : 'supplier',
  org: task.org,
  contact: task.contact,
  team: task.team,
  install: task.install,
  types: [task.kind],
  unitSaving: task.kind === 'unit' ? task.expected : null,
  dmcSaving: task.kind === 'dmc' ? task.expected : null,
  description: task.description,
  model: task.modelNo,
  suppliers: [task.supplier],
  year: task.year,
  flights: task.flights,
  form: task.form,
  needSb: task.needSb ? 'yes' : 'no',
  funding: task.funding,
  proposalNo: task.proposalNo,
  remark: task.remark,
  aircraft: task.model,
  workPackage: task.workPackage,
  owner: task.owner,
  due: task.due,
});

/** 表单的值写回任务卡：主表字段与任务卡字段；新建的任务从“待启动”开始 */
function toTask(values: Values, base: CostTask | null): CostTask {
  const kind = values.types.includes('unit') ? 'unit' : 'dmc';
  const expected = (kind === 'unit' ? values.unitSaving : values.dmcSaving) ?? new Decimal(0);
  return {
    ...(base ?? {
      code: nextTaskCode(kind, values.year, values.team),
      sourceCode: '待关联',
      status: 'pending',
      valueState: 'forecast',
      basis: 'hard',
      a: null,
      b: null,
      gapReason: null,
      milestones: [
        { label: '方案确定', done: null, evidence: null },
        { label: '验证完成', done: null, evidence: null },
        { label: '收益确认', done: null, evidence: null },
      ],
      closing: { verification: false, benefit: false, business: false },
    }),
    name: values.name,
    category: values.category,
    channel: values.source === 'team' ? 'two' : 'one',
    org: values.org,
    contact: values.contact,
    team: values.team,
    install: values.install as CostTask['install'],
    kind,
    expected: new Decimal(expected),
    description: values.description,
    modelNo: values.model,
    supplier: values.suppliers[0] ?? suppliers[0]!,
    year: values.year,
    flights: values.flights,
    form: values.form,
    needSb: values.needSb === 'yes',
    funding: values.funding,
    proposalNo: values.proposalNo,
    remark: values.remark,
    model: values.aircraft,
    workPackage: values.workPackage,
    owner: values.owner,
    due: values.due,
  };
}

export default _component(() => {
  const route = useCaseQuery();
  const navigate = useCaseNavigate();
  // 地址上带 code：编辑那张任务卡；找不到或不带：新建
  const editing = taskStore.value.find((task) => task.code === route().code) ?? null;
  let status = _state('');
  const form = useForm({
    schema,
    initial: editing ? fromTask(editing) : blank(),
    onSubmit: async (values) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const task = toTask(values as Values, editing);
      saveTask(task);
      status = editing ? '已保存' : `已新建 ${task.code}`;
      form.reset(form.values);
      navigate('TaskDetail', { code: task.code });
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
      <CaseShell current="tasks">
        {/* 两列的表单在宽屏上限宽居中：一行太长，眼睛从标签扫到控件太远 */}
        <Container size="lg" padding="none">
          <Flex direction="column" gap="xl">
            <Flex direction="column" gap="sm">
              <Breadcrumbs
                items={[
                  { label: '任务池', href: casePath('TaskPool') },
                  editing
                    ? { label: editing.code, href: casePath('TaskDetail', { code: editing.code }) }
                    : { label: '新建任务卡' },
                  ...(editing ? [{ label: '编辑' }] : []),
                ]}
              />
              <Flex align="center" gap="sm" wrap>
                <H1 size="xxl">{editing ? '编辑降本项目' : '新建任务卡'}</H1>
                {!editing && <Badge tone="neutral">待启动</Badge>}
              </Flex>
              <Text tone="muted" size="sm">
                {editing ? (
                  <>
                    项目编码 <span {...stylex.attrs(styles.code)}>{editing.code}</span>
                    ，按“完成年度 + 团队”生成，不能手改
                  </>
                ) : (
                  '项目编码保存后按“完成年度 + 团队”生成，不能手改'
                )}
              </Text>
            </Flex>

            <Form controller={form} labelPlacement="start" labelWidth="7.5em">
              <Flex direction="column" gap="xl">
                <FormSection
                  headingLevel={2}
                  id="card"
                  title="任务卡"
                  description="任务池要的型号、工作包、主办与计划；状态、里程碑与收益在任务卡详情里推进"
                  columns={2}
                >
                  <form.Field name="aircraft" label="型号" required>
                    <Select items={models} value={_bind(form.values.aircraft)} />
                  </form.Field>
                  <form.Field name="workPackage" label="工作包" required>
                    <Select
                      items={workPackages}
                      value={_bind(form.values.workPackage)}
                      placeholder="请选择"
                    />
                  </form.Field>
                  <form.Field name="owner" label="主办责任人" required>
                    <Combobox
                      items={people}
                      value={_bind(form.values.owner)}
                      placeholder="输入姓名搜索"
                    />
                  </form.Field>
                  <form.Field name="due" label="计划完成" required>
                    <DatePicker value={_bind(form.values.due)} />
                  </form.Field>
                </FormSection>

                <FormSection headingLevel={2} id="basic" title="项目基本信息" columns={2}>
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
                  headingLevel={2}
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

                <FormSection headingLevel={2} id="tech" title="技术及供应商信息" columns={2}>
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

                <FormSection headingLevel={2} id="plan" title="计划及实施信息" columns={2}>
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

                <FormSection
                  headingLevel={2}
                  id="funding"
                  title="经费及项目依据"
                  columns={2}
                  collapsible
                >
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
                  <LinkButton
                    variant="ghost"
                    tone="neutral"
                    href={
                      editing
                        ? casePath('TaskDetail', { code: editing.code })
                        : casePath('TaskPool')
                    }
                  >
                    取消
                  </LinkButton>
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
      </CaseShell>
    );
  };
});
