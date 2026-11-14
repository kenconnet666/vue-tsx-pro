// 放进原生表单：name 用隐藏的 input 提交选中的值（编号，不是显示的名称）；filter 换匹配方式——按编号或名称；
// showToggle 关掉展开按钮（选项少、主要靠输入时）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Code, Combobox, Field, Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';

interface Material {
  code: string;
  name: string;
  spec: string;
}

const materials: Material[] = [
  { code: 'B-6204', name: '深沟球轴承', spec: '20 × 47 × 14' },
  { code: 'B-6205', name: '深沟球轴承', spec: '25 × 52 × 15' },
  { code: 'F-M8-30', name: '六角螺栓', spec: 'M8 × 30，8.8 级' },
  { code: 'S-OR-25', name: 'O 形密封圈', spec: '内径 25，线径 2.65' },
  { code: 'H-V-10', name: '液压阀组', spec: '10 通径，24 V' },
];
const units = ['件', '套', '箱', '千克'];

export default _component(() => {
  let material = _state<string | null>(null);
  let unit = _state<string | null>('件');
  let tried = _state(false);
  let submitted = _state('');

  function onSubmit(event: Event) {
    event.preventDefault();
    tried = true;
    if (!material) return;
    submitted = JSON.stringify(
      Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)),
    );
  }

  return () => (
    <form novalidate onSubmit={onSubmit}>
      <Flex direction="column" gap="md">
        <Field
          label="物料"
          required
          description="按编号或名称搜：输入 6204、螺栓 都行"
          error={tried && !material ? '请选择物料' : undefined}
        >
          <Combobox
            _value={material}
            items={materials}
            toOption={(item) => ({
              value: item.code,
              label: `${item.name} ${item.spec}`,
              description: item.code,
            })}
            filter={(item, query) =>
              item.code.toLowerCase().includes(query.toLowerCase()) || item.name.includes(query)
            }
            name="material"
            clearable
            placeholder="编号或名称"
          />
        </Field>
        <Field label="单位">
          <Combobox _value={unit} items={units} name="unit" showToggle={false} />
        </Field>
        <Flex align="center" gap="sm" wrap>
          <Button type="submit" size="sm">
            提交
          </Button>
          <Small tone="muted" aria-live="polite">
            {submitted ? (
              <>
                表单提交的是值：<Code>{submitted}</Code>
              </>
            ) : (
              '还没提交'
            )}
          </Small>
        </Flex>
      </Flex>
    </form>
  );
});
