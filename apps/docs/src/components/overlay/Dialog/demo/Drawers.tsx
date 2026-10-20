import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Filter } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Checkbox,
  Drawer,
  Field,
  Flex,
  FlexList,
  Paragraph,
  Select,
  Slider,
  type DrawerSides,
} from '@vue-tsx-pro/ui';

const sides = [
  ['start', ArrowRight, '起始边'],
  ['end', ArrowLeft, '结束边'],
  ['top', ArrowDown, '顶部'],
  ['bottom', ArrowUp, '底部'],
] as const;

const brands = ['全部品牌', '云杉', '远山', '青禾', '潮汐'];

export default _component(() => {
  let side = _state<keyof DrawerSides>('end');
  let open = _state(false);
  let filtering = _state(false);
  let brand = _state('全部品牌');
  let price = _state(3000);
  let inStock = _state(true);

  return () => (
    <Flex direction="column" gap="md" align="start">
      <Flex gap="sm" wrap>
        {sides.map(([value, icon, label]) => (
          <Button
            key={value}
            variant="outline"
            tone="neutral"
            icon={icon}
            onClick={() => {
              side = value;
              open = true;
            }}
          >
            {label}
          </Button>
        ))}
      </Flex>
      <Button icon={Filter} onClick={() => (filtering = true)}>
        筛选商品
      </Button>
      <Drawer open={_bind(open)} side={side} title={`side="${side}"`}>
        <Paragraph>
          start / end 是逻辑方向：从右到左排版时左右互换。顶部、底部的抽屉高度随内容。
        </Paragraph>
      </Drawer>
      <Drawer
        open={_bind(filtering)}
        side="end"
        size="xs"
        title="筛选"
        footer={
          <>
            <Button variant="ghost" tone="neutral" onClick={() => (filtering = false)}>
              重置
            </Button>
            <Button onClick={() => (filtering = false)}>查看 128 件商品</Button>
          </>
        }
      >
        <FlexList direction="column" gap="xl">
          <li>
            <Field label="品牌">
              <Select items={brands} value={_bind(brand)} />
            </Field>
          </li>
          <li>
            <Field label={`价格上限：¥${price.toLocaleString()}`}>
              <Slider value={_bind(price)} min={100} max={10000} step={100} />
            </Field>
          </li>
          <li>
            <Checkbox checked={_bind(inStock)}>只看有货</Checkbox>
          </li>
        </FlexList>
      </Drawer>
    </Flex>
  );
});
