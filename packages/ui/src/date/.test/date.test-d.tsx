// 类型：日期、时间组件的值跟着写进来的类型走——ISO 字符串或 @internationalized/date 的对象，回调拿到同一种；
// 多选是数组、区间是 { start, end }；CalendarBoard 从 events 推出数据的类型，取日期、标题的函数跟着它
import type { CalendarDate, Time } from '@internationalized/date';
import { Calendar } from '../Calendar';
import { CalendarBoard } from '../CalendarBoard';
import { DateRangePicker } from '../DateRangePicker';
import { RangeCalendar } from '../RangeCalendar';
import { TimeField } from '../TimeField';
import { TimePicker } from '../TimePicker';

declare const day: CalendarDate;
declare const time: Time;

export const single = <Calendar _value="2026-11-08" onPick={(date: string) => void date} />;
export const dateValue = (
  <Calendar valueType="dateValue" _value={day} onPick={(date: CalendarDate) => void date} />
);
export const multiple = <Calendar selectionMode="multiple" _value={['2026-11-08']} />;
export const multipleTypo = (
  // @ts-expect-error 多选的值是数组
  <Calendar selectionMode="multiple" _value="2026-11-08" />
);
export const pickTypo = (
  // @ts-expect-error 值是 CalendarDate，选中时拿到的也是它，不是字符串
  <Calendar _value={day} onPick={(date: string) => void date} />
);

export const range = <RangeCalendar _value={{ start: '2026-11-01', end: '2026-11-08' }} />;
export const rangeValue = <RangeCalendar _value={{ start: day, end: day }} />;
export const rangePicker = <DateRangePicker _value={{ start: '2026-11-01', end: '2026-11-30' }} />;
export const rangePickerTypo = (
  // @ts-expect-error 区间是 { start, end }，不是数组
  <DateRangePicker _value={['2026-11-01', '2026-11-30']} />
);

export const timeField = <TimeField _value="09:30" />;
export const timeValue = <TimePicker _value={time} />;
export const timeTypo = (
  // @ts-expect-error 时间是 'HH:mm' 字符串或 Time
  <TimeField _value={930} />
);

interface Meeting {
  id: string;
  title: string;
  date: string;
}
declare const meetings: Meeting[];
export const board = (
  <CalendarBoard
    events={meetings}
    getEventDate={(meeting) => meeting.date}
    getEventKey={(meeting) => meeting.id}
    getEventLabel={(meeting) => meeting.title}
  />
);
export const boardTypo = (
  <CalendarBoard
    events={meetings}
    // @ts-expect-error 数据是 Meeting，没有 day
    getEventDate={(meeting) => meeting.day}
  />
);
