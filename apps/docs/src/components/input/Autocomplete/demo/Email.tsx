// 邮箱：输入 @ 之前的部分，建议接上常用后缀；不选也行，输入什么就是什么
import { Mail } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Autocomplete, Code, Field, Grid } from '@vue-tsx-pro/ui';

const domains = ['qq.com', '163.com', 'foxmail.com', 'gmail.com', 'outlook.com', 'company.cn'];

/** 按已输入的 @ 后面部分筛后缀：lin@q → lin@qq.com */
const suggest = (text: string) => {
  if (!text) return [];
  const [name, typed = ''] = text.split('@');
  return domains.filter((domain) => domain.startsWith(typed)).map((domain) => `${name}@${domain}`);
};

export default _component(() => {
  let email = _state('');
  let cc = _state('finance@company.cn');
  return () => (
    <Grid minItemWidth="15rem" gap="lg">
      <Field
        label="联系邮箱"
        description={
          <>
            值就是文字：<Code>{email || '（空）'}</Code>
          </>
        }
      >
        <Autocomplete
          _value={_bind(email)}
          items={suggest(email)}
          // 建议已经按输入算好，不再本地过滤
          filter={false}
          icon={Mail}
          clearable
          placeholder="输入邮箱"
          name="email"
        />
      </Field>
      <Field label="抄送" description="已有值时照常显示；建议只在输入时出现">
        <Autocomplete _value={_bind(cc)} items={suggest(cc)} filter={false} icon={Mail} />
      </Field>
    </Grid>
  );
});
