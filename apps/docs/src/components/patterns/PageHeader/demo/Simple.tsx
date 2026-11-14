// 列表页、表单页的页头：标题、说明、一个主要操作；下面接标签页
import { Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Tab, TabList, Tabs } from '@zerodep-dev/vue-tsx-pro-ui';
import { PageHeader } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

export default _component(() => {
  let tab = _state('all');
  return () => (
    <Tabs _value={tab}>
      <PageHeader
        title="采购申请"
        // 示例嵌在文档页的一节里，标题降到 h3；整页的页头不用写（默认 h1）
        headingLevel={3}
        description="提交后先由部门经理审批，金额超过 5 万元时加签财务。"
        actions={<Button icon={Plus}>新建申请</Button>}
      >
        <TabList aria-label="采购申请">
          <Tab value="all">全部</Tab>
          <Tab value="mine">我提交的</Tab>
          <Tab value="todo">待我审批</Tab>
        </TabList>
      </PageHeader>
    </Tabs>
  );
});
