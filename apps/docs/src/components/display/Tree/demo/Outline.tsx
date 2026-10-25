// 培训手册的目录：搜索过滤（匹配的加粗、上级展开），拖动调整层级与顺序（或 Alt + 方向键），附录不能再往下放
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Flex, Small, TextField, Tree, moveNode } from '@vue-tsx-pro/ui';

interface Section {
  id: string;
  title: string;
  appendix?: boolean;
  children?: Section[];
}

const outline: Section[] = [
  {
    id: 'intro',
    title: '第一章 入职须知',
    children: [
      { id: 'intro-culture', title: '公司文化' },
      { id: 'intro-it', title: '账号与设备' },
    ],
  },
  {
    id: 'process',
    title: '第二章 采购流程',
    children: [
      { id: 'process-request', title: '请购单' },
      { id: 'process-quote', title: '询价与比价' },
      { id: 'process-contract', title: '合同审批' },
    ],
  },
  {
    id: 'quality',
    title: '第三章 来料检验',
    children: [
      { id: 'quality-sampling', title: '抽样方案' },
      { id: 'quality-report', title: '检验报告' },
    ],
  },
  { id: 'appendix', title: '附录 表单模板', appendix: true },
];

const editor = {
  getKey: (section: Section) => section.id,
  getChildren: (section: Section) => section.children,
  withChildren: (section: Section, children: Section[]) => ({ ...section, children }),
};

const styles = css.create({ tree: { height: '18rem' } });

export default _component(() => {
  let sections = _state(outline);
  let expanded = _state(['intro', 'process', 'quality']);
  let query = _state('');
  let moves = _state(0);
  return () => (
    <Card padding="sm">
      <Flex direction="column" gap="sm">
        <TextField
          type="search"
          icon={Search}
          _value={query}
          placeholder="搜索章节（试试“检验”“bj”）"
          aria-label="搜索章节"
        />
        <Tree
          items={sections}
          getKey={(section) => section.id}
          getLabel={(section) => section.title}
          getChildren={(section) => section.children}
          _expanded={expanded}
          filter={query}
          onMove={({ key, target }) => {
            sections = moveNode(sections, editor, key, target) ?? sections;
            moves++;
          }}
          // 附录放在第一层，不放进别的章节里，也不接收子节点
          canDrop={(section, target) =>
            section.appendix ? target.parent === undefined : target.parent !== 'appendix'
          }
          propsScrollArea={{ sx: styles.tree }}
          aria-label="手册目录"
        />
        <Small tone="muted">
          拖动标题调整层级与顺序，或选中后按 Alt + 方向键；已移动 {moves} 次
        </Small>
      </Flex>
    </Card>
  );
});
