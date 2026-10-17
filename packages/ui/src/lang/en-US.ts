import type { Lang } from './types';

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

  selectEmpty: 'No options',
  selectPlaceholder: 'Select…',
  paginationTotal: (total) => `${total} items`,
  formRequired: (label) => `${label} is required`,
};
