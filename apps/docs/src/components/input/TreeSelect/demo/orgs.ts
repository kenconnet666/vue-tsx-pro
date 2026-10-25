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
        id: 'pmo',
        name: '项目管理办公室（PMO）',
        children: [
          { id: 'pmo-plan', name: '计划组' },
          { id: 'pmo-pool', name: '工单池管理组' },
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
    name: '研发中心',
    children: [
      { id: 'composite-structure', name: '研发中心集成团队' },
      { id: 'composite-process', name: '研发工艺团队' },
    ],
  },
  {
    id: 'assembly',
    name: '生产制造中心',
    children: [
      { id: 'assembly-system', name: '产品部团队' },
      { id: 'assembly-landing', name: '运营团队' },
      { id: 'assembly-cabin', name: '包装团队' },
    ],
  },
  { id: 'purchase', name: '采购部' },
];
