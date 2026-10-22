/**
 * 编号链接：任务卡、建议、方案的编号用等宽字体、链到卡的详情；没有详情页的编号（建议、方案还没做）只显示文字
 */
import { _component } from '@vue-tsx-pro/tsx';
import { Link, Text } from '@vue-tsx-pro/ui';
import { paths } from '../app/paths';

/** 任务卡（单机降本、降 DMC）的编号：DJ- 或 DMC- 开头 */
export const isTaskCode = (code: string) => /^(DJ|DMC)-/.test(code);

/** 编号链接 */
export const CodeLink = _component(
  ({
    code,
    href,
  }: {
    /** 编号 */
    code: string;
    /** 链到哪儿；不写时任务卡的编号链到详情，其余只显示文字 */
    href?: string;
  }) =>
    () => {
      const target = href ?? (isTaskCode(code) ? paths.task(code) : undefined);
      const text = (
        <Text mono size="sm">
          {code}
        </Text>
      );
      return target ? <Link href={target}>{text}</Link> : text;
    },
);
