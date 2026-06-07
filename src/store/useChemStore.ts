import { create } from 'zustand';
import { ELEMENT_MAP } from '@/data/elements';

export interface AtomNode {
  id: string;
  symbol: string;
  x: number;
  y: number;
}

export interface Bond {
  id: string;
  from: string;
  to: string;
  type: 1 | 2 | 3;
  stereo?: 'wedge' | 'dash' | 'normal';
}

export interface OperationEffect {
  type: string;
  label: string;
  timestamp: number;
}

export interface Molecule {
  id: string;
  name: string;
  atoms: AtomNode[];
  bonds: Bond[];
}

interface HistorySnapshot {
  atoms: AtomNode[];
  bonds: Bond[];
}

interface ChemState {
  atoms: AtomNode[];
  bonds: Bond[];
  selectedAtomId: string | null;
  selectedBondId: string | null;
  draggingAtomId: string | null;
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  operationEffect: OperationEffect | null;
  pendingElement: string | null;

  // Undo/Redo
  history: HistorySnapshot[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;

  // Multi-molecule
  molecules: Molecule[];
  activeMoleculeId: string;
  addMolecule: () => void;
  switchMolecule: (id: string) => void;
  removeMolecule: (id: string) => void;
  renameMolecule: (id: string, name: string) => void;

  addAtom: (symbol: string, x: number, y: number) => void;
  addFunctionalGroup: (shorthand: string, x: number, y: number) => void;
  removeAtom: (id: string) => void;
  moveAtom: (id: string, x: number, y: number) => void;
  addBond: (fromId: string, toId: string, type?: 1 | 2 | 3) => void;
  removeBond: (id: string) => void;
  cycleBondType: (id: string) => void;
  selectAtom: (id: string | null) => void;
  selectBond: (id: string | null) => void;
  setDraggingAtom: (id: string | null) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setCanvasScale: (scale: number) => void;
  setOperationEffect: (effect: OperationEffect | null) => void;
  setPendingElement: (element: string | null) => void;
  clearCanvas: () => void;
  executeOperation: (type: string) => void;
  getMolecularFormula: () => string;
  getStructuralFormula: () => string;
  getChineseName: () => string;

  // New features
  getMolecularWeight: () => number;
  getIUPACName: () => string;
  getChiralCenters: () => string[];
  getHybridization: (atomId: string) => string;
  getIsomerHints: () => string[];
  saveMolecule: () => void;
  loadMolecule: (id: string) => void;
  getSavedMolecules: () => Molecule[];
  deleteSavedMolecule: (id: string) => void;
  getExportData: () => { atoms: AtomNode[]; bonds: Bond[] };

  // v1.3.0 features
  getSMILES: () => string;
  importSMILES: (smiles: string) => void;
  autoLayout: () => void;
  fitToView: (canvasWidth: number, canvasHeight: number) => void;
  getFormalCharge: (atomId: string) => number;
  getOxidationState: (atomId: string) => number;
  getRings: () => string[][];
  getResonanceStructures: () => { atoms: AtomNode[]; bonds: Bond[] }[];
  getIRPeaks: () => { wavenumber: number; intensity: string; assignment: string }[];
  getNMRSifts: () => { atomId: string; ppm: number; type: string }[];
  getPKa: () => { atomId: string; pKa: number; type: string }[];
  setBondStereo: (id: string, stereo: 'wedge' | 'dash' | 'normal') => void;
  copySelection: () => void;
  pasteSelection: (offsetX: number, offsetY: number) => void;
  getLewisStructure: () => { atomId: string; lonePairs: number; bondingElectrons: number }[];
  toggleTheme: () => void;
  setLanguage: (lang: 'zh' | 'en') => void;

  // v1.3.0 state
  clipboard: { atoms: AtomNode[]; bonds: Bond[] } | null;
  theme: 'dark' | 'light';
  language: 'zh' | 'en';
}

let idCounter = 0;
const genId = () => `node_${++idCounter}_${Date.now()}`;
let bondCounter = 0;
const genBondId = () => `bond_${++bondCounter}_${Date.now()}`;
let moleculeCounter = 0;
const genMoleculeId = () => `mol_${++moleculeCounter}_${Date.now()}`;

const MAX_HISTORY = 50;

// 原子量表 (g/mol)
const ATOMIC_MASSES: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974,
  S: 32.065, Cl: 35.453, Ar: 39.948, K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867,
  V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546,
  Zn: 65.38, Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798,
  Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224, Nb: 92.906, Mo: 95.95, Tc: 98,
  Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71,
  Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91,
  Ce: 140.12, Pr: 140.91, Nd: 144.24, Pm: 145, Sm: 150.36, Eu: 151.96, Gd: 157.25,
  Tb: 158.93, Dy: 162.50, Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05, Lu: 174.97,
  Hf: 178.49, Ta: 180.95, W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08,
  Au: 196.97, Hg: 200.59, Tl: 204.38, Pb: 207.2, Bi: 208.98, Po: 209, At: 210, Rn: 222,
  Fr: 223, Ra: 226, Ac: 227, Th: 232.04, Pa: 231.04, U: 238.03, Np: 237, Pu: 244,
  Am: 243, Cm: 247, Bk: 247, Cf: 251, Es: 252, Fm: 257, Md: 258, No: 259, Lr: 262,
  Rf: 267, Db: 270, Sg: 271, Bh: 270, Hs: 277, Mt: 276, Ds: 281, Rg: 280, Cn: 285,
  Nh: 284, Fl: 289, Mc: 288, Lv: 293, Ts: 294, Og: 294,
};

// 价电子数
const VALENCE_ELECTRONS: Record<string, number> = {
  H: 1, He: 2, Li: 1, Be: 2, B: 3, C: 4, N: 5, O: 6,
  F: 7, Ne: 8, Na: 1, Mg: 2, Al: 3, Si: 4, P: 5, S: 6,
  Cl: 7, Ar: 8, K: 1, Ca: 2, Br: 7, I: 7, Se: 6,
};

// 电负性顺序（越大越电负性）
const ELECTRONEGATIVITY: Record<string, number> = {
  H: 2.20, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44,
  F: 3.98, Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58,
  Cl: 3.16, K: 0.82, Ca: 1.00, Br: 2.96, I: 2.66, Se: 2.55,
  Fe: 1.83, Cu: 1.90, Zn: 1.65, Ag: 1.93, Au: 2.54,
};

// 同分异构体数据库
const ISOMER_DB: Record<string, string[]> = {
  'C4H10': ['正丁烷', '异丁烷'],
  'C3H6': ['丙烯', '环丙烷'],
  'C2H6O': ['乙醇', '二甲醚'],
  'C3H8O': ['1-丙醇', '2-丙醇', '甲乙醚'],
  'C4H10O': ['1-丁醇', '2-丁醇', '2-甲基-1-丙醇', '2-甲基-2-丙醇', '乙醚'],
  'C6H12': ['环己烷', '1-己烯', '2-己烯', '3-己烯', '甲基环戊烷'],
  'C6H6': ['苯'],
  'C2H4O2': ['乙酸', '甲酸甲酯'],
  'C3H6O': ['丙醛', '丙酮', '烯丙醇'],
};

// IUPAC 碳数前缀
const CARBON_PREFIX: Record<number, string> = {
  1: '甲', 2: '乙', 3: '丙', 4: '丁', 5: '戊',
  6: '己', 7: '庚', 8: '辛', 9: '壬', 10: '癸',
};

// 推送历史快照的辅助函数
function pushHistory(state: { history: HistorySnapshot[]; historyIndex: number; atoms: AtomNode[]; bonds: Bond[] }): {
  history: HistorySnapshot[];
  historyIndex: number;
} {
  const snapshot: HistorySnapshot = {
    atoms: JSON.parse(JSON.stringify(state.atoms)),
    bonds: JSON.parse(JSON.stringify(state.bonds)),
  };
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshot);
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
    return { history: newHistory, historyIndex: newHistory.length - 1 };
  }
  return { history: newHistory, historyIndex: newHistory.length - 1 };
}

// 根据两个元素自动推断合适的键型
function inferBondType(symbol1: string, symbol2: string, remaining1: number, remaining2: number): 1 | 2 | 3 {
  const pair = [symbol1, symbol2].sort().join('-');

  // 如果容量不足只能单键
  if (remaining1 < 2 || remaining2 < 2) return 1;

  // C=O 默认双键（羰基）
  if (pair === 'C-O') return 2;
  // C≡N 默认三键（氰基）
  if (pair === 'C-N' && remaining1 >= 3 && remaining2 >= 3) return 3;
  // C=C 默认双键
  if (pair === 'C-C' && remaining1 >= 2 && remaining2 >= 2) return 2;
  // C=N 默认双键
  if (pair === 'C-N' && remaining1 >= 2 && remaining2 >= 2) return 2;
  // N=O 默认双键
  if (pair === 'N-O' && remaining1 >= 2 && remaining2 >= 2) return 2;

  return 1;
}

// 保存当前分子到 molecules 数组
function saveCurrentMolecule(state: ChemState): Molecule[] {
  return state.molecules.map(m =>
    m.id === state.activeMoleculeId
      ? { ...m, atoms: JSON.parse(JSON.stringify(state.atoms)), bonds: JSON.parse(JSON.stringify(state.bonds)) }
      : m
  );
}

const STORAGE_KEY = 'sy-chem-saved-molecules';

// ========== v1.3.0 辅助函数 ==========

// 构建邻接表
function buildAdj(atoms: AtomNode[], bonds: Bond[]): Map<string, { neighborId: string; bondType: 1 | 2 | 3; bondId: string }[]> {
  const adj = new Map<string, { neighborId: string; bondType: 1 | 2 | 3; bondId: string }[]>();
  for (const atom of atoms) {
    adj.set(atom.id, []);
  }
  for (const bond of bonds) {
    adj.get(bond.from)?.push({ neighborId: bond.to, bondType: bond.type, bondId: bond.id });
    adj.get(bond.to)?.push({ neighborId: bond.from, bondType: bond.type, bondId: bond.id });
  }
  return adj;
}

// 获取原子已使用的键级总和
function getUsedBonds(atomId: string, bonds: Bond[]): number {
  return bonds
    .filter(b => b.from === atomId || b.to === atomId)
    .reduce((sum, b) => sum + b.type, 0);
}

// 获取原子的邻居ID列表
function getNeighborIds(atomId: string, bonds: Bond[]): string[] {
  const neighbors: string[] = [];
  for (const bond of bonds) {
    if (bond.from === atomId) neighbors.push(bond.to);
    else if (bond.to === atomId) neighbors.push(bond.from);
  }
  return neighbors;
}

// 检测官能团
function detectFunctionalGroup(atoms: AtomNode[], bonds: Bond[], group: string): boolean {
  const adj = buildAdj(atoms, bonds);

  switch (group) {
    case 'OH': {
      return atoms.some(a => {
        if (a.symbol !== 'O') return false;
        const neighbors = adj.get(a.id) || [];
        const hNeighbors = neighbors.filter(n => {
          const na = atoms.find(x => x.id === n.neighborId);
          return na && na.symbol === 'H';
        });
        return hNeighbors.length >= 1;
      });
    }
    case 'COOH': {
      return atoms.some(a => {
        if (a.symbol !== 'C') return false;
        const neighbors = adj.get(a.id) || [];
        const hasDoubleO = neighbors.some(n => {
          const na = atoms.find(x => x.id === n.neighborId);
          return na && na.symbol === 'O' && n.bondType === 2;
        });
        const hasSingleOH = neighbors.some(n => {
          const na = atoms.find(x => x.id === n.neighborId);
          if (!na || na.symbol !== 'O' || n.bondType !== 1) return false;
          const oNeighbors = adj.get(na.id) || [];
          return oNeighbors.some(on => {
            const oa = atoms.find(x => x.id === on.neighborId);
            return oa && oa.symbol === 'H';
          });
        });
        return hasDoubleO && hasSingleOH;
      });
    }
    case 'CHO': {
      return atoms.some(a => {
        if (a.symbol !== 'C') return false;
        const neighbors = adj.get(a.id) || [];
        const hasDoubleO = neighbors.some(n => {
          const na = atoms.find(x => x.id === n.neighborId);
          return na && na.symbol === 'O' && n.bondType === 2;
        });
        const hasH = neighbors.some(n => {
          const na = atoms.find(x => x.id === n.neighborId);
          return na && na.symbol === 'H';
        });
        return hasDoubleO && hasH;
      });
    }
    case 'NH2': {
      return atoms.some(a => {
        if (a.symbol !== 'N') return false;
        const neighbors = adj.get(a.id) || [];
        const hCount = neighbors.filter(n => {
          const na = atoms.find(x => x.id === n.neighborId);
          return na && na.symbol === 'H';
        }).length;
        return hCount >= 2;
      });
    }
    case 'C=O': {
      return atoms.some(a => {
        if (a.symbol !== 'C') return false;
        const neighbors = adj.get(a.id) || [];
        const hasDoubleO = neighbors.some(n => {
          const na = atoms.find(x => x.id === n.neighborId);
          return na && na.symbol === 'O' && n.bondType === 2;
        });
        const hasH = neighbors.some(n => {
          const na = atoms.find(x => x.id === n.neighborId);
          return na && na.symbol === 'H';
        });
        return hasDoubleO && !hasH;
      });
    }
    default:
      return false;
  }
}

