// Node 的 assert 在浏览器里的最小实现：Babel 的插件辅助函数用它检查前提。
// 写成 CommonJS：调用方是 CommonJS 包，`require('assert')` 要直接拿到函数，ES 模块的默认导出会被包成对象
module.exports = function assert(value, message) {
  if (!value) throw new Error(message || '断言失败');
};
