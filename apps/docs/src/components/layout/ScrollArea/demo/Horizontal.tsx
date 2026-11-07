// 横向滚动：最近打开的图纸一排排开，滚动条一直显示（type="always"），触摸板、Shift + 滚轮横着滚
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  Flex,
  FlexList,
  Image,
  ScrollArea,
  Small,
  Strong,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../../display/Image/demo/drawings';

// 六张图纸再来一轮：内容比区域宽，才有横向滚动
const recent = [...drawings, ...drawings].map((drawing, index) => ({
  ...drawing,
  key: `${drawing.code}-${index}`,
  opened: index < 6 ? `${index + 1} 小时前` : `${index - 4} 天前`,
}));

const styles = css.create({
  item: { flexShrink: 0, width: '10rem' },
  cover: { display: 'block', marginBlockEnd: '_sm', aspectRatio: '3 / 2' },
  padded: { paddingBlockEnd: '_md' },
});

export default _component(() => () => (
  <ScrollArea axis="x" type="always" propsViewport={{ 'aria-label': '最近打开的图纸' }}>
    <FlexList gap="md" sx={styles.padded}>
      {recent.map((drawing) => (
        <li key={drawing.key} {...css.attrs(styles.item)}>
          <Card padding="sm">
            <Image
              src={drawing.src}
              alt=""
              width="100%"
              height="auto"
              fit="contain"
              propsRoot={{ sx: styles.cover }}
            />
            <Flex direction="column">
              <Strong>{drawing.title}</Strong>
              <Small tone="muted">
                {drawing.code} · {drawing.opened}
              </Small>
            </Flex>
          </Card>
        </li>
      ))}
    </FlexList>
  </ScrollArea>
));
