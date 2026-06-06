import { useChemStore } from '@/store/useChemStore';

export default function InfoBar() {
  const atoms = useChemStore(s => s.atoms);
  const bonds = useChemStore(s => s.bonds);
  const getMolecularFormula = useChemStore(s => s.getMolecularFormula);
  const getStructuralFormula = useChemStore(s => s.getStructuralFormula);
  const getChineseName = useChemStore(s => s.getChineseName);

  const formula = getMolecularFormula();
  const structural = getStructuralFormula();
  const chineseName = getChineseName();

  // 格式化分子式（下标数字）
  const formatFormula = (f: string) => {
    if (!f) return null;
    const parts: (string | JSX.Element)[] = [];
    let i = 0;
    while (i < f.length) {
      if (f[i] >= '0' && f[i] <= '9') {
        let num = '';
        while (i < f.length && f[i] >= '0' && f[i] <= '9') {
          num += f[i];
          i++;
        }
        parts.push(<sub key={`sub-${i}`} className="text-[10px]">{num}</sub>);
      } else {
        parts.push(f[i]);
        i++;
      }
    }
    return parts;
  };

  // 统计信息
  const atomCount = atoms.length;
  const bondCount = bonds.length;
  const uniqueElements = new Set(atoms.map(a => a.symbol)).size;

  return (
    <div className="bg-chem-panel/90 backdrop-blur-xl border-t border-chem-accent/10 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        {/* 分子式 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">分子式</span>
          <span className="text-sm font-bold text-chem-accent font-['Orbitron']">
            {formula ? formatFormula(formula) : <span className="text-gray-600">--</span>}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 结构简式 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">结构简式</span>
          <span className="text-sm text-white/80 font-mono">
            {structural || <span className="text-gray-600">--</span>}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 中文名称 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">中文名称</span>
          <span className="text-sm text-white/90 font-['Noto_Sans_SC']">
            {chineseName || <span className="text-gray-600">--</span>}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 统计 */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span>原子: <span className="text-gray-300">{atomCount}</span></span>
          <span>化学键: <span className="text-gray-300">{bondCount}</span></span>
          <span>元素种类: <span className="text-gray-300">{uniqueElements}</span></span>
        </div>
      </div>
    </div>
  );
}
