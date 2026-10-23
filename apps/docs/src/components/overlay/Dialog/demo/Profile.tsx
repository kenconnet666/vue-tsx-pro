// 编辑表单：onConfirm 给出“取消 / 保存”，保存时按钮加载中、关不掉；姓名没填时返回 false，对话框留着
import { Pencil } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Field,
  Flex,
  Select,
  Small,
  Strong,
  Textarea,
  TextField,
} from '@vue-tsx-pro/ui';

const departments = ['设计中心', '研发部', '市场部', '财务部'];
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default _component(() => {
  let open = _state(false);
  let nameError = _state('');
  let profile = _state({
    name: '周一航',
    department: '设计中心',
    bio: '做了八年交互设计，喜欢把复杂的事讲简单。',
  });
  let draft = _state({ ..._untrack(profile) });

  const edit = () => {
    draft = { ...profile };
    nameError = '';
    open = true;
  };
  async function save() {
    nameError = draft.name.trim() ? '' : '请填写姓名';
    if (nameError) return false;
    await wait(800);
    profile = { ...draft, name: draft.name.trim() };
  }

  return () => (
    <Card>
      <Flex align="center" gap="md">
        <Avatar name={profile.name} />
        <Flex direction="column" gap="xs" grow>
          <Strong>{profile.name}</Strong>
          <Small tone="muted">
            {profile.department} · {profile.bio}
          </Small>
        </Flex>
        <Button variant="soft" icon={Pencil} onClick={edit}>
          编辑
        </Button>
      </Flex>
      <Dialog
        open={_bind(open)}
        title="编辑资料"
        description="修改后立即对团队成员可见。"
        confirmText="保存"
        onConfirm={save}
      >
        <Flex direction="column" gap="lg">
          <Field label="姓名" required error={nameError || undefined}>
            <TextField value={_bind(draft.name)} autofocus />
          </Field>
          <Field label="部门">
            <Select items={departments} value={_bind(draft.department)} />
          </Field>
          <Field label="简介" description="显示在个人主页，最多 80 字。">
            <Textarea value={_bind(draft.bio)} rows={3} />
          </Field>
        </Flex>
      </Dialog>
    </Card>
  );
});
