// 移动端页面里手机外框（iframe）加载的入口：直接跑 mobile-demo 的 H5 入口（按 hash 换页面）。
// 单独一个文档，移动端组件库与站点用的桌面组件库各自登记主题 token，互不干扰（见 packages/mobile/MOBILE.md §10）
import '../../mobile-demo/src/main.ts';