// 计算支链大小
function countBranchSize(
  atomId: string,
  parentChainSet: Set<string>,
  adj: Map<string, { neighborId: string; bondType: 1 | 2 | 3 }[]>,
  carbonIds: Set<string>
): number {
  const visited = new Set<string>();
  let count = 0;

  function dfs(id: string) {
    if (visited.has(id)) return;
    if (!carbonIds.has(id)) return;
    visited.add(id);
    count++;
    const neighbors = adj.get(id) || [];
    for (const { neighborId } of neighbors) {
      if (!parentChainSet.has(neighborId)) {
        dfs(neighborId);
      }
    }
  }

  dfs(atomId);
  return count;
}

// 获取子树签名（用于手性中心判断）
function getSubtreeSignature(
  atomId: string,
  parentId: string,
  adj: Map<string, { neighborId: string; bondType: 1 | 2 | 3 }[]>,
  atoms: AtomNode[]
): string {
  const visited = new Set<string>();
  const parts: string[] = [];

  function dfs(id: string, depth: number) {
    if (visited.has(id) || depth > 10) return;
    visited.add(id);

    const atom = atoms.find(a => a.id === id);
    if (!atom) return;

    parts.push(atom.symbol);

    const neighbors = adj.get(id) || [];
    const childParts: string[] = [];
    for (const { neighborId, bondType } of neighbors) {
      if (neighborId === parentId && depth === 0) continue;
      if (visited.has(neighborId)) continue;
      const subParts: string[] = [];
      const savedParts = [...parts];
      parts.length = 0;
      dfs(neighborId, depth + 1);
      subParts.push(...parts);
      parts.length = 0;
      parts.push(...savedParts);
      childParts.push(`${bondType}:${subParts.join(',')}`);
    }

    if (childParts.length > 0) {
      childParts.sort();
      parts.push(`(${childParts.join(';')})`);
    }
  }

  dfs(atomId, 0);
  return parts.join(',');
}

// ========== v1.3.0 SMILES 辅助 ==========

