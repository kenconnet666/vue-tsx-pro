// 跨文件共享（同 Svelte）：不会被整体替换的对象状态可以直接导出，导入方改属性是响应式的
export const settings = _state({ theme: 'light', fontSize: 14 });

// 会被整体替换的状态不能导出，改为导出读写函数
let token = _state('');
export const getToken = () => token;
export function setToken(value: string) {
  token = value;
}
