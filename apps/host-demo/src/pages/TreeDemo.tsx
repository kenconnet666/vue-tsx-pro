// /base 页上的树演示：单选的目录树（文件夹图标随展开切换）与勾选的权限树（父子联动、懒加载）
import { File, Folder, FolderOpen } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Flex, Text, Tree } from '@vue-tsx-pro/ui';

interface Entry {
  id: string;
  name: string;
  children?: Entry[];
  /** 子节点要等展开时才取 */
  lazy?: boolean;
}

const files: Entry[] = [
  {
    id: 'src',
    name: 'src',
    children: [
      {
        id: 'components',
        name: 'components',
        children: [
          { id: 'button', name: 'Button.tsx' },
          { id: 'tree', name: 'Tree.tsx' },
        ],
      },
      { id: 'main', name: 'main.ts' },
    ],
  },
  { id: 'package', name: 'package.json' },
  { id: 'readme', name: 'README.md' },
];

const styles = stylex.create({
  tree: {
    width: '18rem',
    maxHeight: '16rem',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
  },
});

export const TreeDemo = _component(() => {
  let expanded = _state(['src']);
  let current = _state<string[]>(['main']);
  let permissions = _state<Entry[]>([
    {
      id: 'orders',
      name: '订单',
      children: [
        { id: 'orders.view', name: '查看' },
        { id: 'orders.edit', name: '编辑' },
        { id: 'orders.refund', name: '退款' },
      ],
    },
    { id: 'users', name: '用户', lazy: true },
  ]);
  let granted = _state<string[]>(['orders.view']);
  let openPermissions = _state(['orders']);

  function loadPermission(entry: Entry) {
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        permissions = permissions.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                lazy: false,
                children: [
                  { id: `${item.id}.view`, name: '查看' },
                  { id: `${item.id}.invite`, name: '邀请' },
                ],
              }
            : item,
        );
        resolve();
      }, 600),
    );
  }

  return () => (
    <Flex gap="lg" wrap>
      <Flex direction="column" gap="sm">
        <Tree
          items={files}
          getKey={(entry) => entry.id}
          getLabel={(entry) => entry.name}
          getChildren={(entry) => entry.children}
          getIcon={(entry, open) => (entry.children ? (open ? FolderOpen : Folder) : File)}
          expanded={_bind(expanded)}
          selectionMode="single"
          selected={_bind(current)}
          aria-label="文件"
          class="tree-demo"
          sx={styles.tree}
        />
        <Text tone="muted" size="sm">
          当前：{current[0] ?? '无'}
        </Text>
      </Flex>
      <Flex direction="column" gap="sm">
        <Tree
          items={permissions}
          getKey={(entry) => entry.id}
          getLabel={(entry) => entry.name}
          getChildren={(entry) => entry.children}
          hasChildren={(entry) => entry.lazy === true || (entry.children?.length ?? 0) > 0}
          loadChildren={loadPermission}
          expanded={_bind(openPermissions)}
          checkable
          checked={_bind(granted)}
          aria-label="权限"
          class="tree-check-demo"
          sx={styles.tree}
        />
        <Text tone="muted" size="sm" class="tree-check-summary">
          已勾选 {granted.length} 项
        </Text>
      </Flex>
    </Flex>
  );
});
