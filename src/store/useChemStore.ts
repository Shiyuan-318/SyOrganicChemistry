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
}

export interface OperationEffect {
  type: string;
  label: string;
  timestamp: number;
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
}

let idCounter = 0;
const genId = () => `node_${++idCounter}_${Date.now()}`;
let bondCounter = 0;
const genBondId = () => `bond_${++bondCounter}_${Date.now()}`;

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

  addAtom: (symbol, x, y) => {
    const element = ELEMENT_MAP.get(symbol);
    if (!element) return;
    const atom: AtomNode = { id: genId(), symbol, x, y };
    set(state => {
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

      return { atoms: newAtoms, bonds: newBonds };
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
      const newAtoms = [...state.atoms];
      const newBonds = [...state.bonds];

      // 放置原子
      for (const a of groupDef.atoms) {
        const element = ELEMENT_MAP.get(a.symbol);
        if (!element) continue;
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

      return { atoms: newAtoms, bonds: newBonds };
    });
  },

  removeAtom: (id) => {
    set(state => ({
      atoms: state.atoms.filter(a => a.id !== id),
      bonds: state.bonds.filter(b => b.from !== id && b.to !== id),
      selectedAtomId: state.selectedAtomId === id ? null : state.selectedAtomId,
    }));
  },

  moveAtom: (id, x, y) => {
    set(state => {
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
      return { atoms: newAtoms, bonds: newBonds };
    });
  },

  addBond: (fromId, toId, type = 1) => {
    set(state => {
      const existing = state.bonds.find(
        b => (b.from === fromId && b.to === toId) ||
             (b.from === toId && b.to === fromId)
      );
      if (existing) return state;
      return {
        bonds: [...state.bonds, { id: genBondId(), from: fromId, to: toId, type }],
      };
    });
  },

  removeBond: (id) => {
    set(state => ({
      bonds: state.bonds.filter(b => b.id !== id),
      selectedBondId: state.selectedBondId === id ? null : state.selectedBondId,
    }));
  },

  cycleBondType: (id) => {
    set(state => ({
      bonds: state.bonds.map(b =>
        b.id === id ? { ...b, type: ((b.type % 3) + 1) as 1 | 2 | 3 } : b
      ),
    }));
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
        set({ atoms: newAtoms, bonds: newBonds });
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

        set({ atoms: newAtoms, bonds: newBonds, selectedAtomId: null, selectedBondId: null });
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
        set({ atoms: newAtoms, bonds: newBonds });
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
          set({
            atoms: atoms.filter(a => !atomsToRemove.has(a.id)),
            bonds: bonds.filter(b => !bondsToRemove.has(b.id) && !atomsToRemove.has(b.from) && !atomsToRemove.has(b.to)),
          });
        }
        break;
      }

      case '取代': {
        // 取代反应：移除最后一个放置的原子
        if (selectedAtomId) {
          set({
            atoms: atoms.filter(a => a.id !== selectedAtomId),
            bonds: bonds.filter(b => b.from !== selectedAtomId && b.to !== selectedAtomId),
            selectedAtomId: null,
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
        set({ atoms: newAtoms, bonds: newBonds });
        break;
      }

      case '加热':
      case '催化':
      default:
        // 纯视觉效果
        break;
    }
  },

  clearCanvas: () => set({
    atoms: [],
    bonds: [],
    selectedAtomId: null,
    selectedBondId: null,
    draggingAtomId: null,
    canvasOffset: { x: 0, y: 0 },
    canvasScale: 1,
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

      let prefix = '';
      if (bondToParent) {
        if (bondToParent.type === 2) prefix = '=';
        else if (bondToParent.type === 3) prefix = '≡';
        else prefix = '-';
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

      // 如果没有非 H 邻居，显示原子符号+氢
      if (nonHNeighbors.length === 0) {
        const hCount = hNeighbors.length;
        // 碳原子省略自身（因为它总是与父原子相连），只显示氢
        if (atom.symbol === 'C') {
          if (hCount === 0) return prefix;
          if (hCount === 1) return `${prefix}CH`;
          if (hCount === 2) return `${prefix}CH₂`;
          if (hCount === 3) return `${prefix}CH₃`;
          return `${prefix}CH${hCount}`;
        }
        // 其他原子显示自身 + 氢
        if (hCount === 0) return `${prefix}${atom.symbol}`;
        if (hCount === 1) return `${prefix}${atom.symbol}H`;
        if (hCount === 2) return `${prefix}${atom.symbol}H₂`;
        return `${prefix}${atom.symbol}H${hCount}`;
      }

      // 只有一个非 H 邻居：线性链，不用括号
      if (nonHNeighbors.length === 1) {
        const childResult = dfs(nonHNeighbors[0], atomId);
        const hCount = hNeighbors.length;
        let hStr = '';
        if (atom.symbol === 'C') {
          if (hCount === 1) hStr = 'H';
          else if (hCount === 2) hStr = 'H₂';
          else if (hCount >= 3) hStr = `H${hCount}`;
        } else {
          if (hCount === 1) hStr = 'H';
          else if (hCount === 2) hStr = 'H₂';
          else if (hCount >= 3) hStr = `H${hCount}`;
        }

        // 碳原子在链中可省略
        if (atom.symbol === 'C') {
          return `${prefix}${hStr}${childResult}`;
        }
        return `${prefix}${atom.symbol}${hStr}${childResult}`;
      }

      // 多个非 H 邻居：分支结构，用括号
      const childResults = nonHNeighbors.map(id => dfs(id, atomId)).filter(Boolean);
      if (childResults.length === 0) {
        return `${prefix}${atom.symbol}`;
      }

      const hCount = hNeighbors.length;
      let hStr = '';
      if (hCount === 1) hStr = 'H';
      else if (hCount === 2) hStr = 'H₂';
      else if (hCount >= 3) hStr = `H${hCount}`;

      if (atom.symbol === 'C') {
        return `${prefix}C${hStr}(${childResults.join(')(')})`;
      }
      return `${prefix}${atom.symbol}${hStr}(${childResults.join(')(')})`;
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

    const hasDouble = bonds.some(b => b.type === 2);
    const hasTriple = bonds.some(b => b.type === 3);
    const hasOxygen = counts['O'] > 0;
    const hasNitrogen = counts['N'] > 0;
    const hasOH = atoms.some(a => a.symbol === 'O') && atoms.some(a => a.symbol === 'H');
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

    if (hasOxygen && hasOH) {
      if (bonds.some(b => b.type === 2)) {
        // 检查是否有羧基模式
        return `${prefix}酸`;
      }
      return `${prefix}醇`;
    }

    if (hasOxygen) {
      if (hasDouble) return `${prefix}醛`;
      return `${prefix}酮`;
    }

    if (hasNitrogen) return `${prefix}胺`;

    if (hasTriple) return `${prefix}炔`;
    if (hasDouble) return `${prefix}烯`;
    return `${prefix}烷`;
  },
}));
