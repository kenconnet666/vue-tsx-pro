// 远程搜索：load 按搜索词请求，服务端返回命中的节点连同它们的上级，结果全部展开；
// items 放上已选节点的那一枝（编辑页从详情接口拿到），触发框一开始就有文字
import { _component } from '@vue-tsx-pro/tsx';
import { Code, Field, Flex, Small, TreeSelect } from '@vue-tsx-pro/ui';
import { orgs, type Org } from './orgs';

/** 只留命中的节点与它们的上级（裁掉没有命中的分枝） */
function prune(nodes: readonly Org[], hit: (org: Org) => boolean): Org[] {
  return nodes.flatMap((org) => {
    const children = prune(org.children ?? [], hit);
    if (!hit(org) && children.length === 0) return [];
    return [{ ...org, children: children.length ? children : undefined }];
  });
}

/** 假的搜索接口：400 ms 后返回；被后来的请求顶掉、弹层关上时中止 */
const searchOrgs = (query: string, signal: AbortSignal) =>
  new Promise<Org[]>((resolve, reject) => {
    const timer = setTimeout(
      () => resolve(query ? prune(orgs, (org) => org.name.includes(query)) : orgs),
      400,
    );
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

export default _component(() => {
  let org = _state<string | null>('cost-ledger');
  const selectedBranch = prune(orgs, (item) => item.id === 'cost-ledger');
  return () => (
    <Flex direction="column" gap="xs">
      <Field label="归口部门" description="打开后输入“团队”：服务端返回命中的节点与它们的上级">
        <TreeSelect
          load={searchOrgs}
          items={selectedBranch}
          getKey={(item) => item.id}
          getLabel={(item) => item.name}
          getChildren={(item) => item.children}
          searchable
          clearable
          _value={_bind(org)}
        />
      </Field>
      <Small tone="muted">
        值：<Code>{org ?? '—'}</Code>
      </Small>
    </Flex>
  );
});
