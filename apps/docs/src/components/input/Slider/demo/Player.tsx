import { Sun, Volume1, Volume2, VolumeX } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, Icon, IconButton, Slider, Small } from '@vue-tsx-pro/ui';

const duration = 245;
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

export default _component(() => {
  let volume = _state(60);
  let muted = _state(false);
  let position = _state(72);
  let brightness = _state(0.8);
  return () => (
    <Card>
      <Flex direction="column" gap="lg">
        <Flex direction="column" gap="xs">
          <Slider
            _value={position}
            max={duration}
            valueText={(value) => `${clock(value)} / ${clock(duration)}`}
            aria-label="播放进度"
          />
          <Flex justify="between">
            <Small tone="muted">{clock(position)}</Small>
            <Small tone="muted">-{clock(duration - position)}</Small>
          </Flex>
        </Flex>
        <Flex align="center" gap="sm">
          <IconButton
            icon={muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2}
            aria-label={muted ? '取消静音' : '静音'}
            aria-pressed={muted}
            onClick={() => (muted = !muted)}
          />
          <Slider
            _value={muted ? 0 : volume}
            onUpdate:_value={(next) => {
              volume = next;
              muted = false;
            }}
            valueText={(value) => `音量 ${value}%`}
            aria-label="音量"
          />
        </Flex>
        <Flex align="center" gap="sm">
          <Icon icon={Sun} />
          <Slider
            _value={brightness}
            min={0}
            max={1}
            step={0.05}
            tone="warning"
            valueText={(value) => `${Math.round(value * 100)}%`}
            aria-label="亮度"
          />
        </Flex>
      </Flex>
    </Card>
  );
});
