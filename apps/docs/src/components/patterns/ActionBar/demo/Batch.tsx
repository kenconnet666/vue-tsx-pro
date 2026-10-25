// 批量操作：列表下面一行（sticky={false}，不随滚动贴底），起始边是已选几项，选了才能操作
import { CheckCheck, Undo2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Button, Card, Checkbox, CheckboxGroup, Flex, Small } from '@vue-tsx-pro/ui';
import { ActionBar } from '@vue-tsx-pro/ui/patterns';

const styles = css.create({
  list: { padding: '_lg' },
});

const ITEMS = [
  { id: 'PO-2026-0187', title: '显示器支架改为一体成型', due: '剩 2 个工作日' },
  { id: 'PO-2026-0192', title: '包装胶带换国产料号', due: '今天到期' },
  { id: 'PO-2026-0203', title: '线束卡箍合并规格', due: '剩 5 个工作日' },
  { id: 'PO-2026-0211', title: '货架紧固件减量', due: '剩 9 个工作日' },
];

export default _component(() => {
  let selected = _state<string[]>([]);
  let done = _state('');

  const act = (verb: string) => {
    done = `已${verb} ${selected.length} 项：${selected.join('、')}`;
    selected = [];
  };

  return () => (
    <Card padding="none">
      <CheckboxGroup _value={selected} aria-label="待认领的建议">
        <Flex direction="column" gap="sm" sx={styles.list}>
          {ITEMS.map((item) => (
            <Checkbox key={item.id} value={item.id}>
              <Flex gap="sm" align="baseline" wrap>
                {item.title}
                <Small tone="muted">
                  {item.id} · {item.due}
                </Small>
              </Flex>
            </Checkbox>
          ))}
        </Flex>
      </CheckboxGroup>
      <ActionBar
        sticky={false}
        start={selected.length ? `已选 ${selected.length} 项` : done || '勾选要处理的建议'}
      >
        <Button
          variant="outline"
          tone="danger"
          icon={Undo2}
          disabled={!selected.length}
          onClick={() => act('退回')}
        >
          退回
        </Button>
        <Button icon={CheckCheck} disabled={!selected.length} onClick={() => act('认领')}>
          认领
        </Button>
      </ActionBar>
    </Card>
  );
});
