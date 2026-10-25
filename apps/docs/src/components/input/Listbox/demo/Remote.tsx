// 远程搜索：loading 时没有选项显示骨架行、有选项时顶部显示进度条；没有结果时显示 empty；
// onPick 在每次点选时调用（再点已选的那项也算），适合“选中即执行”
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Card,
  Empty,
  Flex,
  Listbox,
  Small,
  TextField,
  type ListboxOption,
} from '@vue-tsx-pro/ui';
import { onBeforeUnmount, watch } from 'vue';

const people: ListboxOption[] = [
  '林小满',
  '周一航',
  '陈默',
  '许悠',
  '王晴',
  '赵子墨',
  '孙可',
  '李想',
].map((name) => ({ value: name, label: name }));

export default _component(() => {
  let query = _state('');
  let loading = _state(false);
  let results = _state<ListboxOption[]>(people);
  let picked = _state<string | null>(null);
  let lastPick = _state('');
  let timer: ReturnType<typeof setTimeout> | undefined;

  // 模拟接口：输入停下 600ms 后返回
  watch(
    () => query,
    (text) => {
      loading = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        results = people.filter((person) => person.label.includes(text.trim()));
        loading = false;
      }, 600);
    },
  );
  onBeforeUnmount(() => clearTimeout(timer));

  return () => (
    <Flex direction="column" gap="sm">
      <Card padding="sm">
        <Flex direction="column" gap="xs">
          <TextField
            _value={_bind(query)}
            icon={Search}
            variant="soft"
            placeholder="搜索成员"
            aria-label="搜索成员"
          />
          <Listbox
            aria-label="成员"
            items={results}
            _value={_bind(picked)}
            loading={loading}
            onPick={(value) => (lastPick = `${value}（${new Date().toLocaleTimeString()}）`)}
            empty={
              <Empty title="没有找到" description={`没有名字含“${query}”的成员`} size="sm">
                <Button size="sm" variant="soft" onClick={() => (query = '')}>
                  清空搜索
                </Button>
              </Empty>
            }
          />
        </Flex>
      </Card>
      <Small tone="muted">最后点选：{lastPick || '无'}</Small>
    </Flex>
  );
});
