import { RefreshCw } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Flex, IconButton, SlideVerify, Small, type SlideVerifyResult } from '@vue-tsx-pro/ui';

type Status = 'idle' | 'verifying' | 'success' | 'error';

const PIECE = 44;

const styles = stylex.create({
  // 画面：服务端生成的背景图；这里用渐变代替
  picture: {
    position: 'relative',
    height: '9rem',
    overflow: 'hidden',
    borderRadius: '_md',
    backgroundImage: 'linear-gradient(135deg, oklch(72% 0.12 250), oklch(60% 0.15 320))',
  },
  piece: {
    position: 'absolute',
    top: '2.5rem',
    width: `${PIECE}px`,
    height: `${PIECE}px`,
    borderRadius: '_sm',
  },
  hole: {
    backgroundColor: 'rgb(0 0 0 / 0.35)',
    boxShadow: 'inset 0 0 0 2px rgb(255 255 255 / 0.6)',
  },
  block: {
    backgroundImage: 'linear-gradient(135deg, oklch(80% 0.12 250), oklch(70% 0.15 320))',
    boxShadow: '0 2px 8px rgb(0 0 0 / 0.35), inset 0 0 0 2px rgb(255 255 255 / 0.9)',
  },
});

// 缺口与拼图块的位置：0–1 换算成画面里的 left
const positionStyles = stylex.create({
  left: (position: number) => ({ left: `calc((100% - ${PIECE}px) * ${position})` }),
});

const randomTarget = () => 0.35 + Math.random() * 0.5;

export default _component(() => {
  let target = _state(randomTarget());
  let position = _state(0);
  let status = _state<Status>('idle');

  // 服务端按缺口位置判定：误差 4% 以内算对
  const verify = (result: SlideVerifyResult) => {
    status = 'verifying';
    setTimeout(
      () => (status = Math.abs(result.position - target) < 0.04 ? 'success' : 'error'),
      500,
    );
  };
  const reset = () => {
    target = randomTarget();
    status = 'idle';
  };

  return () => (
    <Flex direction="column" gap="sm">
      <div {...stylex.attrs(styles.picture)}>
        <div {...stylex.attrs(styles.piece, styles.hole, positionStyles.left(target))} />
        <div {...stylex.attrs(styles.piece, styles.block, positionStyles.left(position))} />
      </div>
      <SlideVerify
        target="free"
        position={_bind(position)}
        status={status}
        hint="拖动滑块，把方块放进缺口"
        onRelease={verify}
      />
      <Flex align="center" justify="between">
        <Small tone="muted">
          {status === 'success'
            ? '验证通过'
            : status === 'error'
              ? '没对准，换一张再试'
              : '误差 4% 以内算对'}
        </Small>
        <IconButton icon={RefreshCw} aria-label="换一张" onClick={reset} />
      </Flex>
    </Flex>
  );
});
