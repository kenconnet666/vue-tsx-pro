// 成员列表：移出成员前问一句；确认后等接口返回再关闭，失败时保持打开并提示
import { Trash2, UserMinus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Avatar,
  Badge,
  Button,
  createToaster,
  Flex,
  IconButton,
  Popconfirm,
  Small,
  Text,
  Toaster,
} from '@vue-tsx-pro/ui';

interface Member {
  id: string;
  name: string;
  role: string;
  owner?: boolean;
}

const toaster = createToaster();

// 假的接口：600ms 后返回；名字里带“周”的模拟失败
const removeMember = (member: Member) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (member.name.includes('周') ? reject(new Error('没有权限')) : resolve()), 600),
  );

export default _component(() => {
  let members = _state<Member[]>([
    { id: 'm1', name: '林小满', role: '项目负责人', owner: true },
    { id: 'm2', name: '韩笑', role: '设计' },
    { id: 'm3', name: '周一航', role: '前端（移出会失败）' },
    { id: 'm4', name: '许悠', role: '测试' },
  ]);

  async function remove(member: Member) {
    try {
      await removeMember(member);
      members = members.filter((item) => item.id !== member.id);
      toaster.success(`已移出 ${member.name}`);
    } catch (error) {
      toaster.error('移出失败', { description: (error as Error).message });
      // 返回 false：气泡保持打开，可以再试或取消
      return false;
    }
  }

  return () => (
    <Flex direction="column" gap="sm">
      {members.map((member) => (
        <Flex key={member.id} align="center" justify="between" gap="md">
          <Flex align="center" gap="sm">
            <Avatar name={member.name} size="sm" />
            <Flex direction="column">
              <Text size="sm" weight="medium">
                {member.name}
              </Text>
              <Small tone="muted">{member.role}</Small>
            </Flex>
            {member.owner && (
              <Badge size="xs" variant="soft" tone="accent">
                负责人
              </Badge>
            )}
          </Flex>
          {member.owner ? (
            <Small tone="muted">不能移出</Small>
          ) : (
            <Popconfirm
              title={`把 ${member.name} 移出项目？`}
              description="移出后不再收到项目的待办与通知，已提交的记录保留。"
              tone="danger"
              confirmText="移出"
              onConfirm={() => remove(member)}
              trigger={(props) => (
                <IconButton
                  {...props}
                  icon={UserMinus}
                  variant="ghost"
                  tone="neutral"
                  aria-label={`移出 ${member.name}`}
                />
              )}
            />
          )}
        </Flex>
      ))}
      <Flex justify="end">
        <Popconfirm
          title="清空回收站？"
          description="回收站里的 12 个文件将被永久删除。"
          tone="danger"
          icon={Trash2}
          confirmText="清空"
          placement="top-end"
          onConfirm={() => void toaster.success('回收站已清空')}
          trigger={(props) => (
            <Button {...props} size="sm" variant="soft" tone="danger" icon={Trash2}>
              清空回收站
            </Button>
          )}
        />
      </Flex>
      <Toaster controller={toaster} placement="bottom-end" />
    </Flex>
  );
});
