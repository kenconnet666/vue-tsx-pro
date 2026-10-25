import { ArrowDownUp, Eye } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Flex,
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  Small,
} from '@vue-tsx-pro/ui';

const sorts = { name: '名称', modified: '修改时间', size: '大小' } as const;
type Sort = keyof typeof sorts;

export default _component(() => {
  let grid = _state(true);
  let hidden = _state(false);
  let extensions = _state(true);
  let sort = _state<Sort>('modified');
  let order = _state('desc');
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Flex gap="sm">
        <Menu
          trigger={(props) => (
            <Button {...props} variant="outline" tone="neutral" icon={Eye}>
              显示
            </Button>
          )}
        >
          <MenuGroup label="视图">
            <MenuCheckboxItem _checked={grid}>网格视图</MenuCheckboxItem>
            <MenuCheckboxItem _checked={hidden}>显示隐藏文件</MenuCheckboxItem>
            <MenuCheckboxItem _checked={extensions}>显示扩展名</MenuCheckboxItem>
          </MenuGroup>
        </Menu>
        <Menu
          trigger={(props) => (
            <Button {...props} variant="outline" tone="neutral" icon={ArrowDownUp}>
              排序：{sorts[sort]}
            </Button>
          )}
        >
          <MenuRadioGroup _value={sort} label="排序依据">
            {(Object.keys(sorts) as Sort[]).map((key) => (
              <MenuRadioItem key={key} value={key}>
                {sorts[key]}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
          <MenuRadioGroup _value={order} label="顺序">
            <MenuRadioItem value="asc">升序</MenuRadioItem>
            <MenuRadioItem value="desc">降序</MenuRadioItem>
          </MenuRadioGroup>
        </Menu>
      </Flex>
      <Small tone="muted">
        {grid ? '网格' : '列表'} · {hidden ? '含' : '不含'}隐藏文件 · {extensions ? '显示' : '隐藏'}
        扩展名 · 按{sorts[sort]}
        {order === 'asc' ? '升序' : '降序'}
      </Small>
    </Flex>
  );
});
