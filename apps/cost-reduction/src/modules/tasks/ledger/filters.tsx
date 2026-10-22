/**
 * 台账查询栏里的各个条件：两种台账各取自己的那几项（常用的放外面，其余收进“展开”）。
 * 选项都取自主数据与字典
 */
import { Combobox, DatePicker, Field, Select } from '@vue-tsx-pro/ui';
import { dict, master, shortTeam, staffOptions } from '../../../app/master';
import type { LedgerQuery } from '../../../domain/task/query';
import { valueStates } from '../../../shared/statuses';

const yesNo = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
];

/** 查询栏的各个条件：拿到可写的查询条件，返回一个 Field */
export const filterFields = {
  team: (query: LedgerQuery) => (
    <Field label="团队">
      <Select
        items={master().teams.map((team) => ({ value: team.name, label: shortTeam(team.name) }))}
        value={_bind(query.team)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  year: (query: LedgerQuery) => (
    <Field label="完成年度">
      <DatePicker granularity="year" value={_bind(query.year)} />
    </Field>
  ),
  contact: (query: LedgerQuery) => (
    <Field label="联络人">
      <Combobox items={staffOptions()} value={_bind(query.contact)} placeholder="输入姓名" />
    </Field>
  ),
  category: (query: LedgerQuery) => (
    <Field label="类别">
      <Select
        items={dict('categories')}
        value={_bind(query.category)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  org: (query: LedgerQuery) => (
    <Field label="提出单位">
      <Select
        items={master().orgs.map((org) => org.name)}
        value={_bind(query.org)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  form: (query: LedgerQuery) => (
    <Field label="完成形式">
      <Select
        items={dict('completionForms')}
        value={_bind(query.form)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  install: (query: LedgerQuery) => (
    <Field label="必装 / 选装">
      <Select
        items={dict('installTypes')}
        value={_bind(query.install)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  supplier: (query: LedgerQuery) => (
    <Field label="涉及供应商">
      <Select
        items={master().suppliers}
        value={_bind(query.supplier)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  funding: (query: LedgerQuery) => (
    <Field label="经费来源">
      <Select
        items={dict('fundingSources')}
        value={_bind(query.funding)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  valueState: (query: LedgerQuery) => (
    <Field label="收益状态">
      <Select
        items={valueStates.options()}
        value={_bind(query.valueState)}
        placeholder="全部"
        clearable
      />
    </Field>
  ),
  needSb: (query: LedgerQuery) => (
    <Field label="需要 SB">
      <Select items={yesNo} value={_bind(query.needSb)} placeholder="全部" clearable />
    </Field>
  ),
};

/** 收起的条件里填了几项（空字符串与 null 都算没填） */
export const countActive = (query: LedgerQuery, keys: readonly (keyof LedgerQuery)[]) =>
  keys.filter((key) => query[key]).length;
