export interface FunctionalGroup {
  name: string;
  formula: string;
  shorthand: string;
  color: string;
  description: string;
}

export const FUNCTIONAL_GROUPS: FunctionalGroup[] = [
  { name: '羟基', formula: '-OH', shorthand: 'OH', color: '#FF0D0D', description: '醇/酚' },
  { name: '羧基', formula: '-COOH', shorthand: 'COOH', color: '#FF6B35', description: '羧酸' },
  { name: '醛基', formula: '-CHO', shorthand: 'CHO', color: '#FFA500', description: '醛' },
  { name: '酮基', formula: '>C=O', shorthand: 'C=O', color: '#FFD700', description: '酮' },
  { name: '氨基', formula: '-NH₂', shorthand: 'NH2', color: '#3050F8', description: '胺' },
  { name: '硝基', formula: '-NO₂', shorthand: 'NO2', color: '#940094', description: '硝基化合物' },
  { name: '氰基', formula: '-C≡N', shorthand: 'CN', color: '#00CED1', description: '腈' },
  { name: '酯基', formula: '-COO-', shorthand: 'COO', color: '#FF69B4', description: '酯' },
  { name: '醚键', formula: '-O-', shorthand: 'O', color: '#FF0D0D', description: '醚' },
  { name: '巯基', formula: '-SH', shorthand: 'SH', color: '#FFFF30', description: '硫醇' },
  { name: '磺酸基', formula: '-SO₃H', shorthand: 'SO3H', color: '#FF4500', description: '磺酸' },
  { name: '酰氨基', formula: '-CONH₂', shorthand: 'CONH2', color: '#4169E1', description: '酰胺' },
  { name: '苯基', formula: '-C₆H₅', shorthand: 'Ph', color: '#909090', description: '芳香族' },
  { name: '甲基', formula: '-CH₃', shorthand: 'CH3', color: '#909090', description: '烷基' },
  { name: '乙基', formula: '-C₂H₅', shorthand: 'C2H5', color: '#909090', description: '烷基' },
  { name: '乙烯基', formula: '-CH=CH₂', shorthand: 'CH=CH2', color: '#909090', description: '烯基' },
  { name: '乙炔基', formula: '-C≡CH', shorthand: 'C≡CH', color: '#909090', description: '炔基' },
  { name: '亚氨基', formula: '=NH', shorthand: 'NH', color: '#3050F8', description: '亚胺' },
  { name: '卤代基', formula: '-X', shorthand: 'X', color: '#1FF01F', description: '卤代烃' },
  { name: '碳碳双键', formula: 'C=C', shorthand: 'C=C', color: '#00ff88', description: '烯烃' },
  { name: '碳碳三键', formula: 'C≡C', shorthand: 'C≡C', color: '#00ccff', description: '炔烃' },
];
