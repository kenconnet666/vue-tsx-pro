/**
 * 整页示例：/frame/<分类>/<组件>/frames/<名字> 单独渲染 frames 目录里的一个示例，不套站点外壳。
 * 示例卡片用 iframe 打开它（Example 的 frame）：AppShell 这类按视口排版、占整页的组件在卡片里也能如实展示。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { h, watch, type Component } from 'vue';
import { useRoute } from 'vue-router';

// 只收 frames 目录：普通示例随页面一起打包，不必各自拆成懒加载的块
const frames = import.meta.glob<{ default: Component }>('../components/*/*/frames/*.tsx');

export default _component(() => {
  const route = useRoute();
  let demo = _state.raw<Component | null>(null);
  watch(
    () => route.params.path,
    async (path) => {
      const load = frames[`../components/${String(path)}.tsx`];
      demo = load ? (await load()).default : null;
    },
    { immediate: true },
  );
  return () => demo && h(demo);
});
