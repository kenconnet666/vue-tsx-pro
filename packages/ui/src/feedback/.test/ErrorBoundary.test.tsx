// ErrorBoundary：里面出错时只换掉这一块、上报一次、不往上传；重试与 resetKeys 重新创建里面的组件；自定义出错时的内容
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { ErrorBoundary } from '../ErrorBoundary';
import { mount } from '../../utils/.test/mount';

/** 前 failures 次创建时在渲染里出错，之后正常 */
function flaky(failures: number) {
  let created = 0;
  return _component(() => {
    const attempt = ++created;
    return () => {
      if (attempt <= failures) throw new Error(`第 ${attempt} 次出错`);
      return <span data-testid="ok">正常（第 {attempt} 次）</span>;
    };
  });
}

describe('ErrorBoundary', () => {
  it('渲染出错：只把这一块换成出错提示，旁边的照常；上报一次、带出错位置', async () => {
    const Child = flaky(1);
    const onError = vi.fn();
    const root = mount(() => (
      <div>
        <ErrorBoundary onError={onError}>
          <Child />
        </ErrorBoundary>
        <p>旁边的内容</p>
      </div>
    ));
    await nextTick();
    expect(root.textContent).toContain('这块内容出错了');
    expect(root.textContent).toContain('第 1 次出错');
    expect(root.textContent).toContain('旁边的内容');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(Error);
    expect(typeof onError.mock.calls[0]![1]).toBe('string');
  });

  it('重试：里面的组件重新创建', async () => {
    const Child = flaky(1);
    const root = mount(() => (
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>
    ));
    await nextTick();
    root.querySelector('button')!.click();
    await nextTick();
    expect(root.querySelector('[data-testid="ok"]')!.textContent).toBe('正常（第 2 次）');
  });

  it('fallback 自己画出错时的内容，拿到错误与重试函数', async () => {
    const Child = flaky(1);
    const root = mount(() => (
      <ErrorBoundary
        fallback={(error, retry) => (
          <button type="button" onClick={retry}>
            {error.message}，再试一次
          </button>
        )}
      >
        <Child />
      </ErrorBoundary>
    ));
    await nextTick();
    expect(root.textContent).toBe('第 1 次出错，再试一次');
    root.querySelector('button')!.click();
    await nextTick();
    expect(root.textContent).toBe('正常（第 2 次）');
  });

  it('事件处理里出错也接住；resetKeys 变了就清掉错误', async () => {
    let source = _state('a');
    const Clicker = _component(() => () => (
      <button
        type="button"
        onClick={() => {
          throw new Error('点了就出错');
        }}
      >
        数据源 {source}
      </button>
    ));
    const root = mount(() => (
      <ErrorBoundary resetKeys={[source]}>
        <Clicker />
      </ErrorBoundary>
    ));
    root.querySelector('button')!.click();
    await nextTick();
    expect(root.textContent).toContain('点了就出错');
    source = 'b';
    await nextTick();
    await nextTick();
    expect(root.textContent).toBe('数据源 b');
  });
});
