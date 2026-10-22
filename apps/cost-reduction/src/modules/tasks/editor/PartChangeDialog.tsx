// 单机降本明细的一条零件更改（单机降本明细表的“构型通知单信息”）：在对话框里分更改前、更改后两栏填写，
// 单件材料费、工时费、单件价格与单机价格、各项收益由系统算出、实时显示，不可手改。
// 取消只有更改前，新增只有更改后，换号、升版两边都有
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Descriptions,
  Dialog,
  Field,
  Flex,
  Grid,
  Form,
  NumberField,
  RadioGroup,
  Radio,
  Separator,
  Switch,
  Text,
  TextField,
  decimalSchema,
  useFormat,
  useForm,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import * as z from 'zod';
import { partCost, partSaving } from '../../../domain/task/calc';
import { changeTypes, type PartChange, type PartSide } from '../../../domain/task/types';
import { yuanFormat } from '../../../shared/kinds';

const side = z.object({
  partNo: z.string(),
  supplierPartNo: z.string(),
  quantity: z.number().nullable(),
  materialChanged: z.boolean(),
  materialGrade: z.string(),
  materialCondition: z.string(),
  materialSpec: z.string(),
  materialStandard: z.string(),
  quota: decimalSchema({ min: 0, scale: 4 }).nullable(),
  quotaUnit: z.string(),
  materialPrice: decimalSchema({ min: 0, scale: 2 }).nullable(),
  laborHours: decimalSchema({ min: 0, scale: 2 }).nullable(),
  laborRate: decimalSchema({ min: 0, scale: 2 }).nullable(),
});

const schema = z
  .object({ changeType: z.enum(changeTypes), before: side, after: side })
  // 用到的那一边：件号、单机数量（>0）、定额与单位、单价、工时与费率必填；材料变化时材料四项必填
  .superRefine((values, ctx) => {
    const sides = [
      ['before', values.changeType !== '新增'],
      ['after', values.changeType !== '取消'],
    ] as const;
    for (const [key, used] of sides) {
      if (!used) continue;
      const item = values[key];
      const need = (field: keyof typeof item, message: string) =>
        ctx.addIssue({ code: 'custom', path: [key, field], message });
      if (!item.partNo) need('partNo', '请填写件号');
      if (item.quantity == null || item.quantity <= 0) need('quantity', '单机数量要大于 0');
      if (item.quota == null) need('quota', '请填写单件材料定额');
      if (!item.quotaUnit) need('quotaUnit', '请填写定额单位');
      if (item.materialPrice == null) need('materialPrice', '请填写材料单价');
      if (item.laborHours == null) need('laborHours', '请填写单件工时定额');
      if (item.laborRate == null) need('laborRate', '请填写费率');
      if (item.materialChanged && !item.materialGrade)
        need('materialGrade', '材料变化时填写材料牌号');
      if (item.materialChanged && !item.materialStandard)
        need('materialStandard', '材料变化时填写技术条件');
    }
  });

type Values = z.input<typeof schema>;
type SideValues = Values['before'];

const emptySide = (): SideValues => ({
  partNo: '',
  supplierPartNo: '',
  quantity: null,
  materialChanged: false,
  materialGrade: '',
  materialCondition: '',
  materialSpec: '',
  materialStandard: '',
  quota: null,
  quotaUnit: 'kg',
  materialPrice: null,
  laborHours: null,
  laborRate: new Decimal(280),
});

const toValues = (item: PartSide | null): SideValues => (item ? { ...item } : emptySide());

/** 表单的一边写回零件；没填的数按 0 */
const toSide = (values: SideValues): PartSide => ({
  ...values,
  quantity: values.quantity ?? 0,
  quota: values.quota ?? new Decimal(0),
  materialPrice: values.materialPrice ?? new Decimal(0),
  laborHours: values.laborHours ?? new Decimal(0),
  laborRate: values.laborRate ?? new Decimal(0),
});

