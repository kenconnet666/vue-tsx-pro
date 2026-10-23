// 拼音匹配：全拼、首字母、混写、多音字，拼音要对上连续的字；经 Provider 的 textMatcher 交给选项过滤
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../Provider';
import { createPinyinMatcher } from '../pinyin';
import { Select } from '../../input/Select';
import { mount } from '../../utils/.test/mount';

describe('createPinyinMatcher', () => {
  const match = createPinyinMatcher();
  it('全拼、首字母、混写都能匹配；多音字任一读音都算', () => {
    expect(match('北京', 'beijing')).toBe(true);
    expect(match('北京', 'bj')).toBe(true);
    expect(match('北京', 'beij')).toBe(true);
    expect(match('北京', 'bei jing')).toBe(true);
    expect(match('会计部', 'kuaiji')).toBe(true);
    expect(match('会计部', 'huiji')).toBe(true);
  });
  it('拼音要对上连续的字；输入不是拼音、文字里没有汉字时不按拼音匹配', () => {
    expect(match('汉语拼音', 'hanpin')).toBe(false);
    expect(match('汉语拼音', 'yupin')).toBe(true);
    expect(match('北京', '北')).toBe(false);
    expect(match('Beijing', 'bj')).toBe(false);
    expect(match('北京', '')).toBe(false);
  });
});

describe('textMatcher 配置', () => {
  it('Provider 给了拼音匹配：Select 的搜索认拼音，字面匹配照常', async () => {
    const root = mount(() => (
      <Provider textMatcher={createPinyinMatcher()}>
        <Select items={['北京', '上海', '杭州']} searchable aria-label="城市" />
      </Provider>
    ));
    const search = root.querySelector<HTMLInputElement>('[popover] input')!;
    const options = () =>
      [...root.querySelectorAll('[role="option"]')].map((option) => option.textContent);
    search.value = 'hz';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(options()).toEqual(['杭州']);
    search.value = '上';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(options()).toEqual(['上海']);
  });

  it('没配时只按字面匹配', async () => {
    const root = mount(() => <Select items={['北京', '上海']} searchable aria-label="城市" />);
    const search = root.querySelector<HTMLInputElement>('[popover] input')!;
    search.value = 'bj';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(root.querySelectorAll('[role="option"]')).toHaveLength(0);
  });
});
