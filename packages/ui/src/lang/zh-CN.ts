import type { Lang } from './types';

/** 简体中文 */
export const zhCN: Lang = {
  code: 'zh-CN',
  direction: 'ltr',
  calendar: 'gregory',
  currency: 'CNY',

  confirm: '确定',
  cancel: '取消',
  close: '关闭',
  clear: '清空',
  loading: '加载中',

  selectEmpty: '没有选项',
  selectPlaceholder: '请选择',
  paginationTotal: (total) => `共 ${total} 条`,
  formRequired: (label) => `请填写${label}`,
};
