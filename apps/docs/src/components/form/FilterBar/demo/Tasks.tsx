// 降本任务的查询栏：常用的四个条件，不常用的收起；收起时“展开”旁提示已经填了几项。
// 在输入框里按回车就是查询；重置回到初始条件再查一次
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  createStatusMap,
  DatePicker,
  Field,
  FilterBar,
  Flex,
  RadioGroup,
  Radio,
  Select,
  Small,
  StatusBadge,
  TextField,
} from '@vue-tsx-pro/ui';

const statuses = createStatusMap({
  pending: { label: '待启动', tone: 'neutral' },
  designing: { label: '方案设计中', tone: 'info' },
  verifying: { label: '验证中', tone: 'info' },
  awaiting: { label: '待认定', tone: 'warning' },
  closed: { label: '关闭', tone: 'success' },
});

const tasks = [
  {
    name: '机型 A 平尾翼根整流罩设计优化',
    category: '设计优化',
    team: '复合材料结构',
    year: '2026',
    status: 'verifying',
    config: true,
  },
  {
    name: '机型 A 机身支架工艺优化',
    category: '工艺优化',
    team: '总体技术集成',
    year: '2026',
    status: 'closed',
    config: false,
  },
  {
    name: '舱门密封件第二货源',
    category: '多货源',
    team: '起落架液压系统',
    year: '2026',
    status: 'awaiting',
    config: false,
  },
  {
    name: '客舱地板支撑件设计优化',
    category: '设计优化',
    team: '复合材料结构',
    year: '2027',
    status: 'designing',
    config: true,
  },
  {
    name: '线束支架工艺优化',
    category: '工艺优化',
    team: '总体技术集成',
    year: '2027',
    status: 'pending',
    config: false,
  },
];

const initial = () => ({
  keyword: '',
  category: '',
  status: [] as string[],
  year: '',
  team: '',
  config: 'any',
});

export default _component(() => {
  let query = _state(initial());
  let applied = _state(initial());
  let loading = _state(false);
  // 收起的条件里填了几项：完成年度、责任团队、是否涉构型更改
  const moreActive = () =>
    [query.year !== '', query.team !== '', query.config !== 'any'].filter(Boolean).length;

  async function search() {
    loading = true;
    await new Promise((resolve) => setTimeout(resolve, 500));
    applied = { ...query, status: [...query.status] };
    loading = false;
  }
  function reset() {
    query = initial();
    void search();
  }
  const results = () =>
    tasks.filter(
      (task) =>
        task.name.includes(applied.keyword) &&
        (!applied.category || task.category === applied.category) &&
        (applied.status.length === 0 || applied.status.includes(task.status)) &&
        (!applied.year || task.year === applied.year) &&
        (!applied.team || task.team === applied.team) &&
        (applied.config === 'any' || task.config === (applied.config === 'yes')),
    );

  return () => (
    <Flex direction="column" gap="md">
      <Card>
        <FilterBar
          onSearch={() => void search()}
          onReset={reset}
          loading={loading}
          moreActive={moreActive()}
          more={
            <>
              <Field label="完成年度">
                <DatePicker granularity="year" value={_bind(query.year)} />
              </Field>
              <Field label="责任团队">
                <Select
                  items={['复合材料结构', '总体技术集成', '起落架液压系统']}
                  value={_bind(query.team)}
                  placeholder="全部"
                  clearable
                />
              </Field>
              <Field label="涉构型更改">
                <RadioGroup value={_bind(query.config)} orientation="horizontal">
                  <Radio value="any">不限</Radio>
                  <Radio value="yes">是</Radio>
                  <Radio value="no">否</Radio>
                </RadioGroup>
              </Field>
            </>
          }
        >
          <Field label="项目名称">
            <TextField value={_bind(query.keyword)} icon={Search} placeholder="名称或编码" />
          </Field>
          <Field label="任务类别">
            <Select
              items={['设计优化', '多货源', '工艺优化']}
              value={_bind(query.category)}
              placeholder="全部"
              clearable
            />
          </Field>
          <Field label="状态">
            <Select
              items={statuses.options()}
              selectionMode="multiple"
              value={_bind(query.status)}
              placeholder="全部"
              clearable
            />
          </Field>
        </FilterBar>
      </Card>
      <Flex direction="column" gap="xs">
        <Small tone="muted">找到 {results().length} 项</Small>
        {results().map((task) => (
          <Flex key={task.name} align="center" gap="sm">
            <StatusBadge statuses={statuses} value={task.status} radius="full" />
            <Small>{task.name}</Small>
            <Small tone="muted">
              {task.category} · {task.team} · {task.year}
            </Small>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
});
