// 一篇文档：标题、简介、导入语句，一节一节往下写；对照表用 TextTable，反引号里的是行内代码
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { CodeBlock, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocArticle, DocSection, TextTable } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';

export default _component(() => () => (
  <DocArticle
    title="缓存"
    description="本机缓存和 Redis 缓存两级，写入提交后失效。"
    lead={<CodeBlock code="import { cache } from 'my-lib/cache';" lang="ts" />}
  >
    <DocSection id="demo-usage" title="怎么用">
      <Paragraph>声明的时候指定过期时间，读的时候和普通查询一样。</Paragraph>
    </DocSection>
    <DocSection id="demo-options" title="选项">
      <TextTable
        head={['选项', '默认值', '含义']}
        rows={[
          ['`ttl`', '`60_000`', '过期时间，毫秒'],
          ['`maxSize`', '`1000`', '本机缓存最多放多少条，超出按最近最少使用淘汰'],
          ['`store`', '无', '外部存储，接 Redis 这类共享缓存时给它'],
        ]}
      />
    </DocSection>
  </DocArticle>
));
