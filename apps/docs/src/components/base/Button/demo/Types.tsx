// type：submit 提交所在的表单，reset 触发表单的 reset 事件（默认 button，放在表单里也不会误提交）；
// ripple={false} 关掉这一个按钮的点击波纹（全局默认见 createUi 的 ripple）
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Field, Flex, Small, TextField } from '@vue-tsx-pro/ui';

const INITIAL = '林小满';

export default _component(() => {
  let nickname = _state(INITIAL);
  let saved = _state('');
  return () => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        saved = nickname;
      }}
      // 值是受控的：拦下原生的重置，自己回到初始值
      onReset={(event) => {
        event.preventDefault();
        nickname = INITIAL;
        saved = '';
      }}
    >
      <Flex direction="column" gap="sm">
        <Field label="昵称">
          <TextField _value={nickname} name="nickname" />
        </Field>
        <Flex gap="sm" align="center" wrap>
          <Button type="submit">保存</Button>
          <Button type="reset" variant="outline">
            重置
          </Button>
          <Button variant="ghost" ripple={false} onClick={() => (nickname = '')}>
            清空（无波纹）
          </Button>
        </Flex>
        <Small tone="muted">{saved ? `已保存：${saved}` : '还没有保存'}</Small>
      </Flex>
    </form>
  );
});
