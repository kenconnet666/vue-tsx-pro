/**
 * 图片上传：已选的图片排成方格（可删除、显示上传中与失败），最后一格点了选图（H5 是文件选择，小程序是相册或拍照）。
 * 只管选图与展示；上传由使用方在 onRead 里做，改文件的 status 显示进度。
 *
 *   <Uploader _value={photos} maxCount={6} onRead={(files) => files.forEach(upload)} />
 *
 *   async function upload(file: UploaderFile) {
 *     file.status = 'uploading';
 *     try { file.url = await api.upload(file.file!); file.status = 'done'; }
 *     catch { file.status = 'failed'; file.message = '上传失败'; }
 *   }
 */
import { Camera, CircleX, X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { reactive, type VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useConfig } from '../config/context';
import { Image } from '../display/Image';
import { Loading } from '../feedback/Loading';
import { useHost } from '../utils/host';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';
import { useForm } from './context';

/** 一个文件 */
export interface UploaderFile {
  /** 预览（及上传完）的地址 */
  url: string;
  /** H5 里选到的 File，上传时用；小程序里没有（用 url 这个临时路径上传） */
  file?: File;
  /** 字节数 */
  size?: number;
  /** 上传的状态；不给时是已完成 */
  status?: 'uploading' | 'failed' | 'done';
  /** 状态下面的文字（“上传中”“上传失败”） */
  message?: string;
}

/** 未声明的属性落到根元素（div）上 */
export interface UploaderProps extends Omit<PartProps<'div'>, 'onChange'> {
  /** 已选的文件；双向绑定写 `_value={x}` */
  _value?: UploaderFile[];
  /** 最多几张 */
  maxCount?: number;
  /** 单张最大字节数；超过的不加进来，交给 onOversize */
  maxSize?: number;
  /**
   * 一次可以选多张
   * @default true
   */
  multiple?: boolean;
  /**
   * 能删除
   * @default true
   */
  deletable?: boolean;
  /** 禁用 */
  disabled?: boolean;
  /**
   * 方格的边长（CSS 长度）
   * @default '5em'
   */
  previewSize?: string;
  /** 选图那一格的文字；不给时用语言包的“上传图片” */
  uploadText?: VNodeChild;
  /** 选好了：新加的文件（已经在 _value 里，是响应式的，改 status 会刷新） */
  onRead?: (files: UploaderFile[]) => void;
  /** 有文件超过 maxSize */
  onOversize?: (files: UploaderFile[]) => void;
  /** 删除了一张 */
  onDelete?: (file: UploaderFile, index: number) => void;
  /** 点了一张预览 */
  onPreview?: (file: UploaderFile, index: number) => void;
  /** 每一格预览的部件属性 */
  propsItem?: PartProps<'div'>;
  /** 选图那一格的部件属性 */
  propsUpload?: PartProps<'button'>;
}

/** Uploader 的样式：root、item、mask、remove、upload */
export const uploaderStyles = css.create({
  root: { display: 'flex', flexWrap: 'wrap', gap: '0.5em' },
  item: { position: 'relative', flex: 'none', overflow: 'hidden', borderRadius: '_md' },
  mask: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25em',
    // 盖在图片上的深色层：两套主题里都是深底白字
    backgroundColor: '_overlay',
    color: '#fff',
    fontSize: '_xs',
  },
  remove: {
    position: 'absolute',
    insetBlockStart: 0,
    insetInlineEnd: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.4em',
    height: '1.4em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    borderEndStartRadius: '_md',
    backgroundColor: '_overlay',
    color: '#fff',
    fontSize: '_xs',
    cursor: 'pointer',
  },
  upload: {
    boxSizing: 'border-box',
    flex: 'none',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.3em',
    margin: 0,
    padding: '0.25em',
    borderWidth: 0,
    borderRadius: '_md',
    backgroundColor: { default: '_fill', ':active:not([disabled])': '_fillActive' },
    color: '_textMuted',
    fontFamily: 'inherit',
    fontSize: '_xs',
    cursor: { default: 'pointer', '[disabled]': 'not-allowed' },
    opacity: { default: 1, '[disabled]': '_disabled' },
  },
  uploadIcon: { fontSize: '1.9em' },
});

/** 图片上传（div > 预览的方格 + 选图的一格） */
export const Uploader = _component(
  ({
    _value: value = _bindable<UploaderFile[]>([]),
    maxCount = Number.POSITIVE_INFINITY,
    maxSize,
    multiple = true,
    deletable = true,
    disabled,
    previewSize = '5em',
    uploadText,
    onRead,
    onOversize,
    onDelete,
    onPreview,
    propsItem,
    propsUpload,
    ...rest
  }: UploaderProps) => {
    const config = useConfig();
    const host = useHost();
    const form = useForm();
    const isDisabled = () => disabled ?? form?.disabled ?? false;

    const choose = async () => {
      const room = maxCount - value.length;
      if (room <= 0) return;
      const chosen = await host.chooseImages({ count: multiple ? Math.min(room, 9) : 1 });
      // 响应式：使用方在 onRead 里改 status、url 会刷新
      const files = chosen
        .slice(0, room)
        .map((image) =>
          reactive<UploaderFile>({ url: image.url, file: image.file, size: image.size }),
        );
      const oversize =
        maxSize === undefined ? [] : files.filter((file) => (file.size ?? 0) > maxSize);
      const accepted = files.filter((file) => !oversize.includes(file));
      if (oversize.length) onOversize?.(oversize);
      if (!accepted.length) return;
      value = [...value, ...accepted];
      onRead?.(accepted);
    };
    const remove = (index: number) => {
      const file = value[index]!;
      value = value.filter((_, position) => position !== index);
      onDelete?.(file, index);
    };

    return () => {
      const off = isDisabled();
      const size = { width: previewSize, height: previewSize };
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: uploaderStyles.root },
            rest,
            dataAttrs({ 'data-disabled': off }),
          )}
        >
          {value.map((file, index) => (
            <div
              {...mergeAttrs<'div'>({ sx: uploaderStyles.item, style: size }, propsItem, {
                onClick: () => onPreview?.(file, index),
                ...dataAttrs({ 'data-status': file.status }),
              })}
            >
              <Image src={file.url} width={previewSize} height={previewSize} fit="cover" />
              {(file.status === 'uploading' || file.status === 'failed') && (
                <div {...mergeAttrs<'div'>({ sx: uploaderStyles.mask })}>
                  {file.status === 'uploading' ? (
                    <Loading size={20} />
                  ) : (
                    <Icon icon={CircleX} size={20} />
                  )}
                  {hasContent(file.message) && <span>{file.message}</span>}
                </div>
              )}
              {deletable && !off && file.status !== 'uploading' && (
                <button
                  {...mergeAttrs<'button'>({ sx: uploaderStyles.remove })}
                  type="button"
                  aria-label={config.lang.remove}
                  onClick={(event: Event) => {
                    // 不当成点了预览
                    event.stopPropagation();
                    remove(index);
                  }}
                >
                  <Icon icon={X} />
                </button>
              )}
            </div>
          ))}
          {value.length < maxCount && (
            <button
              {...mergeAttrs<'button'>({ sx: uploaderStyles.upload, style: size }, propsUpload, {
                type: 'button',
                disabled: off,
                onClick: () => void choose(),
              })}
            >
              <Icon icon={Camera} sx={uploaderStyles.uploadIcon} />
              {uploadText ?? config.lang.upload}
            </button>
          )}
        </div>
      );
    };
  },
);
