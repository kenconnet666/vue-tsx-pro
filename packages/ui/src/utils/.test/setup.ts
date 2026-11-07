// 组件测试的公共环境（vitest.config.ts 的 setupFiles）：happy-dom 没有 popover 的方法，补成空操作，
// 打开弹层的组件照常运行；要看开关的测试查组件自己的状态（data-state、aria-expanded、onOpenChange）。
// 写了 @vitest-environment node 的测试没有 DOM，不补
if (typeof HTMLElement !== 'undefined') {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
  proto.togglePopover ??= () => {};
}
