// 详情页的页头：返回、长标题旁的状态与编号、说明，操作里次要的收进“更多”；下面是详情的页签
import { CirclePause, Ellipsis, FileDown, Pencil, RotateCcwClock } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Button,
  createStatusMap,
  IconButton,
  Menu,
  MenuItem,
  PageHeader,
  Small,
  StatusBadge,
  Tab,
  TabList,
  Tabs,
} from '@vue-tsx-pro/ui';

const taskStatuses = createStatusMap({
  designing: { label: '方案设计中', tone: 'info' },
  verifying: { label: '验证中', tone: 'info' },
  awaiting: { label: '待认定', tone: 'warning' },
});

export default _component(() => {
  let backed = _state(0);
  return () => (
    <PageHeader
      breadcrumbs={[
        { label: '联合降本', href: '#' },
        { label: '降本任务', href: '#' },
        { label: 'DJ-2026-FC-1' },
      ]}
      back={() => backed++}
      title="机型 A 平尾翼根整流罩设计优化"
      meta={
        <>
          <StatusBadge statuses={taskStatuses} value="verifying" radius="full" />
          <Badge variant="outline">DJ-2026-FC-1</Badge>
        </>
      }
      description={
        <>
          复合材料中心 · 主办 林小满 · 计划 2026 年完成
          {backed > 0 && <Small tone="accent"> · 点了 {backed} 次返回</Small>}
        </>
      }
      actions={
        <>
          <Menu
            trigger={(props) => (
              <IconButton
                {...props}
                icon={Ellipsis}
                aria-label="更多操作"
                variant="outline"
                tone="neutral"
              />
            )}
          >
            <MenuItem icon={RotateCcwClock}>变更记录</MenuItem>
            <MenuItem icon={FileDown}>导出任务卡</MenuItem>
            <MenuItem icon={CirclePause} tone="danger">
              暂停任务
            </MenuItem>
          </Menu>
          <Button variant="outline" tone="neutral" icon={Pencil}>
            编辑
          </Button>
          <Button>提交验证结论</Button>
        </>
      }
    >
      <Tabs value="overview">
        <TabList aria-label="任务详情">
          <Tab value="overview">概览</Tab>
          <Tab value="milestones">里程碑</Tab>
          <Tab value="estimate">测算</Tab>
          <Tab value="files">附件</Tab>
          <Tab value="history">变更记录</Tab>
        </TabList>
      </Tabs>
    </PageHeader>
  );
});
