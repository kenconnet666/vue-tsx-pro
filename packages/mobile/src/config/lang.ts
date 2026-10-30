/**
 * 语言包：组件里出现的文案（确认、取消、加载中、下拉刷新的各阶段……）。地区（locale）用于数字与日期的格式化。
 * 用 ConfigProvider 的 `lang` 换整套，或在默认的基础上改几条：`{ ...zhCN, confirm: '好的' }`
 */
import type { DevicePermission } from '../capability/types';

export interface MobileLang {
  /** 地区（BCP 47），数字、日期格式化用 */
  locale: string;
  /** 确认按钮 */
  confirm: string;
  /** 取消按钮 */
  cancel: string;
  /** 关闭按钮的读屏名称 */
  close: string;
  /** 清除按钮的读屏名称 */
  clear: string;
  /** 加载中 */
  loading: string;
  /** 没有数据 */
  empty: string;
  /** 下拉刷新：继续往下拉 */
  pulling: string;
  /** 下拉刷新：松手就刷新 */
  loosing: string;
  /** 下拉刷新：正在刷新 */
  refreshing: string;
  /** 列表：加载失败，点击重试 */
  loadFailed: string;
  /** 列表：没有更多了 */
  noMore: string;
  /** 表单：必填项没填时的消息 */
  fieldRequired: (label: string) => string;
  /** 日期、时间选择器各列的单位（2026 年、10 月）；英文留空 */
  dateUnits: { year: string; month: string; day: string; hour: string; minute: string };
  /** 日历：一周的第一天是周几（0 周日、1 周一）与星期的简称（从周日起） */
  firstDayOfWeek: number;
  weekdays: [string, string, string, string, string, string, string];
  /** 日历：年月的标题 */
  monthTitle: (year: number, month: number) => string;
  /** 回到顶部按钮的读屏名称 */
  backTop: string;
  /** 导航栏只有返回箭头时的读屏名称 */
  back: string;
  /** 搜索框：占位文字、按钮 */
  search: string;
  /** 输入框：已输入字数 / 上限 */
  wordLimit: (count: number, max: number) => string;
  /** 步进器：增加、减少的读屏名称 */
  increase: string;
  decrease: string;
  /** 上传：添加图片、删除 */
  upload: string;
  remove: string;
  /** 选择器、日历：请选择 */
  select: string;
  /** 日历：开始、结束 */
  start: string;
  end: string;
  /** 设备权限的名字（被拒后的引导里用） */
  permissions: Record<DevicePermission, string>;
  /** 权限被拒后引导去设置页：标题、说明、去设置的按钮 */
  permissionDenied: { title: string; message: (name: string) => string; openSettings: string };
  /** 隐私协议弹窗：标题、说明、协议链接、拒绝与同意 */
  privacy: { title: string; message: string; contract: string; disagree: string; agree: string };
}

/** 简体中文 */
export const zhCN: MobileLang = {
  locale: 'zh-CN',
  confirm: '确认',
  cancel: '取消',
  close: '关闭',
  clear: '清除',
  loading: '加载中…',
  empty: '暂无数据',
  pulling: '下拉即可刷新…',
  loosing: '释放即可刷新…',
  refreshing: '加载中…',
  loadFailed: '加载失败，点击重试',
  fieldRequired: (label) => (label ? `请填写${label}` : '请填写'),
  search: '搜索',
  backTop: '回到顶部',
  back: '返回',
  dateUnits: { year: '年', month: '月', day: '日', hour: '时', minute: '分' },
  firstDayOfWeek: 1,
  weekdays: ['日', '一', '二', '三', '四', '五', '六'],
  monthTitle: (year, month) => `${year} 年 ${month} 月`,
  noMore: '没有更多了',
  wordLimit: (count, max) => `${count}/${max}`,
  increase: '增加',
  decrease: '减少',
  upload: '上传图片',
  remove: '删除',
  select: '请选择',
  start: '开始',
  end: '结束',
  permissions: {
    location: '位置',
    fuzzyLocation: '位置',
    camera: '相机',
    microphone: '麦克风',
    album: '相册',
    bluetooth: '蓝牙',
  },
  permissionDenied: {
    title: '需要权限',
    message: (name) => `你之前拒绝了${name}权限，要用这项功能请在设置里打开`,
    openSettings: '去设置',
  },
  privacy: {
    title: '隐私保护提示',
    message: '使用这项功能前，请阅读并同意隐私保护指引',
    contract: '《隐私保护指引》',
    disagree: '拒绝',
    agree: '同意',
  },
};

/** 英文 */
export const enUS: MobileLang = {
  locale: 'en-US',
  confirm: 'Confirm',
  cancel: 'Cancel',
  close: 'Close',
  clear: 'Clear',
  loading: 'Loading…',
  empty: 'No data',
  pulling: 'Pull to refresh…',
  loosing: 'Release to refresh…',
  refreshing: 'Loading…',
  loadFailed: 'Failed to load, tap to retry',
  fieldRequired: (label) => (label ? `${label} is required` : 'Required'),
  search: 'Search',
  backTop: 'Back to top',
  back: 'Back',
  dateUnits: { year: '', month: '', day: '', hour: '', minute: '' },
  firstDayOfWeek: 0,
  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  monthTitle: (year, month) =>
    new Date(year, month - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
  noMore: 'No more',
  wordLimit: (count, max) => `${count}/${max}`,
  increase: 'Increase',
  decrease: 'Decrease',
  upload: 'Upload',
  remove: 'Remove',
  select: 'Select',
  start: 'Start',
  end: 'End',
  permissions: {
    location: 'location',
    fuzzyLocation: 'location',
    camera: 'camera',
    microphone: 'microphone',
    album: 'photo album',
    bluetooth: 'Bluetooth',
  },
  permissionDenied: {
    title: 'Permission needed',
    message: (name) =>
      `You denied ${name} access earlier. Turn it on in Settings to use this feature.`,
    openSettings: 'Open Settings',
  },
  privacy: {
    title: 'Privacy notice',
    message: 'Please read and agree to the privacy policy before using this feature.',
    contract: 'Privacy Policy',
    disagree: 'Decline',
    agree: 'Agree',
  },
};
