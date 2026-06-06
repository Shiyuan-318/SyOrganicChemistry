import { useState } from 'react';
import { useChemStore } from '@/store/useChemStore';
import { t } from '@/data/i18n';
import { Flame, Zap, Link2, Droplets, Wind, ArrowRightLeft, Plus, Minus, RotateCcw, LayoutGrid, Maximize, FileInput } from 'lucide-react';

const OPERATIONS = [
  { type: '加热', labelKey: 'op.heat', icon: Flame, color: '#ff6400', descKey: 'op.heat' },
  { type: '催化', labelKey: 'op.catalyst', icon: Zap, color: '#64c8ff', descKey: 'op.catalyst' },
  { type: '加聚', labelKey: 'op.polymerize', icon: Link2, color: '#00ff88', descKey: 'op.polymerize' },
  { type: '燃烧', labelKey: 'op.burn', icon: Wind, color: '#ff3200', descKey: 'op.burn' },
  { type: '取代', labelKey: 'op.substitute', icon: ArrowRightLeft, color: '#ffff00', descKey: 'op.substitute' },
  { type: '加成', labelKey: 'op.addition', icon: Plus, color: '#00c8ff', descKey: 'op.addition' },
  { type: '消去', labelKey: 'op.eliminate', icon: Minus, color: '#c864ff', descKey: 'op.eliminate' },
  { type: '水解', labelKey: 'op.hydrolyze', icon: Droplets, color: '#0096ff', descKey: 'op.hydrolyze' },
];

