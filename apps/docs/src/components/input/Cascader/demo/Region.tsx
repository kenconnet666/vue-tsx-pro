// 收货地址：全国省 / 市 / 区三级（ui/area 子路径的数据），只能选到区；可搜索（本站开了拼音匹配，试试“xhq”“hz”），可清空。
// 开票地区只到市（depth: 2）
import { MapPin } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Cascader, Field, Flex, Grid, Small, Switch } from '@zerodep-dev/vue-tsx-pro-ui';
import { areaAccessors, areaNames, areaTree } from '@zerodep-dev/vue-tsx-pro-ui/area';

export default _component(() => {
  let address = _state<readonly string[] | null>(['330000', '330100', '330106']);
  let invoice = _state<readonly string[] | null>(null);
  let allLevels = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Switch _checked={allLevels}>显示整条路径</Switch>
      <Grid minItemWidth="17rem" gap="md">
        <Field label="收货地址">
          <Cascader
            items={areaTree()}
            {...areaAccessors}
            _value={address}
            showAllLevels={allLevels}
            icon={MapPin}
            searchable
            clearable
          />
        </Field>
        <Field label="开票地区">
          <Cascader
            items={areaTree({ depth: 2 })}
            {...areaAccessors}
            _value={invoice}
            showAllLevels={allLevels}
            placeholder="省 / 市"
            searchable
          />
        </Field>
      </Grid>
      <Small tone="muted">
        value：{JSON.stringify(address)}
        {address && `（${areaNames(address).join(' ')}）`}
      </Small>
    </Flex>
  );
});
