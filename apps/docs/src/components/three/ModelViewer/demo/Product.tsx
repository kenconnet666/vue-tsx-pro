// 商品详情：模型可以拖动环绕、滚轮缩放，旁边是商品信息；加载完成前中间转圈
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  H3,
  Paragraph,
  Small,
  Strong,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { ModelViewer } from '@zerodep-dev/vue-tsx-pro-ui/three';

const styles = css.create({
  viewer: { maxWidth: '26rem', marginInline: 'auto', borderRadius: '_lg' },
});

export default _component(() => {
  let loaded = _state(false);
  return () => (
    <Grid minItemWidth="18rem" gap="lg" align="center">
      <ModelViewer
        src="/models/trophy.glb"
        alt="金色奖杯，带两只把手，立在深灰色石台上"
        zoom
        sx={styles.viewer}
        onLoad={() => (loaded = true)}
      />
      <Card padding="md">
        <Flex direction="column" gap="sm">
          <Flex align="center" gap="sm">
            <H3 size="md">年度最佳奖杯</H3>
            <Badge tone="success">现货</Badge>
          </Flex>
          <Paragraph tone="muted" size="sm">
            黄铜镀金杯身，大理石底座，正面铭牌可免费刻字。拖动模型从各个角度看，滚轮或 + / -
            键缩放。
          </Paragraph>
          <Strong>¥ 1,299</Strong>
          <Flex gap="sm" align="center">
            <Button disabled={!loaded}>加入购物车</Button>
            <Small tone="muted">{loaded ? '模型已加载' : '模型加载中…'}</Small>
          </Flex>
        </Flex>
      </Card>
    </Grid>
  );
});
