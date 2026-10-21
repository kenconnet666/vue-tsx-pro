// 异步建议：inputValue 双向绑定输入框的文字，据此请求；filter={false} 不再本地过滤，loading 时建议列表显示加载中。
// 输入的话题不在建议里也能加（默认允许自定义值）
import { _component } from '@vue-tsx-pro/tsx';
import { Field, TagsInput } from '@vue-tsx-pro/ui';
import { onBeforeUnmount, watch } from 'vue';

const topics = [
  '前端工程化',
  '前端性能',
  '组件设计',
  '设计系统',
  '无障碍',
  '国际化',
  '可视化',
  '测试',
  '构建工具',
  '状态管理',
];

export default _component(() => {
  let tags = _state(['组件设计']);
  let query = _state('');
  let loading = _state(false);
  let suggestions = _state<string[]>([]);
  let timer: ReturnType<typeof setTimeout> | undefined;

  // 模拟接口：输入停下 500ms 后按关键词返回
  watch(
    () => query,
    (text) => {
      clearTimeout(timer);
      if (!text.trim()) {
        loading = false;
        suggestions = [];
        return;
      }
      loading = true;
      timer = setTimeout(() => {
        suggestions = topics.filter((topic) => topic.includes(text.trim()));
        loading = false;
      }, 500);
    },
  );
  onBeforeUnmount(() => clearTimeout(timer));

  return () => (
    <Field label="话题" description="输入“前端”“设计”试试">
      <TagsInput
        value={_bind(tags)}
        inputValue={_bind(query)}
        items={suggestions}
        filter={false}
        loading={loading}
        max={5}
      />
    </Field>
  );
});
