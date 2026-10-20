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

export default _component(() => {
  let open = _state(false);
  let saving = _state(false);
  let profile = _state({
    name: '周一航',
    department: '设计中心',
    bio: '做了八年交互设计，喜欢把复杂的事讲简单。',
  });
  let draft = _state({ ...profile });

  const edit = () => {
    draft = { ...profile };
    open = true;
  };
  const save = () => {
    saving = true;
    setTimeout(() => {
      profile = { ...draft };
      saving = false;
      open = false;
    }, 800);
  };

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
        footer={
          <>
            <Button variant="ghost" tone="neutral" onClick={() => (open = false)}>
              取消
            </Button>
            <Button loading={saving} onClick={save}>
              保存
            </Button>
          </>
        }
      >
        <Flex direction="column" gap="lg">
          <Field label="姓名" required>
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
