import { _component } from '@vue-tsx-pro/tsx';
import { Combobox, Field, Flex, Small } from '@vue-tsx-pro/ui';

const cities = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '南京',
  '苏州',
  '成都',
  '重庆',
  '武汉',
  '西安',
  '天津',
  '长沙',
  '郑州',
  '青岛',
  '厦门',
  '宁波',
  '合肥',
  '福州',
  '昆明',
  '大连',
  '沈阳',
  '哈尔滨',
  '济南',
  '无锡',
  '东莞',
  '佛山',
  '珠海',
  '南宁',
  '贵阳',
];

const users = [
  'zhouyihang',
  'linxiaoman',
  'chenmo',
  'xuyou',
  'wangqing',
  'zhaohaoran',
  'sunsiyuan',
  'liyutong',
];

// 假的远程搜索：300 ms 后返回包含关键词的用户名，被后来的请求顶掉时中止
const searchUsers = (keyword: string, signal: AbortSignal) =>
  new Promise<string[]>((resolve, reject) => {
    const timer = setTimeout(
      () => resolve(keyword ? users.filter((user) => user.includes(keyword.toLowerCase())) : []),
      300,
    );
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

export default _component(() => {
  let city = _state<string | null>(null);
  let keyword = _state('');
  let user = _state<string | null>(null);

  return () => (
    <Flex direction="column" gap="md">
      <Field label="城市" description="本地过滤：输入“州”试试">
        <Combobox items={cities} _value={_bind(city)} clearable placeholder="输入或选择" />
      </Field>
      <Field label="成员" description="远程搜索：load 在输入停下 300 ms 后请求，只采用最后一次">
        <Combobox
          load={searchUsers}
          _inputValue={_bind(keyword)}
          _value={_bind(user)}
          placeholder="输入用户名"
          empty={keyword ? '没有匹配的成员' : '输入关键词开始搜索'}
        />
      </Field>
      <Small tone="muted">
        城市：{city ?? '未选'} · 成员：{user ?? '未选'}
      </Small>
    </Flex>
  );
});
