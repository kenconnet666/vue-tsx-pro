/**
 * 留言：一串留言与回复（沟通记录、协商的逐条回应、审批时的讨论），下面是写留言的输入框。
 * 留言里可以 @ 人（Mentions）、带附件（Upload），回复只分一层：回复一条回复时仍挂在那串下面，开头写上“@作者 ”。
 *
 *   <CommentThread
 *     comments={comments}                                  // { id, author, avatar?, role?, content, time, attachments?, replies? }
 *     people={people}                                      // 可以 @ 的人（ListboxOption），留言里“@名字”按它高亮
 *     upload={(file, context) => api.upload(file, context)} // 不给时不能带附件
 *     onSend={async (draft) => await api.comment(draft)} // { content, mentions, attachments, replyTo? }；不给时只读
 *   />
 *
 * 发送：按钮或 Ctrl + Enter；onSend 返回 Promise 时按钮转圈，成功后清空，失败时保留内容并提示。
 * 留言存在哪、发出去以后怎样出现在 comments 里由应用决定（乐观更新或重新取）。
 * 时间写成相对现在（3 分钟前），悬停看完整时间。actions 给每条留言加操作（编辑、删除、标为已解决）。
 *
 * 单独的输入框用 CommentComposer（协商回复、审批意见）。
 * 部件：Root（div）、List（ul）、Item（li，可以按条计算）、Composer（CommentComposer）。
 */
import { Paperclip } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { onMounted, type VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { Icon } from '../base/Icon';
import { Link } from '../base/Link';
import { useFormat } from '../config/lang/format';
import { useMessages } from '../config/lang/messages';
import { Avatar, initials } from '../display/Avatar';
import { Empty } from '../feedback/Empty';
import { Mentions, MentionText, type MentionsProps } from '../input/Mentions';
import type { ListboxOption } from '../input/list-state';
import { Upload, type UploadFile, type UploadHandler } from '../input/Upload';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { patternsMessages } from './messages';

/** 留言的一个附件 */
export interface CommentAttachment {
  /** 文件名 */
  name: string;
  /** 地址：文件名链到它（预览、下载） */
  url?: string;
  /** 大小（字节） */
  size?: number;
}

/** 一条留言 */
export interface CommentItem {
  /** 标识 */
  id: string;
  /** 作者 */
  author: string;
  /** 作者的头像地址；没有时显示首字母 */
  avatar?: string;
  /** 作者的身份（岗位、“供应商”标记），在名字后面 */
  role?: VNodeChild;
  /** 内容：文字，“@名字”按 people 高亮 */
  content: string;
  /** 发表的时间（ISO） */
  time: string;
  /** 改过 */
  edited?: boolean;
  /** 附件 */
  attachments?: readonly CommentAttachment[];
  /** 内容下面的补充（逐条回应的“采纳 / 不采纳”、引用的字段对比） */
  extra?: VNodeChild;
  /** 回复（只分一层，回复里的 replies 不显示） */
  replies?: readonly CommentItem[];
}

/** 写好的一条留言：onSend 收到它 */
export interface CommentDraft {
  /** 内容（去掉首尾空白） */
  content: string;
  /** 内容里 @ 到的人（people 的 value） */
  mentions: string[];
  /** 上传完成的附件 */
  attachments: UploadFile[];
  /** 回复哪一串（那一串第一条留言的 id）；新的一串没有 */
  replyTo?: string;
}

/** 写留言的人：输入框前面的头像 */
export interface CommentAuthor {
  /** 名字 */
  name: string;
  /** 头像地址 */
  avatar?: string;
}

/** 未声明的属性落到外层 div 上 */
export interface CommentComposerProps extends PartProps<'div'> {
  /** 发送：返回 Promise 时等它完成，成功后清空；失败（reject）时保留内容并提示 */
  onSend: (draft: Omit<CommentDraft, 'replyTo'>) => unknown;
  /** 取消（回复时）：有它时显示取消按钮，按 Esc 也是取消 */
  onCancel?: () => void;
  /** 可以 @ 的人 */
  people?: readonly ListboxOption[];
  /** 上传附件；不给时不能带附件 */
  upload?: UploadHandler;
  /** 写留言的人：输入框前面的头像 */
  author?: CommentAuthor;
  /** 一开始的内容（回复时的“@作者 ”） */
  initialText?: string;
  /** 挂载后聚焦输入框（点了回复） */
  autofocus?: boolean;
  /** 输入框的提示，默认取文案 */
  placeholder?: string;
  /** 输入框（Mentions）的部件属性；它的 aria-label 是输入框的名称 */
  propsMentions?: Partial<MentionsProps>;
}

/** CommentThread、CommentComposer 的样式 */
export const commentStyles = stylex.create({
  root: { display: 'grid', gap: '_lg' },
  list: { display: 'grid', gap: '_lg', margin: 0, padding: 0, listStyle: 'none' },
  // 头像一列、内容一列
  item: { display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '_sm', alignItems: 'start' },
  body: { display: 'grid', gap: '_xs', minWidth: 0 },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '_sm',
    rowGap: '_xs',
  },
  author: { fontWeight: '_semibold', color: '_text' },
  meta: { fontSize: '_sm', color: '_textMuted' },
  content: { color: '_text' },
  attachments: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: '_md',
    rowGap: '_xs',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    fontSize: '_sm',
  },
  attachment: { display: 'inline-flex', alignItems: 'center', gap: '0.25em' },
  actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '_sm', fontSize: '_sm' },
  // 回复：缩进在内容列里，左边一条竖线
  replies: {
    display: 'grid',
    gap: '_md',
    margin: 0,
    marginBlockStart: '_xs',
    paddingInlineStart: '_md',
    listStyle: 'none',
    borderInlineStartWidth: '_sm',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_borderMuted',
  },
  composer: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: '_sm',
    alignItems: 'start',
  },
  composerNoAvatar: { gridTemplateColumns: '1fr' },
  composerMain: { display: 'grid', gap: '_xs', minWidth: 0 },
  composerFooter: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '_xs',
  },
  composerTools: { display: 'flex', alignItems: 'center', gap: '_sm' },
  hint: { fontSize: '_xs', color: '_textMuted' },
  error: { fontSize: '_sm', color: '_dangerText' },
});

