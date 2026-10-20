/**
 * 把一段文字存成文件（浏览器下载）：导出代码、CSV、SVG。
 * 给 Excel 打开的 CSV 在开头加 BOM（U+FEFF），中文才不乱码。
 *
 *   downloadFile('theme.ts', code, 'text/typescript');
 */
export function downloadFile(name: string, content: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  // 点击已经开始下载，地址可以立即回收
  URL.revokeObjectURL(url);
}
