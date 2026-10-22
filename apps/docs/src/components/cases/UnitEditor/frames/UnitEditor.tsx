// 案例：单机降本编辑（表单页，新建、编辑共用）。字段与校验严格按《降本项目信息表》：
// 主表四组（基本信息、降本信息、技术与实施、经费与依据），明细按“单机降本明细表”的四段（项目基本信息、构型通知单信息、
// 收益计算、工程评估）。系统生成、计算、带出的字段只读：降本项目编码、联络人工号、各项费用与收益。
// 地址上带 code 时编辑那一项，不带时新建；保存后去项目详情。数据是虚构的
import { Pencil, Plus, Trash2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  ActionBar,
  Breadcrumbs,
  Button,
  Checkbox,
  CheckboxGroup,
  Combobox,
  DatePicker,
  Flex,
  Form,
  FormSection,
  GridItem,
  H1,
  IconButton,
  LinkButton,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  Small,
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
  TagsInput,
  Textarea,
  TextField,
  useFormat,
  useForm,
  useLeaveConfirmation,
  useQueryState,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import * as z from 'zod';
import {
  categories,
  completionForms,
  costKinds,
  depts,
  fundingSources,
  models,
  nextTaskCode,
  orgs,
  partSaving,
  people,
  saveTask,
  sources,
  suppliers,
  taskStore,
  teams,
  TODAY,
  workPackages,
  type CostTask,
  type PartChange,
  type UnitDetail,
} from '../../data';
import { PartChangeDialog } from '../../part-change';
import { checkSavings, taskFields } from '../../task-form';
import { CaseShell, casePath, useCaseNavigate } from '../../shell';

const schema = z
  .object({
    // 主表：与降 DMC 共用的基本信息、降本信息、技术与实施、备注
    ...taskFields,
    // 主表 · 基本信息
    category: z.string().min(1, '请选择任务类别'),
    source: z.string().min(1, '请选择任务来源'),
    dept: z.string().min(1, '请选择提出部门'),
    // 主表 · 技术与实施
    year: z.string().min(4, '请选择完成年度'),
    // 主表 · 经费与依据
    funding: z.array(z.string()),
    proposalNo: z.string(),
    // 明细 · 项目基本信息
    notices: z.array(z.string()).min(1, '至少一个构型通知单编号'),
    projectDescription: z.string().min(1, '请填写项目描述').max(1000),
    optimization: z.string().min(1, '请写明具体的优化措施'),
    dualSource: z.string(),
    engineer: z.string().min(1, '请选择工程责任人'),
    // 明细 · 工程评估
    opinion: z.string().min(1, '请选择工程初步评估意见'),
    reason: z.string(),
    reductionType: z.string(),
  })
  // 条件必填：选了哪种降本类型就要填对应的预期收益；评估意见不是“初步同意”时要写原因
  .superRefine((values, ctx) => {
    checkSavings(values, ctx);
    if (values.opinion && values.opinion !== '初步同意' && !values.reason)
      ctx.addIssue({
        code: 'custom',
        path: ['reason'],
        message: '暂不具备实施条件、待评估时必须写原因',
      });
  });

type Values = z.input<typeof schema>;

const blank = (): Values => ({
  name: '',
  category: '',
  source: '',
  org: '',
  dept: '',
  contact: '',
  team: '',
  install: 'required',
  types: ['unit'],
  unitSaving: null,
  dmcSaving: null,
  description: '',
  modelNo: '',
  year: TODAY.slice(0, 4),
  flights: null,
  form: '',
  suppliers: [],
  plan: '',
  funding: [],
  proposalNo: '',
  remark: '',
  notices: [],
  projectDescription: '',
  optimization: '',
  dualSource: 'no',
  engineer: '',
  opinion: '待评估',
  reason: '',
  reductionType: '降本降价',
});

const fromTask = (task: CostTask): Values => ({
  name: task.name,
  category: task.category,
  source: task.channel === 'two' ? 'team' : 'supplier',
  org: task.org,
  dept: task.dept,
  contact: task.contact,
  team: task.team,
  install: task.install,
  types: [task.kind],
  unitSaving: task.kind === 'unit' ? task.expected : null,
  dmcSaving: task.kind === 'dmc' ? task.expected : null,
  description: task.description,
  modelNo: task.modelNo,
  year: task.year,
  flights: task.flights,
  form: task.form,
  suppliers: [task.supplier],
  plan: '',
  funding: task.funding,
  proposalNo: task.proposalNo,
  remark: task.remark,
  notices: task.unitDetail?.notices ?? [],
  projectDescription: task.unitDetail?.projectDescription ?? '',
  optimization: task.unitDetail?.optimization ?? '',
  dualSource: task.unitDetail?.dualSource ? 'yes' : 'no',
  engineer: task.unitDetail?.engineer ?? '',
  opinion: task.unitDetail?.evaluation.opinion ?? '待评估',
  reason: task.unitDetail?.evaluation.reason ?? '',
  reductionType: task.unitDetail?.evaluation.type ?? '降本降价',
});

/** 表单的值与零件更改写回：主表、明细；新建的项目从待启动开始，主办默认是联络人、计划完成是完成年度的年底 */
function toTask(values: Values, parts: PartChange[], base: CostTask | null): CostTask {
  const detail: UnitDetail = {
    notices: values.notices,
    projectDescription: values.projectDescription,
    optimization: values.optimization,
    dualSource: values.dualSource === 'yes',
    engineer: values.engineer,
    parts,
    evaluation: {
      opinion: values.opinion as UnitDetail['evaluation']['opinion'],
      reason: values.reason,
      type: values.reductionType,
    },
  };
  return {
    ...(base ?? {
      code: nextTaskCode('unit', values.year, values.team),
      sourceCode: '待关联',
      model: models[0]!,
      workPackage: workPackages[0]!,
      owner: values.contact,
      due: `${values.year}-12-31`,
      status: 'pending',
      valueState: 'forecast',
      basis: 'hard',
      a: null,
      b: null,
      gapReason: null,
      needSb: false,
      milestones: [
        { label: '方案确定', done: null, evidence: null },
        { label: '验证完成', done: null, evidence: null },
        { label: '收益确认', done: null, evidence: null },
      ],
      closing: { verification: false, benefit: false, business: false },
      dmcNodes: [],
      supplierPartNos: [],
    }),
    kind: 'unit',
    name: values.name,
    category: values.category,
    channel: values.source === 'team' ? 'two' : 'one',
    org: values.org,
    dept: values.dept,
    contact: values.contact,
    team: values.team,
    install: values.install as CostTask['install'],
    expected: values.unitSaving ?? new Decimal(0),
    description: values.description,
    modelNo: values.modelNo,
    year: values.year,
    flights: values.flights,
    form: values.form,
    supplier: values.suppliers[0] ?? suppliers[0]!,
    funding: values.funding,
    proposalNo: values.proposalNo,
    remark: values.remark,
    unitDetail: detail,
  };
}

const styles = stylex.create({
  code: { fontFamily: '_mono', fontSize: '_sm' },
  number: { fontVariantNumeric: 'tabular-nums' },
  tableHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '_md' },
});

