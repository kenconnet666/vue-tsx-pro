// 跨文件共享：响应式变量不能直接导出，导出读写函数（实际项目里优先用 pinia 或组合式函数）

// 对象状态：读取函数返回的是 ref 内的深层响应式对象，拿到后改属性照常触发更新
const settings = _state({ theme: 'light', fontSize: 14 });
export const getSettings = () => settings;

let token = _state('');
export const getToken = () => token;
export function setToken(value: string) {
  token = value;
}
