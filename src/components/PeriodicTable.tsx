import { ELEMENTS, ELEMENT_MAP, CATEGORIES, CATEGORY_COLORS } from '@/data/elements';

interface PeriodicTableProps {
  onSelect: (symbol: string) => void;
  pendingElement: string | null;
}

// 周期表布局定义：[symbol, period, group]
const TABLE_LAYOUT: [string, number, number][] = [
  // Row 1
  ['H', 1, 1], ['He', 1, 18],
  // Row 2
  ['Li', 2, 1], ['Be', 2, 2], ['B', 2, 13], ['C', 2, 14], ['N', 2, 15], ['O', 2, 16], ['F', 2, 17], ['Ne', 2, 18],
  // Row 3
  ['Na', 3, 1], ['Mg', 3, 2], ['Al', 3, 13], ['Si', 3, 14], ['P', 3, 15], ['S', 3, 16], ['Cl', 3, 17], ['Ar', 3, 18],
  // Row 4
  ['K', 4, 1], ['Ca', 4, 2], ['Sc', 4, 3], ['Ti', 4, 4], ['V', 4, 5], ['Cr', 4, 6], ['Mn', 4, 7], ['Fe', 4, 8], ['Co', 4, 9], ['Ni', 4, 10], ['Cu', 4, 11], ['Zn', 4, 12], ['Ga', 4, 13], ['Ge', 4, 14], ['As', 4, 15], ['Se', 4, 16], ['Br', 4, 17], ['Kr', 4, 18],
  // Row 5
  ['Rb', 5, 1], ['Sr', 5, 2], ['Y', 5, 3], ['Zr', 5, 4], ['Nb', 5, 5], ['Mo', 5, 6], ['Tc', 5, 7], ['Ru', 5, 8], ['Rh', 5, 9], ['Pd', 5, 10], ['Ag', 5, 11], ['Cd', 5, 12], ['In', 5, 13], ['Sn', 5, 14], ['Sb', 5, 15], ['Te', 5, 16], ['I', 5, 17], ['Xe', 5, 18],
  // Row 6
  ['Cs', 6, 1], ['Ba', 6, 2], ['Hf', 6, 4], ['Ta', 6, 5], ['W', 6, 6], ['Re', 6, 7], ['Os', 6, 8], ['Ir', 6, 9], ['Pt', 6, 10], ['Au', 6, 11], ['Hg', 6, 12], ['Tl', 6, 13], ['Pb', 6, 14], ['Bi', 6, 15], ['Po', 6, 16], ['At', 6, 17], ['Rn', 6, 18],
  // Row 7
  ['Fr', 7, 1], ['Ra', 7, 2], ['Rf', 7, 4], ['Db', 7, 5], ['Sg', 7, 6], ['Bh', 7, 7], ['Hs', 7, 8], ['Mt', 7, 9], ['Ds', 7, 10], ['Rg', 7, 11], ['Cn', 7, 12], ['Nh', 7, 13], ['Fl', 7, 14], ['Mc', 7, 15], ['Lv', 7, 16], ['Ts', 7, 17], ['Og', 7, 18],
];

// 镧系元素
const LANTHANIDES = ['La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu'];
// 锕系元素
const ACTINIDES = ['Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr'];

export default function PeriodicTable({ onSelect, pendingElement }: PeriodicTableProps) {
  const renderCell = (symbol: string, period: number, group: number) => {
    const el = ELEMENT_MAP.get(symbol);
    if (!el) return null;

    const isActive = pendingElement === symbol;
    const catColor = CATEGORY_COLORS[el.category] || '#666';

    return (
      <div
        key={symbol}
        onClick={() => onSelect(symbol)}
        className="flex flex-col items-center justify-center rounded cursor-pointer border transition-all duration-150 hover:brightness-125"
        style={{
          gridColumn: group,
          gridRow: period,
          width: 36,
          height: 36,
          backgroundColor: `${catColor}22`,
          borderColor: isActive ? '#00ff88' : `${catColor}66`,
          boxShadow: isActive ? '0 0 8px rgba(0,255,136,0.5)' : 'none',
        }}
        title={`${el.name} (${el.symbol}) #${el.atomicNumber}`}
      >
        <span className="text-[7px] leading-none text-gray-400">{el.atomicNumber}</span>
        <span className="text-[11px] font-bold leading-tight text-white">{el.symbol}</span>
        <span className="text-[6px] leading-none text-gray-400 truncate max-w-full">{el.name}</span>
      </div>
    );
  };

  const renderSeriesRow = (symbols: string[], offsetGroup: number, row: number) => {
    return symbols.map((sym, i) => {
      const el = ELEMENT_MAP.get(sym);
      if (!el) return null;
      const isActive = pendingElement === sym;
      const catColor = CATEGORY_COLORS[el.category] || '#666';

      return (
        <div
          key={sym}
          onClick={() => onSelect(sym)}
          className="flex flex-col items-center justify-center rounded cursor-pointer border transition-all duration-150 hover:brightness-125"
          style={{
            gridColumn: offsetGroup + i,
            gridRow: row,
            width: 36,
            height: 36,
            backgroundColor: `${catColor}22`,
            borderColor: isActive ? '#00ff88' : `${catColor}66`,
            boxShadow: isActive ? '0 0 8px rgba(0,255,136,0.5)' : 'none',
          }}
          title={`${el.name} (${el.symbol}) #${el.atomicNumber}`}
        >
          <span className="text-[7px] leading-none text-gray-400">{el.atomicNumber}</span>
          <span className="text-[11px] font-bold leading-tight text-white">{el.symbol}</span>
          <span className="text-[6px] leading-none text-gray-400 truncate max-w-full">{el.name}</span>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* 主周期表 7行 × 18列 */}
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: 'repeat(18, 36px)',
          gridTemplateRows: 'repeat(7, 36px)',
        }}
      >
        {/* 镧系/锕系占位指示器 - Row 6 Col 3 */}
        <div
          className="flex items-center justify-center rounded border border-chem-muted/30 text-[7px] text-gray-500"
          style={{ gridColumn: 3, gridRow: 6, width: 36, height: 36 }}
        >
          57-71
        </div>
        {/* 锕系占位指示器 - Row 7 Col 3 */}
        <div
          className="flex items-center justify-center rounded border border-chem-muted/30 text-[7px] text-gray-500"
          style={{ gridColumn: 3, gridRow: 7, width: 36, height: 36 }}
        >
          89-103
        </div>

        {TABLE_LAYOUT.map(([sym, period, group]) => renderCell(sym, period, group))}
      </div>

      {/* 镧系行 */}
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[8px] text-gray-500 w-6 shrink-0">镧</span>
        <div
          className="grid gap-[2px]"
          style={{
            gridTemplateColumns: 'repeat(15, 36px)',
            gridTemplateRows: '36px',
          }}
        >
          {renderSeriesRow(LANTHANIDES, 1, 1)}
        </div>
      </div>

      {/* 锕系行 */}
      <div className="flex items-center gap-1">
        <span className="text-[8px] text-gray-500 w-6 shrink-0">锕</span>
        <div
          className="grid gap-[2px]"
          style={{
            gridTemplateColumns: 'repeat(15, 36px)',
            gridTemplateRows: '36px',
          }}
        >
          {renderSeriesRow(ACTINIDES, 1, 1)}
        </div>
      </div>

      {/* 分类图例 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
        {CATEGORIES.map(cat => (
          <div key={cat} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
            />
            <span className="text-[8px] text-gray-400">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
