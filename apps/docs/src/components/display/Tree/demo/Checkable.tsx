import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Flex, Small, Tree } from '@zerodep-dev/vue-tsx-pro-ui';

interface Region {
  code: string;
  name: string;
  children?: Region[];
}

const regions: Region[] = [
  {
    code: 'east',
    name: '华东',
    children: [
      { code: 'sh', name: '上海' },
      {
        code: 'zj',
        name: '浙江',
        children: [
          { code: 'hz', name: '杭州' },
          { code: 'nb', name: '宁波' },
          { code: 'wz', name: '温州' },
        ],
      },
      {
        code: 'js',
        name: '江苏',
        children: [
          { code: 'nj', name: '南京' },
          { code: 'su', name: '苏州' },
        ],
      },
    ],
  },
  {
    code: 'south',
    name: '华南',
    children: [
      { code: 'gz', name: '广州' },
      { code: 'sz', name: '深圳' },
    ],
  },
];

const styles = css.create({ tree: { height: '17rem' } });

export default _component(() => {
  let expanded = _state(['east', 'zj']);
  let checked = _state(['sh', 'hz', 'nb']);
  return () => (
    <Card padding="sm">
      <Flex direction="column" gap="sm">
        <Tree
          items={regions}
          getKey={(region) => region.code}
          getLabel={(region) => region.name}
          getChildren={(region) => region.children}
          _expanded={expanded}
          checkable
          _checked={checked}
          aria-label="配送范围"
          sx={styles.tree}
        />
        <Small tone="muted">已勾选 {checked.length} 个节点</Small>
      </Flex>
    </Card>
  );
});
