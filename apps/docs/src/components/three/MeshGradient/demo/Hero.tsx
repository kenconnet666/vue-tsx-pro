import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Badge, Button, Flex, H2, Paragraph } from '@vue-tsx-pro/ui';
import { MeshGradient } from '@vue-tsx-pro/ui/three';

const styles = css.create({
  hero: { borderRadius: '_lg', minHeight: '24rem', display: 'grid', placeItems: 'center' },
  panel: {
    maxWidth: '30rem',
    padding: '_xl',
    borderRadius: '_lg',
    backgroundColor: '_surfaceTranslucent',
    backdropFilter: 'blur(12px)',
    boxShadow: '_lg',
    textAlign: 'center',
  },
  lead: { color: '_textMuted' },
});

export default _component(() => () => (
  <MeshGradient sx={styles.hero} propsContent={{ sx: styles.panel }}>
    <Flex direction="column" gap="md" align="center">
      <Badge variant="soft">新版本 2.0</Badge>
      <H2 size="xxl">把想法变成产品</H2>
      <Paragraph sx={styles.lead}>
        背景的光斑取自主题的品牌色与图表色板，切换主题、在主题编辑器里改品牌色都会实时过渡。移动指针试试。
      </Paragraph>
      <Flex gap="sm" justify="center">
        <Button>开始使用</Button>
        <Button variant="outline">查看文档</Button>
      </Flex>
    </Flex>
  </MeshGradient>
));
