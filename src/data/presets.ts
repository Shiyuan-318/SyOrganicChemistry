export interface PresetAtom { symbol: string; dx: number; dy: number }
export interface PresetBond { from: number; to: number; type: 1 | 2 | 3 }
export interface MoleculePreset { name: string; chineseName: string; atoms: PresetAtom[]; bonds: PresetBond[] }

export const MOLECULE_PRESETS: MoleculePreset[] = [
  // 1. 甲烷 CH4
  {
    name: 'Methane',
    chineseName: '甲烷',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'H', dx: 0, dy: -55 },
      { symbol: 'H', dx: 55, dy: 0 },
      { symbol: 'H', dx: 0, dy: 55 },
      { symbol: 'H', dx: -55, dy: 0 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 0, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
    ],
  },

  // 2. 乙烷 C2H6
  {
    name: 'Ethane',
    chineseName: '乙烷',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'H', dx: -40, dy: -30 },
      { symbol: 'H', dx: -40, dy: 30 },
      { symbol: 'H', dx: 0, dy: -50 },
      { symbol: 'H', dx: 100, dy: -30 },
      { symbol: 'H', dx: 100, dy: 30 },
      { symbol: 'H', dx: 60, dy: -50 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 0, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
      { from: 1, to: 5, type: 1 },
      { from: 1, to: 6, type: 1 },
      { from: 1, to: 7, type: 1 },
    ],
  },

  // 3. 乙烯 C2H4
  {
    name: 'Ethylene',
    chineseName: '乙烯',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'H', dx: -45, dy: -25 },
      { symbol: 'H', dx: -45, dy: 25 },
      { symbol: 'H', dx: 105, dy: -25 },
      { symbol: 'H', dx: 105, dy: 25 },
    ],
    bonds: [
      { from: 0, to: 1, type: 2 },
      { from: 0, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 1, to: 4, type: 1 },
      { from: 1, to: 5, type: 1 },
    ],
  },

  // 4. 乙炔 C2H2
  {
    name: 'Acetylene',
    chineseName: '乙炔',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'H', dx: -50, dy: 0 },
      { symbol: 'H', dx: 110, dy: 0 },
    ],
    bonds: [
      { from: 0, to: 1, type: 3 },
      { from: 0, to: 2, type: 1 },
      { from: 1, to: 3, type: 1 },
    ],
  },

  // 5. 甲醇 CH3OH
  {
    name: 'Methanol',
    chineseName: '甲醇',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'O', dx: 60, dy: 0 },
      { symbol: 'H', dx: 105, dy: 0 },
      { symbol: 'H', dx: -40, dy: -30 },
      { symbol: 'H', dx: -40, dy: 30 },
      { symbol: 'H', dx: 0, dy: -50 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 1, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
      { from: 0, to: 5, type: 1 },
    ],
  },

  // 6. 乙醇 C2H5OH
  {
    name: 'Ethanol',
    chineseName: '乙醇',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'O', dx: 120, dy: 0 },
      { symbol: 'H', dx: 165, dy: 0 },
      { symbol: 'H', dx: -40, dy: -30 },
      { symbol: 'H', dx: -40, dy: 30 },
      { symbol: 'H', dx: 0, dy: -50 },
      { symbol: 'H', dx: 60, dy: -50 },
      { symbol: 'H', dx: 60, dy: 50 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 1, to: 2, type: 1 },
      { from: 2, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
      { from: 0, to: 5, type: 1 },
      { from: 0, to: 6, type: 1 },
      { from: 1, to: 7, type: 1 },
      { from: 1, to: 8, type: 1 },
    ],
  },

  // 7. 甲醛 HCHO
  {
    name: 'Formaldehyde',
    chineseName: '甲醛',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'O', dx: 50, dy: -40 },
      { symbol: 'H', dx: -45, dy: -25 },
      { symbol: 'H', dx: -45, dy: 25 },
    ],
    bonds: [
      { from: 0, to: 1, type: 2 },
      { from: 0, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
    ],
  },

  // 8. 乙酸 CH3COOH
  {
    name: 'Acetic Acid',
    chineseName: '乙酸',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'O', dx: 60, dy: -55 },
      { symbol: 'O', dx: 115, dy: 25 },
      { symbol: 'H', dx: 155, dy: 10 },
      { symbol: 'H', dx: -40, dy: -30 },
      { symbol: 'H', dx: -40, dy: 30 },
      { symbol: 'H', dx: 0, dy: -50 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 1, to: 2, type: 2 },
      { from: 1, to: 3, type: 1 },
      { from: 3, to: 4, type: 1 },
      { from: 0, to: 5, type: 1 },
      { from: 0, to: 6, type: 1 },
      { from: 0, to: 7, type: 1 },
    ],
  },

  // 9. 苯 C6H6 — 正六边形，半径60px
  {
    name: 'Benzene',
    chineseName: '苯',
    atoms: [
      { symbol: 'C', dx: 0, dy: -60 },
      { symbol: 'C', dx: 52, dy: -30 },
      { symbol: 'C', dx: 52, dy: 30 },
      { symbol: 'C', dx: 0, dy: 60 },
      { symbol: 'C', dx: -52, dy: 30 },
      { symbol: 'C', dx: -52, dy: -30 },
      { symbol: 'H', dx: 0, dy: -105 },
      { symbol: 'H', dx: 91, dy: -53 },
      { symbol: 'H', dx: 91, dy: 53 },
      { symbol: 'H', dx: 0, dy: 105 },
      { symbol: 'H', dx: -91, dy: 53 },
      { symbol: 'H', dx: -91, dy: -53 },
    ],
    bonds: [
      { from: 0, to: 1, type: 2 },
      { from: 1, to: 2, type: 1 },
      { from: 2, to: 3, type: 2 },
      { from: 3, to: 4, type: 1 },
      { from: 4, to: 5, type: 2 },
      { from: 5, to: 0, type: 1 },
      { from: 0, to: 6, type: 1 },
      { from: 1, to: 7, type: 1 },
      { from: 2, to: 8, type: 1 },
      { from: 3, to: 9, type: 1 },
      { from: 4, to: 10, type: 1 },
      { from: 5, to: 11, type: 1 },
    ],
  },

  // 10. 丙烷 C3H8
  {
    name: 'Propane',
    chineseName: '丙烷',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'C', dx: 120, dy: 0 },
      { symbol: 'H', dx: -40, dy: -30 },
      { symbol: 'H', dx: -40, dy: 30 },
      { symbol: 'H', dx: 0, dy: -50 },
      { symbol: 'H', dx: 60, dy: -50 },
      { symbol: 'H', dx: 60, dy: 50 },
      { symbol: 'H', dx: 160, dy: -30 },
      { symbol: 'H', dx: 160, dy: 30 },
      { symbol: 'H', dx: 120, dy: -50 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 1, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
      { from: 0, to: 5, type: 1 },
      { from: 1, to: 6, type: 1 },
      { from: 1, to: 7, type: 1 },
      { from: 2, to: 8, type: 1 },
      { from: 2, to: 9, type: 1 },
      { from: 2, to: 10, type: 1 },
    ],
  },

  // 11. 丙烯 C3H6 — CH2=CH-CH3
  {
    name: 'Propylene',
    chineseName: '丙烯',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'C', dx: 120, dy: 0 },
      { symbol: 'H', dx: -45, dy: -25 },
      { symbol: 'H', dx: -45, dy: 25 },
      { symbol: 'H', dx: 60, dy: -50 },
      { symbol: 'H', dx: 160, dy: -30 },
      { symbol: 'H', dx: 160, dy: 30 },
      { symbol: 'H', dx: 120, dy: -50 },
    ],
    bonds: [
      { from: 0, to: 1, type: 2 },
      { from: 1, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
      { from: 1, to: 5, type: 1 },
      { from: 2, to: 6, type: 1 },
      { from: 2, to: 7, type: 1 },
      { from: 2, to: 8, type: 1 },
    ],
  },

  // 12. 甘油 C3H8O3 — HOCH2-CHOH-CH2OH
  {
    name: 'Glycerol',
    chineseName: '甘油',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'C', dx: 120, dy: 0 },
      { symbol: 'O', dx: 0, dy: 55 },
      { symbol: 'H', dx: 0, dy: 100 },
      { symbol: 'O', dx: 60, dy: 55 },
      { symbol: 'H', dx: 60, dy: 100 },
      { symbol: 'O', dx: 120, dy: 55 },
      { symbol: 'H', dx: 120, dy: 100 },
      { symbol: 'H', dx: -40, dy: -25 },
      { symbol: 'H', dx: -40, dy: 25 },
      { symbol: 'H', dx: 60, dy: -45 },
      { symbol: 'H', dx: 160, dy: -25 },
      { symbol: 'H', dx: 160, dy: 25 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 1, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 3, to: 4, type: 1 },
      { from: 1, to: 5, type: 1 },
      { from: 5, to: 6, type: 1 },
      { from: 2, to: 7, type: 1 },
      { from: 7, to: 8, type: 1 },
      { from: 0, to: 9, type: 1 },
      { from: 0, to: 10, type: 1 },
      { from: 1, to: 11, type: 1 },
      { from: 2, to: 12, type: 1 },
      { from: 2, to: 13, type: 1 },
    ],
  },

  // 13. 丙酮 CH3COCH3
  {
    name: 'Acetone',
    chineseName: '丙酮',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'C', dx: 120, dy: 0 },
      { symbol: 'O', dx: 60, dy: -55 },
      { symbol: 'H', dx: -40, dy: -30 },
      { symbol: 'H', dx: -40, dy: 30 },
      { symbol: 'H', dx: 0, dy: -50 },
      { symbol: 'H', dx: 160, dy: -30 },
      { symbol: 'H', dx: 160, dy: 30 },
      { symbol: 'H', dx: 120, dy: -50 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 1, to: 2, type: 1 },
      { from: 1, to: 3, type: 2 },
      { from: 0, to: 4, type: 1 },
      { from: 0, to: 5, type: 1 },
      { from: 0, to: 6, type: 1 },
      { from: 2, to: 7, type: 1 },
      { from: 2, to: 8, type: 1 },
      { from: 2, to: 9, type: 1 },
    ],
  },

  // 14. 甲胺 CH3NH2
  {
    name: 'Methylamine',
    chineseName: '甲胺',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'N', dx: 60, dy: 0 },
      { symbol: 'H', dx: -40, dy: -30 },
      { symbol: 'H', dx: -40, dy: 30 },
      { symbol: 'H', dx: 0, dy: -50 },
      { symbol: 'H', dx: 100, dy: -25 },
      { symbol: 'H', dx: 100, dy: 25 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 0, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
      { from: 1, to: 5, type: 1 },
      { from: 1, to: 6, type: 1 },
    ],
  },

  // 15. 氯甲烷 CH3Cl
  {
    name: 'Chloromethane',
    chineseName: '氯甲烷',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'Cl', dx: 60, dy: 0 },
      { symbol: 'H', dx: -40, dy: -30 },
      { symbol: 'H', dx: -40, dy: 30 },
      { symbol: 'H', dx: 0, dy: -50 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 0, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
    ],
  },

  // 16. 环己烷 C6H12 — 正六边形，每个C有2个H
  {
    name: 'Cyclohexane',
    chineseName: '环己烷',
    atoms: [
      { symbol: 'C', dx: 0, dy: -60 },
      { symbol: 'C', dx: 52, dy: -30 },
      { symbol: 'C', dx: 52, dy: 30 },
      { symbol: 'C', dx: 0, dy: 60 },
      { symbol: 'C', dx: -52, dy: 30 },
      { symbol: 'C', dx: -52, dy: -30 },
      // C0 的 2 个 H（向外上方展开）
      { symbol: 'H', dx: -23, dy: -99 },
      { symbol: 'H', dx: 23, dy: -99 },
      // C1 的 2 个 H（向右上方展开）
      { symbol: 'H', dx: 75, dy: -69 },
      { symbol: 'H', dx: 97, dy: -30 },
      // C2 的 2 个 H（向右下方展开）
      { symbol: 'H', dx: 97, dy: 30 },
      { symbol: 'H', dx: 75, dy: 69 },
      // C3 的 2 个 H（向外下方展开）
      { symbol: 'H', dx: 23, dy: 99 },
      { symbol: 'H', dx: -23, dy: 99 },
      // C4 的 2 个 H（向左下方展开）
      { symbol: 'H', dx: -75, dy: 69 },
      { symbol: 'H', dx: -97, dy: 30 },
      // C5 的 2 个 H（向左上方展开）
      { symbol: 'H', dx: -97, dy: -30 },
      { symbol: 'H', dx: -75, dy: -69 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 1, to: 2, type: 1 },
      { from: 2, to: 3, type: 1 },
      { from: 3, to: 4, type: 1 },
      { from: 4, to: 5, type: 1 },
      { from: 5, to: 0, type: 1 },
      { from: 0, to: 6, type: 1 },
      { from: 0, to: 7, type: 1 },
      { from: 1, to: 8, type: 1 },
      { from: 1, to: 9, type: 1 },
      { from: 2, to: 10, type: 1 },
      { from: 2, to: 11, type: 1 },
      { from: 3, to: 12, type: 1 },
      { from: 3, to: 13, type: 1 },
      { from: 4, to: 14, type: 1 },
      { from: 4, to: 15, type: 1 },
      { from: 5, to: 16, type: 1 },
      { from: 5, to: 17, type: 1 },
    ],
  },

  // 17. 乙醛 CH3CHO
  {
    name: 'Acetaldehyde',
    chineseName: '乙醛',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'C', dx: 60, dy: 0 },
      { symbol: 'O', dx: 60, dy: -55 },
      { symbol: 'H', dx: 105, dy: 0 },
      { symbol: 'H', dx: -40, dy: -30 },
      { symbol: 'H', dx: -40, dy: 30 },
      { symbol: 'H', dx: 0, dy: -50 },
    ],
    bonds: [
      { from: 0, to: 1, type: 1 },
      { from: 1, to: 2, type: 2 },
      { from: 1, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
      { from: 0, to: 5, type: 1 },
      { from: 0, to: 6, type: 1 },
    ],
  },

  // 18. 甲酸 HCOOH
  {
    name: 'Formic Acid',
    chineseName: '甲酸',
    atoms: [
      { symbol: 'C', dx: 0, dy: 0 },
      { symbol: 'O', dx: 50, dy: -40 },
      { symbol: 'O', dx: 50, dy: 40 },
      { symbol: 'H', dx: -50, dy: 0 },
      { symbol: 'H', dx: 90, dy: 55 },
    ],
    bonds: [
      { from: 0, to: 1, type: 2 },
      { from: 0, to: 2, type: 1 },
      { from: 0, to: 3, type: 1 },
      { from: 2, to: 4, type: 1 },
    ],
  },
];