/** 头像：有图片用图片，没有时是名字的首字母（名字就在旁边，头像只是装饰） */
const authorAvatar = (name: string, avatar: string | undefined) => (
  <Avatar src={avatar} fallback={initials(name)} size="sm" />
);

/** 写留言的输入框：提及、附件、发送 */
export const CommentComposer = _component(
  ({
    onSend,
    onCancel,
    people = [],
    upload,
    author,
    initialText = '',
    autofocus = false,
    placeholder,
    propsMentions,
    ...rest
  }: CommentComposerProps) => {
    const messages = useMessages('patterns', patternsMessages);
    // 只取一开始的值：回复时的“@作者 ”，之后由用户编辑
    let text = _state(_untrack(initialText));
    let mentions = _state<string[]>([]);
    let files = _state<UploadFile[]>([]);
    let attaching = _state(false);
    let sending = _state(false);
    let failed = _state(false);
    let root = _state.raw<HTMLElement | null>(null);

    onMounted(() => {
      if (!autofocus) return;
      const input = root?.querySelector('textarea');
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    });

    // 还在上传的附件：等它完成才能发送
    const uploading = () =>
      files.some((file) => file.status === 'uploading' || file.status === 'selected');
    const sendable = () => text.trim() !== '' && !uploading() && !sending;

    async function send() {
      if (!sendable()) return;
      sending = true;
      failed = false;
      try {
        await onSend({
          content: text.trim(),
          mentions,
          attachments: files.filter((file) => file.status === 'done'),
        });
        text = '';
        files = [];
        attaching = false;
      } catch {
        failed = true;
      } finally {
        sending = false;
      }
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void send();
      } else if (event.key === 'Escape' && onCancel && !event.defaultPrevented) {
        // 提及列表打开时 Esc 先关列表（它会 preventDefault）
        onCancel();
      }
    }

    return () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [commentStyles.composer, !author && commentStyles.composerNoAvatar] },
          rest,
          { ref: _toRef(root) },
        )}
      >
        {author && authorAvatar(author.name, author.avatar)}
        <div {...stylex.attrs(commentStyles.composerMain)}>
          <Mentions
            {...mergePartProps<MentionsProps>(
              {
                rows: 2,
                maxRows: 10,
                placeholder: placeholder ?? messages.commentPlaceholder,
                'aria-label': messages.comments,
              },
              propsMentions,
              { items: people, onKeydown },
            )}
            value={_bind(text)}
            mentions={_bind(mentions)}
          />
          {upload && attaching && <Upload value={_bind(files)} upload={upload} multiple />}
          {failed && (
            <div role="alert" {...stylex.attrs(commentStyles.error)}>
              {messages.commentSendFailed}
            </div>
          )}
          <div {...stylex.attrs(commentStyles.composerFooter)}>
            <div {...stylex.attrs(commentStyles.composerTools)}>
              {upload && (
                <Button
                  variant="ghost"
                  tone="neutral"
                  size="sm"
                  icon={Paperclip}
                  aria-pressed={attaching}
                  onClick={() => (attaching = !attaching)}
                >
                  {files.length > 0
                    ? `${messages.commentAttach} ${files.length}`
                    : messages.commentAttach}
                </Button>
              )}
              <span {...stylex.attrs(commentStyles.hint)}>{messages.commentSendHint}</span>
            </div>
            <div {...stylex.attrs(commentStyles.composerTools)}>
              {onCancel && (
                <Button variant="ghost" tone="neutral" size="sm" onClick={onCancel}>
                  {messages.commentCancel}
                </Button>
              )}
              <Button
                size="sm"
                loading={sending}
                disabled={!sendable()}
                onClick={() => void send()}
              >
                {messages.commentSend}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

