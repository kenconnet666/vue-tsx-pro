import { Bug, Play, Redo2, Save, Square, Undo2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  Flex,
  IconButton,
  Select,
  Separator,
  StatusDot,
  Strong,
  Text,
  Toolbar,
} from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({
  stage: { minHeight: '12rem', display: 'grid', placeItems: 'center', backgroundColor: '_fill' },
  target: { width: '9rem' },
});

export default _component(() => {
  let running = _state(false);
  let target = _state('Chrome');
  let edits = _state(3);
  return () => (
    <Card padding="none" variant="outline">
      <Toolbar docked="top" variant="surface" aria-label="主工具栏">
        <Strong>场景编辑器</Strong>
        <Text tone="muted" truncate>
          levels/forest.scene
        </Text>
        <Separator orientation="vertical" />
        <IconButton
          icon={Undo2}
          aria-label="撤销"
          size="sm"
          disabled={edits === 0}
          onClick={() => edits--}
        />
        <IconButton icon={Redo2} aria-label="重做" size="sm" />
        <IconButton icon={Save} aria-label="保存" size="sm" onClick={() => (edits = 0)} />
        <Flex grow />
        <Select
          items={['Chrome', 'Firefox', 'Safari']}
          _value={target}
          size="sm"
          aria-label="运行目标"
          propsRoot={{ sx: styles.target }}
        />
        <IconButton
          icon={running ? Square : Play}
          aria-label={running ? '停止' : '运行'}
          size="sm"
          onClick={() => (running = !running)}
        />
        <IconButton icon={Bug} aria-label="调试" size="sm" />
      </Toolbar>
      <div {...css.attrs(styles.stage)}>
        <Text tone="muted">{running ? `在 ${target} 里运行中…` : '视口'}</Text>
      </div>
      <Toolbar docked="bottom" variant="surface" size="sm" gap="sm" aria-label="状态栏">
        <StatusDot tone={running ? 'success' : 'neutral'} />
        <Text tone="muted" truncate>
          {edits ? `${edits} 处修改没保存` : '都保存了'}
        </Text>
        <Flex grow />
        <Text tone="muted" numeric>
          60 fps
        </Text>
      </Toolbar>
    </Card>
  );
});
