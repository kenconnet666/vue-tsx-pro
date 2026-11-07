/**
 * 错误边界：里面的组件在 setup、渲染、事件处理、侦听器里出错时，只把这一块换成出错的提示，页面的其余部分照常；
 * 重试时里面的组件整个重新创建（出错时的状态不可信）。同 react-error-boundary。
 *
 *   <ErrorBoundary onError={(error) => logger.report(error)}><SalesChart /></ErrorBoundary>
 *   <ErrorBoundary resetKeys={[route.params.id]} fallback={(error, retry) => <Alert …/>}>…</ErrorBoundary>
 *
 * 定时器、Promise 里的错误不经过 Vue，接不住（同 Vue 的 errorCaptured）；接住的错误不再往上传。
 */
import { RotateCcw } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { onErrorCaptured, watch, type VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { useLang } from '../config/context';
import { mergePartProps } from '../utils/props';
import { Result, type ResultProps } from './Result';

/** 里面的内容是 children；出错时显示 fallback（不写时是 Result） */
export interface ErrorBoundaryProps {
  /** 出错时显示什么：拿到错误与重试函数；不写时是 Result（危险色调、标题、错误信息与重试按钮） */
  fallback?: (error: Error, retry: () => void) => VNodeChild;
  /** 接住错误时调用：上报到日志服务；info 是 Vue 给的出错位置（如 “render function”、“setup function”） */
  onError?: (error: Error, info: string) => void;
  /** 这些值变了就清掉错误、重新创建里面的组件：换了路由参数、换了数据源时自动恢复 */
  resetKeys?: readonly unknown[];
  /** 默认出错提示（Result）的部件属性 */
  propsFallback?: Partial<ResultProps>;
  children?: VNodeChild;
}

const changed = (next: readonly unknown[], previous: readonly unknown[]) =>
  next.length !== previous.length ||
  next.some((value, index) => !Object.is(value, previous[index]));

/** 错误边界：里面出错时只把这一块换成出错提示，可以重试 */
export const ErrorBoundary = _component(
  ({ fallback, onError, resetKeys, propsFallback, children }: ErrorBoundaryProps) => {
    const lang = useLang();
    let error = _state.raw<Error | null>(null);
    const retry = () => (error = null);

    onErrorCaptured((caught, _instance, info) => {
      const value = caught instanceof Error ? caught : new Error(String(caught));
      error = value;
      onError?.(value, info);
      return false;
    });
    watch(
      () => [...(resetKeys ?? [])],
      (next, previous) => {
        if (error && changed(next, previous)) retry();
      },
    );

    return () => {
      if (!error) return children;
      if (fallback) return fallback(error, retry);
      return (
        <Result
          {...mergePartProps<ResultProps>(
            {
              tone: 'danger',
              size: 'sm',
              title: lang.errorTitle,
              description: error.message,
              action: (
                <Button size="sm" variant="soft" tone="neutral" icon={RotateCcw} onClick={retry}>
                  {lang.errorRetry}
                </Button>
              ),
            },
            propsFallback,
          )}
        />
      );
    };
  },
);
