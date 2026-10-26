// 框里的图标、前后缀、清空按钮；出错的样子；自己的输入组件用 CharacterCount 显示字数
import { AtSign, Link2, Search } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  CharacterCount,
  Field,
  Flex,
  Grid,
  Textarea,
  TextField,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let keyword = _state('设计规范');
  let bio = _state('喜欢做小而美的工具，周末在山里跑步。');
  return () => (
    <Grid minItemWidth="16rem" gap="lg">
      <Field label="搜索">
        <TextField _value={keyword} type="search" icon={Search} clearable radius="full" />
      </Field>
      <Field label="个人主页" description="prefix 是不算在值里的固定文字，iconEnd 在框尾">
        <TextField _value="github.com/linxiaoman" prefix="https://" iconEnd={Link2} />
      </Field>
      <Field label="用户名" error="用户名已被占用，换一个试试">
        <TextField _value="xiaoman" icon={AtSign} />
      </Field>
      <Field
        label="简介"
        description="自己的输入组件（富文本、代码编辑器）用 CharacterCount 显示字数"
      >
        <Flex direction="column" gap="xs">
          <Textarea _value={bio} rows={3} />
          <CharacterCount count={bio.length} max={30} />
        </Flex>
      </Field>
    </Grid>
  );
});
