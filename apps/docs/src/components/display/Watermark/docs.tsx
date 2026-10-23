import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/WatermarkProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Options from './demo/Options.tsx?demo';
import Report from './demo/Report.tsx?demo';

export const meta = {
  title: 'Watermark 水印',
  description: '在内容上或整页铺满斜着的文字、图片：截图外传时能看出查看人、时间与密级。',
  order: 17,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { Watermark } from '@vue-tsx-pro/ui';">
    <Example id="report" title="内部报表" demo={Report}>
      <Code>content</Code> 写数组就是多行（查看人、日期、密级）。水印是盖在内容上的一层：
      <Code>pointer-events: none</Code>，不挡点击与选择；<Code>aria-hidden</Code>
      ，读屏不念。<Code>fullscreen</Code> 盖住整个窗口；不包内容时只渲染那一层，放在 App
      里即可。前端水印删得掉，只是提示，真正的保密靠服务端（导出时打水印、权限）。
    </Example>
    <Example id="options" title="文字、图片与间距" demo={Options}>
      用 canvas 画一格再平铺（按设备像素比放大，高分屏不糊），所以改任何参数都只重画一格。
      <Code>image</Code> 给了就画图片，要同源或允许跨域；<Code>gap</Code>{' '}
      是每格之间的空隙。默认颜色是半透明的灰，亮色、暗色主题上都看得见、不抢内容。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
