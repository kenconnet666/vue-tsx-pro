// 按钮配色：取色器平铺在页面上，右边实时预览按钮，并算白字在这个底色上的对比度（AA 要 4.5:1）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Badge, ColorPicker, contrastRatio, Flex, Small, Text } from '@zerodep-dev/vue-tsx-pro-ui';

const presets = [
  '#3e63dd',
  '#6e56cf',
  '#12a594',
  '#30a46c',
  '#e5484d',
  '#f76b15',
  '#ffc53d',
  '#1c2024',
];

const styles = css.create({
  button: {
    paddingBlock: '0.5em',
    paddingInline: '1.25em',
    borderRadius: '_md',
    color: '#ffffff',
    fontWeight: '_medium',
  },
});
const colorStyles = css.create({ fill: (color: string) => ({ backgroundColor: color }) });

export default _component(() => {
  let color = _state('#3e63dd');
  return () => {
    const ratio = contrastRatio('#ffffff', color);
    return (
      <Flex gap="xl" wrap align="start">
        <ColorPicker _value={color} presets={presets} />
        <Flex direction="column" gap="sm" align="start">
          <span {...css.attrs(styles.button, colorStyles.fill(color))}>立即购买</span>
          <Text mono>{color}</Text>
          <Flex align="center" gap="xs">
            <Small tone="muted">白字对比度 {ratio.toFixed(2)}:1</Small>
            <Badge tone={ratio >= 4.5 ? 'success' : 'danger'} size="xs">
              {ratio >= 4.5 ? '达到 AA' : '不够'}
            </Badge>
          </Flex>
        </Flex>
      </Flex>
    );
  };
});
