// /base 页上的动效演示：Anime.js 取主题时长的弹簧、数字滚动（AnimatedNumber）、描线（Result）、布局动画（useLayoutAnimation）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  AnimatedNumber,
  Button,
  Flex,
  Result,
  Text,
  themeTransition,
  useLayoutAnimation,
  t,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { animate } from 'animejs';

const styles = css.create({
  section: { display: 'grid', gap: '_md' },
  track: {
    // 小球的宽度加上移动的距离
    width: `calc(${t.sizes.control} + 120px)`,
    padding: '_xs',
    borderRadius: '_full',
    backgroundColor: '_fill',
  },
  ball: {
    width: '_control',
    height: '_control',
    borderRadius: '_full',
    backgroundColor: '_accent',
  },
  chip: {
    display: 'grid',
    placeItems: 'center',
    width: '_control',
    height: '_control',
    borderRadius: '_md',
    backgroundColor: '_fill',
    color: '_text',
    fontVariantNumeric: 'tabular-nums',
  },
});

/** 动效演示 */
export const MotionDemo = _component(() => {
  let ball = _state.raw<HTMLElement | null>(null);
  let moved = false;
  let chips = _state([1, 2, 3, 4, 5, 6]);
  let chipList = _state.raw<HTMLElement | null>(null);
  let nextChip = 7;
  // 换 key 重新挂载：Result 的图标再画一遍
  let resultKey = _state(0);
  let revenue = _state(12800);
  let change = _state(0.042);
  const layout = useLayoutAnimation(() => chipList, { children: '[data-chip]' });

  // JS 动画：Anime.js 的 animate 加上主题的弹簧时长；减少动态效果时立即到位
  function move() {
    moved = !moved;
    void animate(ball!, {
      x: moved ? 120 : 0,
      ...themeTransition(ball!, { duration: 'lg', bounce: 0.3 }),
    });
  }

  function updateStats() {
    revenue = Math.round(revenue + (Math.random() - 0.3) * 5000);
    change = Math.round((Math.random() - 0.5) * 200) / 1000;
  }

  const shuffle = () =>
    void layout.change(() => (chips = [...chips].sort(() => Math.random() - 0.5)));
  const add = () => void layout.change(() => (chips = [nextChip++, ...chips]));
  const removeFirst = () => void layout.change(() => (chips = chips.slice(1)));

  return () => (
    <div {...css.attrs(styles.section)}>
      <Flex gap="md" align="center" wrap>
        <Button variant="outline" class="move-ball" onClick={move}>
          移动
        </Button>
        <div {...css.attrs(styles.track)}>
          <div class="ball" ref={_toRef(ball)} {...css.attrs(styles.ball)} />
        </div>
      </Flex>
      <Flex gap="md" align="center" wrap>
        <Button variant="outline" class="stats-update" onClick={updateStats}>
          更新数据
        </Button>
        <Text size="xl" weight="semibold">
          <AnimatedNumber class="revenue-demo" value={revenue} format={{ style: 'currency' }} />
        </Text>
        <AnimatedNumber
          value={change}
          format={{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }}
          trend
          prefix="较上周 "
        />
      </Flex>
      <Flex gap="sm" wrap>
        <Button variant="outline" class="layout-shuffle" onClick={shuffle}>
          打乱
        </Button>
        <Button variant="outline" class="layout-add" onClick={add}>
          加一项
        </Button>
        <Button variant="outline" onClick={removeFirst}>
          去掉第一项
        </Button>
      </Flex>
      <Flex gap="sm" wrap class="layout-demo" ref={_toRef(chipList)}>
        {chips.map((chip) => (
          <span key={chip} data-chip {...css.attrs(styles.chip)}>
            {chip}
          </span>
        ))}
      </Flex>
      <Flex gap="sm" wrap>
        <Button variant="outline" class="result-replay" onClick={() => resultKey++}>
          重新描线
        </Button>
      </Flex>
      <Result
        key={resultKey}
        class="result-demo"
        title="提交成功"
        description="审核结果会通过邮件通知你。"
        action={<Button variant="soft">返回列表</Button>}
      />
    </div>
  );
});
