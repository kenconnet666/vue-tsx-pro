import { Plus, Search, Settings, User } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { darkTheme, enUS, lightTheme, Provider, useLang, zhCN } from '@vue-tsx-pro/ui';
import { Button } from '../pilot/Button';
import { Dialog } from '../pilot/Dialog';
import { Popover } from '../pilot/Popover';
import { TextField } from '../pilot/TextField';

const styles = stylex.create({
  // Provider 不产生盒子、不画背景：主题区域自己铺底色
  page: {
    display: 'grid',
    alignContent: 'start',
    gap: '1.25em',
    padding: '1.5em',
    minHeight: '100vh',
    backgroundColor: '_background',
  },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75em' },
  large: { fontSize: 24 },
});

/** 弹出内容放在独立组件里，才能读到 Provider 提供的语言 */
const MenuContent = _component(({ onClose }: { onClose: () => void }) => {
  const lang = useLang();
  return () => (
    <div {...stylex.attrs(styles.row)}>
      <span class="menu-text">{lang.loading}</span>
      <Button variant="ghost" onClick={onClose}>
        {lang.close}
      </Button>
    </div>
  );
});

/** 试点组件演示：主题与语言切换、em 尺寸、部件透传、输入法、弹出层 */
export const Pilot = _component(() => {
  let dark = _state(false);
  let english = _state(false);
  let keyword = _state('');
  let menuOpen = _state(false);
  let dialogOpen = _state(false);
  let nestedOpen = _state(false);
  let name = _state('');

  return () => (
    <Provider theme={dark ? darkTheme : lightTheme} lang={english ? enUS : zhCN}>
      <main {...stylex.attrs(styles.page)}>
        <div {...stylex.attrs(styles.row)}>
          <Button variant="outline" class="toggle-theme" onClick={() => (dark = !dark)}>
            {dark ? '亮色' : '暗色'}
          </Button>
          <Button variant="outline" class="toggle-lang" onClick={() => (english = !english)}>
            {english ? '中文' : 'English'}
          </Button>
        </div>

        <div {...stylex.attrs(styles.row)}>
          <Button size="sm" icon={Plus}>
            小
          </Button>
          <Button icon={Plus}>默认</Button>
          <Button size="lg" icon={Plus}>
            大
          </Button>
          <span {...stylex.attrs(styles.large)}>
            <Button variant="ghost" icon={Settings} class="inherit-size">
              继承 24px
            </Button>
          </span>
          <Button href="/profile/42" icon={User} propsIcon={{ strokeWidth: 3 }} class="link-button">
            链接按钮
          </Button>
          <Button disabled>禁用</Button>
          <Button loading>加载中</Button>
        </div>

        <div {...stylex.attrs(styles.row)}>
          <TextField
            value={_bind(keyword)}
            clearable
            icon={Search}
            placeholder="搜索"
            aria-label="搜索"
            propsRoot={{ class: 'search-field' }}
          />
          <span class="keyword">{keyword}</span>
        </div>

        <div {...stylex.attrs(styles.row)}>
          <Popover
            open={_bind(menuOpen)}
            trigger={(props) => (
              <Button {...props} class="menu-trigger">
                更多
              </Button>
            )}
          >
            <MenuContent onClose={() => (menuOpen = false)} />
          </Popover>

          <Button class="dialog-trigger" onClick={() => (dialogOpen = true)}>
            打开对话框
          </Button>
          <Dialog
            open={_bind(dialogOpen)}
            title="编辑资料"
            class="pilot-dialog"
            footer={
              <>
                <Button
                  variant="outline"
                  class="dialog-cancel"
                  onClick={() => (dialogOpen = false)}
                >
                  取消
                </Button>
                <Button class="dialog-ok" onClick={() => (dialogOpen = false)}>
                  确定
                </Button>
              </>
            }
          >
            <div {...stylex.attrs(styles.row)}>
              <TextField
                value={_bind(name)}
                aria-label="名字"
                propsRoot={{ class: 'dialog-field' }}
              />
              <Popover
                open={_bind(nestedOpen)}
                trigger={(props) => (
                  <Button {...props} variant="outline" class="nested-trigger">
                    选项
                  </Button>
                )}
              >
                <Button variant="ghost" class="nested-item">
                  对话框里的弹层
                </Button>
              </Popover>
            </div>
          </Dialog>
        </div>
      </main>
    </Provider>
  );
});
