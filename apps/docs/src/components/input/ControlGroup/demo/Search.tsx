// 搜索范围 + 关键词 + 搜索；协议 + 域名 + 复制；竖排的地址
import { Search as SearchIcon } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  ControlGroup,
  CopyButton,
  Field,
  Flex,
  Select,
  Small,
  TextField,
} from '@zerodep-dev/vue-tsx-pro-ui';

const scopes = [
  { value: 'all', label: '全部' },
  { value: 'title', label: '标题' },
  { value: 'owner', label: '负责人' },
];

export default _component(() => {
  let scope = _state('all');
  let keyword = _state('');
  let searched = _state('');
  let protocol = _state('https://');
  let host = _state('hooks.example.com');

  return () => (
    <Flex direction="column" gap="lg">
      <form
        role="search"
        onSubmit={(event: Event) => {
          event.preventDefault();
          searched = keyword
            ? `在“${scopes.find((item) => item.value === scope)!.label}”里搜索：${keyword}`
            : '';
        }}
      >
        <ControlGroup aria-label="搜索任务">
          <Select items={scopes} _value={scope} aria-label="搜索范围" />
          <TextField
            _value={keyword}
            icon={SearchIcon}
            placeholder="任务名称、编号或负责人"
            aria-label="关键词"
          />
          <Button type="submit">搜索</Button>
        </ControlGroup>
      </form>
      {searched && (
        <Small tone="muted" aria-live="polite">
          {searched}
        </Small>
      )}
      <Field label="回调地址">
        <ControlGroup aria-label="回调地址">
          <Select items={['https://', 'http://']} _value={protocol} aria-label="协议" />
          <TextField _value={host} aria-label="域名" />
          <CopyButton value={`${protocol}${host}`} variant="outline" aria-label="复制地址" />
        </ControlGroup>
      </Field>
      <Field label="收货地址" description='orientation="vertical"：上下相连'>
        <ControlGroup orientation="vertical" aria-label="收货地址">
          <TextField _value="浙江省杭州市西湖区" aria-label="省市区" />
          <TextField _value="文三路 90 号 3 幢 501" aria-label="详细地址" />
        </ControlGroup>
      </Field>
    </Flex>
  );
});
