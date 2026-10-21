import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import dropApi from 'virtual:api/FileDropProps';
import api from 'virtual:api/UploadProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Import from './demo/Import.tsx?demo';
import Photos from './demo/Photos.tsx?demo';
import Resume from './demo/Resume.tsx?demo';

export const meta = {
  title: 'Upload 上传',
  description:
    '选文件、看进度、失败重试：Upload 管列表与状态，怎么上传由 upload 函数决定；FileDrop 是只负责选文件的拖放区域。',
  order: 11,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { FileDrop, Upload } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="photos" title="选好就上传" demo={Photos}>
          给了 <Code>upload</Code> 时选到文件就开始上传：它拿到文件、报告进度的{' '}
          <Code>onProgress</Code> 和中止用的 <Code>signal</Code>，返回
          Promise。失败的可以重试，移除正在上传的会中止。超过 <Code>maxSize</Code>、不在{' '}
          <Code>accept</Code> 里的也列出来，带错误、不上传。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="form" title="随表单提交" demo={Resume}>
          不给 <Code>upload</Code> 时文件停在“已选择”，等提交时一起处理；写了 <Code>name</Code>{' '}
          时有一个隐藏的 file input 带着全部文件，原生提交、FormData
          都拿得到。单选时新文件替换旧的。
        </Example>
        <Example id="file-drop" title="FileDrop" demo={Import}>
          只负责选文件：点击、聚焦后按 Enter / 空格、或把文件拖进来。选到的经 <Code>onFiles</Code>{' '}
          交出去；拖放不受 accept 限制，不合格的经 <Code>onReject</Code> 交出去。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, dropApi]} />
  </DocPage>
));
