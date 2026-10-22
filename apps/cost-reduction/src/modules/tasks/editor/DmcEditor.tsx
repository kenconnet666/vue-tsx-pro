/**
 * 降 DMC 编辑（表单，新建与编辑共用）。字段与校验严格按《降本项目信息表》的“DMC降本主表”与
 * “DMC降本实施节点信息表”：主表三组（基本信息、降本信息、技术与实施），实施节点在表格里逐行编辑
 * （完成形式、计划与实际完成日期、贯彻架次、责任一级团队、是否需要 SB）。项目编码、联络人工号系统生成或带出，只读。
 * 主表的“完成年度”按信息表存完整日期，就是项目的计划完成日期。保存后去项目详情；编码由后端在新建时生成
 */
import { Plus, Trash2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  ActionBar,
  Button,
  Checkbox,
  CheckboxGroup,
  Combobox,
  DatePicker,
  Flex,
  Form,
  FormSection,
  GridItem,
  IconButton,
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
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import { watch } from 'vue';
import * as z from 'zod';
import { createTask, saveTask } from '../../../api/tasks';
import { notifyError } from '../../../app/feedback';
import { deptsOf, dict, master, staffOptions, teamNames } from '../../../app/master';
import { blankClosing, blankMilestones } from '../../../domain/task/lifecycle';
import type { CostTask, InstallType } from '../../../domain/task/types';
import { costKinds } from '../../../shared/kinds';
import { checkSavings, taskFields, type TaskEditorProps } from './task-form';

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
      // 新建时编码由后端按“DMC-完成年度-团队缩写-序号”生成
      code: '',
      sourceCode: '待关联',
      model: master().models[0]!,
      workPackage: master().workPackages[0]!,
      // DMC 主表没有任务类别、提出部门、经费来源与项目建议书：取默认值，统计时按降本类型分开
      category: dict('categories')[0]!.value,
      dept: deptsOf(values.org)[0] ?? '',
      funding: [],
      proposalNo: '',
      owner: values.contact,
      status: 'pending',
      valueState: 'forecast',
      basis: 'hard',
      a: null,
      b: null,
      gapReason: null,
      milestones: blankMilestones(),
      closing: blankClosing(),
      unitDetail: null,
    }),
    kind: 'dmc',
    channel: base?.channel ?? 'one',
    name: values.name,
    org: values.org,
    contact: values.contact,
    team: values.team,
    install: values.install as InstallType,
    expected: values.dmcSaving ?? new Decimal(0),
    description: values.description,
    modelNo: values.modelNo,
    supplierPartNos: values.supplierPartNos,
    due: values.date,
    year: values.date.slice(0, 4),
    flights: values.flights,
    form: values.form,
    supplier: values.suppliers[0] ?? master().suppliers[0]!,
    needSb: values.needSb === 'yes',
    remark: values.remark,
    dmcNodes: values.nodes.map((item) => ({ ...item, done: item.done || null })),
  };
}