/** 零件更改对话框 */
export const PartChangeDialog = _component(
  ({
    open = _bindable(false),
    change,
    onSave,
  }: {
    /** 是否打开：父级写 open={_bind(x)} */
    open?: boolean;
    /** 要编辑的那条；新增时为 null */
    change: PartChange | null;
    /** 保存：拿到写好的一条 */
    onSave: (change: PartChange) => void;
  }) => {
    const format = useFormat();
    const yuan = (value: Decimal) => `${format.number(value, yuanFormat)} 元`;
    const form = useForm({
      schema,
      initial: {
        changeType: '换号',
        before: emptySide(),
        after: emptySide(),
      } as Values,
      onSubmit: (values) => {
        const typed = values as Values;
        onSave({
          id: change?.id ?? `new-${Date.now()}`,
          changeType: typed.changeType,
          before: typed.changeType === '新增' ? null : toSide(typed.before),
          after: typed.changeType === '取消' ? null : toSide(typed.after),
        });
        open = false;
      },
    });
    // 每次打开时换成要编辑的那条（或空表）
    let shownFor: PartChange | null | undefined;
    const sync = () => {
      if (!open || shownFor === change) return;
      shownFor = change;
      form.reset({
        changeType: change?.changeType ?? '换号',
        before: toValues(change?.before ?? null),
        after: toValues(change?.after ?? null),
      });
    };

    /** 一边的字段 */
    function sideFields(key: 'before' | 'after', title: string) {
      const values = form.values[key];
      const cost = partCost(toSide(values));
      return (
        <Flex direction="column" gap="md">
          <Text weight="semibold">{title}</Text>
          <Grid columns={2} gap="md">
            <form.Field name={`${key}.partNo`} label="受影响零件（件号）" required>
              <TextField value={_bind(values.partNo)} />
            </form.Field>
            <form.Field name={`${key}.supplierPartNo`} label="供应商件号">
              <TextField value={_bind(values.supplierPartNo)} />
            </form.Field>
            <form.Field name={`${key}.quantity`} label="单机数量" required>
              <NumberField value={_bind(values.quantity)} min={0} />
            </form.Field>
            <Field label="材料是否变化">
              <Switch checked={_bind(values.materialChanged)}>
                {values.materialChanged ? '是' : '否'}
              </Switch>
            </Field>
            {values.materialChanged && (
              <>
                <form.Field name={`${key}.materialGrade`} label="材料牌号" required>
                  <TextField value={_bind(values.materialGrade)} />
                </form.Field>
                <form.Field name={`${key}.materialCondition`} label="材料状态">
                  <TextField value={_bind(values.materialCondition)} />
                </form.Field>
                <form.Field name={`${key}.materialSpec`} label="材料规格">
                  <TextField value={_bind(values.materialSpec)} />
                </form.Field>
                <form.Field name={`${key}.materialStandard`} label="技术条件" required>
                  <TextField value={_bind(values.materialStandard)} />
                </form.Field>
              </>
            )}
            <form.Field name={`${key}.quota`} label="单件材料定额" required>
              <NumberField value={_bind(values.quota)} valueType={Decimal} min={0} />
            </form.Field>
            <form.Field name={`${key}.quotaUnit`} label="定额单位" required>
              <TextField value={_bind(values.quotaUnit)} placeholder="kg、m、张……" />
            </form.Field>
            <form.Field name={`${key}.materialPrice`} label="材料单价" required>
              <NumberField
                value={_bind(values.materialPrice)}
                valueType={Decimal}
                min={0}
                suffix="元"
              />
            </form.Field>
            <form.Field name={`${key}.laborHours`} label="单件工时定额" required>
              <NumberField
                value={_bind(values.laborHours)}
                valueType={Decimal}
                min={0}
                suffix="小时"
              />
            </form.Field>
            <form.Field name={`${key}.laborRate`} label="费率" required>
              <NumberField
                value={_bind(values.laborRate)}
                valueType={Decimal}
                min={0}
                suffix="元/小时"
              />
            </form.Field>
          </Grid>
          <Descriptions
            columns={2}
            size="sm"
            bordered
            items={[
              { label: '单件材料费', value: yuan(cost.material) },
              { label: '单件工时费', value: yuan(cost.labor) },
              { label: '单件价格', value: yuan(cost.unit) },
              { label: '单机价格', value: yuan(cost.aircraft) },
            ]}
          />
        </Flex>
      );
    }

    return () => {
      sync();
      const type = form.values.changeType;
      const preview: PartChange = {
        id: 'preview',
        changeType: type,
        before: type === '新增' ? null : toSide(form.values.before),
        after: type === '取消' ? null : toSide(form.values.after),
      };
      const saving = partSaving(preview);
      return (
        <Dialog
          open={_bind(open)}
          size="xl"
          title={change ? '编辑零件更改' : '新增零件更改'}
          description="费用与收益由系统按定额、单价、工时与费率算出，不可手改"
          footer={
            <Flex justify="end" gap="sm">
              <Button variant="ghost" tone="neutral" onClick={() => (open = false)}>
                取消
              </Button>
              <Button onClick={() => void form.submit()}>保存</Button>
            </Flex>
          }
        >
          <Form controller={form}>
            <Flex direction="column" gap="lg">
              <form.Field name="changeType" label="更改类型" required>
                <RadioGroup value={_bind(form.values.changeType)} orientation="horizontal">
                  {changeTypes.map((item) => (
                    <Radio key={item} value={item}>
                      {item}
                    </Radio>
                  ))}
                </RadioGroup>
              </form.Field>
              <Grid columns={2} gap="xl">
                {type !== '新增' ? (
                  sideFields('before', '更改前（原方案）')
                ) : (
                  <Text tone="muted">新增零件：没有更改前</Text>
                )}
                {type !== '取消' ? (
                  sideFields('after', '更改后（优化方案）')
                ) : (
                  <Text tone="muted">取消零件：没有更改后</Text>
                )}
              </Grid>
              <Separator>收益（系统计算）</Separator>
              <Descriptions
                columns={4}
                size="sm"
                items={[
                  { label: '单件材料费收益', value: yuan(saving.material) },
                  { label: '单件工时费收益', value: yuan(saving.labor) },
                  { label: '单件零件收益', value: yuan(saving.part) },
                  { label: '单机零件收益', value: yuan(saving.aircraft) },
                ]}
              />
            </Flex>
          </Form>
        </Dialog>
      );
    };
  },
);
