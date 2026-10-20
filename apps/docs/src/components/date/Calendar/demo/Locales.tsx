// 跟随语言：月份名、星期名、读屏念的完整日期都来自 Intl；一周从哪天开始按地区惯例，也可以用 firstDayOfWeek 指定
import { _component } from '@vue-tsx-pro/tsx';
import { Calendar, defineLang, enUS, Flex, Grid, Provider, Small, todayIso } from '@vue-tsx-pro/ui';

const german = defineLang(enUS, { code: 'de-DE' });
const japanese = defineLang(enUS, { code: 'ja-JP' });
// 从右往左排版：整个日历镜像，翻页箭头跟着翻转，数字按 Intl 写成阿拉伯-印度数字
const arabic = defineLang(enUS, { code: 'ar-EG', direction: 'rtl' });

export default _component(() => {
  const today = todayIso();
  const cases = [
    ['简体中文：周一开始', undefined, undefined],
    ['English (US)：周日开始', enUS, undefined],
    ['Deutsch：周一开始，显示周数', german, undefined],
    ['日本語：周日开始', japanese, undefined],
    ['简体中文，firstDayOfWeek={0}', undefined, 0],
    ['阿拉伯语（从右往左）', arabic, undefined],
  ] as const;
  return () => (
    <Grid minItemWidth="15rem" gap="xl">
      {cases.map(([label, lang, firstDayOfWeek]) => (
        <Flex key={label} direction="column" gap="xs">
          <Small tone="muted">{label}</Small>
          <Provider lang={lang}>
            <Calendar
              value={today}
              firstDayOfWeek={firstDayOfWeek}
              showWeekNumbers={lang === german}
              aria-label={label}
            />
          </Provider>
        </Flex>
      ))}
    </Grid>
  );
});
