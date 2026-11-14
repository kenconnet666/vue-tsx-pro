// 搜索框：_value 每敲一个字都更新（本地过滤用它）；onSearch 只在停手、回车、清空时调用（发请求用它）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, List, ListItem, SearchField, Small } from '@zerodep-dev/vue-tsx-pro-ui';

const parts = ['显示器支架', '支架底座', '铰链盖板', '夹持环', '加强筋', '防尘罩'];

export default _component(() => {
  let keyword = _state('');
  let requests = _state<string[]>([]);
  return () => {
    const shown = parts.filter((part) => part.includes(keyword.trim()));
    return (
      <Flex direction="column" gap="md">
        <SearchField
          _value={keyword}
          placeholder="搜索零件"
          aria-label="搜索零件"
          onSearch={(text) => (requests = [...requests.slice(-2), text || '（清空）'])}
        />
        <List>
          {shown.map((part) => (
            <ListItem key={part}>{part}</ListItem>
          ))}
        </List>
        <Small tone="muted">
          列表跟着每个字过滤；onSearch 只在停手 300ms、回车、清空时调用，最近几次：
          {requests.length ? requests.join('、') : '还没有'}
        </Small>
      </Flex>
    );
  };
});
