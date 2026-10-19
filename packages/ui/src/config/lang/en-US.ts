import type { Lang } from './lang';

/** English (United States) */
export const enUS: Lang = {
  code: 'en-US',
  direction: 'ltr',
  calendar: 'gregory',
  currency: 'USD',

  confirm: 'OK',
  cancel: 'Cancel',
  close: 'Close',
  clear: 'Clear',
  loading: 'Loading',
  remove: 'Remove',
  copy: 'Copy',
  copied: 'Copied',

  toasterLabel: 'Notifications',

  linkNewWindow: ' (opens in a new window)',
  selectEmpty: 'No options',
  selectPlaceholder: 'Select…',
  paginationTotal: (total) => `${total} items`,
  pagination: 'Pagination',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageLabel: (page) => `Page ${page}`,
  breadcrumbs: 'Breadcrumb',
  breadcrumbsExpand: 'Show full path',
  formRequired: (label) => `${label} is required`,
  slideVerifyHint: 'Slide to verify',
  slideVerifyChecking: 'Verifying…',
  slideVerifySuccess: 'Verified',
  slideVerifyError: 'Verification failed, try again',
};
