import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ImageCropperProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Avatar from './demo/Avatar.tsx?demo';
import Cover from './demo/Cover.tsx?demo';

export const meta = {
  title: 'ImageCropper 裁剪图片',
  description:
    '头像、封面上传前裁一块：裁剪框固定在中间，图片在底下拖动、缩放，框里永远是图；裁好的输出成 canvas、Blob 或 File。',
  order: 20,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ImageCropper } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="avatar" title="上传头像时先裁剪" demo={Avatar}>
          <Link href="/components/upload">Upload</Link> 的 <Code>transform</Code>
          {
            ' 在选到的文件加进列表之前先过一遍：这里弹出对话框裁剪，确定后交回裁好的文件，取消（返回 null）就不加。'
          }
          <Code>shape="round"</Code> 是圆形裁剪框，输出的图四角透明；
          <Code>toFile(名字, {'{ width: 256 }'})</Code> 输出 256 × 256 的 PNG。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="cover" title="封面" demo={Cover}>
          <Code>aspect</Code>
          {
            ' 是裁剪框的宽高比（宽 / 高）。缩小到正好盖满裁剪框为止，最多放大到它的 maxZoom 倍（默认 4）；拖动时框里不会露出空白。'
          }
          <Code>handle</Code> 拿到 <Code>toCanvas</Code>、<Code>toBlob</Code>（<Code>type</Code>、
          <Code>quality</Code>）、<Code>toFile</Code>、<Code>reset</Code>
          {'，只写宽或高时另一边按宽高比算，都不写时按图片原本的像素。'}
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['+ / −', '放大、缩小（以裁剪框中间为中心）'],
        ['方向键', '移动图片'],
        ['0', '还原：盖满裁剪框、居中'],
      ]}
    >
      指针拖动移动图片，滚轮、触控板以指针为中心缩放，触屏双指捏合，双击放大；下面的工具条有缩小、缩放滑块、放大与还原。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
