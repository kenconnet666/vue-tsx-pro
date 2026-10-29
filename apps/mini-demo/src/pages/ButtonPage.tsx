// 概念验证：组件库的预编译 Button 原样跑在小程序里（样式、条件样式、部件属性透传、图标、事件）
import { Heart, Plus, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Button } from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { fontSize: '_lg', fontWeight: '_semibold', color: '_text' },
  row: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  count: { color: '_textMuted' },
});

export const ButtonPage = _component(() => {
  let count = _state(0);
  let loading = _state(false);
  let liked = _state(false);

  return () => (
    <div {...css.attrs(styles.page)}>
      <div {...css.attrs(styles.title)}>packages/ui · Button</div>
      <div {...css.attrs(styles.row)}>
        <Button onClick={() => count++}>主要 {count}</Button>
        <Button variant="soft" onClick={() => count++}>
          浅色
        </Button>
        <Button variant="outline" tone="danger" icon={Trash2}>
          删除
        </Button>
      </div>
      <div {...css.attrs(styles.row)}>
        <Button size="sm" variant="surface" icon={Plus}>
          小号
        </Button>
        <Button size="lg" loading={loading} onClick={() => (loading = !loading)}>
          {loading ? '加载中' : '大号'}
        </Button>
        <Button disabled onClick={() => count++}>
          禁用
        </Button>
      </div>
      <div {...css.attrs(styles.row)}>
        <Button
          variant={liked ? 'solid' : 'outline'}
          tone="danger"
          icon={Heart}
          aria-pressed={liked}
          onClick={() => (liked = !liked)}
        >
          {liked ? '已收藏' : '收藏'}
        </Button>
        <Button propsContent={{ class: 'probe-part' }} sx={{ borderRadius: '999px' }}>
          透传 + sx
        </Button>
        <Button variant="ghost" onClick={() => (loading = !loading)}>
          切换加载
        </Button>
      </div>
      <div class="count" {...css.attrs(styles.count)}>
        点击次数：{count}
      </div>
    </div>
  );
});
