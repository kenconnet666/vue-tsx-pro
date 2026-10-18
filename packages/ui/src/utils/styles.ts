/**
 * 组件共用的档位类型与样式表。档位与主题 tokens 同名（COMPONENTS.md §6.2）：
 * 组件的 size、gap 等 prop 直接用这些类型，取值一一对应到 token。
 */

/** 五档：字号、间距、圆角、阴影等都按它分档 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** 间距档位：五档之外可以是 none */
export type Space = 'none' | Size;
