/** SSR 登记组件模块用的虚拟模块：id 与代码（不依赖 Babel，预设入口要用；生成登记代码见 hmr.ts 的 ssrCode） */

/** SSR 时登记组件模块的虚拟模块 */
export const SSR_REGISTER_ID = '/__vue-jsx-ssr-register-helper';

/** SSR_REGISTER_ID 的代码：包一层 setup，渲染时把模块记进 ssrContext.modules */
export const SSR_REGISTER_CODE = `import { useSSRContext } from "vue";
export function ssrRegisterHelper(comp, filename) {
  const setup = comp.setup;
  comp.setup = (props, ctx) => {
    const ssrContext = useSSRContext();
    (ssrContext.modules || (ssrContext.modules = new Set())).add(filename);
    if (setup) return setup(props, ctx);
  };
}
`;
