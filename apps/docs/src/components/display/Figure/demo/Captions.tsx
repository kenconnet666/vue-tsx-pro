// 图片的说明在下面，表格的说明在上面：读屏把说明当作这块内容的名称
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  ColumnTable,
  Figure,
  Flex,
  Image,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../Image/demo/drawings';

interface Lead {
  supplier: string;
  days: number;
}

const leads: Lead[] = [
  { supplier: '华辰精密', days: 12 },
  { supplier: '远山钣金', days: 18 },
  { supplier: '北辰电子', days: 9 },
];

const columns: DataTableColumn<Lead>[] = [
  { key: 'supplier', header: '供应商' },
  { key: 'days', header: '平均交付（天）', type: 'number' },
];

const drawing = drawings[0]!;

export default _component(() => () => (
  <Flex direction="column" gap="xl">
    <Figure caption={`图 1：${drawing.title}（${drawing.code}）`}>
      <Image src={drawing.src} alt={drawing.title} width={240} height={160} />
    </Figure>
    <Figure caption="表 1：各供应商的平均交付周期" captionSide="top">
      <ColumnTable rows={leads} columns={columns} getKey={(lead) => lead.supplier} />
    </Figure>
  </Flex>
));
