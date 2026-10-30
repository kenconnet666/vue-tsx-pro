/**
 * 列表：滚到离底部不远时自动加载下一页，底部显示加载中、没有更多了、加载失败（点了重试）。
 *
 *   <List finished={done} onLoad={async () => { rows.push(...(await fetchPage(++page))); done = page >= last; }}>
 *     {rows.map((row) => <Cell title={row.name} />)}
 *   </List>
 *
 * onLoad 返回 Promise 时自动管理加载中与失败（抛错时显示“加载失败，点击重试”）；不返回时由使用方改 _loading、_error。
 * 离底部多近用宿主量底部的位置判断：H5 与小程序都按页面滚动。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { nextTick, onBeforeUnmount, onMounted, watch, type VNodeChild } from 'vue';
import { useConfig } from '../config/context';
import { Loading } from '../feedback/Loading';
import { useHost } from '../utils/host';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到根元素（div）上 */
export interface ListProps extends Omit<PartProps<'div', 'role'>, 'onLoad'> {
  /** 是否在加载；双向绑定写 `_loading={x}` */
  _loading?: boolean;
  /** 是否加载失败；双向绑定写 `_error={x}` */
  _error?: boolean;
  /** 已经加载完了（不再触发 onLoad） */
  finished?: boolean;
  /**
   * 离底部多近（px）开始加载
   * @default 300
   */
  offset?: number;
  /** 加载下一页；返回 Promise 时完成后自动结束加载中，抛错时显示失败 */
  onLoad?: () => void | Promise<unknown>;
  /** 加载完时底部的文字；不给时用语言包的“没有更多了”，null 不显示 */
  finishedText?: VNodeChild;
  /** 失败时底部的文字；不给时用语言包 */
  errorText?: VNodeChild;
  /** 列表的内容 */
  children?: VNodeChild;
  /** 底部状态栏的部件属性 */
  propsFooter?: PartProps<'div'>;
}

/** List 的样式：footer、error */
export const listStyles = css.create({
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '3.2em',
    fontSize: '_sm',
    color: '_textMuted',
  },
  error: { cursor: 'pointer' },
});

/** 列表（div[role=feed] > 内容 + 底部状态） */
export const List = _component(
  ({
    _loading: loading = _bindable(false),
    _error: error = _bindable(false),
    finished = false,
    offset = 300,
    onLoad,
    finishedText,
    errorText,
    children,
    propsFooter,
    ...rest
  }: ListProps) => {
    const host = useHost();
    const config = useConfig();
    let footer: unknown = null;
    let checking = false;

    const load = async () => {
      loading = true;
      const pending = onLoad?.();
      if (!(pending instanceof Promise)) return;
      try {
        await pending;
      } catch {
        error = true;
      } finally {
        loading = false;
      }
    };
    /** 底部离可视区的下沿不到 offset 时加载 */
    const check = async () => {
      if (checking || loading || error || finished) return;
      checking = true;
      try {
        const rect = await host.measure(footer);
        if (rect && rect.top - host.window().height <= offset && !loading && !error && !finished)
          await load();
      } finally {
        checking = false;
      }
    };

    const stop = host.onScroll(() => void check());
    onBeforeUnmount(stop);
    onMounted(() => void check());
    // 一页加载完、内容还不满一屏时接着加载
    watch(
      () => [loading, finished, error],
      () => void nextTick(check),
    );

    const retry = () => {
      error = false;
      void check();
    };

    return () => {
      const status = error ? (
        (errorText ?? config.lang.loadFailed)
      ) : loading ? (
        <Loading>{config.lang.loading}</Loading>
      ) : finished && finishedText !== null ? (
        hasContent(finishedText) ? (
          finishedText
        ) : (
          config.lang.noMore
        )
      ) : null;
      return (
        <div
          {...mergeAttrs<'div'>({}, rest, {
            role: 'feed',
            'aria-busy': loading ? 'true' : 'false',
          })}
        >
          {children}
          <div
            {...mergeAttrs<'div'>(
              { sx: [listStyles.footer, error && listStyles.error] },
              propsFooter,
              // 失败时整条可点：重试
              error ? { role: 'button', onClick: retry } : {},
            )}
            ref={(node: unknown) => (footer = node)}
          >
            {status}
          </div>
        </div>
      );
    };
  },
);
