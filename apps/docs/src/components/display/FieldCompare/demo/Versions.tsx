// 测算版本对比：选两个版本，字段、原值、新值、变化四列；金额是 Decimal，变化量精确计算。
// 单价、年用量越低越好（better="lower"），降本率越高越好；没改的字段淡显，勾上“只看改动”只列改了的
import { _component } from '@vue-tsx-pro/tsx';
import Decimal from 'decimal.js';
import {
  Card,
  Checkbox,
  createStatusMap,
  FieldCompare,
  Flex,
  ToggleGroup,
  ToggleItem,
  type CompareField,
} from '@vue-tsx-pro/ui';

interface Estimate {
  version: string;
  unitPrice: Decimal;
  annualVolume: number;
  savingRate: number;
  material: string;
  supplier: string;
  validUntil: string;
  status: string;
}

const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  reviewing: { label: '评审中', tone: 'info' },
  approved: { label: '已通过', tone: 'success' },
});

const versions: Estimate[] = [
  {
    version: 'V1',
    unitPrice: new Decimal('128.60'),
    annualVolume: 42_000,
    savingRate: 0.062,
    material: '6061-T6 铝合金',
    supplier: '华辰精密',
    validUntil: '2026-12-31',
    status: 'draft',
  },
  {
    version: 'V2',
    unitPrice: new Decimal('119.35'),
    annualVolume: 42_000,
    savingRate: 0.129,
    material: '6063-T5 铝合金',
    supplier: '华辰精密',
    validUntil: '2026-12-31',
    status: 'reviewing',
  },
  {
    version: 'V3',
    unitPrice: new Decimal('116.80'),
    annualVolume: 45_500,
    savingRate: 0.148,
    material: '6063-T5 铝合金',
    supplier: '恒远五金',
    validUntil: '2027-06-30',
    status: 'approved',
  },
];

const fields: CompareField<Estimate>[] = [
  { key: 'unitPrice', header: '单价', type: 'currency', better: 'lower' },
  { key: 'annualVolume', header: '年用量（件）', type: 'number' },
  {
    key: 'annualCost',
    header: '年度金额（万元）',
    type: 'number',
    format: { scale: 10_000, maximumFractionDigits: 2 },
    value: (row) => row.unitPrice.times(row.annualVolume),
    better: 'lower',
  },
  { key: 'savingRate', header: '降本率', type: 'percent', better: 'higher' },
  { key: 'material', header: '材料' },
  { key: 'supplier', header: '供应商' },
  { key: 'validUntil', header: '报价有效期', type: 'date' },
  { key: 'status', header: '状态', statuses },
];

const versionItems = () =>
  versions.map((version) => (
    <ToggleItem key={version.version} value={version.version}>
      {version.version}
    </ToggleItem>
  ));

export default _component(() => {
  let from = _state('V1');
  let to = _state('V3');
  let onlyChanged = _state(false);
  const pick = (key: string) => versions.find((version) => version.version === key)!;
  return () => (
    <Card>
      <Flex direction="column" gap="md">
        <Flex gap="md" wrap align="center">
          <ToggleGroup _value={from} aria-label="原版本" required size="sm">
            {versionItems()}
          </ToggleGroup>
          <span aria-hidden="true">→</span>
          <ToggleGroup _value={to} aria-label="对比版本" required size="sm">
            {versionItems()}
          </ToggleGroup>
          <Checkbox _checked={onlyChanged}>只看改动</Checkbox>
        </Flex>
        <FieldCompare
          fields={fields}
          before={pick(from)}
          after={pick(to)}
          onlyChanged={onlyChanged}
          propsTable={{ 'aria-label': `测算 ${from} 与 ${to} 对比` }}
        />
      </Flex>
    </Card>
  );
});
