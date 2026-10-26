// 尺寸与填充：fit 决定图片在框里怎么放（cover 裁、contain 留白）；圆角档位；地址错了时显示占位与 alt（也可以自己给 fallback）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Image, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from './drawings';

const sample = drawings[0]!;

export default _component(() => () => (
  <Flex gap="lg" wrap align="end">
    {(['cover', 'contain', 'none'] as const).map((fit) => (
      <Flex key={fit} direction="column" gap="xs">
        <Image
          src={sample.src}
          alt={`${sample.title}（${fit}）`}
          width={140}
          height={140}
          fit={fit}
        />
        <Small tone="muted">fit="{fit}"</Small>
      </Flex>
    ))}
    <Flex direction="column" gap="xs">
      <Image src={drawings[2]!.src} alt="圆形缩略图" width={96} height={96} radius="full" />
      <Small tone="muted">radius="full"</Small>
    </Flex>
    <Flex direction="column" gap="xs">
      <Image src="/missing/drawing.png" alt="不存在的图纸" width={140} height={105} />
      <Small tone="muted">加载失败</Small>
    </Flex>
  </Flex>
));
