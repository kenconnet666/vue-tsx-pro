// 跨模块共享：const 对象状态就是 reactive，可直接导出
export const settings = _state({ theme: 'light', fontSize: 14 })

// 需要重新赋值的状态不导出变量，导出读写函数
let token = _state('')
export const getToken = () => token
export function setToken(value: string) {
  token = value
}
