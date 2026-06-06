import { useState } from 'react';
import MoleculeCanvas from '@/components/MoleculeCanvas';
import ElementPanel from '@/components/ElementPanel';
import InfoBar from '@/components/InfoBar';
import OperationBar from '@/components/OperationBar';
import { FlaskConical, Menu } from 'lucide-react';

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(false);

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
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-[#00ff88] transition-colors md:hidden"
        >
          <Menu size={18} />
        </button>
        {/* 桌面端切换按钮 */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-[#00ff88] hover:bg-white/5 transition-colors border border-[#2a2a3e] hover:border-[#00ff88]/30"
        >
          <Menu size={12} />
          <span>元素面板</span>
        </button>
      </header>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 画布区域 */}
        <div className="flex-1 relative">
          <MoleculeCanvas />
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
