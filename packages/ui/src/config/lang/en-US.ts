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

  linkNewWindow: ' (opens in a new window)',
  selectEmpty: 'No options',
  selectPlaceholder: 'Select…',
  paginationTotal: (total) => `${total} items`,
  formRequired: (label) => `${label} is required`,
  slideVerifyHint: 'Slide to verify',
  slideVerifyChecking: 'Verifying…',
  slideVerifySuccess: 'Verified',
  slideVerifyError: 'Verification failed, try again',
};
