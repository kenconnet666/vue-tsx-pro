// 占位页：应用待重做；整屏居中
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Empty } from '@vue-tsx-pro/ui';

const styles = css.create({
  page: { boxSizing: 'border-box', minHeight: '100dvh', justifyContent: 'center' },
});

export const App = _component(() => () => (
  <Empty sx={styles.page} title="联合降本管理" description="正在重新设计，敬请期待。" />
));
