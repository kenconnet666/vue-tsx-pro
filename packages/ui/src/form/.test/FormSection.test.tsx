// FormSection：分组的语义、栅格、折叠，以及这一组的字段布局（覆盖 Form 的设置）
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { TextField } from '../../input/TextField';
import { mount } from '../../utils/.test/mount';
import { Field } from '../Field';
import { Form } from '../Form';
import { FormSection } from '../FormSection';
import { useForm } from '../useForm';

describe('FormSection', () => {
  it('role="group" 以标题为名称、说明为描述；标题级别随 headingLevel', () => {
    const root = mount(() => (
      <FormSection title="项目基本信息" description="带 * 的必填" headingLevel={2}>
        <Field label="项目名称">
          <TextField />
        </Field>
      </FormSection>
    ));
    const group = root.querySelector('[role="group"]')!;
    const heading = root.querySelector('h2')!;
    expect(heading.textContent).toBe('项目基本信息');
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent).toBe(
      '项目基本信息',
    );
    expect(document.getElementById(group.getAttribute('aria-describedby')!)!.textContent).toBe(
      '带 * 的必填',
    );
  });

  it('没有标题时不是 group，只是一层栅格；columns 多列时写最多几列与最小列宽', () => {
    const root = mount(() => (
      <FormSection columns={2} minColumnWidth="18em">
        a
      </FormSection>
    ));
    expect(root.querySelector('[role="group"]')).toBeNull();
    const body = root.firstElementChild!.lastElementChild!;
    expect(body.getAttribute('style')).toContain('18em');
    expect(body.getAttribute('style')).toContain('/ 2');
  });

  it('这一组的布局与只读覆盖 Form 的，其他组照旧', () => {
    const form = useForm({ initial: { a: '', b: '' } });
    const root = mount(() => (
      <Form controller={form} labelPlacement="start">
        <FormSection title="可编辑">
          <Field label="甲">
            <TextField value={_bind(form.values.a)} />
          </Field>
        </FormSection>
        <FormSection title="审批意见" readonly labelPlacement="top">
          <Field label="乙">
            <TextField value={_bind(form.values.b)} />
          </Field>
        </FormSection>
      </Form>
    ));
    const [a, b] = root.querySelectorAll('input');
    const [fieldA, fieldB] = root.querySelectorAll<HTMLElement>('[data-label-placement]');
    expect(a!.readOnly).toBe(false);
    expect(b!.readOnly).toBe(true);
    expect(fieldA!.dataset.labelPlacement).toBe('start');
    expect(fieldB!.dataset.labelPlacement).toBe('top');
  });

  it('collapsible：标题是按钮，aria-expanded 跟着展开收起，open 双向绑定', async () => {
    let open = _state(true);
    const root = mount(() => (
      <FormSection title="经费及项目依据" collapsible open={_bind(open)}>
        内容
      </FormSection>
    ));
    const trigger = root.querySelector('h3 button')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toBeNull();
    (trigger as HTMLButtonElement).click();
    await nextTick();
    expect(open).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(root.firstElementChild!.getAttribute('data-state')).toBe('closed');
  });
});
