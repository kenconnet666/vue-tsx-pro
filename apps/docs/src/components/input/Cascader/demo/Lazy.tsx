// 组织架构按级取回：进入一个部门时才请求它的下级（模拟 600 ms 的接口）。
// 编辑页把已选的那一枝放进初始数据（后端随表单一起返回），触发框一开始就显示得出文字
import { _component } from '@vue-tsx-pro/tsx';
import { Cascader, Field, Flex, Small } from '@vue-tsx-pro/ui';
import { reactive } from 'vue';

interface Unit {
  id: string;
  name: string;
  /** 后端标记的“有下级”：还没取回来时据此显示箭头 */
  hasChildren: boolean;
  children?: Unit[];
}

// 模拟后端：每个部门的下级
const server: Record<string, Unit[]> = {
  hq: [
    { id: 'rd', name: '研发中心', hasChildren: true },
    { id: 'mfg', name: '制造中心', hasChildren: true },
  ],
  rd: [
    { id: 'rd-fe', name: '前端组', hasChildren: false },
    { id: 'rd-be', name: '后端组', hasChildren: false },
  ],
  mfg: [
    { id: 'mfg-1', name: '一车间', hasChildren: false },
    { id: 'mfg-2', name: '二车间', hasChildren: false },
  ],
};

const fetchChildren = (id: string) =>
  new Promise<Unit[]>((resolve) =>
    setTimeout(() => resolve((server[id] ?? []).map((unit) => ({ ...unit }))), 600),
  );

export default _component(() => {
  const units = reactive<Unit[]>([
    {
      id: 'hq',
      name: '集团总部',
      hasChildren: true,
      // 已选的那一枝（总部、制造中心的下级）随表单返回；研发中心进入时再取
      children: [
        { id: 'rd', name: '研发中心', hasChildren: true },
        {
          id: 'mfg',
          name: '制造中心',
          hasChildren: true,
          children: [
            { id: 'mfg-1', name: '一车间', hasChildren: false },
            { id: 'mfg-2', name: '二车间', hasChildren: false },
          ],
        },
      ],
    },
  ]);
  let unit = _state<readonly string[] | null>(['hq', 'mfg', 'mfg-2']);
  let requests = _state(0);
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="所属部门" description="展开时才请求下级">
        <Cascader
          items={units}
          getKey={(item) => item.id}
          getLabel={(item) => item.name}
          getChildren={(item) => item.children}
          hasChildren={(item) => item.hasChildren}
          loadChildren={async (item) => {
            requests++;
            item.children = await fetchChildren(item.id);
          }}
          _value={_bind(unit)}
        />
      </Field>
      <Small tone="muted">已请求 {requests} 次</Small>
    </Flex>
  );
});
