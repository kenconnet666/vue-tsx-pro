import type { Lang } from './lang';

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
  remove: '移除',
  copy: '复制',
  copied: '已复制',

  toasterLabel: '通知',
  linkNewWindow: '（在新窗口打开）',
  selectEmpty: '没有选项',
  selectPlaceholder: '请选择',
  paginationTotal: (total) => `共 ${total} 条`,
  pagination: '分页',
  previousPage: '上一页',
  nextPage: '下一页',
  pageLabel: (page) => `第 ${page} 页`,
  breadcrumbs: '面包屑',
  breadcrumbsExpand: '显示被折叠的路径',
  formRequired: (label) => `请填写${label}`,
  slideVerifyHint: '拖动滑块完成验证',
  slideVerifyChecking: '验证中…',
  slideVerifySuccess: '验证通过',
  slideVerifyError: '验证失败，请重试',
};
