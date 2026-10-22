// 案例：降 DMC 编辑（表单页，新建、编辑共用）。字段与校验严格按《降本项目信息表》的“DMC降本主表”与
// “DMC降本实施节点信息表”：主表三组（基本信息、降本信息、技术与实施），实施节点在表格里逐行编辑
// （完成形式、计划与实际完成日期、贯彻架次、责任一级团队、是否需要 SB）。项目编码、联络人工号系统生成或带出，只读。
// 主表的“完成年度”按信息表存完整日期，就是项目的计划完成日期。地址上带 code 时编辑那一项，不带时新建；保存后去项目详情。
// 数据是虚构的
import { Plus, Trash2 } from '@lucide/icons';
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
  TableHead,
  TableHeaderCell,
  TableRow,
  TagsInput,
  Textarea,
  TextField,
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
  models,
  nextTaskCode,
  orgs,
  people,
  saveTask,
  suppliers,
  taskStore,
  teams,
  workPackages,
  type CostTask,
} from '../../data';
import { CaseShell, casePath, useCaseNavigate } from '../../shell';
import { checkSavings, taskFields } from '../../task-form';

const node = z.object({
  form: z.string().min(1, '请选择完成形式'),
  due: z.string().min(1, '请选择计划完成日期'),
  done: z.string(),
  flights: z.number().int().min(0, '不能小于 0').nullable(),
  team: z.string().min(1, '请选择责任团队'),
  needSb: z.boolean(),
});

const schema = z
  .object({
    // 与单机降本共用的基本信息、降本信息、技术与实施、备注
    ...taskFields,
    // 技术与实施
    supplierPartNos: z.array(z.string().max(100, '单个件号不超过 100 字')),
    date: z.string().min(1, '请选择完成日期'),
    needSb: z.string(),
    // 实施节点
    nodes: z.array(node).min(1, '至少一个实施节点'),
  })
  // 条件必填：选了哪种降本类型就要填对应的预期收益；实际完成不能早于计划前一年（多半是填错了年份）
  .superRefine((values, ctx) => {
    checkSavings(values, ctx);
    values.nodes.forEach((item, index) => {
      if (
        item.done &&
        item.due &&
        item.done < `${Number(item.due.slice(0, 4)) - 1}${item.due.slice(4)}`
      )
        ctx.addIssue({
          code: 'custom',
          path: ['nodes', index, 'done'],
          message: '实际完成比计划早一年以上，请核对',
        });
    });
  });

type Values = z.input<typeof schema>;
type NodeValues = Values['nodes'][number];

/** 新建时的节点模板：按信息表常见的完成形式先后排，日期与责任团队待填 */
const templateNodes = (): NodeValues[] =>
  ['ECP 批准', 'MI 批准', 'QSL 入册', '实施'].map((form) => ({
    form,
    due: '',
    done: '',
    flights: null,
    team: '',
    needSb: false,
  }));

const blank = (): Values => ({
  name: '',
  org: '',
  contact: '',
  team: '',
  install: 'required',
  types: ['dmc'],
  unitSaving: null,
  dmcSaving: null,
  description: '',
  modelNo: '',
  supplierPartNos: [],
  date: '',
  flights: null,
  form: '',
  suppliers: [],
  plan: '',
  needSb: 'no',
  remark: '',
  nodes: templateNodes(),
});

const fromTask = (task: CostTask): Values => ({
  name: task.name,
  org: task.org,
  contact: task.contact,
  team: task.team,
  install: task.install,
  types: ['dmc'],
  unitSaving: null,
  dmcSaving: task.expected,
  description: task.description,
  modelNo: task.modelNo,
  supplierPartNos: task.supplierPartNos,
  date: task.due,
  flights: task.flights,
  form: task.form,
  suppliers: [task.supplier],
  plan: '',
  needSb: task.needSb ? 'yes' : 'no',
  remark: task.remark,
  nodes: task.dmcNodes.map((item) => ({ ...item, done: item.done ?? '' })),
});

/** 表单的值写回：主表与实施节点；新建的项目从待启动开始，主办默认是联络人 */
function toTask(values: Values, base: CostTask | null): CostTask {
  return {
    ...(base ?? {
      code: nextTaskCode('dmc', values.date.slice(0, 4), values.team),
      sourceCode: '待关联',
      model: models[0]!,
      workPackage: workPackages[0]!,
      // DMC 主表没有任务类别、提出部门、经费来源与项目建议书：取默认值，统计时按降本类型分开
      category: categories[0]!.value,
      dept: depts[values.org]?.[0] ?? '',
      funding: [],
      proposalNo: '',
      owner: values.contact,
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
      unitDetail: null,
    }),
    kind: 'dmc',
    channel: base?.channel ?? 'one',
    name: values.name,
    org: values.org,
    contact: values.contact,
    team: values.team,
    install: values.install as CostTask['install'],
    expected: values.dmcSaving ?? new Decimal(0),
    description: values.description,
    modelNo: values.modelNo,
    supplierPartNos: values.supplierPartNos,
    due: values.date,
    year: values.date.slice(0, 4),
    flights: values.flights,
    form: values.form,
    supplier: values.suppliers[0] ?? suppliers[0]!,
    needSb: values.needSb === 'yes',
    remark: values.remark,
    dmcNodes: values.nodes.map((item) => ({ ...item, done: item.done || null })),
  };
}

