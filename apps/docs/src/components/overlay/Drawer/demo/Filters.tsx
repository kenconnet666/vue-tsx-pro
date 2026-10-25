// 筛选抽屉：条件多、页面放不下时收进抽屉；onConfirm 是“查看结果”，footer 里的“重置”排在它前面，按钮上带已设几项
import { Filter } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
  DateRangePicker,
  Drawer,
  Field,
  Flex,
  NumberRangeField,
  Select,
  Small,
} from '@vue-tsx-pro/ui';

interface Filters {
  team: string | null;
  status: string[];
  saving: [number | null, number | null];
  period: { start: string; end: string } | null;
}

const empty = (): Filters => ({ team: null, status: [], saving: [null, null], period: null });
const countOf = (filters: Filters) =>
  [
    filters.team,
    filters.status.length > 0,
    filters.saving.some((value) => value != null),
    filters.period,
  ].filter(Boolean).length;

export default _component(() => {
  let open = _state(false);
  let applied = _state(empty());
  let draft = _state(empty());

  return () => (
    <Flex align="center" gap="md" wrap>
      <Button
        variant="outline"
        tone="neutral"
        icon={Filter}
        onClick={() => {
          draft = _state.snapshot(applied);
          open = true;
        }}
      >
        筛选
        {countOf(applied) > 0 && (
          <Badge size="xs" radius="full">
            {countOf(applied)}
          </Badge>
        )}
      </Button>
      <Small tone="muted">
        {countOf(applied) ? `已设 ${countOf(applied)} 项条件` : '没有筛选条件：显示全部 128 个项目'}
      </Small>
      <Drawer
        _open={open}
        size="xs"
        title="筛选项目"
        confirmText={`查看结果（已设 ${countOf(draft)} 项）`}
        onConfirm={() => {
          applied = _state.snapshot(draft);
        }}
        footer={
          <Button variant="ghost" tone="neutral" onClick={() => (draft = empty())}>
            重置
          </Button>
        }
      >
        <Flex direction="column" gap="lg">
          <Field label="责任团队">
            <Select
              _value={draft.team}
              placeholder="全部团队"
              items={['生产部', '研发中心', '产品部', '供应链管理']}
            />
          </Field>
          <Field label="状态">
            <CheckboxGroup _value={draft.status}>
              <Checkbox value="designing">设计中</Checkbox>
              <Checkbox value="verifying">测试中</Checkbox>
              <Checkbox value="confirming">待验收</Checkbox>
              <Checkbox value="settled">已结算</Checkbox>
            </CheckboxGroup>
          </Field>
          <Field label="预计年销售（万元）">
            <NumberRangeField _value={draft.saving} />
          </Field>
          <Field label="计划完成">
            <DateRangePicker _value={draft.period} />
          </Field>
        </Flex>
      </Drawer>
    </Flex>
  );
});
