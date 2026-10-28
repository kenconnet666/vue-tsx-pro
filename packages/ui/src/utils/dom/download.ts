/**
 * 浏览器里存文件、挑文件：导出代码、CSV、SVG；导入一份 JSON、一张表。
 * 内容原样写入：给 Excel 打开的 CSV 要由调用方在开头加 BOM（`'\uFEFF' + csv`），中文才不乱码。
 *
 *   downloadFile('theme.ts', code, 'text/typescript');
 *   const file = await pickFile('.json');
 *   if (file) importFrom(await file.text());
 */
export function downloadFile(name: string, content: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  // 点击后浏览器才开始读这个地址：Safari、Firefox 里立即回收会让下载失败，过一会儿再回收（同 FileSaver.js）
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}

/**
 * 弹出系统的选文件对话框，挑一个文件；取消时为 null。要在用户的点击里调（浏览器只在用户操作时允许弹）。
 * accept 同 input 的 accept（`.json`、`image/*`）。
 */
export function pickFile(accept?: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), {
      type: 'file',
      ...(accept ? { accept } : {}),
    });
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => resolve(null), { once: true });
    input.click();
  });
}