// 解析 SMILES 中的元素符号，返回 { symbol, length }
function parseSMILESElement(smiles: string, pos: number): { symbol: string; length: number } | null {
  if (pos >= smiles.length) return null;
  const ch = smiles[pos];

  // 方括号内的元素 [XX]
  if (ch === '[') {
    const end = smiles.indexOf(']', pos);
    if (end < 0) return null;
    const content = smiles.substring(pos + 1, end);
    // 去掉电荷和氢标记，只取元素符号
    const elementMatch = content.match(/^([A-Z][a-z]?)/);
    if (elementMatch) {
      return { symbol: elementMatch[1], length: end - pos + 1 };
    }
    return null;
  }

  // 两字母元素
  if (pos + 1 < smiles.length) {
    const twoLetter = smiles.substring(pos, pos + 2);
    const twoLetterElements = ['Cl', 'Br', 'Si', 'Se', 'Na', 'Li', 'Al', 'Mg', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Au'];
    if (twoLetterElements.includes(twoLetter)) {
      return { symbol: twoLetter, length: 2 };
    }
  }

  // 单字母元素
  const singleLetterElements = ['C', 'N', 'O', 'S', 'P', 'F', 'I', 'B', 'K', 'V', 'W', 'U'];
  if (singleLetterElements.includes(ch)) {
    return { symbol: ch, length: 1 };
  }

  return null;
}

export const useChemStore = create<ChemState>((set, get) => ({
  atoms: [],
  bonds: [],
  selectedAtomId: null,
  selectedBondId: null,
  draggingAtomId: null,
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,
  operationEffect: null,
  pendingElement: null,

  // Undo/Redo
  history: [],
  historyIndex: -1,

  // Multi-molecule
  molecules: [{ id: 'mol_default', name: '分子1', atoms: [], bonds: [] }],
  activeMoleculeId: 'mol_default',

  // v1.3.0 state
  clipboard: null,
  theme: 'light',
  language: 'zh',

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const snapshot = history[newIndex];
    set({
      atoms: JSON.parse(JSON.stringify(snapshot.atoms)),
      bonds: JSON.parse(JSON.stringify(snapshot.bonds)),
      historyIndex: newIndex,
      selectedAtomId: null,
      selectedBondId: null,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const snapshot = history[newIndex];
    set({
      atoms: JSON.parse(JSON.stringify(snapshot.atoms)),
      bonds: JSON.parse(JSON.stringify(snapshot.bonds)),
      historyIndex: newIndex,
      selectedAtomId: null,
      selectedBondId: null,
    });
  },

  // Multi-molecule actions
  addMolecule: () => {
    const state = get();
    const updatedMolecules = saveCurrentMolecule(state);
    const newId = genMoleculeId();
    const newMol: Molecule = { id: newId, name: `分子${updatedMolecules.length + 1}`, atoms: [], bonds: [] };
    updatedMolecules.push(newMol);
    set({
      molecules: updatedMolecules,
      activeMoleculeId: newId,
      atoms: [],
      bonds: [],
      selectedAtomId: null,
      selectedBondId: null,
      history: [],
      historyIndex: -1,
    });
  },

  switchMolecule: (id: string) => {
    const state = get();
    if (id === state.activeMoleculeId) return;
    const updatedMolecules = saveCurrentMolecule(state);
    const target = updatedMolecules.find(m => m.id === id);
    if (!target) return;
    set({
      molecules: updatedMolecules,
      activeMoleculeId: id,
      atoms: JSON.parse(JSON.stringify(target.atoms)),
      bonds: JSON.parse(JSON.stringify(target.bonds)),
      selectedAtomId: null,
      selectedBondId: null,
      history: [],
      historyIndex: -1,
    });
  },

  removeMolecule: (id: string) => {
    const state = get();
    if (state.molecules.length <= 1) return;
    const updatedMolecules = state.molecules.filter(m => m.id !== id);
    if (id === state.activeMoleculeId) {
      const newActive = updatedMolecules[0];
      set({
        molecules: updatedMolecules,
        activeMoleculeId: newActive.id,
        atoms: JSON.parse(JSON.stringify(newActive.atoms)),
        bonds: JSON.parse(JSON.stringify(newActive.bonds)),
        selectedAtomId: null,
        selectedBondId: null,
        history: [],
        historyIndex: -1,
      });
    } else {
      set({ molecules: updatedMolecules });
    }
  },

  renameMolecule: (id: string, name: string) => {
    set(state => ({
      molecules: state.molecules.map(m => m.id === id ? { ...m, name } : m),
    }));
  },

  addAtom: (symbol, x, y) => {
    const element = ELEMENT_MAP.get(symbol);
    if (!element) return;
    const atom: AtomNode = { id: genId(), symbol, x, y };
    set(state => {
      const histUpdate = pushHistory(state);
      const newAtoms = [...state.atoms, atom];
      const newBonds = [...state.bonds];
      const BOND_THRESHOLD = 100;

      // 找到最近的、可成键的原子
      let closestAtom: AtomNode | null = null;
      let closestDist = Infinity;

      for (const existingAtom of state.atoms) {
        const dx = existingAtom.x - x;
        const dy = existingAtom.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < BOND_THRESHOLD && dist < closestDist) {
          // 检查是否已有键
          const existingBond = newBonds.find(
            b => (b.from === existingAtom.id && b.to === atom.id) ||
                 (b.from === atom.id && b.to === existingAtom.id)
          );
          if (!existingBond) {
            // 检查双方是否还有成键容量
            const elExisting = ELEMENT_MAP.get(existingAtom.symbol);
            const existingUsed = newBonds
              .filter(b => b.from === existingAtom.id || b.to === existingAtom.id)
              .reduce((sum, b) => sum + b.type, 0);
            const existingRemaining = elExisting ? elExisting.maxBonds - existingUsed : 0;

            if (existingRemaining > 0 && element.maxBonds > 0) {
              closestAtom = existingAtom;
              closestDist = dist;
            }
          }
        }
      }

      if (closestAtom) {
        const elClosest = ELEMENT_MAP.get(closestAtom.symbol);
        const closestUsed = newBonds
          .filter(b => b.from === closestAtom!.id || b.to === closestAtom!.id)
          .reduce((sum, b) => sum + b.type, 0);
        const closestRemaining = elClosest ? elClosest.maxBonds - closestUsed : 0;

        const bondType = inferBondType(symbol, closestAtom.symbol, element.maxBonds, closestRemaining);
        // 确保不超过双方容量
        const actualType = Math.min(bondType, element.maxBonds, closestRemaining) as 1 | 2 | 3;
        newBonds.push({ id: genBondId(), from: atom.id, to: closestAtom.id, type: actualType });
      }

      return { atoms: newAtoms, bonds: newBonds, ...histUpdate };
    });
  },

  addFunctionalGroup: (shorthand: string, x: number, y: number) => {
    // 官能团定义：每个原子及其连接关系
    interface GroupAtomDef { symbol: string; dx: number; dy: number }
    interface GroupBondDef { from: number; to: number; type: 1 | 2 | 3 }

    const groupDefs: Record<string, { atoms: GroupAtomDef[]; bonds: GroupBondDef[] }> = {
      'OH': {
        atoms: [{ symbol: 'O', dx: 0, dy: 0 }, { symbol: 'H', dx: 40, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 1 }],
      },
      'COOH': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'O', dx: 40, dy: -25 }, { symbol: 'O', dx: 40, dy: 25 }, { symbol: 'H', dx: 80, dy: 25 }],
        bonds: [{ from: 0, to: 1, type: 2 }, { from: 0, to: 2, type: 1 }, { from: 2, to: 3, type: 1 }],
      },
      'CHO': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'H', dx: -40, dy: 0 }, { symbol: 'O', dx: 40, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 1 }, { from: 0, to: 2, type: 2 }],
      },
      'C=O': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'O', dx: 50, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 2 }],
      },
      'NH2': {
        atoms: [{ symbol: 'N', dx: 0, dy: 0 }, { symbol: 'H', dx: 35, dy: -25 }, { symbol: 'H', dx: 35, dy: 25 }],
        bonds: [{ from: 0, to: 1, type: 1 }, { from: 0, to: 2, type: 1 }],
      },
      'NO2': {
        atoms: [{ symbol: 'N', dx: 0, dy: 0 }, { symbol: 'O', dx: 40, dy: -25 }, { symbol: 'O', dx: 40, dy: 25 }],
        bonds: [{ from: 0, to: 1, type: 2 }, { from: 0, to: 2, type: 1 }],
      },
      'CN': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'N', dx: 50, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 3 }],
      },
      'COO': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'O', dx: 40, dy: -25 }, { symbol: 'O', dx: 40, dy: 25 }],
        bonds: [{ from: 0, to: 1, type: 2 }, { from: 0, to: 2, type: 1 }],
      },
      'SH': {
        atoms: [{ symbol: 'S', dx: 0, dy: 0 }, { symbol: 'H', dx: 40, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 1 }],
      },
      'SO3H': {
        atoms: [{ symbol: 'S', dx: 0, dy: 0 }, { symbol: 'O', dx: 40, dy: -30 }, { symbol: 'O', dx: 40, dy: 0 }, { symbol: 'O', dx: 40, dy: 30 }, { symbol: 'H', dx: 80, dy: 30 }],
        bonds: [{ from: 0, to: 1, type: 2 }, { from: 0, to: 2, type: 2 }, { from: 0, to: 3, type: 1 }, { from: 3, to: 4, type: 1 }],
      },
      'CONH2': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'O', dx: 40, dy: -25 }, { symbol: 'N', dx: 40, dy: 25 }, { symbol: 'H', dx: 75, dy: 10 }, { symbol: 'H', dx: 75, dy: 40 }],
        bonds: [{ from: 0, to: 1, type: 2 }, { from: 0, to: 2, type: 1 }, { from: 2, to: 3, type: 1 }, { from: 2, to: 4, type: 1 }],
      },
      'Ph': {
        atoms: [
          { symbol: 'C', dx: 0, dy: 0 }, { symbol: 'C', dx: 35, dy: -20 },
          { symbol: 'C', dx: 70, dy: -20 }, { symbol: 'C', dx: 105, dy: 0 },
          { symbol: 'C', dx: 70, dy: 20 }, { symbol: 'C', dx: 35, dy: 20 },
        ],
        bonds: [
          { from: 0, to: 1, type: 2 }, { from: 1, to: 2, type: 1 },
          { from: 2, to: 3, type: 2 }, { from: 3, to: 4, type: 1 },
          { from: 4, to: 5, type: 2 }, { from: 5, to: 0, type: 1 },
        ],
      },
      'CH3': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'H', dx: 35, dy: -25 }, { symbol: 'H', dx: 35, dy: 25 }, { symbol: 'H', dx: -35, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 1 }, { from: 0, to: 2, type: 1 }, { from: 0, to: 3, type: 1 }],
      },
      'C2H5': {
        atoms: [
          { symbol: 'C', dx: 0, dy: 0 }, { symbol: 'C', dx: 50, dy: 0 },
          { symbol: 'H', dx: -30, dy: -25 }, { symbol: 'H', dx: -30, dy: 25 },
          { symbol: 'H', dx: 80, dy: -25 }, { symbol: 'H', dx: 80, dy: 25 }, { symbol: 'H', dx: 50, dy: -40 },
        ],
        bonds: [
          { from: 0, to: 1, type: 1 }, { from: 0, to: 2, type: 1 }, { from: 0, to: 3, type: 1 },
          { from: 1, to: 4, type: 1 }, { from: 1, to: 5, type: 1 }, { from: 1, to: 6, type: 1 },
        ],
      },
      'CH=CH2': {
        atoms: [
          { symbol: 'C', dx: 0, dy: 0 }, { symbol: 'C', dx: 50, dy: 0 },
          { symbol: 'H', dx: -30, dy: 0 }, { symbol: 'H', dx: 80, dy: -25 }, { symbol: 'H', dx: 80, dy: 25 },
        ],
        bonds: [{ from: 0, to: 1, type: 2 }, { from: 0, to: 2, type: 1 }, { from: 1, to: 3, type: 1 }, { from: 1, to: 4, type: 1 }],
      },
      'C≡CH': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'C', dx: 50, dy: 0 }, { symbol: 'H', dx: 80, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 3 }, { from: 1, to: 2, type: 1 }],
      },
      'NH': {
        atoms: [{ symbol: 'N', dx: 0, dy: 0 }, { symbol: 'H', dx: 40, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 1 }],
      },
      'X': {
        atoms: [{ symbol: 'Cl', dx: 0, dy: 0 }],
        bonds: [],
      },
      'C=C': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'C', dx: 50, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 2 }],
      },
      'C≡C': {
        atoms: [{ symbol: 'C', dx: 0, dy: 0 }, { symbol: 'C', dx: 50, dy: 0 }],
        bonds: [{ from: 0, to: 1, type: 3 }],
      },
    };

    const groupDef = groupDefs[shorthand];
    if (!groupDef) return;

    const atomIds: string[] = [];
    set(state => {
      const histUpdate = pushHistory(state);
      const newAtoms = [...state.atoms];
      const newBonds = [...state.bonds];

      // 放置原子
      for (const a of groupDef.atoms) {
        const el = ELEMENT_MAP.get(a.symbol);
        if (!el) continue;
        const atom: AtomNode = { id: genId(), symbol: a.symbol, x: x + a.dx, y: y + a.dy };
        atomIds.push(atom.id);
        newAtoms.push(atom);
      }

      // 按定义创建官能团内部化学键
      for (const bondDef of groupDef.bonds) {
        if (atomIds[bondDef.from] && atomIds[bondDef.to]) {
          newBonds.push({ id: genBondId(), from: atomIds[bondDef.from], to: atomIds[bondDef.to], type: bondDef.type });
        }
      }

      // 与画布上已有原子自动成键（只对官能团的第一个原子/连接点）
      const BOND_THRESHOLD = 100;
      if (atomIds.length > 0) {
        const firstAtomId = atomIds[0];
        const firstAtom = newAtoms.find(a => a.id === firstAtomId);
        if (firstAtom) {
          const firstEl = ELEMENT_MAP.get(firstAtom.symbol);
          const firstUsed = newBonds
            .filter(b => b.from === firstAtomId || b.to === firstAtomId)
            .reduce((sum, b) => sum + b.type, 0);
          const firstRemaining = firstEl ? firstEl.maxBonds - firstUsed : 0;

          if (firstRemaining > 0) {
            let closestAtom: AtomNode | null = null;
            let closestDist = Infinity;

            for (const existingAtom of state.atoms) {
              const dx = existingAtom.x - firstAtom.x;
              const dy = existingAtom.y - firstAtom.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < BOND_THRESHOLD && dist < closestDist) {
                const existingBond = newBonds.find(
                  b => (b.from === existingAtom.id && b.to === firstAtomId) ||
                       (b.from === firstAtomId && b.to === existingAtom.id)
                );
                if (!existingBond) {
                  const elExisting = ELEMENT_MAP.get(existingAtom.symbol);
                  const existingUsed = newBonds
                    .filter(b => b.from === existingAtom.id || b.to === existingAtom.id)
                    .reduce((sum, b) => sum + b.type, 0);
                  const existingRemaining = elExisting ? elExisting.maxBonds - existingUsed : 0;
                  if (existingRemaining > 0) {
                    closestAtom = existingAtom;
                    closestDist = dist;
                  }
                }
              }
            }

            if (closestAtom) {
              const elClosest = ELEMENT_MAP.get(closestAtom.symbol);
              const closestUsed = newBonds
                .filter(b => b.from === closestAtom!.id || b.to === closestAtom!.id)
                .reduce((sum, b) => sum + b.type, 0);
              const closestRemaining = elClosest ? elClosest.maxBonds - closestUsed : 0;
              const bondType = Math.min(1, firstRemaining, closestRemaining) as 1 | 2 | 3;
              newBonds.push({ id: genBondId(), from: firstAtomId, to: closestAtom.id, type: bondType });
            }
          }
        }
      }

      return { atoms: newAtoms, bonds: newBonds, ...histUpdate };
    });
  },

  removeAtom: (id) => {
    set(state => {
      const histUpdate = pushHistory(state);
      return {
        atoms: state.atoms.filter(a => a.id !== id),
        bonds: state.bonds.filter(b => b.from !== id && b.to !== id),
        selectedAtomId: state.selectedAtomId === id ? null : state.selectedAtomId,
        ...histUpdate,
      };
    });
  },

  moveAtom: (id, x, y) => {
    set(state => {
      const histUpdate = pushHistory(state);
      const newAtoms = state.atoms.map(a => a.id === id ? { ...a, x, y } : a);
      const newBonds = [...state.bonds];
      // 移动原子时检查是否靠近其他原子，自动成键
      const BOND_THRESHOLD = 100;
      const movedAtom = newAtoms.find(a => a.id === id);
      if (movedAtom) {
        const movedEl = ELEMENT_MAP.get(movedAtom.symbol);
        const movedUsed = newBonds
          .filter(b => b.from === id || b.to === id)
          .reduce((sum, b) => sum + b.type, 0);
        const movedRemaining = movedEl ? movedEl.maxBonds - movedUsed : 0;

        if (movedRemaining > 0) {
          let closestAtom: AtomNode | null = null;
          let closestDist = Infinity;

          for (const atom of state.atoms) {
            if (atom.id === id) continue;
            const dx = atom.x - x;
            const dy = atom.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < BOND_THRESHOLD && dist < closestDist) {
              const existingBond = newBonds.find(
                b => (b.from === atom.id && b.to === id) ||
                     (b.from === id && b.to === atom.id)
              );
              if (!existingBond) {
                const elAtom = ELEMENT_MAP.get(atom.symbol);
                const atomUsed = newBonds
                  .filter(b => b.from === atom.id || b.to === atom.id)
                  .reduce((sum, b) => sum + b.type, 0);
                const atomRemaining = elAtom ? elAtom.maxBonds - atomUsed : 0;
                if (atomRemaining > 0) {
                  closestAtom = atom;
                  closestDist = dist;
                }
              }
            }
          }

          if (closestAtom) {
            const elClosest = ELEMENT_MAP.get(closestAtom.symbol);
            const closestUsed = newBonds
              .filter(b => b.from === closestAtom!.id || b.to === closestAtom!.id)
              .reduce((sum, b) => sum + b.type, 0);
            const closestRemaining = elClosest ? elClosest.maxBonds - closestUsed : 0;
            const bondType = inferBondType(movedAtom.symbol, closestAtom.symbol, movedRemaining, closestRemaining);
            const actualType = Math.min(bondType, movedRemaining, closestRemaining) as 1 | 2 | 3;
            if (actualType > 0) {
              newBonds.push({ id: genBondId(), from: id, to: closestAtom.id, type: actualType });
            }
          }
        }
      }
      return { atoms: newAtoms, bonds: newBonds, ...histUpdate };
    });
  },

  addBond: (fromId, toId, type = 1) => {
    set(state => {
      const existing = state.bonds.find(
        b => (b.from === fromId && b.to === toId) ||
             (b.from === toId && b.to === fromId)
      );
      if (existing) return state;
      const histUpdate = pushHistory(state);
      return {
        bonds: [...state.bonds, { id: genBondId(), from: fromId, to: toId, type }],
        ...histUpdate,
      };
    });
  },

  removeBond: (id) => {
    set(state => {
      const histUpdate = pushHistory(state);
      return {
        bonds: state.bonds.filter(b => b.id !== id),
        selectedBondId: state.selectedBondId === id ? null : state.selectedBondId,
        ...histUpdate,
      };
    });
  },

  cycleBondType: (id) => {
    set(state => {
      const histUpdate = pushHistory(state);
      return {
        bonds: state.bonds.map(b =>
          b.id === id ? { ...b, type: ((b.type % 3) + 1) as 1 | 2 | 3 } : b
        ),
        ...histUpdate,
      };
    });
  },

  selectAtom: (id) => set({ selectedAtomId: id, selectedBondId: null }),
  selectBond: (id) => set({ selectedBondId: id, selectedAtomId: null }),
  setDraggingAtom: (id) => set({ draggingAtomId: id }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  setCanvasScale: (scale) => set({ canvasScale: Math.max(0.2, Math.min(3, scale)) }),
  setOperationEffect: (effect) => set({ operationEffect: effect }),
  setPendingElement: (element) => set({ pendingElement: element }),

  executeOperation: (type: string) => {
    const { atoms, bonds, selectedAtomId } = get();
    if (atoms.length === 0) return;

    const effect: OperationEffect = { type, label: type, timestamp: Date.now() };
    set({ operationEffect: effect });
    setTimeout(() => {
      const current = get().operationEffect;
      if (current && current.timestamp === effect.timestamp) {
        set({ operationEffect: null });
      }
    }, 2000);

    switch (type) {
      case '加聚': {
        // 克隆所有原子并偏移，用单键连接
        const newAtoms = [...atoms];
        const newBonds = [...bonds];
        const offset = 200;
        const clonedIds: string[] = [];
        const idMap = new Map<string, string>();

        for (const atom of atoms) {
          const newId = genId();
          idMap.set(atom.id, newId);
          clonedIds.push(newId);
          newAtoms.push({ id: newId, symbol: atom.symbol, x: atom.x + offset, y: atom.y });
        }

        // 克隆化学键
        for (const bond of bonds) {
          const newFrom = idMap.get(bond.from);
          const newTo = idMap.get(bond.to);
          if (newFrom && newTo) {
            newBonds.push({ id: genBondId(), from: newFrom, to: newTo, type: bond.type });
          }
        }

        // 在原始分子和克隆分子之间连接（找到最接近的两个原子）
        let bestDist = Infinity;
        let bestFrom = '';
        let bestTo = '';
        for (const orig of atoms) {
          for (const clone of clonedIds) {
            const cloneAtom = newAtoms.find(a => a.id === clone);
            if (cloneAtom) {
              const dx = cloneAtom.x - orig.x;
              const dy = cloneAtom.y - orig.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < bestDist) {
                bestDist = dist;
                bestFrom = orig.id;
                bestTo = clone;
              }
            }
          }
        }
        if (bestFrom && bestTo) {
          newBonds.push({ id: genBondId(), from: bestFrom, to: bestTo, type: 1 });
        }
        set(state => {
          const histUpdate = pushHistory(state);
          return { atoms: newAtoms, bonds: newBonds, ...histUpdate };
        });
        break;
      }

      case '燃烧': {
        // 燃烧：清空画布，添加 CO2 和 H2O
        const { atoms: prevAtoms } = get();
        const cCount = prevAtoms.filter(a => a.symbol === 'C').length;
        const hCount = prevAtoms.filter(a => a.symbol === 'H').length;
        const oCount = prevAtoms.filter(a => a.symbol === 'O').length;

        const newAtoms: AtomNode[] = [];
        const newBonds: Bond[] = [];
        const centerX = 0;
        const centerY = 0;

        // 生成 CO2
        for (let i = 0; i < cCount; i++) {
          const cx = centerX + i * 120;
          const cId = genId();
          const o1Id = genId();
          const o2Id = genId();
          newAtoms.push({ id: cId, symbol: 'C', x: cx, y: centerY });
          newAtoms.push({ id: o1Id, symbol: 'O', x: cx - 45, y: centerY });
          newAtoms.push({ id: o2Id, symbol: 'O', x: cx + 45, y: centerY });
          newBonds.push({ id: genBondId(), from: cId, to: o1Id, type: 2 });
          newBonds.push({ id: genBondId(), from: cId, to: o2Id, type: 2 });
        }

        // 生成 H2O
        const h2oCount = Math.floor(hCount / 2);
        const startX = centerX + cCount * 120 + 60;
        for (let i = 0; i < h2oCount; i++) {
          const ox = startX + i * 100;
          const oId = genId();
          const h1Id = genId();
          const h2Id = genId();
          newAtoms.push({ id: oId, symbol: 'O', x: ox, y: centerY });
          newAtoms.push({ id: h1Id, symbol: 'H', x: ox - 35, y: centerY - 35 });
          newAtoms.push({ id: h2Id, symbol: 'H', x: ox + 35, y: centerY - 35 });
          newBonds.push({ id: genBondId(), from: oId, to: h1Id, type: 1 });
          newBonds.push({ id: genBondId(), from: oId, to: h2Id, type: 1 });
        }

        // 剩余的 O2
        const remainingO = oCount + h2oCount - cCount * 2;
        if (remainingO > 0) {
          const o2Count = Math.floor(remainingO / 2);
          const oStartX = startX + h2oCount * 100 + 60;
          for (let i = 0; i < o2Count; i++) {
            const ox = oStartX + i * 80;
            const o1Id = genId();
            const o2Id = genId();
            newAtoms.push({ id: o1Id, symbol: 'O', x: ox - 25, y: centerY });
            newAtoms.push({ id: o2Id, symbol: 'O', x: ox + 25, y: centerY });
            newBonds.push({ id: genBondId(), from: o1Id, to: o2Id, type: 2 });
          }
        }

        set(state => {
          const histUpdate = pushHistory(state);
          return { atoms: newAtoms, bonds: newBonds, selectedAtomId: null, selectedBondId: null, ...histUpdate };
        });
        break;
      }

      case '加成': {
        // 加成反应：将双键转为单键，在两端各加一个 H
        const newAtoms = [...atoms];
        const newBonds = [...bonds];
        const doubleBonds = newBonds.filter(b => b.type === 2);
        for (const bond of doubleBonds) {
          const fromAtom = newAtoms.find(a => a.id === bond.from);
          const toAtom = newAtoms.find(a => a.id === bond.to);
          if (!fromAtom || !toAtom) continue;
          // 转单键
          bond.type = 1;
          // 在两端各加一个 H
          const dx = fromAtom.x - toAtom.x;
          const dy = fromAtom.y - toAtom.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          const h1Id = genId();
          const h2Id = genId();
          newAtoms.push({ id: h1Id, symbol: 'H', x: fromAtom.x + nx * 40, y: fromAtom.y + ny * 40 });
          newAtoms.push({ id: h2Id, symbol: 'H', x: toAtom.x - nx * 40, y: toAtom.y - ny * 40 });
          newBonds.push({ id: genBondId(), from: fromAtom.id, to: h1Id, type: 1 });
          newBonds.push({ id: genBondId(), from: toAtom.id, to: h2Id, type: 1 });
        }
        set(state => {
          const histUpdate = pushHistory(state);
          return { atoms: newAtoms, bonds: newBonds, ...histUpdate };
        });
        break;
      }

      case '消去': {
        // 消去反应：移除一个端基原子（优先最后一个未连接的 H）
        const atomsToRemove = new Set<string>();
        const bondsToRemove = new Set<string>();
        for (const atom of atoms) {
          if (atomsToRemove.size >= 2) break;
          const atomBonds = bonds.filter(b => b.from === atom.id || b.to === atom.id);
          if (atomBonds.length === 1) {
            atomsToRemove.add(atom.id);
            bondsToRemove.add(atomBonds[0].id);
          }
        }
        if (atomsToRemove.size > 0) {
          set(state => {
            const histUpdate = pushHistory(state);
            return {
              atoms: atoms.filter(a => !atomsToRemove.has(a.id)),
              bonds: bonds.filter(b => !bondsToRemove.has(b.id) && !atomsToRemove.has(b.from) && !atomsToRemove.has(b.to)),
              ...histUpdate,
            };
          });
        }
        break;
      }

      case '取代': {
        // 取代反应：移除最后一个放置的原子
        if (selectedAtomId) {
          set(state => {
            const histUpdate = pushHistory(state);
            return {
              atoms: atoms.filter(a => a.id !== selectedAtomId),
              bonds: bonds.filter(b => b.from !== selectedAtomId && b.to !== selectedAtomId),
              selectedAtomId: null,
              ...histUpdate,
            };
          });
        }
        break;
      }

      case '水解': {
        // 水解：添加一个 H2O 分子
        const newAtoms = [...atoms];
        const newBonds = [...bonds];
        const avgY = atoms.reduce((s, a) => s + a.y, 0) / atoms.length;
        const oId = genId();
        const h1Id = genId();
        const h2Id = genId();
        const ox = 0;
        const oy = avgY + 120;
        newAtoms.push({ id: oId, symbol: 'O', x: ox, y: oy });
        newAtoms.push({ id: h1Id, symbol: 'H', x: ox - 35, y: oy - 35 });
        newAtoms.push({ id: h2Id, symbol: 'H', x: ox + 35, y: oy - 35 });
        newBonds.push({ id: genBondId(), from: oId, to: h1Id, type: 1 });
        newBonds.push({ id: genBondId(), from: oId, to: h2Id, type: 1 });
        set(state => {
          const histUpdate = pushHistory(state);
          return { atoms: newAtoms, bonds: newBonds, ...histUpdate };
        });
        break;
      }

      case '加热':
      case '催化':
      default:
        // 纯视觉效果
        break;
    }
  },

  clearCanvas: () => set(state => {
    const histUpdate = pushHistory(state);
    return {
      atoms: [],
      bonds: [],
      selectedAtomId: null,
      selectedBondId: null,
      draggingAtomId: null,
      canvasOffset: { x: 0, y: 0 },
      canvasScale: 1,
      ...histUpdate,
    };
  }),

  getMolecularFormula: () => {
    const { atoms } = get();
    if (atoms.length === 0) return '';

    const counts: Record<string, number> = {};
    for (const atom of atoms) {
      counts[atom.symbol] = (counts[atom.symbol] || 0) + 1;
    }

    // 化学惯例排序：C → H → 其他按字母序
    const order: string[] = [];
    if (counts['C']) { order.push('C'); }
    if (counts['H']) { order.push('H'); }
    const remaining = Object.keys(counts).filter(k => k !== 'C' && k !== 'H').sort();
    order.push(...remaining);

    return order.map(sym => {
      const c = counts[sym];
      return c > 1 ? `${sym}${c}` : sym;
    }).join('');
  },

  getStructuralFormula: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return '';

    // 检测环状结构
    const simpleAdj = new Map<string, string[]>();
    for (const atom of atoms) {
      simpleAdj.set(atom.id, []);
    }
    for (const bond of bonds) {
      simpleAdj.get(bond.from)?.push(bond.to);
      simpleAdj.get(bond.to)?.push(bond.from);
    }

    const ringVisited = new Set<string>();
    let hasRing = false;

    function detectRings(atomId: string, parentId: string | null): void {
      ringVisited.add(atomId);
      const neighbors = simpleAdj.get(atomId) || [];
      for (const neighborId of neighbors) {
        if (!ringVisited.has(neighborId)) {
          detectRings(neighborId, atomId);
        } else if (neighborId !== parentId) {
          hasRing = true;
        }
      }
    }

    for (const atom of atoms) {
      if (!ringVisited.has(atom.id)) {
        detectRings(atom.id, null);
      }
    }

    // 环状分子回退到分子式
    if (hasRing) {
      return get().getMolecularFormula();
    }

    // 非环状分子：DFS 生成结构简式
    const visited = new Set<string>();
    const parts: string[] = [];

    function dfs(atomId: string, parentId: string | null): string {
      if (visited.has(atomId)) return '';
      visited.add(atomId);

      const atom = atoms.find(a => a.id === atomId);
      if (!atom) return '';

      const atomBonds = bonds.filter(b => b.from === atomId || b.to === atomId);
      const neighbors = atomBonds
        .map(b => b.from === atomId ? b.to : b.from)
        .filter(id => id !== parentId);

      const bondToParent = parentId
        ? bonds.find(b =>
            (b.from === atomId && b.to === parentId) ||
            (b.to === atomId && b.from === parentId)
          )
        : null;

      let bondPrefix = '';
      if (bondToParent) {
        if (bondToParent.type === 2) bondPrefix = '=';
        else if (bondToParent.type === 3) bondPrefix = '≡';
        // 单键不加前缀
      }

      // 找非 H 的子节点
      const nonHNeighbors = neighbors.filter(id => {
        const n = atoms.find(a => a.id === id);
        return n && n.symbol !== 'H';
      });

      // 找 H 子节点
      const hNeighbors = neighbors.filter(id => {
        const n = atoms.find(a => a.id === id);
        return n && n.symbol === 'H';
      });

      const hCount = hNeighbors.length;

      // 氢原子字符串
      const hStr = hCount === 0 ? '' : hCount === 1 ? 'H' : hCount === 2 ? 'H₂' : hCount === 3 ? 'H₃' : `H${hCount}`;

      // 没有非 H 邻居：末端原子
      if (nonHNeighbors.length === 0) {
        if (atom.symbol === 'C') {
          return `${bondPrefix}C${hStr}`;
        }
        return `${bondPrefix}${atom.symbol}${hStr}`;
      }

      // 只有一个非 H 邻居：线性链
      if (nonHNeighbors.length === 1) {
        const childResult = dfs(nonHNeighbors[0], atomId);
        if (atom.symbol === 'C') {
          return `${bondPrefix}C${hStr}${childResult}`;
        }
        return `${bondPrefix}${atom.symbol}${hStr}${childResult}`;
      }

      // 多个非 H 邻居：分支结构，用括号
      const childResults = nonHNeighbors.map(id => dfs(id, atomId)).filter(Boolean);
      if (childResults.length === 0) {
        return `${bondPrefix}${atom.symbol}`;
      }

      if (atom.symbol === 'C') {
        return `${bondPrefix}C${hStr}(${childResults.join(')(')})`;
      }
      return `${bondPrefix}${atom.symbol}${hStr}(${childResults.join(')(')})`;
    }

    for (const atom of atoms) {
      if (!visited.has(atom.id)) {
        parts.push(dfs(atom.id, null));
      }
    }

    return parts.join('·');
  },

  getChineseName: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return '';

    const counts: Record<string, number> = {};
    for (const atom of atoms) {
      counts[atom.symbol] = (counts[atom.symbol] || 0) + 1;
    }

    const carbonCount = counts['C'] || 0;

    // 简化命名规则
    const carbonPrefix: Record<number, string> = {
      0: '', 1: '甲', 2: '乙', 3: '丙', 4: '丁',
      5: '戊', 6: '己', 7: '庚', 8: '辛', 9: '壬', 10: '癸',
    };

    const prefix = carbonPrefix[carbonCount] || `${carbonCount}碳`;

    if (carbonCount === 0) {
      // 无机物简化命名
      const elementNames: Record<string, string> = {
        'H': '氢', 'O': '氧', 'N': '氮', 'S': '硫',
        'Cl': '氯', 'Na': '钠', 'Fe': '铁', 'Cu': '铜',
      };
      return Object.entries(counts)
        .map(([sym, c]) => `${elementNames[sym] || sym}${c > 1 ? c : ''}`)
        .join('化');
    }

    // 构建邻接表用于键检测
    const adj = new Map<string, { neighborId: string; bondType: 1 | 2 | 3 }[]>();
    for (const atom of atoms) {
      adj.set(atom.id, []);
    }
    for (const bond of bonds) {
      adj.get(bond.from)?.push({ neighborId: bond.to, bondType: bond.type });
      adj.get(bond.to)?.push({ neighborId: bond.from, bondType: bond.type });
    }

    // 检测实际的 O-H 键（不是 O 和 H 原子共存）
    const hasOHBond = bonds.some(b => {
      const fromAtom = atoms.find(a => a.id === b.from);
      const toAtom = atoms.find(a => a.id === b.to);
      if (!fromAtom || !toAtom) return false;
      return (fromAtom.symbol === 'O' && toAtom.symbol === 'H') ||
             (fromAtom.symbol === 'H' && toAtom.symbol === 'O');
    });

    // 检测 C=O 键
    const hasCdoubleO = bonds.some(b => {
      if (b.type !== 2) return false;
      const fromAtom = atoms.find(a => a.id === b.from);
      const toAtom = atoms.find(a => a.id === b.to);
      if (!fromAtom || !toAtom) return false;
      return (fromAtom.symbol === 'C' && toAtom.symbol === 'O') ||
             (fromAtom.symbol === 'O' && toAtom.symbol === 'C');
    });

    // 检测羧基：同一个 C 上有 C=O 和 C-OH
    const isCarboxylicAcid = atoms.some(a => {
      if (a.symbol !== 'C') return false;
      const neighbors = adj.get(a.id) || [];
      const hasDoubleO = neighbors.some(n => {
        const na = atoms.find(x => x.id === n.neighborId);
        return na && na.symbol === 'O' && n.bondType === 2;
      });
      const hasSingleOH = neighbors.some(n => {
        const na = atoms.find(x => x.id === n.neighborId);
        if (!na || na.symbol !== 'O' || n.bondType !== 1) return false;
        const oNeighbors = adj.get(na.id) || [];
        return oNeighbors.some(on => {
          const oa = atoms.find(x => x.id === on.neighborId);
          return oa && oa.symbol === 'H';
        });
      });
      return hasDoubleO && hasSingleOH;
    });

    // 检测醛基：C=O 且该 C 上有 C-H 键
    const isAldehyde = bonds.some(b => {
      if (b.type !== 2) return false;
      const fromAtom = atoms.find(a => a.id === b.from);
      const toAtom = atoms.find(a => a.id === b.to);
      if (!fromAtom || !toAtom) return false;
      const cAtom = fromAtom.symbol === 'C' ? fromAtom : (toAtom.symbol === 'C' ? toAtom : null);
      if (!cAtom) return false;
      const cNeighbors = adj.get(cAtom.id) || [];
      return cNeighbors.some(n => {
        const na = atoms.find(a => a.id === n.neighborId);
        return na && na.symbol === 'H';
      });
    });

    // 检测酮基：C=O 且该 C 上没有 H
    const isKetone = bonds.some(b => {
      if (b.type !== 2) return false;
      const fromAtom = atoms.find(a => a.id === b.from);
      const toAtom = atoms.find(a => a.id === b.to);
      if (!fromAtom || !toAtom) return false;
      const cAtom = fromAtom.symbol === 'C' ? fromAtom : (toAtom.symbol === 'C' ? toAtom : null);
      if (!cAtom) return false;
      const cNeighbors = adj.get(cAtom.id) || [];
      const hasH = cNeighbors.some(n => {
        const na = atoms.find(a => a.id === n.neighborId);
        return na && na.symbol === 'H';
      });
      return !hasH;
    });

    const hasNitrogen = counts['N'] > 0;
    const hasDouble = bonds.some(b => b.type === 2);
    const hasTriple = bonds.some(b => b.type === 3);

    // 分类逻辑（按优先级）
    if (isCarboxylicAcid) {
      return `${prefix}酸`;
    }

    if (hasOHBond && !hasCdoubleO) {
      return `${prefix}醇`;
    }

    if (hasCdoubleO && isAldehyde) {
      return `${prefix}醛`;
    }

    if (hasCdoubleO && isKetone) {
      return `${prefix}酮`;
    }

    if (hasNitrogen) return `${prefix}胺`;
    if (hasTriple) return `${prefix}炔`;
    if (hasDouble) return `${prefix}烯`;
    return `${prefix}烷`;
  },

  // ========== 新增功能 ==========

  getMolecularWeight: () => {
    const { atoms } = get();
    if (atoms.length === 0) return 0;
    let total = 0;
    for (const atom of atoms) {
      total += ATOMIC_MASSES[atom.symbol] || 0;
    }
    return Math.round(total * 1000) / 1000;
  },

  getIUPACName: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return '';

    const counts: Record<string, number> = {};
    for (const atom of atoms) {
      counts[atom.symbol] = (counts[atom.symbol] || 0) + 1;
    }

    const carbonCount = counts['C'] || 0;

    // 无碳或碳数过少，返回中文名
    if (carbonCount === 0) {
      return get().getChineseName();
    }

    // 构建邻接表
    const adj = new Map<string, { neighborId: string; bondType: 1 | 2 | 3 }[]>();
    for (const atom of atoms) {
      adj.set(atom.id, []);
    }
    for (const bond of bonds) {
      adj.get(bond.from)?.push({ neighborId: bond.to, bondType: bond.type });
      adj.get(bond.to)?.push({ neighborId: bond.from, bondType: bond.type });
    }

    // 检测官能团
    const hasOH = detectFunctionalGroup(atoms, bonds, 'OH');
    const hasCOOH = detectFunctionalGroup(atoms, bonds, 'COOH');
    const hasCHO = detectFunctionalGroup(atoms, bonds, 'CHO');
    const hasNH2 = detectFunctionalGroup(atoms, bonds, 'NH2');
    const hasCeqO = detectFunctionalGroup(atoms, bonds, 'C=O');

    // 找最长碳链
    const carbonAtoms = atoms.filter(a => a.symbol === 'C');
    const carbonIds = new Set(carbonAtoms.map(a => a.id));

    if (carbonAtoms.length === 0) return get().getChineseName();

    // 用 DFS 找最长碳链
    let longestChain: string[] = [];
    const visited = new Set<string>();

    function dfsChain(atomId: string, chain: string[]) {
      if (!carbonIds.has(atomId)) return;
      visited.add(atomId);
      chain.push(atomId);

      if (chain.length > longestChain.length) {
        longestChain = [...chain];
      }

      const neighbors = adj.get(atomId) || [];
      for (const { neighborId } of neighbors) {
        if (carbonIds.has(neighborId) && !visited.has(neighborId)) {
          dfsChain(neighborId, chain);
        }
      }

      chain.pop();
      visited.delete(atomId);
    }

    for (const cAtom of carbonAtoms) {
      visited.clear();
      dfsChain(cAtom.id, []);
    }

    const parentChainLength = longestChain.length;
    const prefix = CARBON_PREFIX[parentChainLength] || `${parentChainLength}碳`;

    // 确定后缀
    let suffix = '烷';
    const chainBondTypes = new Set<1 | 2 | 3>();
    for (let i = 0; i < longestChain.length - 1; i++) {
      const bond = bonds.find(b =>
        (b.from === longestChain[i] && b.to === longestChain[i + 1]) ||
        (b.to === longestChain[i] && b.from === longestChain[i + 1])
      );
      if (bond) chainBondTypes.add(bond.type);
    }

    // 优先级：COOH > CHO > C=O(酮) > OH(醇) > NH2 > 烯/炔/烷
    if (hasCOOH) {
      suffix = '酸';
    } else if (hasCHO) {
      suffix = '醛';
    } else if (hasCeqO && !hasOH) {
      suffix = '酮';
    } else if (hasOH) {
      suffix = '醇';
    } else if (hasNH2) {
      suffix = '胺';
    } else {
      if (chainBondTypes.has(3)) suffix = '炔';
      else if (chainBondTypes.has(2)) suffix = '烯';
    }

    // 找取代基（不在主链上的碳原子）
    const chainSet = new Set(longestChain as string[]) as Set<string>;
    const substituents: { position: number; name: string }[] = [];

    for (const cId of chainSet) {
      const neighbors = adj.get(cId) || [];
      for (const { neighborId } of neighbors) {
        // 不在主链上的碳邻居是取代基
        if (carbonIds.has(neighborId) && !chainSet.has(neighborId)) {
          const posInChain = longestChain.indexOf(cId) + 1;
          // 计算支链碳数
          const branchSize = countBranchSize(neighborId, chainSet, adj, carbonIds);
          const branchPrefix = CARBON_PREFIX[branchSize] || `${branchSize}碳`;
          substituents.push({ position: posInChain, name: `${branchPrefix}基` });
        }
        // 非碳取代基
        const neighborAtom = atoms.find(a => a.id === neighborId);
        if (neighborAtom && !carbonIds.has(neighborId) && !chainSet.has(neighborId)) {
          const posInChain = longestChain.indexOf(cId) + 1;
          if (neighborAtom.symbol === 'Cl') {
            substituents.push({ position: posInChain, name: '氯' });
          } else if (neighborAtom.symbol === 'Br') {
            substituents.push({ position: posInChain, name: '溴' });
          } else if (neighborAtom.symbol === 'F') {
            substituents.push({ position: posInChain, name: '氟' });
          } else if (neighborAtom.symbol === 'I') {
            substituents.push({ position: posInChain, name: '碘' });
          }
        }
      }
    }

    // 排序取代基按位置
    substituents.sort((a, b) => a.position - b.position);

    if (substituents.length === 0) {
      return `${prefix}${suffix}`;
    }

    // 合并相同取代基
    const mergedMap = new Map<string, number[]>();
    for (const sub of substituents) {
      if (!mergedMap.has(sub.name)) {
        mergedMap.set(sub.name, []);
      }
      mergedMap.get(sub.name)!.push(sub.position);
    }

    const subParts: string[] = [];
    for (const [name, positions] of mergedMap) {
      const posStr = positions.join(',');
      if (positions.length > 1) {
        const chineseNum: Record<number, string> = { 2: '二', 3: '三', 4: '四' };
        subParts.push(`${posStr}-${chineseNum[positions.length] || positions.length}${name}`);
      } else {
        subParts.push(`${posStr}-${name}`);
      }
    }

    return `${subParts.join(',')}${prefix}${suffix}`;
  },

  getChiralCenters: () => {
    const { atoms, bonds } = get();
    const chiralIds: string[] = [];

    // 构建邻接表
    const adj = new Map<string, { neighborId: string; bondType: 1 | 2 | 3 }[]>();
    for (const atom of atoms) {
      adj.set(atom.id, []);
    }
    for (const bond of bonds) {
      adj.get(bond.from)?.push({ neighborId: bond.to, bondType: bond.type });
      adj.get(bond.to)?.push({ neighborId: bond.from, bondType: bond.type });
    }

    for (const atom of atoms) {
      // 手性中心通常是碳原子
      if (atom.symbol !== 'C') continue;

      const neighbors = adj.get(atom.id) || [];
      // 必须有4个单键
      const singleBondNeighbors = neighbors.filter(n => n.bondType === 1);
      if (singleBondNeighbors.length !== 4) continue;

      // 对每个邻居做 DFS 获取子树组成
      const subtreeSignatures: string[] = [];
      for (const { neighborId } of singleBondNeighbors) {
        const signature = getSubtreeSignature(neighborId, atom.id, adj, atoms);
        subtreeSignatures.push(signature);
      }

      // 检查4个子树是否各不相同
      const uniqueSignatures = new Set(subtreeSignatures);
      if (uniqueSignatures.size === 4) {
        chiralIds.push(atom.id);
      }
    }

    return chiralIds;
  },

  getHybridization: (atomId: string) => {
    const { atoms, bonds } = get();
    const atom = atoms.find(a => a.id === atomId);
    if (!atom) return '';

    const atomBonds = bonds.filter(b => b.from === atomId || b.to === atomId);
    const totalBondOrder = atomBonds.reduce((sum, b) => sum + b.type, 0);
    const hasTriple = atomBonds.some(b => b.type === 3);
    const hasDouble = atomBonds.some(b => b.type === 2);

    if (totalBondOrder <= 2 && hasTriple) return 'sp';
    if (totalBondOrder <= 3 && hasDouble) return 'sp2';
    if (totalBondOrder <= 4 && !hasDouble && !hasTriple) return 'sp3';
    return '';
  },

  getIsomerHints: () => {
    const formula = get().getMolecularFormula();
    if (!formula) return [];
    return ISOMER_DB[formula] || [];
  },

  // Save/Load
  saveMolecule: () => {
    const state = get();
    const activeMol = state.molecules.find(m => m.id === state.activeMoleculeId);
    if (!activeMol) return;

    const savedMol: Molecule = {
      id: activeMol.id,
      name: activeMol.name,
      atoms: JSON.parse(JSON.stringify(state.atoms)),
      bonds: JSON.parse(JSON.stringify(state.bonds)),
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const savedList: Molecule[] = stored ? JSON.parse(stored) : [];
      const existingIdx = savedList.findIndex(m => m.id === savedMol.id);
      if (existingIdx >= 0) {
        savedList[existingIdx] = savedMol;
      } else {
        savedList.push(savedMol);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedList));
    } catch {
      // localStorage 不可用时静默失败
    }
  },

  loadMolecule: (id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const savedList: Molecule[] = JSON.parse(stored);
      const target = savedList.find(m => m.id === id);
      if (!target) return;

      const state = get();
      const updatedMolecules = saveCurrentMolecule(state);
      // 如果已存在同名分子则覆盖，否则添加
      const existingIdx = updatedMolecules.findIndex(m => m.id === target.id);
      if (existingIdx < 0) {
        updatedMolecules.push({ ...target });
      } else {
        updatedMolecules[existingIdx] = { ...target };
      }

      set({
        molecules: updatedMolecules,
        activeMoleculeId: target.id,
        atoms: JSON.parse(JSON.stringify(target.atoms)),
        bonds: JSON.parse(JSON.stringify(target.bonds)),
        selectedAtomId: null,
        selectedBondId: null,
        history: [],
        historyIndex: -1,
      });
    } catch {
      // localStorage 不可用时静默失败
    }
  },

  getSavedMolecules: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as Molecule[];
    } catch {
      return [];
    }
  },

  deleteSavedMolecule: (id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const savedList: Molecule[] = JSON.parse(stored);
      const filtered = savedList.filter(m => m.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // localStorage 不可用时静默失败
    }
  },

  getExportData: () => {
    const { atoms, bonds } = get();
    return {
      atoms: JSON.parse(JSON.stringify(atoms)),
      bonds: JSON.parse(JSON.stringify(bonds)),
    };
  },

  // ========== v1.3.0 新增功能 ==========

  // 1. SMILES 导出
  getSMILES: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return '';

    const adj = buildAdj(atoms, bonds);

    // 过滤掉 H 原子（隐式氢）
    const heavyAtoms = atoms.filter(a => a.symbol !== 'H');
    if (heavyAtoms.length === 0) return '';

    const visited = new Set<string>();
    const ringClosures = new Map<string, number>(); // atomId -> ring number
    let ringNumber = 0;
    let smiles = '';

    function dfs(atomId: string, parentId: string | null): void {
      if (visited.has(atomId)) {
        // 环闭合
        if (ringClosures.has(atomId)) {
          const num = ringClosures.get(atomId)!;
          smiles += num < 10 ? `${num}` : `%${num}`;
        }
        return;
      }
      visited.add(atomId);

      const atom = atoms.find(a => a.id === atomId);
      if (!atom) return;

      // 写入原子符号
      smiles += atom.symbol;

      // 获取非 H 邻居
      const neighbors = (adj.get(atomId) || [])
        .filter(n => {
          const na = atoms.find(a => a.id === n.neighborId);
          return na && na.symbol !== 'H';
        });

      // 分离已访问和未访问的邻居
      const unvisitedNeighbors = neighbors.filter(n => !visited.has(n.neighborId));
      const visitedNeighbors = neighbors.filter(n => visited.has(n.neighborId) && n.neighborId !== parentId);

      // 处理环闭合（已访问的非父邻居）
      for (const vn of visitedNeighbors) {
        if (!ringClosures.has(vn.neighborId)) {
          ringNumber++;
          ringClosures.set(vn.neighborId, ringNumber);
          smiles += ringNumber < 10 ? `${ringNumber}` : `%${ringNumber}`;
        }
      }

      // 处理子节点
      for (let i = 0; i < unvisitedNeighbors.length; i++) {
        const neighbor = unvisitedNeighbors[i];

        // 写入键型
        if (neighbor.bondType === 2) smiles += '=';
        else if (neighbor.bondType === 3) smiles += '#';

        // 如果有多个未访问邻居，用括号表示分支
        if (i < unvisitedNeighbors.length - 1) {
          smiles += '(';
          dfs(neighbor.neighborId, atomId);
          smiles += ')';
        } else {
          dfs(neighbor.neighborId, atomId);
        }
      }
    }

    // 从第一个重原子开始 DFS
    dfs(heavyAtoms[0].id, null);

    // 处理未连通的组件
    for (const atom of heavyAtoms) {
      if (!visited.has(atom.id)) {
        smiles += '.';
        dfs(atom.id, null);
      }
    }

    return smiles;
  },

  // 2. SMILES 导入
  importSMILES: (smiles: string) => {
    const newAtoms: AtomNode[] = [];
    const newBonds: Bond[] = [];
    const atomStack: string[] = []; // 当前分支栈
    const ringOpeners = new Map<number, string>(); // ringNumber -> atomId
    let currentAtomId: string | null = null;
    let pendingBondType: 1 | 2 | 3 = 1;
    let x = 0;
    const y = 0;
    const SPACING = 60;
    let atomIndex = 0;

    let pos = 0;
    while (pos < smiles.length) {
      const ch = smiles[pos];

      if (ch === '(') {
        // 开始分支
        if (currentAtomId) {
          atomStack.push(currentAtomId);
        }
        pos++;
        continue;
      }

      if (ch === ')') {
        // 结束分支
        currentAtomId = atomStack.pop() || null;
        pendingBondType = 1;
        pos++;
        continue;
      }

      if (ch === '=') {
        pendingBondType = 2;
        pos++;
        continue;
      }

      if (ch === '#') {
        pendingBondType = 3;
        pos++;
        continue;
      }

      if (ch === '.') {
        // 断开连接
        currentAtomId = null;
        pendingBondType = 1;
        pos++;
        continue;
      }

      if (ch === '-') {
        // 单键（显式）
        pendingBondType = 1;
        pos++;
        continue;
      }

      // 数字：环闭合
      if (ch >= '0' && ch <= '9') {
        const num = parseInt(ch, 10);
        if (ringOpeners.has(num)) {
          // 闭合环
          const openerId = ringOpeners.get(num)!;
          if (currentAtomId && openerId !== currentAtomId) {
            // 检查是否已有键
            const existingBond = newBonds.find(
              b => (b.from === currentAtomId && b.to === openerId) ||
                   (b.from === openerId && b.to === currentAtomId)
            );
            if (!existingBond) {
              newBonds.push({ id: genBondId(), from: currentAtomId, to: openerId, type: pendingBondType });
            }
          }
          ringOpeners.delete(num);
        } else if (currentAtomId) {
          // 开启环
          ringOpeners.set(num, currentAtomId);
        }
        pendingBondType = 1;
        pos++;
        continue;
      }

      // % 后跟两位数字的环号
      if (ch === '%' && pos + 2 < smiles.length) {
        const num = parseInt(smiles.substring(pos + 1, pos + 3), 10);
        if (ringOpeners.has(num)) {
          const openerId = ringOpeners.get(num)!;
          if (currentAtomId && openerId !== currentAtomId) {
            const existingBond = newBonds.find(
              b => (b.from === currentAtomId && b.to === openerId) ||
                   (b.from === openerId && b.to === currentAtomId)
            );
            if (!existingBond) {
              newBonds.push({ id: genBondId(), from: currentAtomId, to: openerId, type: pendingBondType });
            }
          }
          ringOpeners.delete(num);
        } else if (currentAtomId) {
          ringOpeners.set(num, currentAtomId);
        }
        pendingBondType = 1;
        pos += 3;
        continue;
      }

      // 方括号原子
      if (ch === '[') {
        const end = smiles.indexOf(']', pos);
        if (end < 0) break;
        const content = smiles.substring(pos + 1, end);
        const elementMatch = content.match(/^([A-Z][a-z]?)/);
        if (elementMatch) {
          const symbol = elementMatch[1];
          const atomId = genId();
          newAtoms.push({ id: atomId, symbol, x, y });
          if (currentAtomId) {
            newBonds.push({ id: genBondId(), from: currentAtomId, to: atomId, type: pendingBondType });
            pendingBondType = 1;
          }
          currentAtomId = atomId;
          atomIndex++;
          x = atomIndex * SPACING;
        }
        pos = end + 1;
        continue;
      }

      // 元素符号
      const elementResult = parseSMILESElement(smiles, pos);
      if (elementResult) {
        const atomId = genId();
        newAtoms.push({ id: atomId, symbol: elementResult.symbol, x, y });
        if (currentAtomId) {
          newBonds.push({ id: genBondId(), from: currentAtomId, to: atomId, type: pendingBondType });
          pendingBondType = 1;
        }
        currentAtomId = atomId;
        atomIndex++;
        x = atomIndex * SPACING;
        pos += elementResult.length;
        continue;
      }

      // 未知字符，跳过
      pos++;
    }

    // 清空画布并设置新原子和键
    set(state => {
      const histUpdate = pushHistory(state);
      return {
        atoms: newAtoms,
        bonds: newBonds,
        selectedAtomId: null,
        selectedBondId: null,
        ...histUpdate,
      };
    });
  },

  // 3. 自动布局
  autoLayout: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return;

    const adj = buildAdj(atoms, bonds);
    const SPACING = 60;

    // 找到键最多的原子作为根
    let rootAtom = atoms[0];
    let maxBonds = 0;
    for (const atom of atoms) {
      const bondCount = (adj.get(atom.id) || []).length;
      if (bondCount > maxBonds) {
        maxBonds = bondCount;
        rootAtom = atom;
      }
    }

    const visited = new Set<string>();
    const positions = new Map<string, { x: number; y: number }>();

    function dfs(atomId: string, x: number, y: number, angle: number, parentId: string | null): void {
      if (visited.has(atomId)) return;
      visited.add(atomId);
      positions.set(atomId, { x, y });

      const neighbors = (adj.get(atomId) || [])
        .filter(n => n.neighborId !== parentId && !visited.has(n.neighborId));

      if (neighbors.length === 0) return;

      // 计算角度分布
      const angleSpread = Math.PI * 0.6; // 子节点角度范围
      const startAngle = angle - angleSpread / 2;
      const angleStep = neighbors.length > 1 ? angleSpread / (neighbors.length - 1) : 0;

      for (let i = 0; i < neighbors.length; i++) {
        const childAngle = neighbors.length === 1 ? angle : startAngle + i * angleStep;
        const childX = x + SPACING * Math.cos(childAngle);
        const childY = y + SPACING * Math.sin(childAngle);
        dfs(neighbors[i].neighborId, childX, childY, childAngle, atomId);
      }
    }

    dfs(rootAtom.id, 0, 0, 0, null);

    // 处理未连通的组件
    for (const atom of atoms) {
      if (!visited.has(atom.id)) {
        const maxX = Math.max(...Array.from(positions.values()).map(p => p.x), 0);
        dfs(atom.id, maxX + SPACING * 2, 0, 0, null);
      }
    }

    // 居中
    if (positions.size > 0) {
      const allPos = Array.from(positions.values());
      const centerX = allPos.reduce((s, p) => s + p.x, 0) / allPos.length;
      const centerY = allPos.reduce((s, p) => s + p.y, 0) / allPos.length;

      for (const [id, pos] of positions) {
        positions.set(id, { x: pos.x - centerX, y: pos.y - centerY });
      }
    }

    // 应用新位置
    set(state => {
      const histUpdate = pushHistory(state);
      const newAtoms = state.atoms.map(a => {
        const pos = positions.get(a.id);
        return pos ? { ...a, x: pos.x, y: pos.y } : a;
      });
      return { atoms: newAtoms, ...histUpdate };
    });
  },

  // 4. 适配视图
  fitToView: (canvasWidth: number, canvasHeight: number) => {
    const { atoms } = get();
    if (atoms.length === 0) return;

    const minX = Math.min(...atoms.map(a => a.x));
    const maxX = Math.max(...atoms.map(a => a.x));
    const minY = Math.min(...atoms.map(a => a.y));
    const maxY = Math.max(...atoms.map(a => a.y));

    const padding = 80;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const scaleX = canvasWidth / contentWidth;
    const scaleY = canvasHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 2); // 最大缩放2倍

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    set({
      canvasScale: scale,
      canvasOffset: {
        x: canvasWidth / 2 - centerX * scale,
        y: canvasHeight / 2 - centerY * scale,
      },
    });
  },

  // 5. 形式电荷
  getFormalCharge: (atomId: string) => {
    const { atoms, bonds } = get();
    const atom = atoms.find(a => a.id === atomId);
    if (!atom) return 0;

    const valence = VALENCE_ELECTRONS[atom.symbol] || 0;
    if (valence === 0) return 0;

    const usedBonds = getUsedBonds(atomId, bonds);
    const bondingElectrons = usedBonds * 2; // 每个键贡献2个电子
    const element = ELEMENT_MAP.get(atom.symbol);
    const maxBonds = element ? element.maxBonds : usedBonds;
    const nonBondingElectrons = Math.max(0, (maxBonds - usedBonds)) * 2; // 简化估计孤对电子

    // 形式电荷 = 价电子 - (非键电子 + 键合电子/2)
    const formalCharge = valence - (nonBondingElectrons + bondingElectrons / 2);
    return Math.round(formalCharge);
  },

  // 6. 氧化态
  getOxidationState: (atomId: string) => {
    const { atoms, bonds } = get();
    const atom = atoms.find(a => a.id === atomId);
    if (!atom) return 0;

    const valence = VALENCE_ELECTRONS[atom.symbol] || 0;
    if (valence === 0) return 0;

    const atomBonds = bonds.filter(b => b.from === atomId || b.to === atomId);
    let assignedElectrons = 0;

    for (const bond of atomBonds) {
      const otherId = bond.from === atomId ? bond.to : bond.from;
      const otherAtom = atoms.find(a => a.id === otherId);
      if (!otherAtom) continue;

      const myEN = ELECTRONEGATIVITY[atom.symbol] || 0;
      const otherEN = ELECTRONEGATIVITY[otherAtom.symbol] || 0;

      if (myEN > otherEN) {
        // 我更电负性，获得所有键合电子
        assignedElectrons += bond.type * 2;
      } else if (myEN === otherEN) {
        // 同种元素，平分
        assignedElectrons += bond.type;
      }
      // 否则对方更电负性，我不获得电子
    }

    // 氧化态 = 价电子 - 分配到的电子
    return valence - assignedElectrons;
  },

  // 7. 环检测
  getRings: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return [];

    const adj = buildAdj(atoms, bonds);
    const rings: string[][] = [];
    const visited = new Set<string>();
    const parent = new Map<string, string | null>();

    function dfs(atomId: string, parentId: string | null): void {
      visited.add(atomId);
      parent.set(atomId, parentId);

      const neighbors = adj.get(atomId) || [];
      for (const { neighborId } of neighbors) {
        if (!visited.has(neighborId)) {
          dfs(neighborId, atomId);
        } else if (neighborId !== parentId) {
          // 找到环：回溯从 neighborId 到当前原子的路径
          const ring: string[] = [atomId];
          let current: string | null = atomId;
          while (current && current !== neighborId) {
            current = parent.get(current) || null;
            if (current && current !== neighborId) {
              ring.push(current);
            }
          }
          if (current === neighborId) {
            ring.push(neighborId);
            // 只保留最小环（长度 <= 8）
            if (ring.length >= 3 && ring.length <= 8) {
              // 检查是否是已有环的排列
              const sortedRing = [...ring].sort();
              const isDuplicate = rings.some(r => {
                const sorted = [...r].sort();
                if (sorted.length !== sortedRing.length) return false;
                return sorted.every((id, i) => id === sortedRing[i]);
              });
              if (!isDuplicate) {
                rings.push(ring);
              }
            }
          }
        }
      }
    }

    for (const atom of atoms) {
      if (!visited.has(atom.id)) {
        dfs(atom.id, null);
      }
    }

    return rings;
  },

  // 8. 共振结构
  getResonanceStructures: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return [];

    const structures: { atoms: AtomNode[]; bonds: Bond[] }[] = [];
    // 原始结构
    structures.push({
      atoms: JSON.parse(JSON.stringify(atoms)),
      bonds: JSON.parse(JSON.stringify(bonds)),
    });

    // 查找共轭系统（交替单/双键路径）
    const adj = buildAdj(atoms, bonds);

    // 找所有双键
    const doubleBonds = bonds.filter(b => b.type === 2);

    if (doubleBonds.length === 0) return structures;

    // 找共轭路径：双键-单键-双键
    const conjugatedPaths: { bond1: Bond; middleAtom1: string; middleAtom2: string; bond2: Bond }[] = [];

    for (const db1 of doubleBonds) {
      // 从 db1 的两端找单键连接的另一个双键
      for (const endId of [db1.from, db1.to]) {
        const neighbors = adj.get(endId) || [];
        for (const { neighborId, bondType } of neighbors) {
          if (bondType !== 1) continue;
          // 检查 neighborId 是否连着另一个双键
          const neighborBonds = adj.get(neighborId) || [];
          for (const { neighborId: nextId, bondType: nextBondType } of neighborBonds) {
            if (nextBondType !== 2) continue;
            const db2 = bonds.find(b =>
              b.id !== db1.id &&
              ((b.from === neighborId && b.to === nextId) || (b.to === neighborId && b.from === nextId))
            );
            if (db2) {
              conjugatedPaths.push({
                bond1: db1,
                middleAtom1: endId,
                middleAtom2: neighborId,
                bond2: db2,
              });
            }
          }
        }
      }
    }

    // 生成共振结构：移动双键
    if (conjugatedPaths.length > 0) {
      const newBonds = JSON.parse(JSON.stringify(bonds)) as Bond[];
      for (const path of conjugatedPaths.slice(0, 3)) {
        // bond1: 双→单，中间键: 单→双，bond2: 双→单
        const b1 = newBonds.find((b: Bond) => b.id === path.bond1.id);
        const b2 = newBonds.find((b: Bond) => b.id === path.bond2.id);
        const middleBond = newBonds.find((b: Bond) =>
          (b.from === path.middleAtom1 && b.to === path.middleAtom2) ||
          (b.from === path.middleAtom2 && b.to === path.middleAtom1)
        );

        if (b1 && b2 && middleBond) {
          b1.type = 1;
          middleBond.type = 2;
          b2.type = 1;
        }
      }
      structures.push({
        atoms: JSON.parse(JSON.stringify(atoms)),
        bonds: newBonds,
      });

      // 对于苯环，生成第二个 Kekulé 结构
      const rings = get().getRings();
      const has6Ring = rings.some(r => r.length === 6);
      if (has6Ring && conjugatedPaths.length >= 3) {
        const newBonds2 = JSON.parse(JSON.stringify(bonds)) as Bond[];
        // 翻转所有环上的双/单键
        for (const path of conjugatedPaths) {
          const b1 = newBonds2.find((b: Bond) => b.id === path.bond1.id);
          const b2 = newBonds2.find((b: Bond) => b.id === path.bond2.id);
          const middleBond = newBonds2.find((b: Bond) =>
            (b.from === path.middleAtom1 && b.to === path.middleAtom2) ||
            (b.from === path.middleAtom2 && b.to === path.middleAtom1)
          );
          if (b1 && b2 && middleBond) {
            if (b1.type === 2) b1.type = 1;
            else if (b1.type === 1) b1.type = 2;
            if (middleBond.type === 2) middleBond.type = 1;
            else if (middleBond.type === 1) middleBond.type = 2;
            if (b2.type === 2) b2.type = 1;
            else if (b2.type === 1) b2.type = 2;
          }
        }
        structures.push({
          atoms: JSON.parse(JSON.stringify(atoms)),
          bonds: newBonds2,
        });
      }
    }

    // 最多返回3个
    return structures.slice(0, 3);
  },

  // 9. IR 光谱预测
  getIRPeaks: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return [];

    const peaks: { wavenumber: number; intensity: string; assignment: string }[] = [];
    const adj = buildAdj(atoms, bonds);

    const counts: Record<string, number> = {};
    for (const atom of atoms) {
      counts[atom.symbol] = (counts[atom.symbol] || 0) + 1;
    }

    // O-H 伸缩
    const hasOH = detectFunctionalGroup(atoms, bonds, 'OH');
    if (hasOH) {
      peaks.push({ wavenumber: 3400, intensity: '宽强', assignment: 'O-H 伸缩振动' });
    }

    // N-H 伸缩
    const hasNH2 = detectFunctionalGroup(atoms, bonds, 'NH2');
    if (hasNH2) {
      peaks.push({ wavenumber: 3400, intensity: '中强', assignment: 'N-H 伸缩振动' });
    }

    // C-H 伸缩
    if (counts['C'] > 0 && counts['H'] > 0) {
      // 检查是否有双键或三键
      const hasCdoubleC = bonds.some(b => b.type === 2);
      const hasCTripleC = bonds.some(b => b.type === 3);
      if (hasCTripleC) {
        peaks.push({ wavenumber: 3300, intensity: '中强', assignment: '≡C-H 伸缩振动' });
      } else if (hasCdoubleC) {
        peaks.push({ wavenumber: 3050, intensity: '中强', assignment: '=C-H 伸缩振动' });
      }
      peaks.push({ wavenumber: 2950, intensity: '中强', assignment: 'C-H 伸缩振动' });
    }

    // C≡C 伸缩
    if (bonds.some(b => b.type === 3)) {
      const hasTripleBond = bonds.some(b => {
        const fromAtom = atoms.find(a => a.id === b.from);
        const toAtom = atoms.find(a => a.id === b.to);
        return b.type === 3 && fromAtom?.symbol === 'C' && toAtom?.symbol === 'C';
      });
      if (hasTripleBond) {
        peaks.push({ wavenumber: 2200, intensity: '中', assignment: 'C≡C 伸缩振动' });
      }
    }

    // C=O 伸缩
    const hasCO = bonds.some(b => {
      if (b.type !== 2) return false;
      const fromAtom = atoms.find(a => a.id === b.from);
      const toAtom = atoms.find(a => a.id === b.to);
      return (fromAtom?.symbol === 'C' && toAtom?.symbol === 'O') ||
             (fromAtom?.symbol === 'O' && toAtom?.symbol === 'C');
    });
    if (hasCO) {
      const hasCOOH = detectFunctionalGroup(atoms, bonds, 'COOH');
      if (hasCOOH) {
        peaks.push({ wavenumber: 1720, intensity: '强', assignment: '羧基 C=O 伸缩振动' });
      } else {
        const hasCHO = detectFunctionalGroup(atoms, bonds, 'CHO');
        if (hasCHO) {
          peaks.push({ wavenumber: 1730, intensity: '强', assignment: '醛基 C=O 伸缩振动' });
        } else {
          peaks.push({ wavenumber: 1715, intensity: '强', assignment: 'C=O 伸缩振动' });
        }
      }
    }

    // C=C 伸缩
    const hasCCdouble = bonds.some(b => {
      if (b.type !== 2) return false;
      const fromAtom = atoms.find(a => a.id === b.from);
      const toAtom = atoms.find(a => a.id === b.to);
      return fromAtom?.symbol === 'C' && toAtom?.symbol === 'C';
    });
    if (hasCCdouble) {
      peaks.push({ wavenumber: 1640, intensity: '中', assignment: 'C=C 伸缩振动' });
    }

    // C-O 伸缩
    const hasCOsingle = bonds.some(b => {
      if (b.type !== 1) return false;
      const fromAtom = atoms.find(a => a.id === b.from);
      const toAtom = atoms.find(a => a.id === b.to);
      return (fromAtom?.symbol === 'C' && toAtom?.symbol === 'O') ||
             (fromAtom?.symbol === 'O' && toAtom?.symbol === 'C');
    });
    if (hasCOsingle) {
      peaks.push({ wavenumber: 1100, intensity: '强', assignment: 'C-O 伸缩振动' });
    }

    return peaks;
  },

  // 10. NMR 化学位移预测
  getNMRSifts: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return [];

    const shifts: { atomId: string; ppm: number; type: string }[] = [];
    const adj = buildAdj(atoms, bonds);

    for (const atom of atoms) {
      if (atom.symbol === 'H') {
        // ¹H NMR
        const neighbors = adj.get(atom.id) || [];
        const parentAtom = neighbors.length > 0
          ? atoms.find(a => a.id === neighbors[0].neighborId)
          : null;

        if (!parentAtom) {
          shifts.push({ atomId: atom.id, ppm: 1.0, type: '¹H' });
          continue;
        }

        let ppm = 1.0;

        // 根据连接的原子类型估算
        if (parentAtom.symbol === 'O') {
          ppm = 3.5; // OH
          // 检查是否是羧基 OH
          const oNeighbors = adj.get(parentAtom.id) || [];
          const hasCdoubleO = oNeighbors.some(n => {
            const na = atoms.find(a => a.id === n.neighborId);
            return na && na.symbol === 'C' && n.bondType === 2;
          });
          if (hasCdoubleO) ppm = 11.0; // 羧酸 OH
        } else if (parentAtom.symbol === 'N') {
          ppm = 2.5; // NH
        } else if (parentAtom.symbol === 'C') {
          // 检查 C 的键型
          const cBonds = bonds.filter(b => b.from === parentAtom.id || b.to === parentAtom.id);
          const hasDouble = cBonds.some(b => b.type === 2);
          const hasTriple = cBonds.some(b => b.type === 3);

          if (hasTriple) {
            ppm = 2.5; // 炔氢
          } else if (hasDouble) {
            // 检查是否是醛基
            const hasOdouble = cBonds.some(b => {
              if (b.type !== 2) return false;
              const otherId = b.from === parentAtom.id ? b.to : b.from;
              const otherAtom = atoms.find(a => a.id === otherId);
              return otherAtom?.symbol === 'O';
            });
            if (hasOdouble) {
              ppm = 9.5; // 醛氢
            } else {
              ppm = 5.5; // 烯氢
            }
          } else {
            // 检查是否连着电负性原子
            const cNeighbors = adj.get(parentAtom.id) || [];
            const hasElectronegative = cNeighbors.some(n => {
              const na = atoms.find(a => a.id === n.neighborId);
              return na && (na.symbol === 'O' || na.symbol === 'N' || na.symbol === 'Cl' || na.symbol === 'Br');
            });
            if (hasElectronegative) {
              ppm = 3.5;
            } else {
              ppm = 1.2; // 烷基氢
            }
          }

          // 芳香氢
          const rings = get().getRings();
          const isInRing = rings.some(r => r.includes(parentAtom.id));
          if (isInRing && hasDouble) {
            ppm = 7.2; // 芳香氢
          }
        }

        shifts.push({ atomId: atom.id, ppm: Math.round(ppm * 10) / 10, type: '¹H' });
      } else if (atom.symbol === 'C') {
        // ¹³C NMR
        const cBonds = bonds.filter(b => b.from === atom.id || b.to === atom.id);
        const hasDouble = cBonds.some(b => b.type === 2);
        const hasTriple = cBonds.some(b => b.type === 3);

        let ppm = 30;

        if (hasTriple) {
          ppm = 80; // 炔碳
        } else if (hasDouble) {
          // 检查是否是羰基
          const hasOdouble = cBonds.some(b => {
            if (b.type !== 2) return false;
            const otherId = b.from === atom.id ? b.to : b.from;
            const otherAtom = atoms.find(a => a.id === otherId);
            return otherAtom?.symbol === 'O';
          });
          if (hasOdouble) {
            ppm = 200; // 羰基碳
          } else {
            // 芳香碳
            const rings = get().getRings();
            const isInRing = rings.some(r => r.includes(atom.id));
            if (isInRing) {
              ppm = 130; // 芳香碳
            } else {
              ppm = 125; // 烯碳
            }
          }
        } else {
          // 烷基碳，根据取代基调整
          const neighbors = adj.get(atom.id) || [];
          const electronegCount = neighbors.filter(n => {
            const na = atoms.find(a => a.id === n.neighborId);
            return na && (na.symbol === 'O' || na.symbol === 'N' || na.symbol === 'Cl');
          }).length;
          ppm = 20 + electronegCount * 10;
        }

        shifts.push({ atomId: atom.id, ppm: Math.round(ppm), type: '¹³C' });
      }
    }

    return shifts;
  },

  // 11. pKa 预测
  getPKa: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return [];

    const pKaValues: { atomId: string; pKa: number; type: string }[] = [];
    const adj = buildAdj(atoms, bonds);

    for (const atom of atoms) {
      if (atom.symbol === 'O') {
        const neighbors = adj.get(atom.id) || [];
        const hNeighbor = neighbors.find(n => {
          const na = atoms.find(a => a.id === n.neighborId);
          return na && na.symbol === 'H';
        });

        if (hNeighbor) {
          // 检查是否是羧基
          const cNeighbor = neighbors.find(n => {
            const na = atoms.find(a => a.id === n.neighborId);
            return na && na.symbol === 'C';
          });

          if (cNeighbor) {
            const cNeighbors = adj.get(cNeighbor.neighborId) || [];
            const hasDoubleO = cNeighbors.some(n => {
              const na = atoms.find(a => a.id === n.neighborId);
              return na && na.symbol === 'O' && n.bondType === 2;
            });

            if (hasDoubleO) {
              // 羧酸 -OH
              pKaValues.push({ atomId: atom.id, pKa: 4.5, type: '羧酸' });
              continue;
            }
          }

          // 检查是否是酚（芳香环上的 OH）
          const rings = get().getRings();
          const isPhenol = neighbors.some(n => {
            const na = atoms.find(a => a.id === n.neighborId);
            if (!na || na.symbol !== 'C') return false;
            return rings.some(r => r.includes(na.id));
          });

          if (isPhenol) {
            pKaValues.push({ atomId: atom.id, pKa: 10, type: '酚' });
          } else {
            // 醇 -OH
            pKaValues.push({ atomId: atom.id, pKa: 16, type: '醇' });
          }
        }
      } else if (atom.symbol === 'N') {
        const neighbors = adj.get(atom.id) || [];
        const hCount = neighbors.filter(n => {
          const na = atoms.find(a => a.id === n.neighborId);
          return na && na.symbol === 'H';
        }).length;

        if (hCount >= 1) {
          // 胺的共轭酸 pKa
          pKaValues.push({ atomId: atom.id, pKa: 10, type: '胺(共轭酸)' });
        }
      } else if (atom.symbol === 'S') {
        const neighbors = adj.get(atom.id) || [];
        const hNeighbor = neighbors.find(n => {
          const na = atoms.find(a => a.id === n.neighborId);
          return na && na.symbol === 'H';
        });

        if (hNeighbor) {
          pKaValues.push({ atomId: atom.id, pKa: 10, type: '硫醇' });
        }
      }
    }

    return pKaValues;
  },

  // 12. 楔形/虚线键
  setBondStereo: (id: string, stereo: 'wedge' | 'dash' | 'normal') => {
    set(state => {
      const histUpdate = pushHistory(state);
      return {
        bonds: state.bonds.map(b =>
          b.id === id ? { ...b, stereo } : b
        ),
        ...histUpdate,
      };
    });
  },

  // 13. 复制选择
  copySelection: () => {
    const { atoms, bonds, selectedAtomId } = get();
    if (!selectedAtomId) return;

    const selectedAtom = atoms.find(a => a.id === selectedAtomId);
    if (!selectedAtom) return;

    // 收集选中的原子及其直接连接的原子和键
    const connectedAtomIds = new Set<string>();
    connectedAtomIds.add(selectedAtomId);

    // 获取直接连接的原子
    const neighborIds = getNeighborIds(selectedAtomId, bonds);
    for (const nid of neighborIds) {
      connectedAtomIds.add(nid);
    }

    const copiedAtoms = atoms.filter(a => connectedAtomIds.has(a.id));
    const copiedBonds = bonds.filter(b =>
      connectedAtomIds.has(b.from) && connectedAtomIds.has(b.to)
    );

    set({
      clipboard: {
        atoms: JSON.parse(JSON.stringify(copiedAtoms)),
        bonds: JSON.parse(JSON.stringify(copiedBonds)),
      },
    });
  },

  // 14. 粘贴选择
  pasteSelection: (offsetX: number, offsetY: number) => {
    const { clipboard } = get();
    if (!clipboard) return;

    set(state => {
      const histUpdate = pushHistory(state);
      const newAtoms = [...state.atoms];
      const newBonds = [...state.bonds];
      const idMap = new Map<string, string>();

      // 创建新原子（带偏移）
      for (const atom of clipboard.atoms) {
        const newId = genId();
        idMap.set(atom.id, newId);
        newAtoms.push({
          id: newId,
          symbol: atom.symbol,
          x: atom.x + offsetX,
          y: atom.y + offsetY,
        });
      }

      // 创建新键
      for (const bond of clipboard.bonds) {
        const newFrom = idMap.get(bond.from);
        const newTo = idMap.get(bond.to);
        if (newFrom && newTo) {
          newBonds.push({
            id: genBondId(),
            from: newFrom,
            to: newTo,
            type: bond.type,
            stereo: bond.stereo,
          });
        }
      }

      return { atoms: newAtoms, bonds: newBonds, ...histUpdate };
    });
  },

  // 15. Lewis 结构
  getLewisStructure: () => {
    const { atoms, bonds } = get();
    if (atoms.length === 0) return [];

    const result: { atomId: string; lonePairs: number; bondingElectrons: number }[] = [];

    for (const atom of atoms) {
      const valence = VALENCE_ELECTRONS[atom.symbol] || 0;
      const usedBonds = getUsedBonds(atom.id, bonds);
      const bondingElectrons = usedBonds * 2;

      // 孤对电子数 = (价电子 - 键合电子) / 2
      const formalCharge = get().getFormalCharge(atom.id);
      const adjustedValence = valence - formalCharge;
      const lonePairElectrons = Math.max(0, adjustedValence - usedBonds);
      const lonePairs = Math.floor(lonePairElectrons / 2);

      result.push({
        atomId: atom.id,
        lonePairs,
        bondingElectrons,
      });
    }

    return result;
  },

  // 16. 切换主题
  toggleTheme: () => {
    set(state => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    }));
  },

  // 17. 设置语言
  setLanguage: (lang: 'zh' | 'en') => {
    set({ language: lang });
  },
}));
