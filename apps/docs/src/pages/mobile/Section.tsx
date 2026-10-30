/**
 * 移动端的分组页（数据在 sections.ts）：手机外框里运行 mobile-demo 对应页面的 H5 版（可以点、可以滑），
 * 旁边是同一页在微信开发者工具里的截图（apps/mobile-demo 的 screenshots.ts 生成），下面列出这一组的组件
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Code, Flex, H2, List, ListItem, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import type { Component } from 'vue';
import { DocPage } from '../../site/DocPage';
import { MOBILE_SECTIONS, type MobileSection } from './sections';

/** 外框的大小：iPhone 13 的逻辑宽度，高度留出页面底部 */
const PHONE = { width: 375, height: 760 };

const styles = css.create({
  stage: { gap: '_xl', flexWrap: 'wrap', alignItems: 'flex-start' },
  figure: {
    flex: 'none',
    maxWidth: '100%',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
  },
  phone: {
    width: `${PHONE.width}px`,
    maxWidth: '100%',
    height: `${PHONE.height}px`,
    border: '1px solid',
    borderColor: '_border',
    borderRadius: '28px',
    overflow: 'hidden',
    backgroundColor: '_surface',
  },
  frame: { display: 'block', width: '100%', height: '100%', border: 0 },
  // 截图带着开发者工具画的手机外形，按高度对齐
  shot: { display: 'block', height: `${PHONE.height}px`, maxWidth: '100%', objectFit: 'contain' },
  caption: { fontSize: '_sm', color: '_textMuted', textAlign: 'center' },
});

/** 一组的页面 */
function sectionView(section: MobileSection): Component {
  const meta = { title: section.title, description: section.description };
  return _component(() => () => (
    <DocPage meta={meta} imports="import { … } from '@zerodep-dev/vue-tsx-pro-mobile';" wide>
      <Flex sx={styles.stage}>
        <figure {...css.attrs(styles.figure)}>
          <div {...css.attrs(styles.phone)}>
            <iframe
              {...css.attrs(styles.frame)}
              src={`/mobile-frame.html#${section.demo}`}
              title={`${section.title}：H5 演示`}
              loading="lazy"
            />
          </div>
          <figcaption {...css.attrs(styles.caption)}>H5（可以点、可以滑）</figcaption>
        </figure>
        <figure {...css.attrs(styles.figure)}>
          <img
            {...css.attrs(styles.shot)}
            src={`/mobile/wx/${section.demo}.png`}
            alt={`${section.title}：微信小程序截图`}
            loading="lazy"
          />
          <figcaption {...css.attrs(styles.caption)}>微信小程序（同一份页面代码）</figcaption>
        </figure>
      </Flex>
      <Flex direction="column" gap="md">
        <H2 id="components" size="xl" anchor>
          组件
        </H2>
        <List>
          {section.components.map(([name, summary]) => (
            <ListItem>
              <Code>{name}</Code>：{summary}
            </ListItem>
          ))}
        </List>
        <Paragraph tone="muted">
          页面源码在 <Code>apps/mobile-demo/src/pages</Code>；写法约束与各组件的取舍见{' '}
          <Code>packages/mobile/MOBILE.md</Code>。
        </Paragraph>
      </Flex>
    </DocPage>
  ));
}

const views = new Map<string, Component>();

/** 演示页名 → 分组页的组件（同一组每次拿到同一个组件） */
export function sectionPage(demo: string): Component {
  let view = views.get(demo);
  if (!view) {
    view = sectionView(MOBILE_SECTIONS.find((section) => section.demo === demo)!);
    views.set(demo, view);
  }
  return view;
}
