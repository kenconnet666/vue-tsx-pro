/** SSR 登记组件模块用的虚拟模块：id 与代码（不依赖 Babel，预设入口要用；生成登记代码见 hmr.ts 的 ssrCode） */

/** SSR 时登记组件模块的虚拟模块：编译产物导入它 */
export const SSR_REGISTER_ID = 'virtual:vue-tsx-pro/ssr-register';

/**
 * 解析后的 id：按 Vite 的约定以 \0 开头，模块运行器把它当虚拟模块，不当成文件。
 * 原先借用 Vue JSX 插件的 '/__vue-jsx-ssr-register-helper'，模块运行器把它拼成 file:///__vue-jsx-ssr-register-helper，
 * Windows 上不是合法的绝对路径，服务端加载任何组件都失败；与那个插件同名也会抢同一个 id（Nuxt 总会装上它）
 */
export const SSR_REGISTER_RESOLVED = `\0${SSR_REGISTER_ID}`;

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