/** 未声明的属性落到外层 div 上 */
export interface CommentThreadProps extends PartProps<'div'> {
  /** 留言，旧的在前；回复在各自的 replies 里 */
  comments: readonly CommentItem[];
  /** 可以 @ 的人：输入框的候选，也是留言里“@名字”高亮的依据 */
  people?: readonly ListboxOption[];
  /** 发送一条留言或回复；不给时只读（没有输入框与回复按钮） */
  onSend?: (draft: CommentDraft) => unknown;
  /** 上传附件；不给时不能带附件 */
  upload?: UploadHandler;
  /** 当前用户：输入框前面的头像 */
  currentUser?: CommentAuthor;
  /** 每条留言的操作（编辑、删除、标为已解决），在回复按钮后面 */
  actions?: (comment: CommentItem) => VNodeChild;
  /** 没有留言时显示的内容，默认取文案 */
  empty?: VNodeChild;
  /** “现在”的时间戳：相对时间按它算，默认是当前时间（文档与测试里固定它） */
  now?: number;
  /** 列表（ul）的部件属性 */
  propsList?: PartProps<'ul'>;
  /** 每条留言（li）的部件属性，可以按条计算 */
  propsItem?: PartProps<'li'> | ((comment: CommentItem) => PartProps<'li'>);
  /** 输入框（CommentComposer）的部件属性 */
  propsComposer?: Partial<Omit<CommentComposerProps, 'onSend'>>;
}