export default function OperationBar() {
  const executeOperation = useChemStore(s => s.executeOperation);
  const clearCanvas = useChemStore(s => s.clearCanvas);
  const atoms = useChemStore(s => s.atoms);
  const language = useChemStore(s => s.language);

  // SMILES 导入对话框状态
  const [smilesInputOpen, setSmilesInputOpen] = useState(false);
  const [smilesInput, setSmilesInput] = useState('');

  const handleAutoLayout = () => {
    useChemStore.getState().autoLayout();
  };

  const handleFitView = () => {
    useChemStore.getState().fitToView(window.innerWidth, window.innerHeight);
  };

  const handleSmilesImport = () => {
    if (!smilesInput.trim()) return;
    useChemStore.getState().importSMILES(smilesInput.trim());
    setSmilesInput('');
    setSmilesInputOpen(false);
  };

  return (
    <>
      <div className="bg-chem-panel/90 backdrop-blur-xl border-t border-chem-accent/10 px-4 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-gray-500 font-['Orbitron'] tracking-wider flex-shrink-0 mr-1">操作</span>

          {OPERATIONS.map(op => {
            const Icon = op.icon;
            return (
              <button
                key={op.type}
                onClick={() => executeOperation(op.type)}
                disabled={atoms.length === 0}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  border transition-all duration-200 flex-shrink-0
                  ${atoms.length === 0
                    ? 'border-chem-muted text-gray-600 cursor-not-allowed opacity-40'
                    : 'border-transparent'
                  }
                `}
                style={{
                  borderColor: atoms.length === 0 ? undefined : `${op.color}30`,
                  color: atoms.length === 0 ? undefined : op.color,
                }}
                onMouseEnter={e => {
                  if (atoms.length > 0) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = `${op.color}10`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${op.color}60`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 15px ${op.color}20`;
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '';
                  (e.currentTarget as HTMLElement).style.borderColor = `${op.color}30`;
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
                title={t(op.descKey, language)}
              >
                <Icon size={12} />
                <span>{t(op.labelKey, language)}</span>
              </button>
            );
          })}

          <div className="w-px h-5 bg-chem-muted flex-shrink-0 mx-1" />

          {/* 自动布局 */}
          <button
            onClick={handleAutoLayout}
            disabled={atoms.length === 0}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-200 flex-shrink-0
              ${atoms.length === 0
                ? 'border-chem-muted text-gray-600 cursor-not-allowed opacity-40'
                : 'border-transparent'
              }
            `}
            style={{
              borderColor: atoms.length === 0 ? undefined : '#00ff8830',
              color: atoms.length === 0 ? undefined : '#00ff88',
            }}
            onMouseEnter={e => {
              if (atoms.length > 0) {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#00ff8810';
                (e.currentTarget as HTMLElement).style.borderColor = '#00ff8860';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px #00ff8820';
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '';
              (e.currentTarget as HTMLElement).style.borderColor = '#00ff8830';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
            title={t('feature.autoLayout', language)}
          >
            <LayoutGrid size={12} />
            <span>{t('feature.autoLayout', language)}</span>
          </button>

          {/* 适配视图 */}
          <button
            onClick={handleFitView}
            disabled={atoms.length === 0}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-200 flex-shrink-0
              ${atoms.length === 0
                ? 'border-chem-muted text-gray-600 cursor-not-allowed opacity-40'
                : 'border-transparent'
              }
            `}
            style={{
              borderColor: atoms.length === 0 ? undefined : '#64c8ff30',
              color: atoms.length === 0 ? undefined : '#64c8ff',
            }}
            onMouseEnter={e => {
              if (atoms.length > 0) {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#64c8ff10';
                (e.currentTarget as HTMLElement).style.borderColor = '#64c8ff60';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px #64c8ff20';
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '';
              (e.currentTarget as HTMLElement).style.borderColor = '#64c8ff30';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
            title={t('feature.fitView', language)}
          >
            <Maximize size={12} />
            <span>{t('feature.fitView', language)}</span>
          </button>

          {/* SMILES 导入 */}
          <button
            onClick={() => setSmilesInputOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex-shrink-0 border-transparent"
            style={{
              borderColor: '#ff79c630',
              color: '#ff79c6',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#ff79c610';
              (e.currentTarget as HTMLElement).style.borderColor = '#ff79c660';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px #ff79c620';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '';
              (e.currentTarget as HTMLElement).style.borderColor = '#ff79c630';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
            title={t('feature.smilesImport', language)}
          >
            <FileInput size={12} />
            <span>{t('feature.smilesImport', language)}</span>
          </button>

          <div className="w-px h-5 bg-chem-muted flex-shrink-0 mx-1" />

          <button
            onClick={clearCanvas}
            disabled={atoms.length === 0}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-200 flex-shrink-0
              ${atoms.length === 0
                ? 'border-chem-muted text-gray-600 cursor-not-allowed opacity-40'
                : 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60'
              }
            `}
            title={t('op.clear', language)}
          >
            <RotateCcw size={12} />
            <span>{t('op.clear', language)}</span>
          </button>
        </div>
      </div>

      {/* SMILES 导入对话框 */}
      {smilesInputOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSmilesInputOpen(false)}>
          <div className="bg-chem-panel border border-chem-accent/20 rounded-xl shadow-2xl shadow-black/60 p-5 min-w-[360px]" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-bold text-white/90 mb-3 font-['Orbitron'] tracking-wider">
              {t('feature.smilesImport', language)}
            </div>
            <input
              type="text"
              value={smilesInput}
              onChange={e => setSmilesInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSmilesImport();
                if (e.key === 'Escape') setSmilesInputOpen(false);
              }}
              placeholder="e.g. CCO, c1ccccc1, CC(=O)O"
              className="w-full bg-black/30 border border-chem-accent/20 rounded-lg px-3 py-2 text-sm text-white/90 font-mono placeholder-gray-500 focus:outline-none focus:border-chem-accent/50"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSmilesInputOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs text-gray-400 border border-chem-muted hover:bg-chem-muted/20 transition-colors"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleSmilesImport}
                disabled={!smilesInput.trim()}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  smilesInput.trim()
                    ? 'bg-chem-accent/20 text-chem-accent border border-chem-accent/30 hover:bg-chem-accent/30'
                    : 'bg-chem-muted/20 text-gray-600 border border-chem-muted cursor-not-allowed'
                }`}
              >
                {language === 'zh' ? '导入' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
