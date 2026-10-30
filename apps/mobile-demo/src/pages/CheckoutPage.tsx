// 真实场景之三：确认订单——收货信息（校验）、配送方式、备注、金额明细，底部提交；提交成功后回到上一页
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  Cell,
  CellGroup,
  ConfigProvider,
  Field,
  Form,
  FormItem,
  Radio,
  RadioGroup,
  showDialog,
  showFailToast,
  showLoadingToast,
  type ChoiceValue,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { back } from '../nav.ts';
import { demoSettings } from '../settings.ts';
import { getProduct, swatch } from '../shop/data.ts';

const styles = css.create({
  page: {
    minHeight: '100vh',
    paddingBlockEnd: 'calc(4em + env(safe-area-inset-bottom))',
    backgroundColor: '_background',
  },
  item: { display: 'flex', gap: '_md', padding: '_lg', backgroundColor: '_surface' },
  image: { flex: 'none', width: '4.5em', height: '4.5em', borderRadius: '_md' },
  info: {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3em',
    fontSize: '_sm',
  },
  name: { fontSize: '_md', fontWeight: '_medium', color: '_text' },
  muted: { color: '_textMuted' },
  total: { color: '_dangerText', fontWeight: '_semibold' },
  bar: {
    boxSizing: 'content-box',
    position: 'fixed',
    insetInline: 0,
    insetBlockEnd: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '_md',
    height: '3.6em',
    paddingInline: '_lg',
    paddingBlockEnd: 'env(safe-area-inset-bottom)',
    backgroundColor: '_surface',
    borderBlockStartWidth: '_hairline',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_border',
    fontSize: '_md',
  },
  sum: { fontSize: '_xl', color: '_dangerText', fontWeight: '_bold' },
});

const FEES: Record<string, number> = { express: 0, sameDay: 12 };

export const CheckoutPage = _component(({ query = {} }: { query?: Record<string, string> }) => {
  const product = _derived(getProduct(Number(query.id ?? 0)));
  const count = _derived(Number(query.count ?? 1));
  const spec = _derived(query.spec ?? '');
  let name = _state('');
  let phone = _state('');
  let address = _state('');
  let delivery = _state<ChoiceValue>('express');
  let note = _state('');
  const total = _derived(product.price * count + FEES[delivery as string]!);

  const submit = async () => {
    const toast = showLoadingToast('提交中…');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.close();
    await showDialog({ title: '下单成功', message: `实付 ¥${total.toFixed(1)}，商家会尽快发货。` });
    back();
  };

  return () => (
    <ConfigProvider theme={demoSettings.theme} {...css.attrs(styles.page)}>
      <Form
        onSubmit={() => void submit()}
        onFailed={({ errors }) => showFailToast(errors[0]!.message)}
      >
        <CellGroup title="收货信息">
          <Field
            name="name"
            label="收货人"
            _value={name}
            placeholder="姓名"
            rules={[{ required: true }]}
          />
          <Field
            name="phone"
            label="手机号"
            type="tel"
            maxlength={11}
            _value={phone}
            placeholder="11 位手机号"
            rules={[{ required: true }, { pattern: /^1\d{10}$/, message: '手机号格式不对' }]}
          />
          <Field
            name="address"
            label="详细地址"
            multiline
            autosize
            rows={2}
            _value={address}
            placeholder="街道、门牌号"
            rules={[{ required: true }]}
          />
        </CellGroup>
        <CellGroup title="商品">
          <div {...css.attrs(styles.item)}>
            <div {...css.attrs(styles.image)} style={{ background: swatch(product.hue) }} />
            <div {...css.attrs(styles.info)}>
              <span {...css.attrs(styles.name)}>{product.name}</span>
              <span {...css.attrs(styles.muted)}>{spec}</span>
              <span>
                ¥{product.price.toFixed(1)} × {count}
              </span>
            </div>
          </div>
          <FormItem label="配送" name="delivery" value={delivery}>
            <RadioGroup _value={delivery} direction="horizontal">
              <Radio name="express">快递（包邮）</Radio>
              <Radio name="sameDay">当日达 +¥12</Radio>
            </RadioGroup>
          </FormItem>
          <Field name="note" label="备注" _value={note} placeholder="选填" maxlength={50} />
        </CellGroup>
        <CellGroup title="金额">
          <Cell title="商品金额" value={`¥${(product.price * count).toFixed(1)}`} />
          <Cell title="运费" value={`¥${FEES[delivery as string]!.toFixed(1)}`} />
          <Cell
            title="合计"
            value={<span {...css.attrs(styles.total)}>¥{total.toFixed(1)}</span>}
          />
        </CellGroup>
        <div {...css.attrs(styles.bar)}>
          <span>
            实付 <span {...css.attrs(styles.sum)}>¥{total.toFixed(1)}</span>
          </span>
          <Button type="submit" radius="full">
            提交订单
          </Button>
        </div>
      </Form>
    </ConfigProvider>
  );
});
