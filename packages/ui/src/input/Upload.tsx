/**
 * 上传（div）：FileDrop 选文件，下面列出文件、上传进度、失败重试与移除。只负责界面与状态，怎样上传由 upload 决定：
 *
 *   <Upload
 *     value={_bind(files)}
 *     multiple
 *     accept="image/*"
 *     maxSize={5_000_000}
 *     upload={(file, { onProgress, signal }) => api.upload(file, { onProgress, signal })}
 *   />
 *
 * - value 是 UploadFile 的数组（文件、状态、进度、错误、upload 的结果），父级写 value={_bind(list)}；
 * - 给了 upload 时选到文件就开始上传，否则停在 selected（等提交时一起上传）；移除正在上传的文件会中止（signal）；
 * - 超过 maxSize、不在 accept 里的文件也列出来，带错误、不上传；单选（不写 multiple）时新文件替换旧的；
 * - 在 Field 里时关联标签与错误；写了 name 时有一个隐藏的 file input 带着全部文件，原生提交（FormData）也拿得到。
 *
 * 部件：Root（div）、Drop（FileDrop）、List（ul）、Item（li）、Body（文件名与下一行）、Name、Meta（大小或错误）、Progress。
 */
import { CircleAlert, CircleCheck, File as FileIcon, RotateCw, X } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount } from 'vue';
import { Icon } from '../base/Icon';
import { IconButton } from '../base/IconButton';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { Progress, type ProgressProps } from '../feedback/Progress';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { itemStyles } from '../utils/style/item-styles';
import { FileDrop, type FileDropProps } from './FileDrop';
import { GridList, type GridProps } from '../layout/Grid';

/** 列表里的一个文件 */
export interface UploadFile {
  /** 组件给的 id，同一个列表里唯一 */
  readonly id: string;
  /** 文件 */
  readonly file: File;
  /** selected：选了、还没上传；uploading：上传中；done：完成；error：失败或没通过检查 */
  readonly status: 'selected' | 'uploading' | 'done' | 'error';
  /** 上传进度 0–1；upload 没报告进度时为 undefined（不确定进度） */
  readonly progress?: number;
  /** 错误信息 */
  readonly error?: string;
  /** 没通过大小或类型检查：不会上传，也不能重试 */
  readonly rejected?: boolean;
  /** upload 的返回值（如文件地址） */
  readonly response?: unknown;
}

/** 上传一个文件：报告进度、响应中止；成功时 resolve（值记在 response 上），失败时 reject */
export type UploadHandler = (
  file: File,
  context: { onProgress: (fraction: number) => void; signal: AbortSignal },
) => Promise<unknown>;

/** 未声明的属性落到外层 div 上 */
export interface UploadProps extends PartProps<'div'> {
  /** 文件列表：父级写 value={_bind(list)} */
  value?: UploadFile[];
  /** 怎样上传一个文件；不写时只选文件、不上传 */
  upload?: UploadHandler;
  /** 接受的文件类型（同原生 accept） */
  accept?: string;
  /** 可以选多个；不写时新文件替换旧的 */
  multiple?: boolean;
  /** 单个文件的大小上限（字节） */
  maxSize?: number;
  /** 最多几个文件，超出的不加进来 */
  maxFiles?: number;
  /** 原生表单提交时的字段名：写了才有隐藏的 file input */
  name?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 必填 */
  required?: boolean;
  /** 选择区域里提示文字下面的说明（大小、类型限制） */
  description?: FileDropProps['description'];
  /** 选择区域（FileDrop）的部件属性 */
  propsDrop?: Partial<FileDropProps>;
  /** 列表的部件属性 */
  propsList?: Partial<GridProps<'ul'>>;
  /** 每一项的部件属性，可以按文件计算 */
  propsItem?: PartProps<'li'> | ((file: UploadFile) => PartProps<'li'>);
  /** 每一项里文件名与下一行（大小、错误或进度）的外层的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 每一项里文件名的部件属性 */
  propsName?: PartProps<'span'>;
  /** 每一项里文件大小或错误信息的部件属性 */
  propsMeta?: PartProps<'span'>;
  /** 每一项上传中的进度条的部件属性 */
  propsProgress?: Partial<ProgressProps>;
}

/** Upload 的样式：root、list、item、icon、body、name、meta、error、progress */
export const uploadStyles = stylex.create({
  root: { display: 'grid', gap: '_sm' },
  item: {
    cursor: 'default',
    gap: '_sm',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
  },
  icon: { flexShrink: 0, color: '_textMuted' },
  body: { display: 'grid', gap: '_xs', flexGrow: 1, minWidth: 0 },
  name: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: '_sm', color: '_textMuted' },
  error: { color: '_dangerText' },
  done: { color: '_successText' },
  progress: { width: '_full' },
});

let nextId = 0;

