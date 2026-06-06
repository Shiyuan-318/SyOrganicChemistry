import { useChemStore } from '@/store/useChemStore';
import { Flame, Zap, Link2, Droplets, Wind, ArrowRightLeft, Plus, Minus, RotateCcw } from 'lucide-react';

const OPERATIONS = [
  { type: '加热', label: '加热', icon: Flame, color: '#ff6400', desc: '对分子加热' },
  { type: '催化', label: '催化', icon: Zap, color: '#64c8ff', desc: '催化剂作用' },
  { type: '加聚', label: '加聚', icon: Link2, color: '#00ff88', desc: '加聚反应' },
  { type: '燃烧', label: '燃烧', icon: Wind, color: '#ff3200', desc: '燃烧反应' },
  { type: '取代', label: '取代', icon: ArrowRightLeft, color: '#ffff00', desc: '取代反应' },
  { type: '加成', label: '加成', icon: Plus, color: '#00c8ff', desc: '加成反应' },
  { type: '消去', label: '消去', icon: Minus, color: '#c864ff', desc: '消去反应' },
  { type: '水解', label: '水解', icon: Droplets, color: '#0096ff', desc: '水解反应' },
];

export default function OperationBar() {
  const executeOperation = useChemStore(s => s.executeOperation);
  const clearCanvas = useChemStore(s => s.clearCanvas);
  const atoms = useChemStore(s => s.atoms);

  return (
    <div className="bg-[#0d0d1a]/90 backdrop-blur-xl border-t border-[#00ff88]/10 px-4 py-2.5">
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
                  ? 'border-[#2a2a3e] text-gray-600 cursor-not-allowed opacity-40'
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
              title={op.desc}
            >
              <Icon size={12} />
              <span>{op.label}</span>
            </button>
          );
        })}

        <div className="w-px h-5 bg-[#2a2a3e] flex-shrink-0 mx-1" />

        <button
          onClick={clearCanvas}
          disabled={atoms.length === 0}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            border transition-all duration-200 flex-shrink-0
            ${atoms.length === 0
              ? 'border-[#2a2a3e] text-gray-600 cursor-not-allowed opacity-40'
              : 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60'
            }
          `}
          title="清空画布"
        >
          <RotateCcw size={12} />
          <span>清空</span>
        </button>
      </div>
    </div>
  );
}