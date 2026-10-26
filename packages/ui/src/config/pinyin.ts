/**
 * 拼音匹配（子路径 `@zerodep-dev/vue-tsx-pro-ui/pinyin`；pinyin-pro 是可选的 peer 依赖，用到才安装）：
 * 选项过滤、命令面板、树的搜索除了按字面匹配，还认全拼、首字母与两者混写（“bj”“beijing”“beij”都能搜到“北京”）。
 *
 *   app.use(createUi({ textMatcher: createPinyinMatcher() }))
 *
 * 多音字任一读音都算（“会计”既能搜 kuaiji 也能搜 huiji）；拼音要对上连续的几个字（“hanpin”搜不到“汉语拼音”），
 * 不在中间跳字，免得结果太宽。只有输入里都是字母（可带空格）时才按拼音匹配，输入汉字时就是普通的字面匹配。
 * pinyin-pro 的字典约 300 KB：只有用到这个子路径的应用才打包它。
 */
import { match } from 'pinyin-pro';
import type { TextMatcher } from './context';

/** 输入是拼音：只有字母与空格 */
const PINYIN_QUERY = /^[a-z\s]+$/i;

/** 拼音匹配器：交给 createUi / Provider 的 textMatcher */
export function createPinyinMatcher(): TextMatcher {
  return (text, query) => {
    const input = query.trim();
    if (!input || !PINYIN_QUERY.test(input) || !/[㐀-鿿]/.test(text)) return false;
    return match(text, input.replace(/\s+/g, ''), { continuous: true }) != null;
  };
}
