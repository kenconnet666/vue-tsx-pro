// 建议详情的沟通：留言与回复、身份标记（供应商 / 内部岗位）、@ 提及、附件。发出去的留言直接加进列表（乐观更新），
// 内容里写“失败”会模拟接口出错：内容保留并提示。自己的留言可以删除（actions）
import { Trash2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Badge, Button, Card, type ListboxOption, type UploadHandler } from '@vue-tsx-pro/ui';
import { CommentThread, type CommentDraft, type CommentItem } from '@vue-tsx-pro/ui/patterns';
import { photo } from '../../../display/Avatar/demo/photos';

const people: ListboxOption[] = [
  { value: 'E2007', label: '方圆', description: '成本工程师', group: '财务部' },
  { value: 'E2015', label: '韩笑', description: '财务部负责人', group: '财务部' },
  { value: 'E1031', label: '陆川', description: '采购经理', group: '采购部' },
  { value: 'S0088', label: '华辰-李工', description: '供应商技术', group: '供应商' },
];

const supplier = (
  <Badge tone="warning" size="sm">
    供应商
  </Badge>
);
const internal = (role: string) => <Badge size="sm">{role}</Badge>;
const me = { name: '方圆', avatar: photo('#10b981', '#0d9488') };

const initial: CommentItem[] = [
  {
    id: 'c1',
    author: '华辰-李工',
    role: supplier,
    content:
      '支架改用 6063-T5 后壁厚可以从 3.0 减到 2.6，强度校核见附件。@方圆 麻烦确认一下测算里的材料单价是否按新牌号。',
    time: '2026-10-21T09:12:00+08:00',
    attachments: [
      { name: '支架强度校核.pdf', url: '#', size: 1_240_000 },
      { name: '6063 报价.xlsx', url: '#', size: 38_000 },
    ],
    replies: [
      {
        id: 'c2',
        author: '方圆',
        avatar: me.avatar,
        role: internal('成本工程师'),
        content: '已按 6063-T5 的 10 月均价重算，单价降到 ¥116.80。@韩笑 请过目。',
        time: '2026-10-21T14:30:00+08:00',
      },
      {
        id: 'c3',
        author: '韩笑',
        role: internal('财务部负责人'),
        content: '@方圆 年用量按 Q4 排产补到 45,500，其余没问题。',
        time: '2026-10-22T10:05:00+08:00',
        edited: true,
      },
    ],
  },
  {
    id: 'c4',
    author: '陆川',
    role: internal('采购经理'),
    content: '换供应商的话交期能不能保证？@华辰-李工 请给一下首批的排产计划。',
    time: '2026-10-23T16:40:00+08:00',
  },
];

/** 模拟上传：一秒内完成 */
const upload: UploadHandler = (file, { onProgress }) =>
  new Promise((resolve) => {
    let fraction = 0;
    const timer = setInterval(() => {
      fraction += 0.25;
      onProgress(Math.min(fraction, 1));
      if (fraction < 1) return;
      clearInterval(timer);
      resolve(`/files/${encodeURIComponent(file.name)}`);
    }, 200);
  });

export default _component(() => {
  let comments = _state<CommentItem[]>(initial);
  let sequence = 0;

  /** 模拟接口：半秒后成功；内容里有“失败”时出错 */
  async function send(draft: CommentDraft) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (draft.content.includes('失败')) throw new Error('网络错误');
    const comment: CommentItem = {
      id: `new-${(sequence += 1)}`,
      author: me.name,
      avatar: me.avatar,
      role: internal('成本工程师'),
      content: draft.content,
      time: new Date().toISOString(),
      attachments: draft.attachments.map((file) => ({
        name: file.name,
        size: file.size,
        url: String(file.response),
      })),
    };
    comments = draft.replyTo
      ? comments.map((thread) =>
          thread.id === draft.replyTo
            ? { ...thread, replies: [...(thread.replies ?? []), comment] }
            : thread,
        )
      : [...comments, comment];
  }

  /** 删掉自己的一条（回复也行） */
  function remove(id: string) {
    comments = comments
      .filter((thread) => thread.id !== id)
      .map((thread) => ({
        ...thread,
        replies: thread.replies?.filter((reply) => reply.id !== id),
      }));
  }

  return () => (
    <Card>
      <CommentThread
        comments={comments}
        people={people}
        currentUser={me}
        upload={upload}
        onSend={send}
        actions={(comment) =>
          comment.author === me.name && (
            <Button
              variant="link"
              tone="danger"
              size="sm"
              icon={Trash2}
              onClick={() => remove(comment.id)}
            >
              删除
            </Button>
          )
        }
      />
    </Card>
  );
});
