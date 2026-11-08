// 审批面板（组合）：单据摘要（Descriptions）、只看的进度图、流转记录（Timeline）与留言（CommentThread），
// 最后是吸底的 ActionBar（滚动时一直看得见）。点按钮弹出写意见的表单对话框（useFormDialog），“不同意”的意见必填；
// 按钮的名字、要不要写意见都取自环节的 outcomes。转办（选一个人）、抄送（多选几个人）同样是一个对话框，结果记进流转记录
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  Button,
  Descriptions,
  Flex,
  H3,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Timeline,
  type TimelineItem,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { Diagram } from '@zerodep-dev/vue-tsx-pro-ui/diagram';
import {
  ActionBar,
  CommentThread,
  useFormDialog,
  type CommentItem,
} from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { templates, type Outcome } from '@zerodep-dev/flow-ts-model';
import { processDiagram, renderStep, stepLabel } from '../process-diagram';

const definition = templates.purchase();
const task = definition.nodes.find((node) => node.id === 'step');
const outcomes: readonly Outcome[] = task?.type === 'task' ? task.outcomes : [];
/** 按钮按下后走到哪条线、哪个结束 */
const routes: Record<string, { edge: string; end: string; status: string }> = {
  approve: { edge: 'step-next', end: 'approved', status: '已通过' },
  reject: { edge: 'step-reject', end: 'rejected', status: '不通过' },
};

const NOW = Date.parse('2026-10-24T16:00:00+08:00');

const history: TimelineItem[] = [
  {
    key: 'start',
    title: '提交',
    actor: '陈晓',
    time: '10-23 09:12',
    dateTime: '2026-10-23T09:12:00+08:00',
    tone: 'success',
  },
  {
    key: 'manager',
    title: '部门经理审批 · 同意',
    actor: '王经理',
    time: '10-23 14:30',
    dateTime: '2026-10-23T14:30:00+08:00',
    description: '扩容是年初预算里的，同意。',
    tone: 'success',
  },
  {
    key: 'step',
    title: '到达总经理审批',
    actor: '系统',
    time: '10-23 14:30',
    dateTime: '2026-10-23T14:30:00+08:00',
    description: '金额超过 10000，加审',
  },
];

const initialComments: CommentItem[] = [
  {
    id: 'c1',
    author: '王经理',
    role: '部门经理',
    content: '供应商报价已对比过三家，这家最低。',
    time: '2026-10-23T14:32:00+08:00',
  },
];

/** 转办、抄送时能选的人（真实应用里来自组织架构） */
const PEOPLE = [
  { value: 'wang', label: '王经理' },
  { value: 'zhao', label: '赵会计' },
  { value: 'sun', label: '孙总监' },
];
const nameOf = (id: string) => PEOPLE.find((p) => p.value === id)?.label ?? id;

