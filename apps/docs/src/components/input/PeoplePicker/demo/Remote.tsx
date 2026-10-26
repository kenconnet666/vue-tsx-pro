// 远程数据：source 的三个函数按自己的接口实现（这里用延时模拟请求），signal 在换了部门、改了搜索词、关掉对话框时中止；
// 加载中显示转圈。真实接口常是 GET /org/children?parent=…、GET /org/search?q=…
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Field,
  localPeopleSource,
  PeoplePicker,
  type PeopleEntry,
  type PeopleSource,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { org, positions } from './org';

const local = localPeopleSource(org, positions);

/** 等一会儿再给结果；被中止时报 AbortError（同 fetch） */
function later<T>(result: () => Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => void result().then(resolve, reject), 600);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });
}

const source: PeopleSource = {
  children: (parent, signal) => later(() => local.children(parent, signal), signal),
  search: (query, signal) => later(() => local.search!(query, signal), signal),
};

export default _component(() => {
  let members = _state<readonly PeopleEntry[]>([]);
  return () => (
    <Field label="项目成员">
      <PeoplePicker source={source} _value={members} maxTagCount="responsive" />
    </Field>
  );
});
