/**
 * 滚动加载的列表末尾的状态（配合 useInfiniteList）：失败时是出错提示与“重试”，取完了是“没有更多了”，其余时候不占位。
 *
 *   <VirtualList items={orders.items} loading={orders.loading} onRangeChange={orders.onRangeChange} … />
 *   <InfiniteListStatus list={orders} />
 *
 * 放在列表下方（不放进 role="list" 里）。加载中不在这里显示：列表自己在末尾接骨架。失败的文案：错误码有文案时用它（网络断了、没有权限），否则是“加载失败，请重试”。
 * 根元素一直在、是 role="status"：内容变了读屏会播报。部件：Root（div）、Retry（Button）。
 */
import { RotateCw } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { Text } from '../base/Text';
import { useLang } from '../config/context';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { errorCodeText } from '../utils/request/error-message';
import type { InfiniteListState } from '../utils/request/use-infinite-list';

/** 未声明的属性落到根元素（div）上 */
export interface InfiniteListStatusProps extends PartProps<'div', 'role'> {
  /** 列表的状态（useInfiniteList 的返回值） */
  list: InfiniteListState<unknown>;
  /** 取完时的文字；不给时用语言包的“没有更多了”，false 不显示 */
  noMore?: VNodeChild | false;
  /** 重试按钮的部件属性 */
  propsRetry?: Partial<ButtonProps>;
}

/** InfiniteListStatus 的样式：root、shown */
export const infiniteListStatusStyles = css.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '_sm',
    color: '_textMuted',
    fontSize: '_sm',
  },
  shown: { minHeight: '2.75em', paddingBlock: '_xs', paddingInline: '_md' },
});

/** 滚动加载的列表末尾：失败时重试，取完了提示没有更多 */
export const InfiniteListStatus = _component(
  ({ list, noMore, propsRetry, ...rest }: InfiniteListStatusProps) => {
    const lang = useLang();
    const content = (): VNodeChild => {
      if (list.error !== undefined) {
        return (
          <>
            <Text tone="danger">{errorCodeText(list.error, lang) ?? lang.listLoadFailed}</Text>
            <Button
              {...mergePartProps<ButtonProps>(
                { size: 'sm', variant: 'ghost', icon: RotateCw },
                propsRetry,
                { onClick: () => void list.loadMore() },
              )}
            >
              {lang.errorRetry}
            </Button>
          </>
        );
      }
      if (noMore === false || list.loading || !list.loaded || list.hasMore) return null;
      return list.items.length > 0 ? (noMore ?? lang.listNoMore) : null;
    };
    return () => {
      const shown = content();
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [infiniteListStatusStyles.root, shown != null && infiniteListStatusStyles.shown],
            },
            rest,
            { role: 'status' },
          )}
        >
          {shown}
        </div>
      );
    };
  },
);