/** 降 DMC 编辑：task 为 null 时新建 */
export const DmcEditor = _component(
  ({ task, onSaved, onCancel, dirty = _bindable(false) }: TaskEditorProps) => {
    // 编辑的是哪一项在打开时就定了：取一次
    const editing = _untrack(task);
    let status = _state('');

    const form = useForm({
      schema,
      initial: editing ? fromTask(editing) : blank(),
      onSubmit: async (values) => {
        const draft = toTask(values as Values, editing);
        try {
          const saved = editing ? await saveTask(draft) : await createTask(draft);
          status = editing ? '已保存' : `已新建 ${saved.code}`;
          form.reset(form.values);
          onSaved(saved);
        } catch (error) {
          notifyError(editing ? '没能保存' : '没能创建项目', error);
        }
      },
    });
    // 有没保存的改动时，点“取消”、面包屑或关掉页面都先问一下
    useLeaveConfirmation(() => form.dirty && !form.submitting);
    // 有没有未保存的改动交给抽屉：关闭前确认
    watch(
      () => form.dirty && !form.submitting,
      (value) => {
        if (dirty !== value) dirty = value;
      },
      { immediate: true },
    );
    const person = () => staffOptions().find((item) => item.value === form.values.contact);
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
      const nodesError = form.visibleError('nodes');
      return (
        <>
          {/* 抽屉宽时每段最多三列；窄了按 minColumnWidth 自动减列 */}
          <Flex direction="column" gap="lg">
            <Form controller={form} labelPlacement="start" labelWidth="8.5em">
              <Flex direction="column" gap="xl">
                <FormSection headingLevel={2} id="basic" title="基本信息" columns={3}>
                  <GridItem span={2}>
                    <form.Field name="name" label="项目名称" required>
                      <TextField value={_bind(form.values.name)} maxlength={200} showCount />
                    </form.Field>
                  </GridItem>
                  <form.Field name="team" label="责任一级团队" required>
                    <Select
                      items={teamNames()}
                      value={_bind(form.values.team)}
                      placeholder="请选择"
                    />
                  </form.Field>
                  <form.Field name="org" label="提出单位" required>
                    <Select
                      items={master().orgs.map((org) => org.name)}
                      value={_bind(form.values.org)}
                      placeholder="请选择"
                    />
                  </form.Field>
                  <form.Field name="contact" label="联络人" required>
                    <Combobox
                      items={staffOptions()}
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
                      {dict('installTypes').map((item) => (
                        <Radio key={item.value} value={item.value}>
                          {item.label}
                        </Radio>
                      ))}
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
                    <TextField
                      value={_bind(form.values.modelNo)}
                      placeholder="C1H02-5513-002 R03"
                    />
                  </form.Field>
                  <form.Field
                    name="supplierPartNos"
                    label="供应商件号"
                    description="可填多个，回车分隔"
                  >
                    <TagsInput
                      value={_bind(form.values.supplierPartNos)}
                      placeholder="SP-5513-01"
                    />
                  </form.Field>
                  <form.Field name="date" label="完成年度" required description="存完整日期">
                    <DatePicker value={_bind(form.values.date)} />
                  </form.Field>
                  <form.Field name="form" label="完成形式" required>
                    <Select
                      items={dict('completionForms')}
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
                      items={master().suppliers}
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
                      <Flex align="center" justify="between" gap="md">
                        <Small tone={nodesError ? 'danger' : 'muted'}>
                          {nodesError ??
                            `${form.values.nodes.length} 个节点，已完成 ${form.values.nodes.filter((item) => item.done).length} 个`}
                        </Small>
                        <Button size="sm" variant="soft" icon={Plus} onClick={addNode}>
                          添加节点
                        </Button>
                      </Flex>
                      <Table aria-label="实施节点" density="compact">
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell width="3rem">序号</TableHeaderCell>
                            <TableHeaderCell width="11rem">完成形式</TableHeaderCell>
                            <TableHeaderCell width="11rem">计划完成日期</TableHeaderCell>
                            <TableHeaderCell width="11rem">实际完成日期</TableHeaderCell>
                            <TableHeaderCell width="8rem">贯彻架次</TableHeaderCell>
                            <TableHeaderCell>责任一级团队</TableHeaderCell>
                            <TableHeaderCell width="5rem" align="center">
                              需要 SB
                            </TableHeaderCell>
                            <TableHeaderCell width="4rem">操作</TableHeaderCell>
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
                                      items={dict('completionForms')}
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
                                      items={teamNames()}
                                      value={_bind(item.team)}
                                      placeholder="请选择"
                                      aria-label={`${which}责任一级团队`}
                                    />
                                  </form.Field>
                                </TableCell>
                                <TableCell align="center">
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
                  <Button variant="ghost" tone="neutral" onClick={onCancel}>
                    取消
                  </Button>
                  <Button type="submit" loading={form.submitting}>
                    {editing ? '保存' : '创建项目'}
                  </Button>
                </ActionBar>
              </Flex>
            </Form>
          </Flex>
        </>
      );
    };
  },
);
