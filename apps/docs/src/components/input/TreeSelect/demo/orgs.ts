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
          { id: 'pmo-plan', name: '计划团队' },
          { id: 'pmo-quality', name: '质量团队' },
        ],
      },
      {
        id: 'finance',
        name: '财务部',
        children: [
          { id: 'finance-budget', name: '预算团队' },
          { id: 'finance-settle', name: '结算团队' },
        ],
      },
    ],
  },
  {
    id: 'rd',
    name: '研发中心',
    children: [
      { id: 'rd-frontend', name: '前端团队' },
      { id: 'rd-backend', name: '后端团队' },
    ],
  },
  {
    id: 'mfg',
    name: '生产中心',
    children: [
      { id: 'mfg-assembly', name: '装配团队' },
      { id: 'mfg-testing', name: '测试团队' },
      { id: 'mfg-packing', name: '包装团队' },
    ],
  },
  { id: 'purchase', name: '采购部' },
];
