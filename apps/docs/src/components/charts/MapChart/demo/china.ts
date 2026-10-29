/**
 * 示例共用的省份：组件库自带的中国省份 TopoJSON（@zerodep-dev/vue-tsx-pro-ui/maps 的 chinaProvinces）的要素 id 与中文名、所属大区。
 * 这份数据里湖北是 CN-HU、河北是 CN-HB、河南是 CN-HE、海南是 CN-HA、陕西是 CN-SA、内蒙古是 CN-NM。
 */
export const provinces: readonly { id: string; name: string; region: string }[] = [
  { id: 'CN-BJ', name: '北京', region: '华北' },
  { id: 'CN-TJ', name: '天津', region: '华北' },
  { id: 'CN-HB', name: '河北', region: '华北' },
  { id: 'CN-SX', name: '山西', region: '华北' },
  { id: 'CN-NM', name: '内蒙古', region: '华北' },
  { id: 'CN-LN', name: '辽宁', region: '东北' },
  { id: 'CN-JL', name: '吉林', region: '东北' },
  { id: 'CN-HL', name: '黑龙江', region: '东北' },
  { id: 'CN-SH', name: '上海', region: '华东' },
  { id: 'CN-JS', name: '江苏', region: '华东' },
  { id: 'CN-ZJ', name: '浙江', region: '华东' },
  { id: 'CN-AH', name: '安徽', region: '华东' },
  { id: 'CN-FJ', name: '福建', region: '华东' },
  { id: 'CN-JX', name: '江西', region: '华东' },
  { id: 'CN-SD', name: '山东', region: '华东' },
  { id: 'CN-HE', name: '河南', region: '华中' },
  { id: 'CN-HU', name: '湖北', region: '华中' },
  { id: 'CN-HN', name: '湖南', region: '华中' },
  { id: 'CN-GD', name: '广东', region: '华南' },
  { id: 'CN-GX', name: '广西', region: '华南' },
  { id: 'CN-HA', name: '海南', region: '华南' },
  { id: 'CN-CQ', name: '重庆', region: '西南' },
  { id: 'CN-SC', name: '四川', region: '西南' },
  { id: 'CN-GZ', name: '贵州', region: '西南' },
  { id: 'CN-YN', name: '云南', region: '西南' },
  { id: 'CN-XZ', name: '西藏', region: '西南' },
  { id: 'CN-SA', name: '陕西', region: '西北' },
  { id: 'CN-GS', name: '甘肃', region: '西北' },
  { id: 'CN-QH', name: '青海', region: '西北' },
  { id: 'CN-NX', name: '宁夏', region: '西北' },
  { id: 'CN-XJ', name: '新疆', region: '西北' },
];

/** 按位置算出一个看起来自然的数：东部高、西部低 */
export function sampleValue(index: number, scale: number): number {
  const wave = Math.sin(index * 1.7) * 0.35 + Math.cos(index * 0.6) * 0.25;
  return Math.round(scale * Math.max(0.05, 0.9 - index / 40 + wave) * 10) / 10;
}
