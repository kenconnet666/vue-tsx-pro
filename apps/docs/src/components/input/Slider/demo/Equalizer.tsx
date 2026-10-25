import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, Slider, Small, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';

const bands = ['60', '150', '400', '1k', '2.4k', '6k', '15k'];
const presets = {
  flat: [0, 0, 0, 0, 0, 0, 0],
  bass: [8, 6, 3, 0, -1, -2, -2],
  vocal: [-2, -1, 2, 5, 4, 1, 0],
  bright: [-1, -1, 0, 1, 3, 6, 8],
} as const;
type Preset = keyof typeof presets;

export default _component(() => {
  let preset = _state<Preset>('bass');
  let gains = _state<number[]>([...presets.bass]);
  return () => (
    <Card>
      <Flex direction="column" gap="lg">
        <ToggleGroup
          _value={preset}
          onUpdate:_value={(next: Preset) => {
            preset = next;
            gains = [...presets[next]];
          }}
          required
          size="sm"
          aria-label="预设"
        >
          <ToggleItem value="flat">平直</ToggleItem>
          <ToggleItem value="bass">低音</ToggleItem>
          <ToggleItem value="vocal">人声</ToggleItem>
          <ToggleItem value="bright">明亮</ToggleItem>
        </ToggleGroup>
        <Flex justify="between" gap="sm">
          {bands.map((band, index) => (
            <Flex key={band} direction="column" align="center" gap="xs">
              <Slider
                orientation="vertical"
                _value={gains[index]!}
                onUpdate:_value={(next) =>
                  (gains = gains.map((gain, i) => (i === index ? next : gain)))
                }
                min={-12}
                max={12}
                size="sm"
                valueText={(value) => `${value > 0 ? '+' : ''}${value} dB`}
                aria-label={`${band} Hz`}
              />
              <Small tone="muted">{band}</Small>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
});
