import { useState } from 'react';
import { ELEMENTS, CATEGORIES, CATEGORY_COLORS } from '@/data/elements';
import { FUNCTIONAL_GROUPS } from '@/data/functionalGroups';
import { ELEMENT_MAP } from '@/data/elements';
import { useChemStore } from '@/store/useChemStore';
import { ChevronDown, ChevronRight, Search, X, FlaskConical } from 'lucide-react';

interface ElementPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ElementPanel({ isOpen, onToggle }: ElementPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['非金属', '卤素'])
  );
  const [showFunctionalGroups, setShowFunctionalGroups] = useState(true);

  const pendingElement = useChemStore(s => s.pendingElement);
  const setPendingElement = useChemStore(s => s.setPendingElement);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, symbol: string) => {
    e.dataTransfer.setData('text/plain', symbol);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleElementClick = (symbol: string) => {
    if (pendingElement === symbol) {
      setPendingElement(null);
    } else {
      setPendingElement(symbol);
    }
  };

  const handleFunctionalGroupClick = (shorthand: string) => {
    if (pendingElement === shorthand) {
      setPendingElement(null);
    } else {
      setPendingElement(shorthand);
    }
  };

  const filteredElements = searchTerm
    ? ELEMENTS.filter(el =>
        el.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        el.name.includes(searchTerm) ||
        el.atomicNumber.toString() === searchTerm
      )
    : ELEMENTS;

  const filteredGroups = searchTerm
    ? FUNCTIONAL_GROUPS.filter(g =>
        g.name.includes(searchTerm) ||
        g.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.shorthand.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : FUNCTIONAL_GROUPS;

  const groupedElements: Record<string, typeof ELEMENTS> = {};
  for (const el of filteredElements) {
    if (!groupedElements[el.category]) groupedElements[el.category] = [];
    groupedElements[el.category].push(el);
  }

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      <div
        className={`
          fixed md:relative z-40
          top-0 right-0 h-full
          w-72 md:w-80
          bg-chem-panel/95 backdrop-blur-xl
          border-l border-chem-accent/10
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
          shadow-[-4px_0_30px_rgba(0,255,136,0.05)]
        `}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-3 border-b border-chem-accent/10">
          <h2 className="text-sm font-['Orbitron'] text-chem-accent tracking-wider">元素面板</h2>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 使用提示 */}
        <div className="px-3 pt-2">
          <p className="text-[10px] text-gray-500">
            点击元素后在画布上点击放置，或直接拖拽到画布
          </p>
        </div>

        {/* 搜索栏 */}
        <div className="p-3 pb-1">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索元素 / 官能团..."
              className="w-full pl-8 pr-3 py-1.5 bg-chem-border border border-chem-muted rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-chem-accent/50 transition-colors"
            />
          </div>
        </div>

        {/* 元素列表 */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          {/* 周期表元素 */}
          {CATEGORIES.map(cat => {
            const catElements = groupedElements[cat];
            if (!catElements || catElements.length === 0) return null;
            const isExpanded = expandedCategories.has(cat);

            return (
              <div key={cat} className="mb-2">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center gap-1.5 w-full py-1.5 text-xs font-medium hover:text-chem-accent transition-colors"
                  style={{ color: CATEGORY_COLORS[cat] }}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>{cat}</span>
                  <span className="text-gray-600 ml-auto">{catElements.length}</span>
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-6 gap-1 mt-1 mb-2">
                    {catElements.map(el => {
                      const isActive = pendingElement === el.symbol;
                      return (
                        <div
                          key={el.symbol}
                          draggable
                          onDragStart={e => handleDragStart(e, el.symbol)}
                          onClick={() => handleElementClick(el.symbol)}
                          className={`flex flex-col items-center justify-center p-1 rounded-lg cursor-pointer
                            bg-chem-border border transition-all duration-200 group
                            ${isActive
                              ? 'border-chem-accent shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                              : 'border-chem-muted hover:border-chem-accent/50 hover:shadow-[0_0_10px_rgba(0,255,136,0.15)]'
                            }
                          `}
                          title={`${el.name} (${el.symbol}) - 原子序数 ${el.atomicNumber} - 点击或拖拽`}
                        >
                          <div
                            className="w-5 h-5 rounded-full mb-0.5 flex items-center justify-center text-[8px] font-bold"
                            style={{
                              backgroundColor: el.color,
                              color: getContrastColor(el.color),
                              boxShadow: `0 0 6px ${el.color}40`,
                            }}
                          >
                            {el.symbol.length > 2 ? el.symbol.slice(0, 2) : el.symbol}
                          </div>
                          <span className={`text-[8px] truncate w-full text-center transition-colors ${isActive ? 'text-chem-accent' : 'text-gray-500 group-hover:text-gray-300'}`}>
                            {el.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 官能团 */}
          <div className="mb-2">
            <button
              onClick={() => setShowFunctionalGroups(!showFunctionalGroups)}
              className="flex items-center gap-1.5 w-full py-1.5 text-xs font-medium text-[#ff79c6] hover:text-[#ff79c6]/80 transition-colors"
            >
              {showFunctionalGroups ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <FlaskConical size={12} />
              <span>官能团</span>
              <span className="text-gray-600 ml-auto">{filteredGroups.length}</span>
            </button>

            {showFunctionalGroups && (
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {filteredGroups.map(group => {
                  const isActive = pendingElement === group.shorthand;
                  return (
                    <div
                      key={group.shorthand}
                      draggable
                      onDragStart={e => handleDragStart(e, group.shorthand)}
                      onClick={() => handleFunctionalGroupClick(group.shorthand)}
                      className={`p-2 rounded-lg cursor-pointer
                        bg-chem-border border transition-all duration-200 group
                        ${isActive
                          ? 'border-[#ff79c6] shadow-[0_0_10px_rgba(255,121,198,0.3)]'
                          : 'border-chem-muted hover:border-[#ff79c6]/50 hover:shadow-[0_0_10px_rgba(255,121,198,0.15)]'
                        }
                      `}
                      title={`${group.name} - ${group.description} - 点击或拖拽`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: group.color,
                            boxShadow: `0 0 4px ${group.color}40`,
                          }}
                        />
                        <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-[#ff79c6]' : 'text-white group-hover:text-[#ff79c6]'}`}>
                          {group.formula}
                        </span>
                      </div>
                      <span className={`text-[9px] transition-colors ${isActive ? 'text-[#ff79c6]/70' : 'text-gray-500 group-hover:text-gray-300'}`}>
                        {group.name} · {group.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 图例 */}
        <div className="p-3 border-t border-chem-accent/10">
          <h3 className="text-[10px] font-['Orbitron'] text-gray-400 mb-2 tracking-wider">元素图例</h3>
          <div className="grid grid-cols-4 gap-1">
            {['H', 'C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I', 'Fe', 'Na'].map(sym => {
              const el = ELEMENT_MAP.get(sym);
              if (!el) return null;
              return (
                <div key={sym} className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: el.color, boxShadow: `0 0 4px ${el.color}40` }}
                  />
                  <span className="text-[9px] text-gray-400">{sym}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-gray-400" />
              <span className="text-[9px] text-gray-500">单键</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex flex-col gap-0.5">
                <div className="w-4 h-0.5 bg-gray-400" />
                <div className="w-4 h-0.5 bg-gray-400" />
              </div>
              <span className="text-[9px] text-gray-500">双键</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex flex-col gap-0.5">
                <div className="w-4 h-0.5 bg-gray-400" />
                <div className="w-4 h-0.5 bg-gray-400" />
                <div className="w-4 h-0.5 bg-gray-400" />
              </div>
              <span className="text-[9px] text-gray-500">三键</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
