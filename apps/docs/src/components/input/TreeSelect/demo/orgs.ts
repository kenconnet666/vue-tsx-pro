// 示例用的组织机构（虚构）：公司 → 中心 / 部 → 团队
export interface Org {
  id: string;
  name: string;
  children?: Org[];
}

export const orgs: Org[] = [
  {
    id: 'hq',
    name: '总部',
    children: [
      {
        id: 'pemo',
        name: '项目管理办公室（PEMO）',
        children: [
          { id: 'pemo-plan', name: '计划组' },
          { id: 'pemo-pool', name: '任务池管理组' },
        ],
      },
      {
        id: 'cost',
        name: '成本管理部',
        children: [
          { id: 'cost-estimate', name: '测算组' },
          { id: 'cost-ledger', name: '一本账组' },
        ],
      },
    ],
  },
  {
    id: 'composite',
    name: '复合材料中心',
    children: [
      { id: 'composite-structure', name: '复合材料结构集成团队' },
      { id: 'composite-process', name: '复材工艺团队' },
    ],
  },
  {
    id: 'assembly',
    name: '总装制造中心',
    children: [
      { id: 'assembly-system', name: '总体技术集成团队' },
      { id: 'assembly-landing', name: '起落架液压系统集成团队' },
      { id: 'assembly-cabin', name: '客舱内饰团队' },
    ],
  },
  { id: 'purchase', name: '采购部' },
];
