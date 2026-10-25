import { _component } from '@vue-tsx-pro/tsx';
import Decimal from 'decimal.js';
import {
  Card,
  Descriptions,
  enUS,
  Flex,
  Pagination,
  Provider,
  Strong,
  useFormat,
  zhCN,
  type Lang,
} from '@vue-tsx-pro/ui';

// 在 Provider 里面调用 useFormat：拿到的是这一层的语言
const Sample = _component(() => {
  const format = useFormat();
  return () => (
    <Flex direction="column" gap="md">
      <Descriptions
        columns={1}
        size="sm"
        items={[
          { label: 'number', value: format.number(1234567.891) },
          { label: 'currency', value: format.currency(new Decimal('19999.9')) },
          { label: 'percent', value: format.number(0.1234, { style: 'percent' }) },
          { label: 'fileSize', value: format.fileSize(23_456_789) },
          { label: 'date', value: format.date('2026-10-21', { dateStyle: 'full' }) },
        ]}
      />
      <Pagination total={1286} pageSize={20} _page={3} showTotal size="sm" />
    </Flex>
  );
});

const locales: [string, Lang][] = [
  ['简体中文（zhCN）', zhCN],
  ['English（enUS）', enUS],
];

export default _component(() => () => (
  <Flex gap="md" wrap>
    {locales.map(([title, lang]) => (
      <Card key={title} padding="sm">
        <Provider lang={lang}>
          <Flex direction="column" gap="sm">
            <Strong>{title}</Strong>
            <Sample />
          </Flex>
        </Provider>
      </Card>
    ))}
  </Flex>
));
