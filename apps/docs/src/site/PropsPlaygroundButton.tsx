/**
 * 顶栏的组件演练场入口：图标按钮打开抽屉，里面是 PropsPlayground。
 * 打开时默认是当前页面的组件（/components/icon-button → IconButton）；不是组件页时沿用上次选的。
 * 面板与组件目录的数据第一次打开时才加载。
 */
import { SlidersHorizontal } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Drawer, IconButton, Spinner, Tooltip } from '@vue-tsx-pro/ui';
import { useRoute } from 'vue-router';

type PanelModule = typeof import('../playground/props/PropsPlayground');

/** /components/icon-button → IconButton；不是组件页时 undefined */
function componentOfPath(path: string): string | undefined {
  const slug = /^\/components\/([a-z0-9-]+)$/.exec(path)?.[1];
  return slug?.replace(/(^|-)([a-z0-9])/g, (_, __, letter: string) => letter.toUpperCase());
}

export const PropsPlaygroundButton = _component(() => {
  const route = useRoute();
  let open = _state(false);
  let component = _state('Button');
  let panel = _state.raw<PanelModule | null>(null);

  async function show() {
    panel ??= await import('../playground/props/PropsPlayground');
    const fromRoute = componentOfPath(route.path);
    if (fromRoute && panel.playableNames.has(fromRoute)) component = fromRoute;
    open = true;
  }

  return () => (
    <>
      <Tooltip
        trigger={(props) => (
          <IconButton
            {...props}
            icon={SlidersHorizontal}
            aria-label="组件演练场"
            onClick={() => void show()}
          />
        )}
      >
        组件演练场：点选属性组合样式
      </Tooltip>
      <Drawer _open={_bind(open)} size="xl" title="组件演练场">
        {panel ? <panel.PropsPlayground _name={_bind(component)} /> : <Spinner />}
      </Drawer>
    </>
  );
});
