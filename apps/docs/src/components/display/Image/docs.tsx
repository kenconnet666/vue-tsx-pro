import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ImageProps';
import groupApi from 'virtual:api/ImageGroupProps';
import lightboxApi from 'virtual:api/LightboxProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Gallery from './demo/Gallery.tsx?demo';
import States from './demo/States.tsx?demo';

export const meta = {
  title: 'Image 图片',
  description:
    '图片：懒加载、加载中扫光、失败占位；点开看大图（Lightbox）——缩放、拖动、旋转、下载，同一组的图左右切换。',
  order: 8,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Image, ImageGroup, Lightbox } from '@vue-tsx-pro/ui';"
  >
    <Example id="gallery" title="图纸相册：预览、缩放、旋转" demo={Gallery}>
      写了 <Code>preview</Code> 的图片是按钮（名称“查看大图：alt”），点了（或 Enter）打开
      Lightbox：深色全屏，滚轮、触控板、捏合以指针为中心缩放，拖动平移，双击放大 / 还原，旋转以 90°
      为一档，打开、换一张、旋转后整张放进视口。
      <Code>preview</Code> 可以给大图地址 <Code>src</Code>、说明 <Code>caption</Code>、下载的文件名{' '}
      <Code>download</Code>。<Code>ImageGroup</Code> 里的图片共用一个预览，从点的那张开始，
      <Code>loop</Code> 时到头从另一头继续。<Code>Lightbox</Code>{' '}
      也可以单独用（附件列表里的“预览”）。
    </Example>
    <Example id="states" title="尺寸、填充与加载失败" demo={States}>
      <Code>width</Code>、<Code>height</Code> 是框的大小（数字是 px），<Code>fit</Code>{' '}
      是图片在框里怎么放；加载完之前框里是扫光的占位，加载完淡入；默认 <Code>loading="lazy"</Code>
      （滚到附近才加载）。地址错了时显示占位与 alt，读屏念出 alt 与“图片加载失败”；
      <Code>fallback</Code> 换成自己的内容。
    </Example>
    <KeyboardReference
      keys={[
        ['Enter / Space', '在可以预览的图片上：打开大图'],
        ['← / →', '大图里：上一张、下一张（从右到左排版时反过来）'],
        ['+ / −', '放大、缩小（焦点在图片区）'],
        ['0', '还原大小与位置'],
        ['R', '向右旋转 90°'],
        ['Esc', '关闭大图，焦点回到打开它的图片'],
      ]}
    >
      大图里的工具栏按钮都能用 <Kbd>Tab</Kbd> 走到；焦点在大图里循环（模态）。
    </KeyboardReference>
    <ApiReference api={[api, groupApi, lightboxApi]} />
  </DocPage>
));