/** 一串留言与回复，下面是输入框 */
export const CommentThread = _component(
  ({
    comments,
    people = [],
    onSend,
    upload,
    currentUser,
    actions,
    empty,
    now,
    propsList,
    propsItem,
    propsComposer,
    ...rest
  }: CommentThreadProps) => {
    const messages = useMessages('patterns', patternsMessages);
    const format = useFormat();
    // 正在回复：哪一串（第一条的 id）与回复谁
    let replying = _state<{ thread: string; to: string } | null>(null);

    const item = (comment: CommentItem, thread: CommentItem): VNodeChild => {
      const own = typeof propsItem === 'function' ? propsItem(comment) : propsItem;
      const top = comment === thread;
      return (
        <li key={comment.id} {...mergeAttrs<'li'>({ sx: commentStyles.item }, own)}>
          {authorAvatar(comment.author, comment.avatar)}
          <article {...stylex.attrs(commentStyles.body)} aria-label={comment.author}>
            <div {...stylex.attrs(commentStyles.header)}>
              <span {...stylex.attrs(commentStyles.author)}>{comment.author}</span>
              {comment.role}
              <time
                datetime={comment.time}
                title={format.date(comment.time, { dateStyle: 'medium', timeStyle: 'short' })}
                {...stylex.attrs(commentStyles.meta)}
              >
                {format.relative(comment.time, { now })}
              </time>
              {comment.edited && (
                <span {...stylex.attrs(commentStyles.meta)}>{messages.commentEdited}</span>
              )}
            </div>
            <MentionText text={comment.content} options={people} sx={commentStyles.content} />
            {comment.attachments && comment.attachments.length > 0 && (
              <ul
                {...stylex.attrs(commentStyles.attachments)}
                aria-label={messages.commentAttachments}
              >
                {comment.attachments.map((file) => (
                  <li key={file.name} {...stylex.attrs(commentStyles.attachment)}>
                    <Icon icon={Paperclip} />
                    {file.url ? <Link href={file.url}>{file.name}</Link> : file.name}
                    {file.size != null && (
                      <span {...stylex.attrs(commentStyles.meta)}>
                        {format.fileSize(file.size)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {comment.extra}
            {(onSend || actions) && (
              <div {...stylex.attrs(commentStyles.actions)}>
                {onSend && (
                  <Button
                    variant="link"
                    tone="neutral"
                    size="sm"
                    onClick={() => (replying = { thread: thread.id, to: comment.author })}
                  >
                    {messages.commentReply}
                  </Button>
                )}
                {actions?.(comment)}
              </div>
            )}
            {top && replies(thread)}
          </article>
        </li>
      );
    };

    /** 一串的回复与回复的输入框 */
    const replies = (thread: CommentItem) => {
      const list = thread.replies ?? [];
      const open = replying?.thread === thread.id;
      if (list.length === 0 && !open) return null;
      return (
        <>
          {list.length > 0 && (
            <ul
              {...stylex.attrs(commentStyles.replies)}
              aria-label={messages.commentReplies(list.length)}
            >
              {list.map((reply) => item(reply, thread))}
            </ul>
          )}
          {open && onSend && (
            <CommentComposer
              {...mergePartProps<Partial<CommentComposerProps>>(
                { people, upload, author: currentUser },
                propsComposer,
                {
                  key: `${thread.id}:${replying!.to}`,
                  initialText: `@${replying!.to} `,
                  autofocus: true,
                  propsMentions: {
                    ...propsComposer?.propsMentions,
                    'aria-label': messages.commentReplyTo(replying!.to),
                  },
                  onCancel: () => (replying = null),
                },
              )}
              // onSend 有返回值（Promise），不经 mergePartProps：它会把 on 开头的属性当事件串起来
              onSend={async (draft) => {
                await onSend({ ...draft, replyTo: thread.id });
                replying = null;
              }}
            />
          )}
        </>
      );
    };

    return () => (
      <div {...mergeAttrs<'div'>({ sx: commentStyles.root }, rest)}>
        {comments.length === 0 ? (
          hasContent(empty) ? (
            empty
          ) : (
            <Empty size="sm" title={messages.commentsEmpty} />
          )
        ) : (
          <ul
            {...mergeAttrs<'ul'>({ sx: commentStyles.list }, propsList)}
            aria-label={messages.comments}
          >
            {comments.map((comment) => item(comment, comment))}
          </ul>
        )}
        {onSend && (
          <CommentComposer
            {...mergePartProps<Partial<CommentComposerProps>>(
              { people, upload, author: currentUser },
              propsComposer,
            )}
            onSend={onSend}
          />
        )}
      </div>
    );
  },
);
