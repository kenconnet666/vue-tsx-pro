/**
 * 类型搜索（WAI-ARIA 的 type-ahead）：在菜单、列表里直接按字母，焦点跳到以它开头的项。
 * 连续输入拼成一个词（“ex” 跳到 Export）；间隔超过 timeout 后重新开始；反复按同一个字母在以它开头的项之间轮换。
 * 菜单经 rovingFocus 的 typeahead 选项使用，Listbox、Select 经 useListState 用同一个匹配规则。
 */

/** createTypeahead 返回的搜索器 */
export interface Typeahead {
  /**
   * 处理一次按键：key 是 KeyboardEvent.key，labels 是各项的文字，current 是当前项的序号（没有时 -1）。
   * 返回该落到的项的序号；不是可打印字符、或没有匹配时返回 -1
   */
  next(key: string, labels: readonly string[], current: number): number;
}

/** 生成一个搜索器：每个菜单、列表各用一个，输入缓冲互不干扰 */
export function createTypeahead(timeout = 500): Typeahead {
  let query = '';
  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    next(key, labels, current) {
      // 只认单个可打印字符；空格开头时不算（空格是激活键）
      if (!/^.$/su.test(key) || (key === ' ' && !query)) return -1;
      clearTimeout(timer);
      timer = setTimeout(() => (query = ''), timeout);
      query += key.toLocaleLowerCase();

      const normalized = labels.map((label) => label.trim().toLocaleLowerCase());
      // 同一个字母反复按：从下一项开始找以它开头的，轮换
      const first = query.slice(0, key.length);
      const repeated = query === first.repeat(query.length / first.length);
      const search = repeated ? first : query;
      const start = repeated ? current + 1 : Math.max(current, 0);
      for (let offset = 0; offset < normalized.length; offset++) {
        const index = (start + offset) % normalized.length;
        if (normalized[index]!.startsWith(search)) return index;
      }
      return -1;
    },
  };
}
