/** 示例用的“照片”：渐变色的 SVG（data URL），不依赖外部图片服务 */
export function photo(from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#fff" fill-opacity=".85"/><path d="M12 60c2-13 11-19 20-19s18 6 20 19z" fill="#fff" fill-opacity=".85"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** 示例里的团队成员 */
export const members = [
  { name: '林小满', src: photo('#f97316', '#db2777') },
  { name: '周一航', src: photo('#0ea5e9', '#6366f1') },
  { name: 'Chen Mo', src: photo('#10b981', '#0d9488') },
  { name: '吴悠', src: undefined },
  { name: 'Zhao Qing', src: photo('#a855f7', '#ec4899') },
  { name: '孙浩然', src: undefined },
  { name: 'Li Wei', src: photo('#eab308', '#f97316') },
];
