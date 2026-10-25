import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Pager, Pagination, Small } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Flex direction="column" gap="xs">
      <Small tone="muted">href：渲染为链接，可以分享、可以被收录</Small>
      <Pagination
        aria-label="文章分页"
        _page={3}
        pageCount={12}
        href={(page) => `#articles-page-${page}`}
      />
    </Flex>
    <Flex direction="column" gap="xs">
      <Small tone="muted">Pager：文章末尾的上一篇 / 下一篇</Small>
      <Pager
        aria-label="文章翻页"
        previous={{ href: '/components/tabs', label: 'Tabs 标签页' }}
        next={{ href: '/components/breadcrumbs', label: 'Breadcrumbs 面包屑' }}
      />
    </Flex>
  </Flex>
));