/** 上传：选文件、列出文件与进度、失败重试、移除 */
export const Upload = _component(
  ({
    value = _bindable<UploadFile[]>([]),
    upload,
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    name,
    disabled,
    invalid,
    required,
    description,
    propsDrop,
    propsList,
    propsItem,
    propsBody,
    propsName,
    propsMeta,
    propsProgress,
    ...rest
  }: UploadProps) => {
    const lang = useLang();
    const format = useFormat();
    let hidden = _state.raw<HTMLInputElement | null>(null);
    // 每个正在上传的文件一个：移除、重试、卸载时中止
    const controllers = new Map<string, AbortController>();
    onBeforeUnmount(() => controllers.forEach((controller) => controller.abort()));

    const patch = (id: string, changes: Partial<UploadFile>) =>
      (value = value.map((item) => (item.id === id ? { ...item, ...changes } : item)));

    async function start(item: UploadFile) {
      if (!upload) return;
      controllers.get(item.id)?.abort();
      const controller = new AbortController();
      controllers.set(item.id, controller);
      patch(item.id, { status: 'uploading', progress: undefined, error: undefined });
      try {
        const response = await upload(item.file, {
          onProgress: (fraction) => {
            if (!controller.signal.aborted) patch(item.id, { progress: fraction });
          },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) patch(item.id, { status: 'done', progress: 1, response });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error && error.message ? error.message : lang.uploadFailed;
        patch(item.id, { status: 'error', error: message });
      } finally {
        if (controllers.get(item.id) === controller) controllers.delete(item.id);
      }
    }

    function remove(id: string) {
      controllers.get(id)?.abort();
      controllers.delete(id);
      value = value.filter((item) => item.id !== id);
    }

    function add(files: File[], rejectedType = false) {
      const entries = files.map((file): UploadFile => {
        const id = `upload-${++nextId}`;
        if (rejectedType) {
          return { id, file, status: 'error', error: lang.fileTypeRejected, rejected: true };
        }
        if (maxSize != null && file.size > maxSize) {
          const error = lang.fileTooLarge(format.fileSize(maxSize));
          return { id, file, status: 'error', error, rejected: true };
        }
        return { id, file, status: 'selected' };
      });
      if (!multiple) value.forEach((item) => controllers.get(item.id)?.abort());
      const kept = multiple ? value : [];
      const room = maxFiles == null ? entries.length : Math.max(0, maxFiles - kept.length);
      const added = (multiple ? entries : entries.slice(-1)).slice(0, room);
      value = [...kept, ...added];
      added.filter((item) => item.status === 'selected').forEach((item) => void start(item));
    }

    // 隐藏的 file input 带着全部可提交的文件：原生提交、FormData 拿得到
    _effect(() => {
      if (!hidden || typeof DataTransfer === 'undefined') return;
      const transfer = new DataTransfer();
      value.filter((item) => !item.rejected).forEach((item) => transfer.items.add(item.file));
      hidden.files = transfer.files;
    });

    function renderItem(item: UploadFile) {
      const own = typeof propsItem === 'function' ? propsItem(item) : propsItem;
      const fileName = item.file.name;
      const failed = item.status === 'error';
      return (
        <li
          key={item.id}
          {...mergeAttrs<'li'>({ sx: [itemStyles.row, uploadStyles.item] }, own)}
          data-state={item.status}
        >
          <Icon
            icon={failed ? CircleAlert : item.status === 'done' ? CircleCheck : FileIcon}
            sx={[
              uploadStyles.icon,
              failed && uploadStyles.error,
              item.status === 'done' && uploadStyles.done,
            ]}
          />
          <div {...mergeAttrs<'div'>({ sx: uploadStyles.body }, propsBody)}>
            <span {...mergeAttrs<'span'>({ sx: uploadStyles.name }, propsName)}>{fileName}</span>
            {item.status === 'uploading' ? (
              <Progress
                {...mergePartProps<ProgressProps>(
                  { size: 'xs', 'aria-label': fileName, sx: uploadStyles.progress },
                  propsProgress,
                  { value: item.progress == null ? null : Math.round(item.progress * 100) },
                )}
              />
            ) : (
              <span
                {...mergeAttrs<'span'>(
                  { sx: [uploadStyles.meta, failed && uploadStyles.error] },
                  propsMeta,
                )}
              >
                {failed ? item.error : format.fileSize(item.file.size)}
                {item.status === 'done' && <VisuallyHidden> {lang.uploadDone}</VisuallyHidden>}
              </span>
            )}
          </div>
          {failed && upload && !item.rejected && (
            <IconButton
              icon={RotateCw}
              variant="ghost"
              size="sm"
              aria-label={lang.uploadRetry(fileName)}
              onClick={() => void start(item)}
            />
          )}
          <IconButton
            icon={X}
            variant="ghost"
            size="sm"
            aria-label={lang.uploadRemove(fileName)}
            disabled={disabled}
            onClick={() => remove(item.id)}
          />
        </li>
      );
    }

    return () => (
      <div {...mergeAttrs<'div'>({ sx: uploadStyles.root }, rest)}>
        <FileDrop
          {...mergePartProps<FileDropProps>(
            { accept, multiple, disabled, invalid, required, description },
            propsDrop,
            {
              onFiles: (files) => add(files),
              onReject: (files) => add(files, true),
            },
          )}
        />
        {name != null && (
          <input
            ref={_toRef(hidden)}
            type="file"
            name={name}
            multiple
            hidden
            tabindex={-1}
            aria-hidden="true"
          />
        )}
        {value.length > 0 && (
          // 状态变化（失败、完成）由读屏播报
          <GridList
            {...mergePartProps<GridProps<'ul'>>({ gap: 'xs' }, propsList)}
            aria-live="polite"
          >
            {value.map(renderItem)}
          </GridList>
        )}
      </div>
    );
  },
);
