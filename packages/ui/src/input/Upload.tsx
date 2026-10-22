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
 *   <Upload value={_bind(files)} action="/files" />   用应用配置的请求客户端（http）上传
 *
 * - value 是 UploadFile 的数组（文件、状态、进度、错误、upload 的结果），父级写 value={_bind(list)}；
 * - 给了 upload 或 action 时选到文件就开始上传，否则停在 selected（等提交时一起上传）；移除正在上传的文件会中止（signal）；
 * - action：经 createUi / Provider 的 http 把文件 POST 过去（multipart，字段名 fieldName），与其他请求共用 baseURL、令牌与拆包；
 *   fetch 拿不到上传的字节进度，进度条是不确定的，要进度时写 upload（XMLHttpRequest 的 upload.onprogress）；
 * - 超过 maxSize、不在 accept 里的文件也列出来，带错误、不上传；单选（不写 multiple）时新文件替换旧的；
 * - 已有文件（之前上传过、从后端读回来的）用 existingUploadFile 放进 value：状态是 done，没有 File，
 *   给了 url 时文件名链到它（预览、下载），可以移除；
 *
 *   let files = _state([existingUploadFile({ name: '验证报告.pdf', url: '/files/123' })]);
 * - 在 Field 里时关联标签与错误；写了 name 时有一个隐藏的 file input 带着全部文件，原生提交（FormData）也拿得到。
 *
 * 部件：Root（div）、Drop（FileDrop）、List（ul）、Item（li）、Icon（文件图标）、Body（文件名与下一行）、Name、Meta（大小或错误）、
 * Progress、Retry（重试按钮）、Remove（移除按钮）。
 */
import { CircleAlert, CircleCheck, File as FileIcon, RotateCw, X } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { Link } from '../base/Link';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { useFieldControl } from '../form/Field';
import { useHttp } from '../utils/request/http';
import { Progress, type ProgressProps } from '../feedback/Progress';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { itemStyles } from '../utils/style/item-styles';
import { FileDrop, type FileDropProps } from './FileDrop';
import { GridList, type GridProps } from '../layout/Grid';

