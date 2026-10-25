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
import SupplierTable from './data/SupplierTable.tsx?demo';

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
      <Paragraph>
        值按线上的 typed JSON 传（与 query 库同一套写法）：请求体里的 bigint、Decimal、CalendarDate
        写成文字（Decimal 不用科学计数法，日期是 ISO），根上附一张 <Code>$types</Code>{' '}
        记下它们的位置；地址栏参数写成同样的文字；响应带 <Code>$types</Code> 时先还原再交给{' '}
        <Code>onResponse</Code>。默认 bigint 还原成 bigint，decimal 与日期留作文字（组件都认）；给{' '}
        <Code>{'wire: { decimal: Decimal }'}</Code> 时 decimal 还原成 Decimal，
        <Code>{"dates: 'objects'"}</Code> 时日期还原成 CalendarDate 等，<Code>wire: false</Code>{' '}
        时按普通 JSON。<Code>toWire</Code>、<Code>fromWire</Code>、<Code>wireText</Code>{' '}
        也可以单独用。
      </Paragraph>
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
      <CodePreview code={SupplierSearch.source}>
        {h(Provider, { http: demoHttp }, () => h(SupplierSearch.component))}
      </CodePreview>
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="table-query" size="xl" anchor>
        服务端分页：useTableQuery
      </H2>
      <Paragraph>
        列表页的页码、每页条数、排序、已应用的筛选条件、总数、加载与出错交给{' '}
        <Code>useTableQuery</Code>
        （建在 useRequest 上）。<Code>page</Code>、<Code>pageSize</Code>、<Code>sort</Code> 直接{' '}
        <Code>_bind</Code> 到 PaginationBar、DataTable（加 <Code>manualSort</Code>
        ，排序交给服务端；多列排序的表格加 <Code>multiSort</Code> 并绑 <Code>sorts</Code>
        ）；查询栏点“查询”时调用 <Code>search(条件)</Code>
        。换排序、条数、条件或 <Code>params</Code>
        （当前页签这类）回到第一页，只请求一次；删掉数据后当前页空了，自动退到最后一页。表头筛选（DataTable
        的 <Code>filters</Code> 加 <Code>manualFilter</Code>）绑 <Code>columnFilters</Code>
        。只翻页、换排序或条数时，交给 fetcher 的 <Code>total</Code>{' '}
        是上一次的总数，服务端可以不再数行数。
      </Paragraph>
      <Paragraph>
        fetcher 用 <Code>tableParams(query, columns)</Code> 把一次查询写成接口的参数：
        <Code>page</Code>、<Code>pageSize</Code>、<Code>sort=-amount,name</Code>（减号是倒序，同
        JSON:API）、已知时的 <Code>total</Code>，表头多选写成 <Code>filter.列=值</Code>
        ，关键字写成 <Code>search.列=关键字</Code>
        ，查询栏的条件按字段名平铺（Decimal 不用科学计数法、日期是
        ISO，区间写成两个同名参数）。query 库的 <Code>parseTableRequest</Code> 与{' '}
        <Code>db.table(查询, 请求)</Code>
        （Java 是 <Code>TableRequest.parse</Code>）读的就是这套参数：筛选、排序只认结果里的列。
      </Paragraph>
      <Paragraph>
        <Code>syncToUrl: true</Code> 把页码、条数、排序（<Code>sort=-amount,name</Code>{' '}
        先按金额倒序再按名称）、筛选条件放进地址的查询参数：刷新、分享链接、从别的页带着条件点进来都是同一份列表；等于初始值的不写。页签这类单个的值用{' '}
        <Code>{"useQueryState('view', 'all')"}</Code>
        ，按初始值的类型读写，固定几个值的用 <Code>{'queryCodecs.oneOf([...])'}</Code>
        。需要路由适配给出 <Code>query</Code> 与 <Code>replaceQuery</Code>（vueRouterAdapter
        有），没配路由时就是普通的状态。销售台账用的就是它。
      </Paragraph>
      <CodePreview code={SupplierTable.source}>
        {h(Provider, { http: demoHttp }, () => h(SupplierTable.component))}
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
