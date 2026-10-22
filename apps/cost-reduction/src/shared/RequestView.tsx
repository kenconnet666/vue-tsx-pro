/**
 * 一个请求的三种样子：第一次加载时是骨架，失败时是结果页（找不到、出错可以重试），有数据时交给 children 渲染。
 * 重新请求时保留旧内容（不闪成骨架）
 */
import { RotateCcw } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, HttpError, Result, SkeletonText, type RequestState } from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';
import { errorMessage } from '../app/feedback';

/** RequestView 的属性 */
export interface RequestViewProps<T> {
  /** 请求（useRequest 的结果） */
  request: RequestState<T>;
  /** 404 时的标题（“没有找到项目 DJ-2026-FC-1”） */
  notFound?: string;
  /** 有数据时的内容 */
  children: (data: T) => VNodeChild;
}

/** 请求的加载、出错与内容 */
export const RequestView = _component(
  <T,>({ request, notFound, children }: RequestViewProps<T>) =>
    () => {
      if (request.data !== undefined) return children(request.data);
      if (request.error) {
        const missing =
          request.error instanceof HttpError && request.error.response?.status === 404;
        return (
          <Result
            tone={missing ? 'warning' : 'danger'}
            title={missing ? (notFound ?? '没有找到') : '没能加载'}
            description={errorMessage(request.error)}
            action={
              !missing && (
                <Button variant="outline" icon={RotateCcw} onClick={() => void request.refresh()}>
                  重试
                </Button>
              )
            }
          />
        );
      }
      return <SkeletonText lines={8} />;
    },
);
