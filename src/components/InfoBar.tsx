import { useState, useRef, useEffect } from 'react';
import { useChemStore } from '@/store/useChemStore';

export default function InfoBar() {
  const atoms = useChemStore(s => s.atoms);
  const bonds = useChemStore(s => s.bonds);
  const getMolecularFormula = useChemStore(s => s.getMolecularFormula);
  const getStructuralFormula = useChemStore(s => s.getStructuralFormula);
  const getChineseName = useChemStore(s => s.getChineseName);
  const getMolecularWeight = useChemStore(s => s.getMolecularWeight);
  const getIUPACName = useChemStore(s => s.getIUPACName);
  const getChiralCenters = useChemStore(s => s.getChiralCenters);
  const getIsomerHints = useChemStore(s => s.getIsomerHints);

  const formula = getMolecularFormula();
  const structural = getStructuralFormula();
  const chineseName = getChineseName();
  const molecularWeight = getMolecularWeight();
  const iupacName = getIUPACName();
  const chiralCenters = getChiralCenters();
  const isomerHints = getIsomerHints();

  // 同分异构体弹出框状态
  const [isomerOpen, setIsomerOpen] = useState(false);
  const isomerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭弹出框
  useEffect(() => {
    if (!isomerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (isomerRef.current && !isomerRef.current.contains(e.target as Node)) {
        setIsomerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isomerOpen]);

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

  const hasChiral = chiralCenters.length > 0;

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

        {/* 分子量 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">分子量</span>
          <span className="text-sm font-bold text-chem-accent font-['Orbitron']">
            {molecularWeight > 0 ? (
              <>{molecularWeight.toFixed(3)}<span className="text-[10px] text-gray-400 ml-1">g/mol</span></>
            ) : (
              <span className="text-gray-600">--</span>
            )}
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

        {/* IUPAC */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">IUPAC</span>
          <span className="text-sm text-white/80 font-['Noto_Sans_SC']">
            {iupacName || <span className="text-gray-600">--</span>}
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

        {/* 手性中心 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">手性中心</span>
          <span className={`text-sm font-bold ${hasChiral ? 'text-amber-400' : 'text-gray-600'}`}>
            {hasChiral ? chiralCenters.length : '无'}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 同分异构体 */}
        <div className="flex items-center gap-2 relative" ref={isomerRef}>
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">同分异构体</span>
          {isomerHints.length > 0 ? (
            <button
              onClick={() => setIsomerOpen(prev => !prev)}
              className="text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>{isomerHints.length}</span>
              <svg
                className={`w-3 h-3 transition-transform ${isomerOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <span className="text-sm text-gray-600">无</span>
          )}

          {/* 同分异构体弹出框 */}
          {isomerOpen && isomerHints.length > 0 && (
            <div className="absolute top-full left-0 mt-2 z-50 min-w-[160px] bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl shadow-black/40 py-2 px-3">
              <div className="text-[10px] text-gray-400 mb-1.5 font-['Orbitron'] tracking-wider">可能的同分异构体</div>
              <ul className="space-y-1">
                {isomerHints.map((hint, idx) => (
                  <li key={idx} className="text-sm text-white/90 font-['Noto_Sans_SC'] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/60 shrink-0" />
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
