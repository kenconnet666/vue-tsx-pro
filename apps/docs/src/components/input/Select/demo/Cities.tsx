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

// 假的远程搜索：300ms 后返回包含关键词的用户名
const search = (keyword: string) =>
  new Promise<string[]>((resolve) =>
    setTimeout(() => resolve(users.filter((user) => user.includes(keyword.toLowerCase()))), 300),
  );

export default _component(() => {
  let city = _state<string | undefined>();
  let keyword = _state('');
  let results = _state<string[]>([]);
  let searching = _state(false);
  let user = _state<string | undefined>();

  let latest = 0;
  const onKeyword = async (next: string) => {
    keyword = next;
    const id = ++latest;
    if (!next) return void (results = []);
    searching = true;
    const found = await search(next);
    // 只用最后一次输入的结果：先发的请求后回来时丢掉
    if (id !== latest) return;
    results = found;
    searching = false;
  };

  return () => (
    <Flex direction="column" gap="md">
      <Field label="城市" description="本地过滤：输入“州”试试">
        <Combobox items={cities} value={_bind(city)} clearable placeholder="输入或选择" />
      </Field>
      <Field label="成员" description="远程搜索：filter={false}，按 inputValue 换数据">
        <Combobox
          items={results}
          filter={false}
          loading={searching}
          inputValue={_bind(() => keyword, onKeyword)}
          value={_bind(user)}
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
