// 供应商档案：同一份详情（columns="auto"）放在窄的卡片与宽的区域里，各自按宽度排成一栏、两栏或三栏；
// 拖动右边的手柄看栏数随宽度变化。信用代码、银行账号、地址可以一键复制（copyable），地址复制的是完整写法（copyText）
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Badge, Card, Descriptions, Flex, Small, type DescriptionItem } from '@vue-tsx-pro/ui';

const items: DescriptionItem[] = [
  { label: '供应商', value: '华辰精密机械有限公司' },
  { label: '信用代码', value: '91310115MA1K4QXX2R', copyable: true },
  { label: '等级', value: <Badge tone="success">A 级</Badge> },
  { label: '联系人', value: '林小满 · 138 0013 8000' },
  { label: '开户行', value: '招商银行上海张江支行' },
  { label: '银行账号', value: '6214 8301 2345 6789', copyable: true, copyText: '6214830123456789' },
  {
    label: '地址',
    value: '上海浦东张江高科园区 88 号',
    copyable: true,
    copyText: '上海市浦东新区张江高科技园区碧波路 88 号 3 号楼',
    span: 3,
  },
];

const styles = css.create({
  narrow: { width: '20rem', flexShrink: 0 },
  // 可以拖宽窄的区域：原生的 resize 手柄
  resizable: {
    resize: 'horizontal',
    overflow: 'auto',
    minWidth: '16rem',
    maxWidth: '100%',
    width: '40rem',
    padding: '1rem',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'color-mix(in srgb, currentColor 25%, transparent)',
    borderRadius: '0.5rem',
  },
});

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Flex gap="lg" wrap align="start">
      <Card sx={styles.narrow}>
        <Descriptions title="抽屉里（窄）" items={items} columns="auto" minItemWidth={220} />
      </Card>
      <Flex direction="column" gap="xs">
        <div {...css.attrs(styles.resizable)}>
          <Descriptions
            title="详情页（拖动右下角调宽）"
            items={items}
            columns="auto"
            minItemWidth={220}
          />
        </div>
        <Small tone="muted">每栏不窄于 220px，最多 4 栏；地址跨 3 栏，栏数少时按栏数封顶</Small>
      </Flex>
    </Flex>
  </Flex>
));
