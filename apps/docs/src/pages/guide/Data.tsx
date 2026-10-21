/**
 * 指南：请求与数据。配置请求客户端（拆后端的包装、加令牌）、换成 axios 或 ky、useRequest 的行为（演示连着内存里的假接口）、
 * 出错与取消
 */
import { _component } from '@vue-tsx-pro/tsx';
import {
  Alert,
  Code,
  CodeBlock,
  Flex,
  H2,
  List,
  ListItem,
  Paragraph,
  Provider,
} from '@vue-tsx-pro/ui';
import { CodePreview } from '@vue-tsx-pro/ui/docs-kit';
import { h } from 'vue';
import { DocPage } from '../../site/DocPage';
import { demoHttp } from './data/fake-api';
import SupplierSearch from './data/SupplierSearch.tsx?demo';

const meta = {
  title: 'Data 请求与数据',
  description:
    '组件只依赖 HttpClient 接口：默认是原生 fetch 的薄封装，也可以换成 axios、ky；useRequest 管加载、出错、防抖与取消。',
};

const client = `import { createHttpClient, createUi, HttpError } from '@vue-tsx-pro/ui';

/** 后端的包装：{ code: 0, data: …, message: '' } */
interface Envelope { code: number; data: unknown; message: string }

const http = createHttpClient({
  baseURL: '/api',
  timeout: 15_000, // 默认 30 秒
  // 发出之前：加令牌
  onRequest: (request) => request.headers.set('Authorization', \`Bearer \${auth.token}\`),
  // 2xx 之后：拆掉包装，业务错误变成 HttpError
  onResponse: (body, context) => {
    const envelope = body as Envelope;
    if (envelope.code !== 0) throw new HttpError(envelope.message, { ...context, data: body });
    return envelope.data;
  },
});

app.use(createUi({ http }));

// 页面里也能直接用它的简写
const user = await http.get<User>('/users/42');
await http.post('/users', { name: '林小满' }); // 普通对象按 JSON 发送`;

const adapter = `import axios from 'axios';
import type { HttpClient } from '@vue-tsx-pro/ui';

// 组件只调用 request：把字段对上就行（query → params，body → data）
const http: HttpClient = {
  request: ({ query, body, ...rest }) =>
    instance.request({ ...rest, params: query, data: body }).then((response) => response.data),
};

app.use(createUi({ http }));`;

const errors = `import { HttpError, isAbortError } from '@vue-tsx-pro/ui';

try {
  await http.post('/tasks', values);
} catch (error) {
  if (isAbortError(error)) return; // 主动取消的，不是错误
  if (error instanceof HttpError && error.status === 409) form.setError('code', '编号已经被占用');
  else throw error;
}`;

export default _component(() => () => (
  <DocPage meta={meta}>
    <Flex direction="column" gap="md">
      <H2 id="client" size="xl" anchor>
        配置请求客户端
      </H2>
      <Paragraph>
        远程选项、上传、列表查询这些组件都通过 <Code>useHttp()</Code> 拿到请求客户端，客户端在{' '}
        <Code>createUi</Code>（或局部的 <Code>Provider</Code>）的 <Code>http</Code> 里给出。默认实现{' '}
        <Code>createHttpClient</Code> 是原生 fetch 的薄封装：baseURL、query（null 与 undefined
        不写进地址，数组写成重复的键）、普通对象按 JSON 发送、超时与取消、状态码不是 2xx 时抛{' '}
        <Code>HttpError</Code>。后端把数据包在 <Code>{'{ code, data, message }'}</Code> 里时，在{' '}
        <Code>onResponse</Code> 里拆开。
      </Paragraph>
      <CodeBlock title="main.ts" code={client} lang="ts" />
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="adapter" size="xl" anchor>
        换成 axios、ky
      </H2>
      <Paragraph>
        项目里已经有请求库、拦截器时不必换：<Code>HttpClient</Code> 只有一个 <Code>request</Code>
        ，包一层交给 createUi 即可，令牌、拆包照旧写在原来的拦截器里。
      </Paragraph>
      <CodeBlock title="http.ts" code={adapter} lang="ts" />
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="use-request" size="xl" anchor>
        请求的状态：useRequest
      </H2>
      <Paragraph>
        <Code>useRequest(fetcher, {'{ params, debounce }'})</Code> 管一个请求的数据、出错与加载：
      </Paragraph>
      <List>
        <ListItem>
          <Code>params</Code> 读到的值变了、且内容确实不同时才重新请求；<Code>debounce</Code>{' '}
          让输入停下一会儿再发。点一下的变化（翻页）调用 <Code>refresh()</Code>，不用等。
        </ListItem>
        <ListItem>
          只采用最后一次的结果：发新请求时取消上一次（fetcher 收到的 <Code>signal</Code>
          ），晚到的旧结果也不会覆盖。
        </ListItem>
        <ListItem>
          重新请求时保留上一次的数据（<Code>keepPrevious</Code> 默认开），表格不闪成空的；
          <Code>mutate</Code> 直接改数据，做乐观更新。
        </ListItem>
      </List>
      <Paragraph>
        下面的演示连着内存里的假接口（300–800 ms
        的随机延迟）：快速输入只发最后一次，翻页立即请求，“模拟一次失败”让下一次请求返回业务错误。
      </Paragraph>
      <CodePreview code={SupplierSearch.source} showCode>
        {h(Provider, { http: demoHttp }, () => h(SupplierSearch.component))}
      </CodePreview>
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="errors" size="xl" anchor>
        出错与取消
      </H2>
      <Paragraph>
        <Code>HttpError</Code> 带着 <Code>status</Code>（网络错误、超时为 0）、<Code>data</Code>
        （错误详情）、<Code>request</Code> 与 <Code>response</Code>
        。调用方取消的请求原样交出 AbortError，用 <Code>isAbortError</Code> 判断，不当作错误显示。
      </Paragraph>
      <CodeBlock code={errors} lang="ts" />
      <Alert tone="info">
        HttpError
        的说明是给开发者看的（带着请求方法与地址）；给用户看的文案按状态码或业务码在页面里写，或者在
        onResponse 里换成后端返回的 message。
      </Alert>
    </Flex>
  </DocPage>
));
