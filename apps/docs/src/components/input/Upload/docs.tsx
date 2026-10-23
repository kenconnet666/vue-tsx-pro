import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import dropApi from 'virtual:api/FileDropProps';
import api from 'virtual:api/UploadProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Existing from './demo/Existing.tsx?demo';
import Import from './demo/Import.tsx?demo';
import Photos from './demo/Photos.tsx?demo';
import Resume from './demo/Resume.tsx?demo';

export const meta = {
  title: 'Upload 上传',
  description:
    '选文件、看进度、失败重试：Upload 管列表与状态，怎么上传由 upload 函数决定；FileDrop 是只负责选文件的拖放区域。',
  order: 13,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { FileDrop, Upload } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="photos" title="选好就上传" demo={Photos}>
          给了 <Code>upload</Code> 时选到文件就开始上传：它拿到文件、报告进度的{' '}
          <Code>onProgress</Code> 和中止用的 <Code>signal</Code>，返回
          Promise。失败的可以重试，移除正在上传的会中止。超过 <Code>maxSize</Code>、不在{' '}
          <Code>accept</Code> 里的也列出来，带错误、不上传。不写 upload 时可以给 <Code>action</Code>
          ：用应用配置的请求客户端（<Code>createUi</Code> 的 <Code>http</Code>
          ，同一套 baseURL、令牌与拆包）把文件 POST 过去，字段名默认 file（<Code>fieldName</Code>
          ）；fetch 拿不到上传进度，要进度时写 upload。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="form" title="随表单提交" demo={Resume}>
          不给 <Code>upload</Code> 时文件停在“已选择”，等提交时一起处理；写了 <Code>name</Code>{' '}
          时有一个隐藏的 file input 带着全部文件，原生提交、FormData
          都拿得到。单选时新文件替换旧的。
        </Example>
        <Example id="existing" title="已有文件" demo={Existing}>
          之前上传过、从后端读回来的文件用 <Code>existingUploadFile</Code> 放进
          value：状态是完成、不重新上传，给了 <Code>url</Code>{' '}
          时文件名链到它；可以移除，新选的照常上传。
        </Example>
        <Example id="file-drop" title="FileDrop" demo={Import}>
          只负责选文件：点击、聚焦后按 Enter / 空格、或把文件拖进来。选到的经 <Code>onFiles</Code>{' '}
          交出去；拖放不受 accept 限制，不合格的经 <Code>onReject</Code> 交出去。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Enter / Space', '在选择区域上：打开系统的文件对话框（原生 input[type=file]）'],
        ['Tab', '每个文件的“重试”“移除”按钮都在 Tab 顺序里'],
        ['Enter / Space', '在“重试”“移除”上：重新上传 / 移除这个文件（上传中的会中止）'],
      ]}
    />
    <ApiReference api={[api, dropApi]} />
  </DocPage>
));
