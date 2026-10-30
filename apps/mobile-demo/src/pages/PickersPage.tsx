// 选择：下拉菜单、滚轮选择器（一列、省市区联动）、日期、时间、级联选择、日历（单选、区间）；都放在底部弹出层里，三端同一份页面
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Calendar,
  Cascader,
  Cell,
  CellGroup,
  ConfigProvider,
  DatePicker,
  DropdownItem,
  DropdownMenu,
  Picker,
  Popup,
  TimePicker,
  findPath,
  resolveColumns,
  showToast,
  type CalendarValue,
  type PickerOption,
  type PickerValue,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { areaOptions } from '@zerodep-dev/vue-tsx-pro-mobile/area';
import { demoSettings } from '../settings.ts';

const styles = css.create({
  page: { minHeight: '100vh', paddingBlockEnd: '_xxl', backgroundColor: '_background' },
});

const FRUITS: PickerOption[] = ['苹果', '香蕉', '橙子（缺货）', '葡萄', '西瓜', '芒果', '草莓'].map(
  (text, index) => ({
    text,
    value: index,
    disabled: index === 2,
  }),
);

/** 选项的文字连起来（省市区的选项文字都是字符串） */
const names = (options: PickerOption[], separator: string) =>
  options.map((option) => (typeof option.text === 'string' ? option.text : '')).join(separator);

const pad = (value: number) => String(value).padStart(2, '0');
const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** 打开的是哪一个弹出层 */
type Sheet = 'fruit' | 'area' | 'date' | 'time' | 'cascader' | 'calendar' | 'range' | null;

export const PickersPage = _component(() => {
  let sheet = _state<Sheet>(null);
  let fruit = _state<PickerValue[]>([0]);
  let area = _state<PickerValue[]>(['330000', '330100', '330106']);
  let date = _state(new Date(2026, 9, 30));
  let time = _state('09:30');
  let region = _state<string | number | undefined>(undefined);
  let day = _state<CalendarValue | null>(null);
  let stay = _state<CalendarValue | null>(null);
  let sort = _state<string | number | undefined>('default');
  let category = _state<string | number | undefined>('all');

  const areas = areaOptions();
  const close = () => (sheet = null);
  const areaText = () => names(resolveColumns(areas, area).options, ' ');
  const today = new Date();
  const inThreeMonths = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

  return () => (
    <ConfigProvider theme={demoSettings.theme} {...css.attrs(styles.page)}>
      <DropdownMenu>
        <DropdownItem
          _value={sort}
          options={[
            { text: '综合排序', value: 'default' },
            { text: '销量优先', value: 'sales' },
            { text: '价格从低到高', value: 'price' },
          ]}
          onChange={(value) => showToast(`排序：${String(value)}`)}
        />
        <DropdownItem
          _value={category}
          options={[
            { text: '全部分类', value: 'all' },
            { text: '咖啡', value: 'coffee' },
            { text: '茶饮', value: 'tea' },
          ]}
        />
      </DropdownMenu>

      <CellGroup title="滚轮选择器">
        <Cell
          title="水果"
          value={FRUITS[Number(fruit[0])]!.text}
          arrow
          onClick={() => (sheet = 'fruit')}
        />
        <Cell title="省市区（联动）" value={areaText()} arrow onClick={() => (sheet = 'area')} />
        <Cell title="日期" value={formatDate(date)} arrow onClick={() => (sheet = 'date')} />
        <Cell title="时间（15 分钟一档）" value={time} arrow onClick={() => (sheet = 'time')} />
      </CellGroup>
      <CellGroup title="级联选择">
        <Cell
          title="所在地区"
          value={names(findPath(areas, region), ' / ') || '请选择'}
          arrow
          onClick={() => (sheet = 'cascader')}
        />
      </CellGroup>
      <CellGroup title="日历">
        <Cell
          title="预约日期"
          value={day ? formatDate(day as Date) : '请选择'}
          arrow
          onClick={() => (sheet = 'calendar')}
        />
        <Cell
          title="入住与离店"
          value={stay ? (stay as Date[]).map(formatDate).join(' 至 ') : '请选择'}
          arrow
          onClick={() => (sheet = 'range')}
        />
      </CellGroup>

      <Popup
        _open={sheet === 'fruit'}
        position="bottom"
        round
        onOpenChange={(open) => !open && close()}
      >
        <Picker
          title="选择水果"
          columns={FRUITS}
          _value={fruit}
          onConfirm={close}
          onCancel={close}
        />
      </Popup>
      <Popup
        _open={sheet === 'area'}
        position="bottom"
        round
        onOpenChange={(open) => !open && close()}
      >
        <Picker title="省市区" columns={areas} _value={area} onConfirm={close} onCancel={close} />
      </Popup>
      <Popup
        _open={sheet === 'date'}
        position="bottom"
        round
        onOpenChange={(open) => !open && close()}
      >
        <DatePicker
          title="选择日期"
          _value={date}
          minDate={new Date(2020, 0, 1)}
          maxDate={new Date(2030, 11, 31)}
          onConfirm={close}
          onCancel={close}
        />
      </Popup>
      <Popup
        _open={sheet === 'time'}
        position="bottom"
        round
        onOpenChange={(open) => !open && close()}
      >
        <TimePicker
          title="选择时间"
          _value={time}
          minuteStep={15}
          onConfirm={close}
          onCancel={close}
        />
      </Popup>
      <Popup
        _open={sheet === 'cascader'}
        position="bottom"
        round
        onOpenChange={(open) => !open && close()}
      >
        <Cascader
          title="所在地区"
          options={areas}
          _value={region}
          onFinish={close}
          onClose={close}
        />
      </Popup>
      <Popup
        _open={sheet === 'calendar'}
        position="bottom"
        round
        onOpenChange={(open) => !open && close()}
      >
        <Calendar title="预约日期" _value={day} maxDate={inThreeMonths} onConfirm={close} />
      </Popup>
      <Popup
        _open={sheet === 'range'}
        position="bottom"
        round
        onOpenChange={(open) => !open && close()}
      >
        <Calendar
          title="入住与离店"
          type="range"
          _value={stay}
          maxDate={inThreeMonths}
          dayInfo={(value) => ({ bottom: value.getDay() % 6 === 0 ? '¥399' : '¥299' })}
          onConfirm={close}
        />
      </Popup>
    </ConfigProvider>
  );
});