export default _component(() => {
  const format = useFormat();
  const code = useQueryState('code', '');
  const navigate = useCaseNavigate();
  const yuan = (value: Decimal) =>
    format.number(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const wan = (value: Decimal) => format.number(value, costKinds.unit.format);
  // 地址上带 code：编辑那一项；找不到或不带：新建
  const editing =
    taskStore.value.find((task) => task.code === code.value && task.kind === 'unit') ?? null;
  let parts = _state.raw<PartChange[]>(editing?.unitDetail?.parts ?? []);
  let partsError = _state('');
  let dialogOpen = _state(false);
  let editingPart = _state.raw<PartChange | null>(null);
  let status = _state('');

  const form = useForm({
    schema,
    initial: editing ? fromTask(editing) : blank(),
    onSubmit: async (values) => {
      if (parts.length === 0) {
        partsError = '至少一条零件更改：受影响零件一个件号一条';
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
      const task = toTask(values as Values, parts, editing);
      saveTask(task);
      status = editing ? '已保存' : `已新建 ${task.code}`;
      form.reset(form.values);
      navigate('TaskDetail', { code: task.code });
    },
  });
  // 有没保存的改动时，点“取消”、面包屑或关掉页面都先问一下
  useLeaveConfirmation(() => form.dirty && !form.submitting);
  const person = () => people.find((item) => item.value === form.values.contact);
  const total = () =>
    parts.reduce((sum, change) => sum.plus(partSaving(change).aircraft), new Decimal(0));
  const visibleErrors = () =>
    Object.keys(form.errors).filter((path) => form.visibleError(path) != null).length +
    (partsError ? 1 : 0);

  function openPart(change: PartChange | null) {
    editingPart = change;
    dialogOpen = true;
  }
  function savePart(change: PartChange) {
    const index = parts.findIndex((item) => item.id === change.id);
    parts =
      index < 0 ? [...parts, change] : parts.map((item) => (item.id === change.id ? change : item));
    partsError = '';
  }

  return () => {
    const types = form.values.types;
    const errors = visibleErrors();
    const back = editing ? casePath('TaskDetail', { code: editing.code }) : casePath('UnitLedger');
    return (
      <CaseShell current="unit">
        {/* 宽屏上每段最多三列、占满宽度：字段多，少翻页；窄了按 minColumnWidth 自动减列 */}
        <Flex direction="column" gap="lg">
          <Flex direction="column" gap="xs">
            <Breadcrumbs
              items={[
                { label: '单机降本台账', href: casePath('UnitLedger') },
                editing
                  ? { label: editing.code, href: casePath('TaskDetail', { code: editing.code }) }
                  : { label: '新建项目' },
                ...(editing ? [{ label: '编辑' }] : []),
              ]}
            />
            <Flex align="baseline" gap="md" wrap>
              <H1 size="xl">{editing ? '编辑单机降本项目' : '新建单机降本项目'}</H1>
              <Small tone="muted">
                降本项目编码{' '}
                {editing ? (
                  <span {...stylex.attrs(styles.code)}>{editing.code}</span>
                ) : (
                  '保存后生成'
                )}
                ：按“DJ-完成年度-团队拼音缩写-序号”自动生成，不能手改
              </Small>
            </Flex>
          </Flex>

          <Form controller={form} labelPlacement="start" labelWidth="8.5em">
            <Flex direction="column" gap="xl">
              <FormSection headingLevel={2} id="basic" title="基本信息" columns={3}>
                <GridItem span={2}>
                  <form.Field name="name" label="项目名称" required>
                    <TextField value={_bind(form.values.name)} maxlength={200} showCount />
                  </form.Field>
                </GridItem>
                <form.Field name="category" label="任务类别" required>
                  <RadioGroup value={_bind(form.values.category)} orientation="horizontal">
                    {categories.map((item) => (
                      <Radio key={item.value} value={item.value}>
                        {item.label}
                      </Radio>
                    ))}
                  </RadioGroup>
                </form.Field>
                <form.Field name="source" label="任务来源" required>
                  <Select items={sources} value={_bind(form.values.source)} placeholder="请选择" />
                </form.Field>
                <form.Field name="team" label="责任一级团队" required>
                  <Select items={teams} value={_bind(form.values.team)} placeholder="请选择" />
                </form.Field>
                <form.Field name="org" label="提出单位" required>
                  <Select
                    items={orgs}
                    value={_bind(
                      () => form.values.org,
                      (next: string) => {
                        form.values.org = next;
                        // 提出部门属于提出单位：换单位时清空
                        form.values.dept = '';
                      },
                    )}
                    placeholder="请选择"
                  />
                </form.Field>
                <form.Field name="dept" label="提出部门" required>
                  <Select
                    items={depts[form.values.org] ?? []}
                    value={_bind(form.values.dept)}
                    placeholder={form.values.org ? '请选择' : '先选提出单位'}
                    disabled={!form.values.org}
                  />
                </form.Field>
                <form.Field name="contact" label="联络人" required>
                  <Combobox
                    items={people}
                    value={_bind(form.values.contact)}
                    placeholder="输入姓名搜索"
                  />
                </form.Field>
                <form.Field label="联络人工号" description="由联络人带出，不能手改">
                  <TextField value={person()?.value ?? ''} readonly />
                </form.Field>
              </FormSection>

              <FormSection
                headingLevel={2}
                id="saving"
                title="降本信息"
                description="降本类型可以都选；选了哪种，就要填对应的预期收益"
                columns={3}
              >
                <form.Field name="install" label="必装 / 选装" required>
                  <RadioGroup value={_bind(form.values.install)} orientation="horizontal">
                    <Radio value="required">必装</Radio>
                    <Radio value="optional">选装</Radio>
                  </RadioGroup>
                </form.Field>
                <form.Field name="types" label="降本类型" required>
                  <CheckboxGroup value={_bind(form.values.types)} orientation="horizontal">
                    <Checkbox value="unit">单机降本</Checkbox>
                    <Checkbox value="dmc">降 DMC</Checkbox>
                  </CheckboxGroup>
                </form.Field>
                {/* 只显示选了的降本类型的预期收益：没选的不留禁用的空框 */}
                {types.includes('unit') && (
                  <form.Field
                    name="unitSaving"
                    label="单机降本"
                    required
                    description={`明细算出 ${wan(total())} ${costKinds.unit.unit}`}
                  >
                    <NumberField
                      value={_bind(form.values.unitSaving)}
                      valueType={Decimal}
                      format={costKinds.unit.format}
                      min={0}
                      suffix={costKinds.unit.unit}
                    />
                  </form.Field>
                )}
                {types.includes('dmc') && (
                  <form.Field name="dmcSaving" label="降 DMC" required>
                    <NumberField
                      value={_bind(form.values.dmcSaving)}
                      valueType={Decimal}
                      format={costKinds.dmc.format}
                      min={0}
                      suffix={costKinds.dmc.unit}
                    />
                  </form.Field>
                )}
                <GridItem span="full">
                  <form.Field
                    name="description"
                    label="简要描述"
                    required
                    description="写明更改内容、降本金额计算依据、材料降本、工时降本，并填已批准的三级项目建议书编号或明确计算方法"
                  >
                    <Textarea value={_bind(form.values.description)} rows={3} />
                  </form.Field>
                </GridItem>
              </FormSection>

              <FormSection headingLevel={2} id="tech" title="技术与实施" columns={3}>
                <form.Field name="modelNo" label="数模编号 + 版本" description="有数模时填写">
                  <TextField value={_bind(form.values.modelNo)} placeholder="C1H02-5513-002 R03" />
                </form.Field>
                <form.Field name="year" label="完成年度" required>
                  <DatePicker granularity="year" value={_bind(form.values.year)} />
                </form.Field>
                <form.Field name="flights" label="贯彻架次">
                  <NumberField value={_bind(form.values.flights)} min={0} suffix="架" />
                </form.Field>
                <form.Field name="form" label="完成形式" required>
                  <Select
                    items={completionForms}
                    value={_bind(form.values.form)}
                    placeholder="请选择"
                  />
                </form.Field>
                <form.Field name="suppliers" label="涉及供应商">
                  <Select
                    items={suppliers}
                    selectionMode="multiple"
                    value={_bind(form.values.suppliers)}
                    placeholder="可多选"
                  />
                </form.Field>
                <form.Field
                  name="plan"
                  label="型号计划名称/编号"
                  description="与年度计划表关联，重复内容不在这里填"
                >
                  <TextField value={_bind(form.values.plan)} />
                </form.Field>
              </FormSection>

              <FormSection headingLevel={2} id="funding" title="经费与依据" columns={3} collapsible>
                <form.Field name="funding" label="经费来源">
                  <CheckboxGroup value={_bind(form.values.funding)} orientation="horizontal">
                    {fundingSources.map((item) => (
                      <Checkbox key={item.value} value={item.value}>
                        {item.label}
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                </form.Field>
                <form.Field
                  name="proposalNo"
                  label="项目建议书编号"
                  description="有项目建议书时填写"
                >
                  <TextField value={_bind(form.values.proposalNo)} />
                </form.Field>
                <GridItem span="full">
                  <form.Field name="remark" label="备注">
                    <Textarea value={_bind(form.values.remark)} rows={2} maxlength={1000} />
                  </form.Field>
                </GridItem>
              </FormSection>

              <FormSection
                headingLevel={2}
                id="detail"
                title="降本明细 · 项目基本信息"
                description="单机降本明细表：年度与降本项目编码由主表带出"
                columns={3}
              >
                <form.Field
                  name="notices"
                  label="构型通知单编号"
                  required
                  description="可填多个，回车分隔"
                >
                  <TagsInput value={_bind(form.values.notices)} placeholder="GT-2026-0401" />
                </form.Field>
                <form.Field name="engineer" label="工程责任人" required>
                  <Combobox
                    items={people}
                    value={_bind(form.values.engineer)}
                    placeholder="输入姓名搜索"
                  />
                </form.Field>
                <form.Field name="dualSource" label="是否双定点" required>
                  <RadioGroup value={_bind(form.values.dualSource)} orientation="horizontal">
                    <Radio value="yes">是</Radio>
                    <Radio value="no">否</Radio>
                  </RadioGroup>
                </form.Field>
                <GridItem span="full">
                  <form.Field name="projectDescription" label="项目描述" required>
                    <Textarea
                      value={_bind(form.values.projectDescription)}
                      rows={2}
                      maxlength={1000}
                    />
                  </form.Field>
                </GridItem>
                <GridItem span="full">
                  <form.Field name="optimization" label="项目优化内容" required>
                    <Textarea value={_bind(form.values.optimization)} rows={2} />
                  </form.Field>
                </GridItem>
              </FormSection>

              <FormSection
                headingLevel={2}
                id="parts"
                title="降本明细 · 构型通知单信息与收益计算"
                description="受影响零件一个件号一条；费用与收益由系统按定额、单价、工时与费率算出"
              >
                <GridItem span="full">
                  <Flex direction="column" gap="sm">
                    <div {...stylex.attrs(styles.tableHead)}>
                      <Small tone={partsError ? 'danger' : 'muted'}>
                        {partsError || `${parts.length} 条零件更改`}
                      </Small>
                      <Button size="sm" variant="soft" icon={Plus} onClick={() => openPart(null)}>
                        新增零件更改
                      </Button>
                    </div>
                    <Table aria-label="零件更改与收益计算" density="compact">
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>序号</TableHeaderCell>
                          <TableHeaderCell>更改类型</TableHeaderCell>
                          <TableHeaderCell>更改前件号</TableHeaderCell>
                          <TableHeaderCell>更改后件号</TableHeaderCell>
                          <TableHeaderCell align="end">单件材料费收益（元）</TableHeaderCell>
                          <TableHeaderCell align="end">单件工时费收益（元）</TableHeaderCell>
                          <TableHeaderCell align="end">单件零件收益（元）</TableHeaderCell>
                          <TableHeaderCell align="end">单机数量</TableHeaderCell>
                          <TableHeaderCell align="end">单机零件收益（元）</TableHeaderCell>
                          <TableHeaderCell>操作</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parts.length === 0 && (
                          <TableRow>
                            <TableCell colspan={10}>
                              <Small tone="muted">
                                还没有零件更改：点“新增零件更改”，受影响零件一个件号一条
                              </Small>
                            </TableCell>
                          </TableRow>
                        )}
                        {parts.map((change, index) => {
                          const saving = partSaving(change);
                          return (
                            <TableRow key={change.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{change.changeType}</TableCell>
                              <TableCell>
                                <span {...stylex.attrs(styles.code)}>
                                  {change.before?.partNo ?? '—'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span {...stylex.attrs(styles.code)}>
                                  {change.after?.partNo ?? '—'}
                                </span>
                              </TableCell>
                              <TableCell align="end">
                                <span {...stylex.attrs(styles.number)}>
                                  {yuan(saving.material)}
                                </span>
                              </TableCell>
                              <TableCell align="end">
                                <span {...stylex.attrs(styles.number)}>{yuan(saving.labor)}</span>
                              </TableCell>
                              <TableCell align="end">
                                <span {...stylex.attrs(styles.number)}>{yuan(saving.part)}</span>
                              </TableCell>
                              <TableCell align="end">
                                <span {...stylex.attrs(styles.number)}>
                                  {(change.after ?? change.before)?.quantity}
                                </span>
                              </TableCell>
                              <TableCell align="end">
                                <span {...stylex.attrs(styles.number)}>
                                  {yuan(saving.aircraft)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Flex gap="xs">
                                  <IconButton
                                    size="xs"
                                    icon={Pencil}
                                    aria-label={`编辑第 ${index + 1} 条`}
                                    onClick={() => openPart(change)}
                                  />
                                  <IconButton
                                    size="xs"
                                    icon={Trash2}
                                    tone="danger"
                                    aria-label={`删除第 ${index + 1} 条`}
                                    onClick={() =>
                                      (parts = parts.filter((item) => item.id !== change.id))
                                    }
                                  />
                                </Flex>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFoot>
                        <TableRow>
                          <TableHeaderCell scope="row">合计</TableHeaderCell>
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell align="end">
                            <span {...stylex.attrs(styles.number)}>{yuan(total())}</span>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableFoot>
                    </Table>
                  </Flex>
                </GridItem>
              </FormSection>

              <FormSection headingLevel={2} id="evaluation" title="降本明细 · 工程评估" columns={3}>
                <form.Field name="opinion" label="工程初步评估意见" required>
                  <RadioGroup value={_bind(form.values.opinion)} orientation="horizontal">
                    <Radio value="初步同意">初步同意</Radio>
                    <Radio value="暂不具备实施条件">暂不具备实施条件</Radio>
                    <Radio value="待评估">待评估</Radio>
                  </RadioGroup>
                </form.Field>
                <form.Field name="reductionType" label="类型">
                  <Select
                    items={['降本降价', '降本不降价']}
                    value={_bind(form.values.reductionType)}
                  />
                </form.Field>
                {/* 暂不具备实施条件、待评估时才要写原因 */}
                {form.values.opinion !== '初步同意' && (
                  <form.Field name="reason" label="具体原因" required>
                    <Textarea value={_bind(form.values.reason)} rows={1} />
                  </form.Field>
                )}
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
                <LinkButton variant="ghost" tone="neutral" href={back}>
                  取消
                </LinkButton>
                <Button type="submit" loading={form.submitting}>
                  {editing ? '保存' : '创建项目'}
                </Button>
              </ActionBar>
            </Flex>
          </Form>
        </Flex>
        <PartChangeDialog open={_bind(dialogOpen)} change={editingPart} onSave={savePart} />
      </CaseShell>
    );
  };
});
