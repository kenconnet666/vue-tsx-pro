// 项目任务的查询栏：常用的四个条件，不常用的收起；收起时“展开”旁提示已经填了几项。
// 在输入框里按回车就是查询；重置回到初始条件再查一次
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  createStatusMap,
  DatePicker,
  Field,
  Flex,
  RadioGroup,
  Radio,
  Select,
  Small,
  StatusBadge,
  TextField,
} from '@vue-tsx-pro/ui';
import { FilterBar } from '@vue-tsx-pro/ui/patterns';

const statuses = createStatusMap({
  pending: { label: '待启动', tone: 'neutral' },
  designing: { label: '设计中', tone: 'info' },
  verifying: { label: '测试中', tone: 'info' },
  awaiting: { label: '待验收', tone: 'warning' },
  closed: { label: '关闭', tone: 'success' },
});

const tasks = [
  {
    name: '华东门店陈列改造',
    category: '产品改进',
    team: '研发中心',
    year: '2026',
    status: 'verifying',
    config: true,
  },
  {
    name: '仓库拣货流程优化',
    category: '流程优化',
    team: '产品部',
    year: '2026',
    status: 'closed',
    config: false,
  },
  {
    name: '包装纸箱第二供应商',
    category: '供应商切换',
    team: '运营部',
    year: '2026',
    status: 'awaiting',
    config: false,
  },
  {
    name: '会员小程序改版',
    category: '产品改进',
    team: '研发中心',
    year: '2027',
    status: 'designing',
    config: true,
  },
  {
    name: '仓库盘点流程优化',
    category: '流程优化',
    team: '产品部',
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
          aria-label="项目任务查询"
          onSearch={() => void search()}
          onReset={reset}
          loading={loading}
          moreActive={moreActive()}
          more={
            <>
              <Field label="完成年度">
                <DatePicker granularity="year" _value={query.year} />
              </Field>
              <Field label="责任团队">
                <Select
                  items={['研发中心', '产品部', '运营部']}
                  _value={query.team}
                  placeholder="全部"
                  clearable
                />
              </Field>
              <Field label="涉构型更改">
                <RadioGroup _value={query.config} orientation="horizontal">
                  <Radio value="any">不限</Radio>
                  <Radio value="yes">是</Radio>
                  <Radio value="no">否</Radio>
                </RadioGroup>
              </Field>
            </>
          }
        >
          <Field label="项目名称">
            <TextField _value={query.keyword} icon={Search} placeholder="名称或编码" />
          </Field>
          <Field label="任务类别">
            <Select
              items={['产品改进', '供应商切换', '流程优化']}
              _value={query.category}
              placeholder="全部"
              clearable
            />
          </Field>
          <Field label="状态">
            <Select
              items={statuses.options()}
              selectionMode="multiple"
              _value={query.status}
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
