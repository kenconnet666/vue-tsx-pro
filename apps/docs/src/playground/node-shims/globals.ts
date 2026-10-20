/**
 * Babel 在浏览器里要用的几个 Node 全局量：读 process.env 判断开关、用 process.cwd() 作默认工作目录。
 * 编译 Worker 的第一个导入就是它，先于 Babel 执行
 */
const scope = globalThis as { process?: unknown };
scope.process ??= { env: {}, cwd: () => '/', platform: 'browser', version: '', versions: {} };
