import { useState } from 'react';
import MoleculeCanvas from '@/components/MoleculeCanvas';
import MoleculeViewer3D from '@/components/MoleculeViewer3D';
import ElementPanel from '@/components/ElementPanel';
import InfoBar from '@/components/InfoBar';
import OperationBar from '@/components/OperationBar';
import { FlaskConical, Menu, Box, Pen } from 'lucide-react';

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'split'>('split');

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a]/80 backdrop-blur-xl border-b border-[#00ff88]/10 z-50">
        <div className="flex items-center gap-2">
          <FlaskConical size={20} className="text-[#00ff88]" />
          <h1 className="text-sm font-['Orbitron'] tracking-[0.2em] text-white">
            Sy <span className="text-[#00ff88]">Organic Chemistry</span>
          </h1>
        </div>

        {/* 视图模式切换 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('2d')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === '2d'
                ? 'bg-[#00ff88]/20 text-[#00ff88]'
                : 'text-gray-500 hover:text-white'
            }`}
            title="2D编辑"
          >
            <Pen size={14} />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'split'
                ? 'bg-[#00ff88]/20 text-[#00ff88]'
                : 'text-gray-500 hover:text-white'
            }`}
            title="分屏模式"
          >
            <Box size={14} />
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === '3d'
                ? 'bg-[#00ff88]/20 text-[#00ff88]'
                : 'text-gray-500 hover:text-white'
            }`}
            title="3D预览"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z" />
              <path d="M12 12l9-4.5" />
              <path d="M12 12v9" />
              <path d="M12 12L3 7.5" />
            </svg>
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-[#00ff88] transition-colors md:hidden"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-[#00ff88] hover:bg-white/5 transition-colors border border-[#2a2a3e] hover:border-[#00ff88]/30"
          >
            <Menu size={12} />
            <span>元素面板</span>
          </button>
        </div>
      </header>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 画布区域 */}
        <div className={`relative ${viewMode === '3d' ? 'hidden' : viewMode === 'split' ? 'w-1/2' : 'flex-1'}`}>
          <MoleculeCanvas />
        </div>

        {/* 3D预览区域 */}
        <div className={`relative border-l border-[#00ff88]/10 ${viewMode === '2d' ? 'hidden' : viewMode === 'split' ? 'w-1/2' : 'flex-1'}`}>
          <MoleculeViewer3D />
        </div>

        {/* 元素面板 */}
        <ElementPanel isOpen={panelOpen} onToggle={() => setPanelOpen(false)} />
      </div>

      {/* 底部信息栏和操作栏 */}
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 min-w-0">
          <InfoBar />
        </div>
        <div className="sm:w-auto flex-shrink-0">
          <OperationBar />
        </div>
      </div>
    </div>
  );
}