/** 列表里的一个文件 */
export interface UploadFile {
  /** 组件给的 id，同一个列表里唯一 */
  readonly id: string;
  /** 文件名 */
  readonly name: string;
  /** 大小（字节）；已有文件不知道时为 undefined */
  readonly size?: number;
  /** 选的文件；已有文件没有 */
  readonly file?: File;
  /** 已有文件的地址：文件名链到它 */
  readonly url?: string;
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
  /** 怎样上传一个文件；不写时用 action，都没有时只选文件、不上传 */
  upload?: UploadHandler;
  /** 上传地址：没写 upload 时用应用配置的请求客户端（useHttp）POST 过去，响应体记在 response 上 */
  action?: string;
  /** action 上传时文件在表单里的字段名，默认 file */
  fieldName?: string;
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
  /** 只读：只列出文件，不能再选、不能移除或重试 */
  readonly?: boolean;
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
  /** 每一项的文件图标（按状态是文件、对勾或警告）的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 每一项里文件名与下一行（大小、错误或进度）的外层的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 每一项里文件名的部件属性 */
  propsName?: PartProps<'span'>;
  /** 每一项里文件大小或错误信息的部件属性 */
  propsMeta?: PartProps<'span'>;
  /** 每一项上传中的进度条的部件属性；进度与名称（文件名）由组件管理 */
  propsProgress?: Omit<Partial<ProgressProps>, 'value' | 'aria-label'>;
  /**
   * 每一项失败后的重试按钮的部件属性。名称（重新上传 文件名）每项不同，由组件按语言包生成，
   * 改文案请改语言包的 uploadRetry；点击由组件管理
   */
  propsRetry?: Omit<Partial<IconButtonProps>, 'aria-label' | 'onClick'>;
  /** 每一项的移除按钮的部件属性；名称（语言包的 uploadRemove）、点击与不可用由组件管理 */
  propsRemove?: Omit<Partial<IconButtonProps>, 'aria-label' | 'onClick' | 'disabled'>;
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

/** 已有文件（之前上传过、从后端读回来的）：放进 Upload 的 value，状态是 done */
export function existingUploadFile(file: {
  /** 标识；不写时生成一个 */
  id?: string;
  /** 文件名 */
  name: string;
  /** 大小（字节） */
  size?: number;
  /** 地址：文件名链到它 */
  url?: string;
}): UploadFile {
  return { ...file, id: file.id ?? `upload-${++nextId}`, status: 'done', response: file.url };
}

/** 上传：选文件、列出文件与进度、失败重试、移除 */
export const Upload = _component(
  ({
    value = _bindable<UploadFile[]>([]),
    upload,
    action,
    fieldName = 'file',
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    name,
    disabled,
    readonly,
    invalid,
    required,
    description,
    propsDrop,
    propsList,
    propsItem,
    propsIcon,
    propsBody,
    propsName,
    propsMeta,
    propsProgress,
    propsRetry,
    propsRemove,
    ...rest
  }: UploadProps) => {
    const lang = useLang();
    const format = useFormat();
    // delegate：里面的 FileDrop 照常从 Field 拿 id、说明与标签
    const control = useFieldControl(() => ({ invalid, required, disabled, readonly }), {
      delegate: true,
    });
    const http = useHttp();
    /** 实际用的上传函数：upload 优先，其次按 action 用请求客户端发 */
    const uploader = (): UploadHandler | undefined =>
      upload ??
      (action
        ? (file, { signal }) => {
            const body = new FormData();
            body.append(fieldName, file);
            return http.request({ method: 'POST', url: action, body, signal });
          }
        : undefined);
    let hidden = _state.raw<HTMLInputElement | null>(null);
    // 每个正在上传的文件一个：移除、重试、卸载时中止
    const controllers = new Map<string, AbortController>();
    onBeforeUnmount(() => controllers.forEach((controller) => controller.abort()));

    const patch = (id: string, changes: Partial<UploadFile>) =>
      (value = value.map((item) => (item.id === id ? { ...item, ...changes } : item)));

    async function start(item: UploadFile) {
      const send = uploader();
      if (!send || !item.file) return;
      controllers.get(item.id)?.abort();
      const controller = new AbortController();
      controllers.set(item.id, controller);
      patch(item.id, { status: 'uploading', progress: undefined, error: undefined });
      try {
        const response = await send(item.file!, {
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
        const base = { id: `upload-${++nextId}`, name: file.name, size: file.size, file };
        if (rejectedType) {
          return { ...base, status: 'error', error: lang.fileTypeRejected, rejected: true };
        }
        if (maxSize != null && file.size > maxSize) {
          const error = lang.fileTooLarge(format.fileSize(maxSize));
          return { ...base, status: 'error', error, rejected: true };
        }
        return { ...base, status: 'selected' };
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
      for (const item of value) if (item.file && !item.rejected) transfer.items.add(item.file);
      hidden.files = transfer.files;
    });

    function renderItem(item: UploadFile) {
      const state = control();
      const own = typeof propsItem === 'function' ? propsItem(item) : propsItem;
      const fileName = item.name;
      const failed = item.status === 'error';
      return (
        <li
          key={item.id}
          {...mergeAttrs<'li'>({ sx: [itemStyles.row, uploadStyles.item] }, own)}
          data-state={item.status}
        >
          <Icon
            {...mergePartProps<IconProps>(
              {
                icon: failed ? CircleAlert : item.status === 'done' ? CircleCheck : FileIcon,
                sx: [
                  uploadStyles.icon,
                  failed && uploadStyles.error,
                  item.status === 'done' && uploadStyles.done,
                ],
              },
              propsIcon,
            )}
          />
          <div {...mergeAttrs<'div'>({ sx: uploadStyles.body }, propsBody)}>
            <span {...mergeAttrs<'span'>({ sx: uploadStyles.name }, propsName)}>
              {item.url ? (
                <Link href={item.url} target="_blank">
                  {fileName}
                </Link>
              ) : (
                fileName
              )}
            </span>
            {item.status === 'uploading' ? (
              <Progress
                {...mergePartProps<ProgressProps>(
                  { size: 'xs', sx: uploadStyles.progress },
                  propsProgress,
                  {
                    value: item.progress == null ? null : Math.round(item.progress * 100),
                    'aria-label': fileName,
                  },
                )}
              />
            ) : (
              <span
                {...mergeAttrs<'span'>(
                  { sx: [uploadStyles.meta, failed && uploadStyles.error] },
                  propsMeta,
                )}
              >
                {failed ? item.error : item.size != null && format.fileSize(item.size)}
                {item.status === 'done' && <VisuallyHidden> {lang.uploadDone}</VisuallyHidden>}
              </span>
            )}
          </div>
          {failed && uploader() && !item.rejected && !state.readonly && (
            <IconButton
              {...mergePartProps<IconButtonProps>(
                {
                  icon: RotateCw,
                  variant: 'ghost',
                  size: 'sm',
                  // 名称带文件名、每项不同：类型里不让使用方覆盖（同一个值会让各项的按钮同名）
                  'aria-label': lang.uploadRetry(fileName),
                },
                propsRetry,
                { onClick: () => void start(item) },
              )}
            />
          )}
          {!state.readonly && (
            <IconButton
              {...mergePartProps<IconButtonProps>(
                {
                  icon: X,
                  variant: 'ghost',
                  size: 'sm',
                  'aria-label': lang.uploadRemove(fileName),
                },
                propsRemove,
                { disabled: state.disabled, onClick: () => remove(item.id) },
              )}
            />
          )}
        </li>
      );
    }

    return () => {
      const state = control();
      return (
        <div {...mergeAttrs<'div'>({ sx: uploadStyles.root }, rest)}>
          {!state.readonly && (
            <FileDrop
              {...mergePartProps<FileDropProps>(
                {
                  accept,
                  multiple,
                  disabled: state.disabled,
                  invalid: state.invalid,
                  // 选好的文件不在这个输入框里（它选完就清空）：已有文件时不再原生必填，免得表单交不了
                  required: state.required && value.length === 0,
                  description,
                },
                propsDrop,
                {
                  onFiles: (files) => add(files),
                  onReject: (files) => add(files, true),
                },
              )}
            />
          )}
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
    };
  },
);