export default _component(() => {
  const prompt = useFormDialog();
  let tab = _state('records');
  let finished = _state.raw<{ outcome: Outcome; status: string } | null>(null);
  let records = _state.raw<TimelineItem[]>(history);
  let comments = _state.raw<CommentItem[]>(initialComments);

  const progress = _derived(
    finished
      ? {
          done: [
            ...['start', 'submit', 'manager', 'manager-next', 'branch', 'branch-large', 'step'],
            routes[finished.outcome.key]!.edge,
            routes[finished.outcome.key]!.end,
          ],
        }
      : {
          current: ['step'],
          done: ['start', 'submit', 'manager', 'manager-next', 'branch', 'branch-large'],
        },
  );
  const view = _derived(processDiagram(definition, progress));

  /** 记一条流转记录 */
  function record(key: string, title: string, description?: string) {
    records = [
      ...records,
      { key, title, actor: '李总', time: '刚刚', ...(description ? { description } : {}) },
    ];
  }

  /** 转办：交给另一个人处理 */
  async function transfer() {
    const values = await prompt({
      title: '转办',
      fields: [
        { name: 'to', label: '转给', type: 'select', required: true, options: PEOPLE },
        { name: 'comment', label: '说明', type: 'textarea', placeholder: '可以不写' },
      ],
      confirmText: '转办',
    });
    if (values)
      record(`transfer-${records.length}`, `转办 · 给 ${nameOf(values.to)}`, values.comment);
  }

  /** 抄送：多选几个人，他们只看不处理 */
  async function cc() {
    const values = await prompt({
      title: '抄送',
      fields: [
        {
          name: 'users',
          label: '抄送给',
          type: 'select',
          multiple: true,
          required: true,
          options: PEOPLE,
        },
        { name: 'comment', label: '附言', type: 'textarea', placeholder: '可以不写' },
      ],
      confirmText: '抄送',
    });
    if (values)
      record(
        `cc-${records.length}`,
        `抄送 · 给 ${values.users.map(nameOf).join('、')}`,
        values.comment,
      );
  }

  async function handle(outcome: Outcome) {
    const required = outcome.comment === 'required';
    const values = await prompt({
      title: outcome.label,
      fields: [
        {
          name: 'comment',
          label: '意见',
          type: 'textarea',
          required,
          maxlength: 500,
          ...(required ? {} : { placeholder: '可以不写' }),
        },
      ],
      confirmText: outcome.label,
      ...(outcome.kind === 'reject' ? { tone: 'danger' as const } : {}),
    });
    if (!values) return;
    const comment = values['comment']?.trim();
    finished = { outcome, status: routes[outcome.key]!.status };
    records = [
      ...records,
      {
        key: 'done',
        title: `总经理审批 · ${outcome.label}`,
        actor: '李总',
        time: '刚刚',
        tone: outcome.kind === 'reject' ? 'danger' : 'success',
        ...(comment ? { description: comment } : {}),
      },
    ];
  }

  return () => (
    <Flex direction="column" gap="lg">
      <Flex gap="sm" align="center" wrap>
        <H3>采购：服务器扩容</H3>
        <Badge
          tone={finished ? (finished.outcome.kind === 'reject' ? 'danger' : 'success') : 'accent'}
        >
          {finished ? finished.status : '审批中'}
        </Badge>
      </Flex>
      <Descriptions
        columns="auto"
        items={[
          { label: '申请人', value: '陈晓（研发部）' },
          { label: '金额', value: '¥ 48,600.00' },
          { label: '提交时间', value: '2026-10-23 09:12' },
          { label: '当前环节', value: finished ? '已结束' : '总经理审批' },
        ]}
      />
      <Diagram
        nodes={view.nodes}
        edges={view.edges}
        getNodeLabel={stepLabel}
        edgeText={(flow) => flow.text}
        routing="orthogonal"
        fitView
        height="15rem"
        aria-label="审批进度"
      >
        {renderStep}
      </Diagram>
      <Tabs _value={tab}>
        <TabList aria-label="审批单">
          <Tab value="records">流转记录</Tab>
          <Tab value="comments">留言（{comments.length}）</Tab>
        </TabList>
        <TabPanel value="records">
          <Timeline items={records} />
        </TabPanel>
        <TabPanel value="comments">
          <CommentThread
            comments={comments}
            now={NOW}
            currentUser={{ name: '李总' }}
            onSend={(draft) =>
              (comments = [
                ...comments,
                {
                  id: `c${comments.length + 1}`,
                  author: '李总',
                  role: '总经理',
                  content: draft.content,
                  time: new Date(NOW).toISOString(),
                },
              ])
            }
          />
        </TabPanel>
      </Tabs>
      {!finished && (
        <ActionBar start="处理后流程走到下一步，申请人会收到通知">
          <Button variant="ghost" tone="neutral" onClick={() => void cc()}>
            抄送
          </Button>
          <Button variant="ghost" tone="neutral" onClick={() => void transfer()}>
            转办
          </Button>
          {outcomes.map((outcome) => (
            <Button
              key={outcome.key}
              variant={outcome.kind === 'reject' ? 'outline' : 'solid'}
              tone={outcome.kind === 'reject' ? 'danger' : 'accent'}
              onClick={() => void handle(outcome)}
            >
              {outcome.label}
            </Button>
          ))}
        </ActionBar>
      )}
    </Flex>
  );
});
