// 收货地址：省 / 市 / 区三级，只能选到区；可搜索（本站开了拼音匹配，试试“bj”“hz”），可清空
import { MapPin } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Cascader, Field, Flex, Grid, Small, Switch } from '@vue-tsx-pro/ui';

interface Region {
  code: string;
  name: string;
  children?: Region[];
}

const regions: Region[] = [
  {
    code: '330000',
    name: '浙江省',
    children: [
      {
        code: '330100',
        name: '杭州市',
        children: [
          { code: '330106', name: '西湖区' },
          { code: '330108', name: '滨江区' },
          { code: '330110', name: '余杭区' },
        ],
      },
      {
        code: '330200',
        name: '宁波市',
        children: [
          { code: '330212', name: '鄞州区' },
          { code: '330213', name: '奉化区' },
        ],
      },
    ],
  },
  {
    code: '320000',
    name: '江苏省',
    children: [
      {
        code: '320500',
        name: '苏州市',
        children: [
          { code: '320505', name: '虎丘区' },
          { code: '320506', name: '吴中区' },
          { code: '320508', name: '姑苏区' },
        ],
      },
      { code: '320100', name: '南京市', children: [{ code: '320106', name: '鼓楼区' }] },
    ],
  },
  {
    code: '110000',
    name: '北京市',
    children: [
      {
        code: '110100',
        name: '市辖区',
        children: [
          { code: '110105', name: '朝阳区' },
          { code: '110108', name: '海淀区' },
        ],
      },
    ],
  },
];

export default _component(() => {
  let address = _state<readonly string[] | null>(['330000', '330100', '330106']);
  let invoice = _state<readonly string[] | null>(null);
  let allLevels = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Switch _checked={_bind(allLevels)}>显示整条路径</Switch>
      <Grid minItemWidth="17rem" gap="md">
        <Field label="收货地址">
          <Cascader
            items={regions}
            getKey={(region) => region.code}
            getLabel={(region) => region.name}
            getChildren={(region) => region.children}
            _value={_bind(address)}
            showAllLevels={allLevels}
            icon={MapPin}
            searchable
            clearable
          />
        </Field>
        <Field label="开票地区">
          <Cascader
            items={regions}
            getKey={(region) => region.code}
            getLabel={(region) => region.name}
            getChildren={(region) => region.children}
            _value={_bind(invoice)}
            showAllLevels={allLevels}
            placeholder="省 / 市 / 区"
            searchable
          />
        </Field>
      </Grid>
      <Small tone="muted">value：{JSON.stringify(address)}</Small>
    </Flex>
  );
});
