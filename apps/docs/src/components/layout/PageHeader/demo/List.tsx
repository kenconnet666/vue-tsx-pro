// 列表页的页头：面包屑、标题与总数、说明，结束边是导入、导出与新建；下面是带计数的页签
import { Download, Plus, Upload } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Badge, Button, PageHeader, Tab, TabList, Tabs } from '@vue-tsx-pro/ui';

const tabs = [
  { value: 'all', label: '全部', count: 128 },
  { value: 'active', label: '进行中', count: 46 },
  { value: 'awaiting', label: '待认定', count: 12 },
  { value: 'closed', label: '已关闭', count: 70 },
];

export default _component(() => {
  let tab = _state('all');
  return () => (
    <PageHeader
      breadcrumbs={[{ label: '联合降本', href: '#' }, { label: '降本任务' }]}
      title="降本任务"
      meta={
        <Badge radius="full" tone="neutral">
          128 项
        </Badge>
      }
      description="两条渠道达成一致后汇入任务池，管执行、管进度直到关闭"
      actions={
        <>
          <Button variant="outline" tone="neutral" icon={Upload}>
            导入
          </Button>
          <Button variant="outline" tone="neutral" icon={Download}>
            导出
          </Button>
          <Button icon={Plus}>新建任务</Button>
        </>
      }
    >
      <Tabs value={_bind(tab)}>
        <TabList aria-label="任务状态">
          {tabs.map((item) => (
            <Tab key={item.value} value={item.value}>
              {item.label}
              <Badge radius="full" tone={tab === item.value ? 'accent' : 'neutral'}>
                {item.count}
              </Badge>
            </Tab>
          ))}
        </TabList>
      </Tabs>
    </PageHeader>
  );
});
