// 可选中的标签：列表上方一排筛选条件，点一下选上、再点取消；一排放在 role="group" 加名称的容器里
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Small, Tag } from '@zerodep-dev/vue-tsx-pro-ui';

const options = ['加急', '待我审批', '已逾期', '本周到期', '有附件'];

export default _component(() => {
  let picked = _state<Record<string, boolean>>({ 加急: true, 已逾期: true });
  return () => {
    const active = options.filter((option) => picked[option]);
    return (
      <Flex direction="column" gap="sm">
        <Flex role="group" aria-label="筛选" gap="xs" wrap>
          {options.map((option) => (
            <Tag
              key={option}
              _selected={picked[option] ?? false}
              onUpdate:_selected={(next: boolean) => (picked = { ...picked, [option]: next })}
            >
              {option}
            </Tag>
          ))}
        </Flex>
        <Small tone="muted">已选：{active.join('、') || '（无）'}</Small>
      </Flex>
    );
  };
});
