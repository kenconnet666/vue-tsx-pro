/**
 * 发起中心：能发起的流程按分类列出，可以搜；点一个去发起页。
 */
import { Search } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Flex, H2, Small, TextField, Text } from '@zerodep-dev/vue-tsx-pro-ui';
import { RouterLink } from 'vue-router';
import { PROCESSES } from '../processes';

const styles = css.create({
  grid: {
    display: 'grid',
    gap: '_md',
    gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))',
  },
  link: { color: 'inherit', textDecoration: 'none', display: 'block', height: '_full' },
  search: { maxWidth: '20rem' },
});

export default _component(() => {
  let query = _state('');
  return () => {
    const words = query.trim();
    const shown = PROCESSES.filter(
      (p) =>
        !words ||
        p.definition.name.includes(words) ||
        p.description.includes(words) ||
        p.category.includes(words),
    );
    const categories = [...new Set(shown.map((p) => p.category))];
    return (
      <Flex direction="column" gap="lg">
        <TextField
          _value={query}
          icon={Search}
          placeholder="搜流程"
          aria-label="搜流程"
          sx={styles.search}
        />
        {categories.length === 0 && <Small tone="muted">没有找到。</Small>}
        {categories.map((category) => (
          <Flex key={category} direction="column" gap="sm">
            <H2>{category}</H2>
            <div {...css.attrs(styles.grid)}>
              {shown
                .filter((p) => p.category === category)
                .map((p) => (
                  <RouterLink
                    key={p.definition.key}
                    to={`/flow/start/${p.definition.key}`}
                    {...css.attrs(styles.link)}
                  >
                    <Card padding="md" effect="spotlight" header={p.definition.name}>
                      <Text tone="muted">{p.description}</Text>
                    </Card>
                  </RouterLink>
                ))}
            </div>
          </Flex>
        ))}
      </Flex>
    );
  };
});
