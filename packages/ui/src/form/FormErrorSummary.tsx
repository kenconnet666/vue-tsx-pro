/**
 * 错误汇总：提交没通过时在表单顶上列出各项错误（“有 3 项需要修改”），每项是链接，点了跳到那个字段的控件。
 * 放在 Form 里（通常是第一个）；提交失败时 Form 把焦点移到它上面，读屏念出有几项、各是什么（GOV.UK 的 Error summary）。
 *
 *   <Form controller={form}>
 *     <FormErrorSummary />
 *     <form.Field name="email" label="邮箱"><TextField /></form.Field>
 *   </Form>
 *
 * 只列显示着的错误（失焦过、提交过的字段），按字段在表单里出现的顺序；改对一项它就从列表里消失，全改对了汇总收起。
 * 整份表单的错误（不属于哪个字段）排在最前，不带链接。字段名取自 Field 的标签。
 * 部件：Root（div，role="alert" 之外可以聚焦）、Title（div）、List（ul）、Link（a）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useLang } from '../config/context';
import { focusControl } from '../utils/dom/focus';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { statusIcons } from '../utils/style/tone-styles';
import { FormContext } from './Form';

/** 未声明的属性落到外层 div 上 */
export interface FormErrorSummaryProps extends PartProps<'div', 'title'> {
  /** 标题；不写时取语言包（有 N 项需要修改） */
  title?: (count: number) => VNodeChild;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 列表的部件属性 */
  propsList?: PartProps<'ul'>;
  /** 每一项链接的部件属性 */
  propsLink?: PartProps<'a'>;
}

/** FormErrorSummary 的样式：root、title、list、link */
export const formErrorSummaryStyles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    padding: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_dangerBorder',
    borderRadius: '_md',
    backgroundColor: '_dangerSoft',
    color: '_text',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '_xs',
    fontWeight: '_semibold',
    color: '_dangerText',
  },
  list: { margin: 0, paddingInlineStart: '1.5em', display: 'grid', gap: '_xs' },
  link: {
    color: '_dangerText',
    textDecoration: { default: 'underline', ':hover': 'none' },
    textUnderlineOffset: '0.2em',
  },
});

/** 错误汇总：提交没通过时列出各项错误，点了跳到字段 */
export const FormErrorSummary = _component(
  ({ title, propsTitle, propsList, propsLink, ...rest }: FormErrorSummaryProps) => {
    const lang = useLang();
    const form = FormContext.inject(null);

    /** 显示着的错误：整份表单的在前，其余按字段在表单里出现的顺序 */
    const items = () => {
      if (!form || form.submitCount === 0) return [];
      const fields = [...form.fields].flatMap(([path, field]) => {
        const message = form.visibleError(path);
        return message ? [{ path, label: field.label, controlId: field.controlId, message }] : [];
      });
      return form.formError
        ? [{ path: '', label: '', controlId: '', message: form.formError }, ...fields]
        : fields;
    };

    function jump(event: MouseEvent, controlId: string) {
      event.preventDefault();
      const control = document.getElementById(controlId);
      if (control) focusControl(control);
    }

    return () => {
      const list = items();
      if (list.length === 0) return null;
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [formErrorSummaryStyles.root, focusRingStyles.visible] },
            rest,
            {
              // 提交失败时 Form 把焦点移到这里
              tabindex: -1,
            },
          )}
          data-form-error-summary=""
        >
          <div {...mergeAttrs<'div'>({ sx: formErrorSummaryStyles.title }, propsTitle)}>
            <Icon icon={statusIcons.danger} />
            {title ? title(list.length) : lang.formErrorSummary(list.length)}
          </div>
          <ul {...mergeAttrs<'ul'>({ sx: formErrorSummaryStyles.list }, propsList)}>
            {list.map((item) => (
              <li key={item.path}>
                {item.controlId ? (
                  <a
                    {...mergeAttrs<'a'>({ sx: formErrorSummaryStyles.link }, propsLink, {
                      href: `#${item.controlId}`,
                      onClick: (event: MouseEvent) => jump(event, item.controlId),
                    })}
                  >
                    {item.label ? lang.formErrorItem(item.label, item.message) : item.message}
                  </a>
                ) : (
                  item.message
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    };
  },
);
