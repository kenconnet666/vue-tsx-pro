/**
 * 把一段文字存成文件（浏览器下载）：导出代码、CSV、SVG。
 * 内容原样写入：给 Excel 打开的 CSV 要由调用方在开头加 BOM（`'\uFEFF' + csv`），中文才不乱码。
 *
 *   downloadFile('theme.ts', code, 'text/typescript');
 */
export function downloadFile(name: string, content: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  // 点击后浏览器才开始读这个地址：Safari、Firefox 里立即回收会让下载失败，过一会儿再回收（同 FileSaver.js）
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}
