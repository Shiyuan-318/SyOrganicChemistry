import { useState, useRef, useEffect } from 'react';
import { useChemStore } from '@/store/useChemStore';
import { t } from '@/data/i18n';

export default function InfoBar() {
  const atoms = useChemStore(s => s.atoms);
  const bonds = useChemStore(s => s.bonds);
  const language = useChemStore(s => s.language);
  const getMolecularFormula = useChemStore(s => s.getMolecularFormula);
  const getStructuralFormula = useChemStore(s => s.getStructuralFormula);
  const getChineseName = useChemStore(s => s.getChineseName);
  const getMolecularWeight = useChemStore(s => s.getMolecularWeight);
  const getIUPACName = useChemStore(s => s.getIUPACName);
  const getChiralCenters = useChemStore(s => s.getChiralCenters);
  const getIsomerHints = useChemStore(s => s.getIsomerHints);
  const getSMILES = useChemStore(s => s.getSMILES);
  const getFormalCharge = useChemStore(s => s.getFormalCharge);
  const getRings = useChemStore(s => s.getRings);
  const getIRPeaks = useChemStore(s => s.getIRPeaks);
  const getNMRSifts = useChemStore(s => s.getNMRSifts);
  const getPKa = useChemStore(s => s.getPKa);
  const getResonanceStructures = useChemStore(s => s.getResonanceStructures);

  const formula = getMolecularFormula();
  const structural = getStructuralFormula();
  const chineseName = getChineseName();
  const molecularWeight = getMolecularWeight();
  const iupacName = getIUPACName();
  const chiralCenters = getChiralCenters();
  const isomerHints = getIsomerHints();
  const smiles = getSMILES();
  const rings = getRings();
  const irPeaks = getIRPeaks();
  const nmrShifts = getNMRSifts();
  const pkaValues = getPKa();
  const resonanceStructures = getResonanceStructures();

  // 计算总电荷
  const totalCharge = atoms.reduce((sum, atom) => sum + getFormalCharge(atom.id), 0);

  // 同分异构体弹出框状态
  const [isomerOpen, setIsomerOpen] = useState(false);
  const isomerRef = useRef<HTMLDivElement>(null);

  // IR 弹出框状态
  const [irOpen, setIrOpen] = useState(false);
  const irRef = useRef<HTMLDivElement>(null);

  // NMR 弹出框状态
  const [nmrOpen, setNmrOpen] = useState(false);
  const nmrRef = useRef<HTMLDivElement>(null);

  // pKa 弹出框状态
  const [pkaOpen, setPkaOpen] = useState(false);
  const pkaRef = useRef<HTMLDivElement>(null);

  // 共振结构索引
  const [resonanceIndex, setResonanceIndex] = useState(0);

  // 点击外部关闭弹出框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isomerOpen && isomerRef.current && !isomerRef.current.contains(e.target as Node)) {
        setIsomerOpen(false);
      }
      if (irOpen && irRef.current && !irRef.current.contains(e.target as Node)) {
        setIrOpen(false);
      }
      if (nmrOpen && nmrRef.current && !nmrRef.current.contains(e.target as Node)) {
        setNmrOpen(false);
      }
      if (pkaOpen && pkaRef.current && !pkaRef.current.contains(e.target as Node)) {
        setPkaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isomerOpen, irOpen, nmrOpen, pkaOpen]);

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

  // 共振结构切换
  const handleResonanceClick = () => {
    if (resonanceStructures.length <= 1) return;
    const nextIndex = (resonanceIndex + 1) % resonanceStructures.length;
    setResonanceIndex(nextIndex);
    const structure = resonanceStructures[nextIndex];
    if (structure) {
      useChemStore.getState().setCanvasOffset(useChemStore.getState().canvasOffset);
      // 替换当前键为共振结构的键
      useChemStore.setState({
        bonds: JSON.parse(JSON.stringify(structure.bonds)),
      });
    }
  };

  return (
    <div className="bg-chem-panel/90 backdrop-blur-xl border-t border-chem-accent/10 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        {/* 分子式 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.molecularFormula', language)}</span>
          <span className="text-sm font-bold text-chem-accent font-['Orbitron']">
            {formula ? formatFormula(formula) : <span className="text-gray-600">--</span>}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 分子量 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.molecularWeight', language)}</span>
          <span className="text-sm font-bold text-chem-accent font-['Orbitron']">
            {molecularWeight > 0 ? (
              <>{molecularWeight.toFixed(3)}<span className="text-[10px] text-gray-400 ml-1">{t('info.unit.gmol', language)}</span></>
            ) : (
              <span className="text-gray-600">--</span>
            )}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 结构简式 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.structuralFormula', language)}</span>
          <span className="text-sm text-white/80 font-mono">
            {structural || <span className="text-gray-600">--</span>}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* IUPAC */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.iupac', language)}</span>
          <span className="text-sm text-white/80 font-['Noto_Sans_SC']">
            {iupacName || <span className="text-gray-600">--</span>}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 中文名称 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.chineseName', language)}</span>
          <span className="text-sm text-white/90 font-['Noto_Sans_SC']">
            {chineseName || <span className="text-gray-600">--</span>}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* SMILES */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.smiles', language)}</span>
          <span className="text-sm text-white/80 font-mono">
            {smiles || <span className="text-gray-600">--</span>}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 总电荷 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.totalCharge', language)}</span>
          <span className={`text-sm font-bold ${totalCharge !== 0 ? 'text-amber-400' : 'text-gray-300'}`}>
            {atoms.length > 0 ? totalCharge : '--'}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 环数 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.rings', language)}</span>
          <span className={`text-sm font-bold ${rings.length > 0 ? 'text-cyan-400' : 'text-gray-600'}`}>
            {atoms.length > 0 ? rings.length : '--'}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 手性中心 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.chiralCenters', language)}</span>
          <span className={`text-sm font-bold ${hasChiral ? 'text-amber-400' : 'text-gray-600'}`}>
            {hasChiral ? chiralCenters.length : t('info.none', language)}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 同分异构体 */}
        <div className="flex items-center gap-2 relative" ref={isomerRef}>
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider">{t('info.isomers', language)}</span>
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
            <span className="text-sm text-gray-600">{t('info.none', language)}</span>
          )}

          {/* 同分异构体弹出框 */}
          {isomerOpen && isomerHints.length > 0 && (
            <div className="absolute top-full left-0 mt-2 z-50 min-w-[160px] bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl shadow-black/40 py-2 px-3">
              <div className="text-[10px] text-gray-400 mb-1.5 font-['Orbitron'] tracking-wider">{t('info.possibleIsomers', language)}</div>
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

        {/* IR 光谱按钮 */}
        <div className="flex items-center gap-2 relative" ref={irRef}>
          <button
            onClick={() => setIrOpen(prev => !prev)}
            disabled={irPeaks.length === 0}
            className={`text-[10px] px-2 py-0.5 rounded font-['Orbitron'] tracking-wider border transition-all duration-200 ${
              irPeaks.length > 0
                ? 'text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10 hover:border-emerald-400/60 cursor-pointer'
                : 'text-gray-600 border-gray-600/30 cursor-not-allowed opacity-40'
            }`}
          >
            {t('info.irPeaks', language)}
          </button>

          {/* IR 弹出框 */}
          {irOpen && irPeaks.length > 0 && (
            <div className="absolute top-full left-0 mt-2 z-50 min-w-[280px] bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl shadow-black/40 py-2 px-3">
              <div className="text-[10px] text-gray-400 mb-1.5 font-['Orbitron'] tracking-wider">{t('feature.irSpectrum', language)}</div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-gray-400 border-b border-chem-muted">
                    <th className="text-left py-1 pr-2">{t('spectrum.wavenumber', language)}</th>
                    <th className="text-left py-1 pr-2">{t('spectrum.intensity', language)}</th>
                    <th className="text-left py-1">{t('spectrum.assignment', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {irPeaks.map((peak, idx) => (
                    <tr key={idx} className="text-white/80 border-b border-chem-muted/30 last:border-0">
                      <td className="py-1 pr-2 font-mono text-emerald-400">{peak.wavenumber}</td>
                      <td className="py-1 pr-2">{peak.intensity}</td>
                      <td className="py-1">{peak.assignment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* NMR 化学位移按钮 */}
        <div className="flex items-center gap-2 relative" ref={nmrRef}>
          <button
            onClick={() => setNmrOpen(prev => !prev)}
            disabled={nmrShifts.length === 0}
            className={`text-[10px] px-2 py-0.5 rounded font-['Orbitron'] tracking-wider border transition-all duration-200 ${
              nmrShifts.length > 0
                ? 'text-blue-400 border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400/60 cursor-pointer'
                : 'text-gray-600 border-gray-600/30 cursor-not-allowed opacity-40'
            }`}
          >
            {t('info.nmrShifts', language)}
          </button>

          {/* NMR 弹出框 */}
          {nmrOpen && nmrShifts.length > 0 && (
            <div className="absolute top-full left-0 mt-2 z-50 min-w-[220px] max-h-[200px] overflow-y-auto bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl shadow-black/40 py-2 px-3">
              <div className="text-[10px] text-gray-400 mb-1.5 font-['Orbitron'] tracking-wider">{t('feature.nmrSpectrum', language)}</div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-gray-400 border-b border-chem-muted">
                    <th className="text-left py-1 pr-2">{t('spectrum.atom', language)}</th>
                    <th className="text-left py-1 pr-2">{t('spectrum.ppm', language)}</th>
                    <th className="text-left py-1">{t('spectrum.type', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {nmrShifts.map((shift, idx) => {
                    const atom = atoms.find(a => a.id === shift.atomId);
                    return (
                      <tr key={idx} className="text-white/80 border-b border-chem-muted/30 last:border-0">
                        <td className="py-1 pr-2 font-mono text-blue-400">{atom?.symbol || shift.atomId}</td>
                        <td className="py-1 pr-2 font-mono">{shift.ppm}</td>
                        <td className="py-1">{shift.type}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* pKa 按钮 */}
        <div className="flex items-center gap-2 relative" ref={pkaRef}>
          <button
            onClick={() => setPkaOpen(prev => !prev)}
            disabled={pkaValues.length === 0}
            className={`text-[10px] px-2 py-0.5 rounded font-['Orbitron'] tracking-wider border transition-all duration-200 ${
              pkaValues.length > 0
                ? 'text-purple-400 border-purple-400/30 hover:bg-purple-400/10 hover:border-purple-400/60 cursor-pointer'
                : 'text-gray-600 border-gray-600/30 cursor-not-allowed opacity-40'
            }`}
          >
            {t('info.pka', language)}
          </button>

          {/* pKa 弹出框 */}
          {pkaOpen && pkaValues.length > 0 && (
            <div className="absolute top-full left-0 mt-2 z-50 min-w-[200px] bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl shadow-black/40 py-2 px-3">
              <div className="text-[10px] text-gray-400 mb-1.5 font-['Orbitron'] tracking-wider">{t('feature.pka', language)}</div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-gray-400 border-b border-chem-muted">
                    <th className="text-left py-1 pr-2">{t('spectrum.atom', language)}</th>
                    <th className="text-left py-1 pr-2">{t('spectrum.pkaValue', language)}</th>
                    <th className="text-left py-1">{t('spectrum.type', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {pkaValues.map((item, idx) => {
                    const atom = atoms.find(a => a.id === item.atomId);
                    return (
                      <tr key={idx} className="text-white/80 border-b border-chem-muted/30 last:border-0">
                        <td className="py-1 pr-2 font-mono text-purple-400">{atom?.symbol || item.atomId}</td>
                        <td className="py-1 pr-2 font-mono">{item.pKa}</td>
                        <td className="py-1">{item.type}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 共振结构按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResonanceClick}
            disabled={resonanceStructures.length <= 1}
            className={`text-[10px] px-2 py-0.5 rounded font-['Orbitron'] tracking-wider border transition-all duration-200 ${
              resonanceStructures.length > 1
                ? 'text-orange-400 border-orange-400/30 hover:bg-orange-400/10 hover:border-orange-400/60 cursor-pointer'
                : 'text-gray-600 border-gray-600/30 cursor-not-allowed opacity-40'
            }`}
          >
            {t('info.resonance', language)}
            {resonanceStructures.length > 1 && (
              <span className="ml-1 text-white/60">
                {resonanceIndex + 1}/{resonanceStructures.length}
              </span>
            )}
          </button>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-chem-muted" />

        {/* 统计 */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span>{t('info.atoms', language)}: <span className="text-gray-300">{atomCount}</span></span>
          <span>{t('info.bonds', language)}: <span className="text-gray-300">{bondCount}</span></span>
          <span>{t('info.elementTypes', language)}: <span className="text-gray-300">{uniqueElements}</span></span>
        </div>
      </div>
    </div>
  );
}
