// 调整水印：文字或图片、角度、间距、字号、颜色
import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  ColorField,
  Field,
  Flex,
  Grid,
  Slider,
  Text,
  TextField,
  ToggleGroup,
  ToggleItem,
  Watermark,
} from '@vue-tsx-pro/ui';

// 示例自带的标志图（data URL，不跨域）
const logo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect x="1" y="1" width="118" height="38" rx="8" fill="none" stroke="#6366f1" stroke-width="2" opacity="0.2"/><text x="60" y="26" font-size="16" font-family="sans-serif" text-anchor="middle" fill="#6366f1" opacity="0.2">ACME</text></svg>',
)}`;

export default _component(() => {
  let kind = _state('text');
  let text = _state('仅供内部评审');
  let rotate = _state(-22);
  let gap = _state(120);
  let fontSize = _state(14);
  let color = _state('#80808033');
  return () => (
    <Grid minItemWidth="18rem" gap="lg">
      <Flex direction="column" gap="md">
        <ToggleGroup _value={_bind(kind)} size="sm" required aria-label="水印内容">
          <ToggleItem value="text">文字</ToggleItem>
          <ToggleItem value="image">图片</ToggleItem>
        </ToggleGroup>
        {kind === 'text' && (
          <>
            <Field label="文字">
              <TextField _value={_bind(text)} />
            </Field>
            <Field label={`字号：${fontSize}px`}>
              <Slider _value={_bind(fontSize)} min={10} max={28} />
            </Field>
            <Field label="颜色">
              <ColorField _value={_bind(color)} />
            </Field>
          </>
        )}
        <Field label={`角度：${rotate}°`}>
          <Slider _value={_bind(rotate)} min={-90} max={90} />
        </Field>
        <Field label={`间距：${gap}px`}>
          <Slider _value={_bind(gap)} min={40} max={240} step={10} />
        </Field>
      </Flex>
      <Watermark
        content={text}
        image={kind === 'image' ? logo : undefined}
        rotate={rotate}
        gap={[gap, Math.round(gap * 0.8)]}
        fontSize={fontSize}
        color={color}
      >
        <Card style={{ height: '100%', minHeight: '16rem' }}>
          <Flex direction="column" gap="sm">
            <Text weight="semibold">供应商评审纪要</Text>
            <Text size="sm" tone="muted">
              参会：采购部、质量部、生产部。结论：远山精密进入 A 类名录，海川液压整改后复审。
            </Text>
            <Text size="sm" tone="muted">
              下次评审：11 月第二周。整改清单见附件，责任人按清单跟进，周五前反馈进度。
            </Text>
          </Flex>
        </Card>
      </Watermark>
    </Grid>
  );
});
