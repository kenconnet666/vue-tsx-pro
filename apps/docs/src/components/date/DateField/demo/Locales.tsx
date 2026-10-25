// 段的顺序与分隔符取自 Intl：中文 年/月/日，美国 月/日/年，德国 日.月.年，英国 日/月/年；时间部分 12 / 24 小时制也跟着语言
import { _component } from '@vue-tsx-pro/tsx';
import { DateField, defineLang, enUS, Field, Grid, Provider } from '@vue-tsx-pro/ui';

const cases = [
  ['简体中文', undefined],
  ['English (US)', enUS],
  ['English (UK)', defineLang(enUS, { code: 'en-GB' })],
  ['Deutsch', defineLang(enUS, { code: 'de-DE' })],
  ['한국어', defineLang(enUS, { code: 'ko-KR' })],
] as const;

export default _component(() => () => (
  <Grid minItemWidth="16rem" gap="lg">
    {cases.map(([label, lang]) => (
      <Provider key={label} lang={lang}>
        <Field label={label}>
          <DateField granularity="minute" _value="2026-10-20T14:30" />
        </Field>
      </Provider>
    ))}
  </Grid>
));
