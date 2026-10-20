import { _component } from '@vue-tsx-pro/tsx';
import { Code, Field, Flex, Small, ColorField } from '@vue-tsx-pro/ui';

export default _component(() => {
  let color = _state('#0ea5e9');
  let overlay = _state('#11182799');
  return () => (
    <Flex direction="column" gap="md">
      <Field
        label="任意格式"
        description="输入 rgb(255 99 71)、hsl(…)、颜色名（tomato）后回车或失焦，规范成 #hex 写回"
      >
        <ColorField value={_bind(color)} />
      </Field>
      <Small tone="muted">
        值：<Code>{color}</Code>
      </Small>
      <Field
        label="带透明度"
        description="#rrggbbaa；用原生取色器选色时透明度会去掉（它不支持透明度）"
      >
        <ColorField value={_bind(overlay)} />
      </Field>
      <Field label="只读" readonly>
        <ColorField value="#16a34a" />
      </Field>
    </Flex>
  );
});
