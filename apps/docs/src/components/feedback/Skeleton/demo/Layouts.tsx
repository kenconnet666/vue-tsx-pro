import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Avatar,
  Button,
  Card,
  Flex,
  Grid,
  H4,
  Paragraph,
  SHIMMER_STAGGER,
  shimmerStyles,
  Skeleton,
  SkeletonText,
  Small,
  Stat,
  Switch,
  Text,
  TextField,
  t,
} from '@vue-tsx-pro/ui';

const styles = stylex.create({
  cover: {
    display: 'block',
    aspectRatio: '16 / 9',
    borderRadius: '_md',
    backgroundImage: `linear-gradient(135deg, ${t.colors.accentSoft}, ${t.colors.infoSoft})`,
  },
  fieldLabel: { width: '4em', height: '0.875em' },
  field: {
    width: '_full',
    height: `max(${t.sizes.control}, ${t.sizes.minTarget})`,
    borderRadius: '_md',
  },
});

const messages = [
  ['林小满', '周五的评审材料我放到共享盘了，你看下第三页的数据。'],
  ['陈一舟', '收到，下午三点前给你反馈。'],
  ['王若曦', '接口文档更新了分页参数，前端记得同步。'],
];

export default _component(() => {
  let loading = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Switch checked={_bind(loading)}>加载中</Switch>
      {/* 整块区域加载时带 aria-busy（骨架本身对读屏隐藏）；内容出现时淡入，不硬切 */}
      <Grid minItemWidth="16em" gap="md" align="start" aria-busy={loading || undefined}>
        {/* 文章：配图、标题、段落，自上而下依次扫过 */}
        <Card>
          {loading ? (
            <Flex direction="column" gap="md">
              <Skeleton variant="image" />
              <Skeleton variant="heading" delay={SHIMMER_STAGGER} style={{ width: '70%' }} />
              <SkeletonText lines={3} delay={2 * SHIMMER_STAGGER} />
            </Flex>
          ) : (
            <Flex direction="column" gap="md" sx={shimmerStyles.reveal}>
              <span {...stylex.attrs(styles.cover)} />
              <H4>设计系统的第一年</H4>
              <Paragraph tone="muted">
                从十几个按钮样式收敛到一套
                tokens，我们踩过的坑和留下的约定：命名、档位、主题与文档。
              </Paragraph>
            </Flex>
          )}
        </Card>

        {/* 消息列表：头像加两行文字，一条消息一档 */}
        <Card>
          {loading ? (
            <Flex direction="column" gap="lg">
              {messages.map((_, index) => (
                <Flex key={index} gap="md" align="center">
                  <Skeleton variant="circle" delay={index * SHIMMER_STAGGER} />
                  <Flex direction="column" gap="sm" style={{ flex: 1 }}>
                    <Skeleton
                      variant="text"
                      delay={index * SHIMMER_STAGGER}
                      style={{ width: '35%' }}
                    />
                    <Skeleton variant="text" delay={(index + 0.5) * SHIMMER_STAGGER} />
                  </Flex>
                </Flex>
              ))}
            </Flex>
          ) : (
            <Flex direction="column" gap="lg" sx={shimmerStyles.reveal}>
              {messages.map(([name, text]) => (
                <Flex key={name} gap="md" align="center">
                  <Avatar name={name} />
                  <Flex direction="column" style={{ minWidth: 0 }}>
                    <Text weight="semibold">{name}</Text>
                    <Small tone="muted" truncate>
                      {text}
                    </Small>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>

        {/* 看板：Stat、Card 自带 loading（骨架、aria-busy、淡入都由组件管） */}
        <Flex direction="column" gap="md">
          <Card>
            <Stat
              label="本月营收"
              value={128.6}
              unit="万元"
              change={0.084}
              changeLabel="较上月"
              loading={loading}
            />
          </Card>
          <Card header={<Text weight="semibold">本周摘要</Text>} loading={loading}>
            <Paragraph tone="muted">新签客户 12 家，续约率 94%，两笔大单进入法务审核。</Paragraph>
          </Card>
        </Flex>

        {/* 表单：标签加输入框，一个字段一档 */}
        <Card>
          {loading ? (
            <Flex direction="column" gap="lg">
              {[0, 1, 2].map((index) => (
                <Flex key={index} direction="column" gap="sm">
                  <Skeleton sx={styles.fieldLabel} delay={index * SHIMMER_STAGGER} />
                  <Skeleton sx={styles.field} delay={(index + 0.5) * SHIMMER_STAGGER} />
                </Flex>
              ))}
              <Skeleton variant="button" delay={3 * SHIMMER_STAGGER} />
            </Flex>
          ) : (
            <Flex direction="column" gap="lg" sx={shimmerStyles.reveal}>
              {['姓名', '邮箱', '部门'].map((label) => (
                <Flex key={label} direction="column" gap="sm">
                  <Small>{label}</Small>
                  <TextField aria-label={label} />
                </Flex>
              ))}
              <Button style={{ alignSelf: 'start' }}>保存</Button>
            </Flex>
          )}
        </Card>
      </Grid>
    </Flex>
  );
});
