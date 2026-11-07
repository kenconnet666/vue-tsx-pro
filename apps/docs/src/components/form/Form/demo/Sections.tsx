// 供应商准入申请：长表单按主题分成几组，每组最多两列（容器窄时自动单列）；分组带 id，旁边的目录跳到各组
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  AsideLayout,
  Button,
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Field,
  Flex,
  FormSection,
  GridItem,
  NumberField,
  Select,
  TableOfContents,
  Textarea,
  TextField,
} from '@zerodep-dev/vue-tsx-pro-ui';

const sections = [
  { id: 'admission-basic', label: '企业信息', level: 2 },
  { id: 'admission-scope', label: '供货范围', level: 2 },
  { id: 'admission-quality', label: '质量体系', level: 2 },
  { id: 'admission-settle', label: '结算信息', level: 2 },
] as const;

export default _component(() => {
  let form = _state({
    name: '供应商甲精密制造有限公司',
    code: '91310115MA1K4XXX0Q',
    founded: '2012-06-18',
    staff: 860 as number | null,
    address: '上海市浦东新区某路 88 号',
    category: 'machining' as string | null,
    parts: ['bracket', 'fastener'],
    capacity: 12000 as number | null,
    cert: 'iso9001' as string | null,
    certExpire: '2027-03-31',
    audit: '',
    bank: '某银行上海浦东支行',
    account: '6222 0210 0100 1234 567',
    terms: '60' as string | null,
  });

  return () => (
    <AsideLayout
      asideLabel="申请表目录"
      asideWidth="12rem"
      aside={<TableOfContents items={sections} />}
    >
      <form onSubmit={(event: Event) => event.preventDefault()}>
        <Flex direction="column" gap="xl">
          <FormSection id={sections[0].id} title="企业信息" columns={2} minColumnWidth="16em">
            <Field label="企业名称" required>
              <TextField _value={form.name} />
            </Field>
            <Field label="统一社会信用代码" required>
              <TextField _value={form.code} />
            </Field>
            <Field label="成立日期">
              <DatePicker _value={form.founded} />
            </Field>
            <Field label="员工人数">
              <NumberField _value={form.staff} suffix="人" />
            </Field>
            <GridItem span="full">
              <Field label="注册地址">
                <TextField _value={form.address} />
              </Field>
            </GridItem>
          </FormSection>
          <FormSection
            id={sections[1].id}
            title="供货范围"
            description="勾选能供的零件类别；年产能按最近一年实际产量填"
            columns={2}
            minColumnWidth="16em"
          >
            <Field label="主营类别" required>
              <Select
                _value={form.category}
                items={[
                  { value: 'machining', label: '机械件' },
                  { value: 'composite', label: '研发中心件' },
                  { value: 'standard', label: '标准件' },
                ]}
              />
            </Field>
            <Field label="年产能">
              <NumberField _value={form.capacity} suffix="件 / 年" />
            </Field>
            <GridItem span="full">
              <Field label="零件类别">
                <CheckboxGroup _value={form.parts} orientation="horizontal">
                  <Checkbox value="bracket">支架</Checkbox>
                  <Checkbox value="fastener">紧固件</Checkbox>
                  <Checkbox value="seal">密封件</Checkbox>
                  <Checkbox value="harness">线束卡箍</Checkbox>
                  <Checkbox value="packaging">包装</Checkbox>
                </CheckboxGroup>
              </Field>
            </GridItem>
          </FormSection>
          <FormSection id={sections[2].id} title="质量体系" columns={2} minColumnWidth="16em">
            <Field label="认证" required>
              <Select
                _value={form.cert}
                items={[
                  { value: 'iso9001', label: 'ISO 9001' },
                  { value: 'iso14001', label: 'ISO 14001' },
                ]}
              />
            </Field>
            <Field label="证书有效期至">
              <DatePicker _value={form.certExpire} />
            </Field>
            <GridItem span="full">
              <Field label="最近一次二方审核" description="时间、审核方、主要不符合项">
                <Textarea _value={form.audit} rows={2} />
              </Field>
            </GridItem>
          </FormSection>
          <FormSection id={sections[3].id} title="结算信息" columns={2} minColumnWidth="16em">
            <Field label="开户行" required>
              <TextField _value={form.bank} />
            </Field>
            <Field label="账号" required>
              <TextField _value={form.account} />
            </Field>
            <Field label="账期">
              <Select
                _value={form.terms}
                items={[
                  { value: '30', label: '30 天' },
                  { value: '60', label: '60 天' },
                  { value: '90', label: '90 天' },
                ]}
              />
            </Field>
          </FormSection>
          <Flex justify="end" gap="sm">
            <Button variant="soft" tone="neutral">
              保存草稿
            </Button>
            <Button>提交准入申请</Button>
          </Flex>
        </Flex>
      </form>
    </AsideLayout>
  );
});
