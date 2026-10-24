// happy-dom（21）没有 Popover API：挂载时就打开 popover 的组件（Toaster 的通知区域）会抛错。
// 这里的测试只看示例能不能渲染，补空实现即可；显示与层叠在真实浏览器的测试里验证。
// 构建脚本的测试（build/*.test.ts）跑在 node 环境，没有 DOM
if (typeof HTMLElement !== 'undefined' && !('showPopover' in HTMLElement.prototype)) {
  Object.assign(HTMLElement.prototype, {
    showPopover() {},
    hidePopover() {},
    togglePopover: () => false,
  });
}

// happy-dom 不按样式表计算主题变量（--vtp-…），读出来是空串，readToken 会按约定抛错。
// 读取 token 的示例（ColorSwatch 列主题色）在这里只需渲染得出来：空值换成占位的 0s（时长能解析，颜色只是显示）
if (typeof CSSStyleDeclaration !== 'undefined') {
  const { prototype } = CSSStyleDeclaration;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'getPropertyValue')!;
  const getPropertyValue = descriptor.value as (this: CSSStyleDeclaration, name: string) => string;
  prototype.getPropertyValue = function (name: string) {
    const value = getPropertyValue.call(this, name);
    return value === '' && name.startsWith('--vtp-') ? '0s' : value;
  };
}
