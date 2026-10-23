// 工作区的页签（同后台系统的多页签）：打开的单据各占一个标签，可以关闭、新建、拖动排序；放不下时两端有滚动按钮，
// 右边“全部标签页”一眼找到并切过去。首页固定，不能关
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, Small, Tab, TabList, TabPanel, Tabs, Text } from '@vue-tsx-pro/ui';

interface Page {
  id: string;
  title: string;
  pinned?: boolean;
}

const initial: Page[] = [
  { id: 'home', title: '工作台', pinned: true },
  { id: 'po-2401', title: '采购单 PO-2401' },
  { id: 'po-2402', title: '采购单 PO-2402' },
  { id: 'supplier-17', title: '供应商：远山精密' },
  { id: 'report-q3', title: '第三季度降本报表' },
  { id: 'inspect-88', title: '来料检验 IQC-88' },
  { id: 'contract-5', title: '合同审批 CT-5' },
];

export default _component(() => {
  let pages = _state(initial);
  let current = _state('po-2401');
  let created = _state(0);
  return () => (
    <Card padding="sm">
      <Tabs value={_bind(current)}>
        <TabList
          aria-label="打开的页面"
          showAllMenu
          onAdd={() => {
            created++;
            const page = { id: `draft-${created}`, title: `新建草稿 ${created}` };
            pages = [...pages, page];
            current = page.id;
          }}
          onReorder={(order) => (pages = order.map((id) => pages.find((page) => page.id === id)!))}
        >
          {pages.map((page) => (
            <Tab
              key={page.id}
              value={page.id}
              onClose={
                page.pinned
                  ? undefined
                  : () => (pages = pages.filter((item) => item.id !== page.id))
              }
            >
              {page.title}
            </Tab>
          ))}
        </TabList>
        {pages.map((page) => (
          <TabPanel key={page.id} value={page.id}>
            <Flex direction="column" gap="xs" style={{ paddingBlock: '1em' }}>
              <Text weight="semibold">{page.title}</Text>
              <Small tone="muted">
                拖动标签换顺序（或在标签上按 Alt + ← →），Delete 或中键关闭；共 {pages.length}{' '}
                个页签
              </Small>
            </Flex>
          </TabPanel>
        ))}
      </Tabs>
    </Card>
  );
});
