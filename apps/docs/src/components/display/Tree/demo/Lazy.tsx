// 组织架构：子部门展开时才向“服务端”取（loadChildren，加载中显示指示）；已停用的部门可以展开、不能选中；
// renderItem 在名字后面加人数
import { Building2, Users } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Badge, Card, Flex, Small, Tree } from '@vue-tsx-pro/ui';

interface Department {
  id: string;
  name: string;
  people: number;
  hasTeams: boolean;
  retired?: boolean;
  teams?: Department[];
}

/** 模拟服务端：按部门取下一级，600 毫秒后返回 */
const fetchTeams = (parent: Department) =>
  new Promise<Department[]>((resolve) =>
    setTimeout(
      () =>
        resolve(
          ['产品', '设计', '研发', '测试'].map((name, index) => ({
            id: `${parent.id}-${index}`,
            name: `${parent.name.replace(/部$/, '')}${name}组`,
            people: 3 + ((index * 7 + parent.people) % 9),
            hasTeams: false,
            retired: index === 3 && parent.id === 'rd',
          })),
        ),
      600,
    ),
  );

const styles = css.create({ tree: { height: '16rem' }, count: { marginInlineStart: '_xs' } });

export default _component(() => {
  let departments = _state<Department[]>([
    { id: 'product', name: '产品部', people: 24, hasTeams: true },
    { id: 'rd', name: '研发部', people: 86, hasTeams: true },
    { id: 'market', name: '市场部', people: 15, hasTeams: true },
    { id: 'legal', name: '法务部（已停用）', people: 0, hasTeams: false, retired: true },
  ]);
  let expanded = _state<string[]>([]);
  let selected = _state<string[]>([]);

  async function loadChildren(node: Department) {
    node.teams = await fetchTeams(node);
    // 换一个新数组让树重新读数据
    departments = [...departments];
  }

  return () => (
    <Card padding="sm">
      <Flex direction="column" gap="sm">
        <Tree
          items={departments}
          getKey={(node) => node.id}
          getLabel={(node) => node.name}
          getChildren={(node) => node.teams}
          hasChildren={(node) => node.hasTeams}
          loadChildren={loadChildren}
          isDisabled={(node) => node.retired === true}
          getIcon={(node) => (node.hasTeams ? Building2 : Users)}
          expanded={_bind(expanded)}
          selectionMode="single"
          selected={_bind(selected)}
          indent={1.5}
          renderItem={(node) => (
            <>
              {node.name}
              <Badge size="sm" variant="soft" tone="neutral" sx={styles.count}>
                {node.people} 人
              </Badge>
            </>
          )}
          aria-label="组织架构"
          sx={styles.tree}
        />
        <Small tone="muted">
          {selected[0] ? `选中了 ${selected[0]}` : '展开部门时才加载下面的小组'}
        </Small>
      </Flex>
    </Card>
  );
});