const styles = stylex.create({
  code: { fontFamily: '_mono', fontSize: '_sm' },
  tableHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '_md' },
  // 节点表的列宽：日期、数字按内容给定宽，责任团队占剩下的
  index: { width: '3rem' },
  form: { width: '11rem' },
  date: { width: '11rem' },
  flights: { width: '8rem' },
  check: { width: '5rem', textAlign: 'center' },
  actions: { width: '4rem' },
});

export default _component(() => {
  const code = useQueryState('code', '');
  const navigate = useCaseNavigate();
  // 地址上带 code：编辑那一项；找不到或不带：新建
  const editing =
    taskStore.value.find((task) => task.code === code.value && task.kind === 'dmc') ?? null;
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
  // 有没保存的改动时，点“取消”、面包屑或关掉页面都先问一下
  useLeaveConfirmation(() => form.dirty && !form.submitting);
  const person = () => people.find((item) => item.value === form.values.contact);
  const visibleErrors = () =>
    Object.keys(form.errors).filter((path) => form.visibleError(path) != null).length;

  // 实施节点：每行一个稳定的 key，删掉一行时其余行的错误与失焦记录跟着移动
  const nodes = form.array('nodes');
  /** 加一个节点：责任团队默认跟主表 */
  const addNode = () =>
    nodes.append({
      form: '',
      due: '',
      done: '',
      flights: null,
      team: form.values.team,
      needSb: false,
    });

  return () => {
    const types = form.values.types;
    const errors = visibleErrors();
    const back = editing ? casePath('TaskDetail', { code: editing.code }) : casePath('DmcLedger');
    const nodesError = form.visibleError('nodes');
    return (
      <CaseShell current="dmc">
        {/* 宽屏上每段最多三列、占满宽度；窄了按 minColumnWidth 自动减列 */}
        <Flex direction="column" gap="lg">
          <Flex direction="column" gap="xs">
            <Breadcrumbs
              items={[
                { label: '降 DMC 台账', href: casePath('DmcLedger') },
                editing
                  ? { label: editing.code, href: casePath('TaskDetail', { code: editing.code }) }
                  : { label: '新建项目' },
                ...(editing ? [{ label: '编辑' }] : []),
              ]}
            />
            <Flex align="baseline" gap="md" wrap>
              <H1 size="xl">{editing ? '编辑降 DMC 项目' : '新建降 DMC 项目'}</H1>
              <Small tone="muted">
                项目编码{' '}
                {editing ? (
                  <span {...stylex.attrs(styles.code)}>{editing.code}</span>
                ) : (
                  '保存后生成'
                )}
                ：按“DMC-完成年度-团队拼音缩写-序号”自动生成，不能手改
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
                <form.Field name="team" label="责任一级团队" required>
                  <Select items={teams} value={_bind(form.values.team)} placeholder="请选择" />
                </form.Field>
                <form.Field name="org" label="提出单位" required>
                  <Select items={orgs} value={_bind(form.values.org)} placeholder="请选择" />
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
                description="降本类型至少选一种；预期降本收益按选了的类型分别填，两位小数"
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
                {types.includes('unit') && (
                  <form.Field name="unitSaving" label="单机降本" required>
                    <NumberField
                      value={_bind(form.values.unitSaving)}
                      valueType={Decimal}
                      format={costKinds.unit.format}
                      min={0}
                      suffix={costKinds.unit.unit}
                    />
                  </form.Field>
                )}
                <GridItem span="full">
                  <form.Field
                    name="description"
                    label="简要描述"
                    required
                    description="必须写明：① 项目更改内容；② 降本金额来源；③ 材料降本；④ 工时降本；⑤ 已批准的三级项目建议书编号或明确的计算方法"
                  >
                    <Textarea value={_bind(form.values.description)} rows={3} />
                  </form.Field>
                </GridItem>
              </FormSection>

              <FormSection headingLevel={2} id="tech" title="技术与实施" columns={3}>
                <form.Field name="modelNo" label="数模编号 + 版本" description="涉及数模时填写">
                  <TextField value={_bind(form.values.modelNo)} placeholder="C1H02-5513-002 R03" />
                </form.Field>
                <form.Field
                  name="supplierPartNos"
                  label="供应商件号"
                  description="可填多个，回车分隔"
                >
                  <TagsInput value={_bind(form.values.supplierPartNos)} placeholder="SP-5513-01" />
                </form.Field>
                <form.Field name="date" label="完成年度" required description="存完整日期">
                  <DatePicker value={_bind(form.values.date)} />
                </form.Field>
                <form.Field name="form" label="完成形式" required>
                  <Select
                    items={completionForms}
                    value={_bind(form.values.form)}
                    placeholder="请选择"
                  />
                </form.Field>
                <form.Field name="flights" label="贯彻架次">
                  <NumberField value={_bind(form.values.flights)} min={0} suffix="架" />
                </form.Field>
                <form.Field name="needSb" label="需要 SB 贯彻" required>
                  <RadioGroup value={_bind(form.values.needSb)} orientation="horizontal">
                    <Radio value="yes">是</Radio>
                    <Radio value="no">否</Radio>
                  </RadioGroup>
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
                <form.Field name="remark" label="备注">
                  <Textarea value={_bind(form.values.remark)} rows={1} />
                </form.Field>
              </FormSection>

              <FormSection
                headingLevel={2}
                id="nodes"
                title="实施节点"
                description="DMC 降本实施节点信息表：按完成形式先后排，每个节点有计划与实际完成日期；编码、名称、数模等由主表带出"
              >
                <GridItem span="full">
                  <Flex direction="column" gap="sm">
                    <div {...stylex.attrs(styles.tableHead)}>
                      <Small tone={nodesError ? 'danger' : 'muted'}>
                        {nodesError ??
                          `${form.values.nodes.length} 个节点，已完成 ${form.values.nodes.filter((item) => item.done).length} 个`}
                      </Small>
                      <Button size="sm" variant="soft" icon={Plus} onClick={addNode}>
                        添加节点
                      </Button>
                    </div>
                    <Table aria-label="实施节点" density="compact">
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell sx={styles.index}>序号</TableHeaderCell>
                          <TableHeaderCell sx={styles.form}>完成形式</TableHeaderCell>
                          <TableHeaderCell sx={styles.date}>计划完成日期</TableHeaderCell>
                          <TableHeaderCell sx={styles.date}>实际完成日期</TableHeaderCell>
                          <TableHeaderCell sx={styles.flights}>贯彻架次</TableHeaderCell>
                          <TableHeaderCell>责任一级团队</TableHeaderCell>
                          <TableHeaderCell sx={styles.check}>需要 SB</TableHeaderCell>
                          <TableHeaderCell sx={styles.actions}>操作</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {nodes.items.map((item, index) => {
                          const which = `第 ${index + 1} 个节点的`;
                          const path = `nodes.${index}` as const;
                          return (
                            <TableRow key={nodes.keys[index]}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <form.Field name={`${path}.form`} labelPlacement="top">
                                  <Select
                                    items={completionForms}
                                    value={_bind(item.form)}
                                    placeholder="请选择"
                                    aria-label={`${which}完成形式`}
                                  />
                                </form.Field>
                              </TableCell>
                              <TableCell>
                                <form.Field name={`${path}.due`} labelPlacement="top">
                                  <DatePicker
                                    value={_bind(item.due)}
                                    aria-label={`${which}计划完成日期`}
                                  />
                                </form.Field>
                              </TableCell>
                              <TableCell>
                                <form.Field name={`${path}.done`} labelPlacement="top">
                                  <DatePicker
                                    value={_bind(item.done)}
                                    aria-label={`${which}实际完成日期`}
                                  />
                                </form.Field>
                              </TableCell>
                              <TableCell>
                                <form.Field name={`${path}.flights`} labelPlacement="top">
                                  <NumberField
                                    value={_bind(item.flights)}
                                    min={0}
                                    suffix="架"
                                    aria-label={`${which}贯彻架次`}
                                  />
                                </form.Field>
                              </TableCell>
                              <TableCell>
                                <form.Field name={`${path}.team`} labelPlacement="top">
                                  <Select
                                    items={teams}
                                    value={_bind(item.team)}
                                    placeholder="请选择"
                                    aria-label={`${which}责任一级团队`}
                                  />
                                </form.Field>
                              </TableCell>
                              <TableCell sx={styles.check}>
                                <Checkbox
                                  checked={_bind(item.needSb)}
                                  aria-label={`${which}是否需要 SB 贯彻航线架次`}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="xs"
                                  icon={Trash2}
                                  tone="danger"
                                  aria-label={`删除第 ${index + 1} 个节点`}
                                  onClick={() => nodes.remove(index)}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Flex>
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
      </CaseShell>
    );
  };
});
