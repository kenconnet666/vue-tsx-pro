// 粘贴 JSON 看结构：解析出错时提示位置；“生成 5000 条”看大数据下的虚拟滚动与搜索
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Field, Flex, JsonViewer, Textarea } from '@zerodep-dev/vue-tsx-pro-ui';

const initial = JSON.stringify(
  {
    name: 'vue-tsx-pro',
    private: true,
    workspaces: ['packages/*', 'apps/*'],
    engines: { node: '>=22' },
  },
  null,
  2,
);

const big = () =>
  JSON.stringify(
    Array.from({ length: 5000 }, (_, index) => ({
      id: index + 1,
      level: ['info', 'warn', 'error'][index % 3],
      message: `job-${index % 37} finished in ${(index * 7) % 1000} ms`,
    })),
  );

export default _component(() => {
  let text = _state(initial);
  const parsed = () => {
    try {
      return { value: JSON.parse(text) as unknown };
    } catch (error) {
      return { error: (error as Error).message };
    }
  };
  return () => {
    const result = parsed();
    return (
      <Flex direction="column" gap="sm">
        <Field label="JSON" error={result.error}>
          <Textarea _value={text} rows={5} spellcheck={false} />
        </Field>
        <Flex gap="xs">
          <Button size="sm" variant="soft" onClick={() => (text = big())}>
            生成 5000 条
          </Button>
          <Button size="sm" variant="ghost" tone="neutral" onClick={() => (text = initial)}>
            还原
          </Button>
        </Flex>
        {'value' in result && (
          <JsonViewer value={result.value} maxHeight="18rem" aria-label="解析结果" />
        )}
      </Flex>
    );
  };
});
