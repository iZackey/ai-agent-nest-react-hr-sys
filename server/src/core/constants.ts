export const EMPLOYEE_STATUS = { ACTIVE: '在职', INACTIVE: '离职', LEAVE: '休假' } as const;
export const PROJECT_COMPLEXITY = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' } as const;
export const CONTRIBUTION_LEVEL = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' } as const;
export const FEEDBACK_CATEGORY = { COMMUNICATION: '沟通', TECHNICAL: '技术能力', LEADERSHIP: '领导力', TEAMWORK: '协作' } as const;
export const POSITIONS = ['实习生', '初级工程师', '中级工程师', '高级工程师', '技术负责人', '经理', '总监', '副总裁'] as const;
export const DEPARTMENTS = ['销售部', '市场部', '技术部', '产品部', '运营部', '人力资源部', '财务部', '法律部'] as const;
export const COMPLEXITY_WEIGHTS: Record<string, number> = { '低': 1, '中': 2, '高': 3, '非常高': 4 };
export const LEADERSHIP_POSITION_WEIGHTS: Record<string, number> = { 'CTO': 1.0, '总经理': 1.0, 'VP': 0.9, '经理': 0.7, '主管': 0.5, '组长': 0.3, '员工': 0.0 };
