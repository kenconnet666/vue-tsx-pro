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
        open={_bind(open)}
        size="xs"
        title="筛选降本项目"
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
              value={_bind(draft.team)}
              placeholder="全部团队"
              items={['机体结构', '复合材料中心', '总体技术集成', '供应链管理']}
            />
          </Field>
          <Field label="状态">
            <CheckboxGroup value={_bind(draft.status)}>
              <Checkbox value="designing">方案设计中</Checkbox>
              <Checkbox value="verifying">验证中</Checkbox>
              <Checkbox value="confirming">待认定</Checkbox>
              <Checkbox value="realized">已兑现</Checkbox>
            </CheckboxGroup>
          </Field>
          <Field label="预计年降本（万元）">
            <NumberRangeField value={_bind(draft.saving)} />
          </Field>
          <Field label="计划完成">
            <DateRangePicker value={_bind(draft.period)} />
          </Field>
        </Flex>
      </Drawer>
    </Flex>
  );
});
