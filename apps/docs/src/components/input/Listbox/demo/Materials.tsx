// 网格：按样子挑材质。layout="grid" 时每格不窄于 minItemWidth，放得下几列排几列（拖窄示例框看列数变化）；
// 分组的第一项另起一行，←→ 前后一项、↑↓ 上下一行的同一列，已选的描一圈品牌色。格子的内容是渲染函数画的色块和名字
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Flex, Listbox, Small } from '@zerodep-dev/vue-tsx-pro-ui';

interface Material {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  /** 色块的渐变：亮处、暗处 */
  readonly light: string;
  readonly dark: string;
}

const materials: Material[] = [
  { id: 'gold', name: '金', kind: '金属', light: '#ffe9a3', dark: '#9a6b12' },
  { id: 'copper', name: '铜', kind: '金属', light: '#ffc6a3', dark: '#8a4220' },
  { id: 'chrome', name: '铬', kind: '金属', light: '#ffffff', dark: '#5b6470' },
  { id: 'steel', name: '拉丝钢', kind: '金属', light: '#dfe3e8', dark: '#6c737c' },
  { id: 'paint', name: '车漆', kind: '涂层', light: '#ff8a8a', dark: '#8c0d0d' },
  { id: 'plastic', name: '亮面塑料', kind: '涂层', light: '#9fd8ff', dark: '#1867a8' },
  { id: 'rubber', name: '橡胶', kind: '涂层', light: '#5a5a5a', dark: '#111111' },
  { id: 'oak', name: '橡木', kind: '天然', light: '#e8b879', dark: '#7a4a1c' },
  { id: 'marble', name: '大理石', kind: '天然', light: '#ffffff', dark: '#bfc4c9' },
  { id: 'concrete', name: '混凝土', kind: '天然', light: '#d6d3cd', dark: '#8a867f' },
];

const styles = css.create({
  list: { width: '100%', maxWidth: '28rem', maxHeight: '18rem' },
  swatch: (light: string, dark: string) => ({
    width: '3em',
    height: '3em',
    borderRadius: '_full',
    backgroundImage: `radial-gradient(circle at 35% 30%, ${light}, ${dark})`,
  }),
});

export default _component(() => {
  let material = _state<string | null>('oak');
  return () => (
    <Flex direction="column" gap="sm">
      <Listbox
        items={materials}
        toOption={(item) => ({ value: item.id, label: item.name, group: item.kind })}
        layout="grid"
        minItemWidth="5.5em"
        _value={material}
        aria-label="材质"
        sx={styles.list}
      >
        {(item: Material) => (
          <>
            <span {...css.attrs(styles.swatch(item.light, item.dark))} />
            <Small>{item.name}</Small>
          </>
        )}
      </Listbox>
      <Small tone="muted">
        已选：{materials.find((item) => item.id === material)?.name ?? '无'}
      </Small>
    </Flex>
  );
});
