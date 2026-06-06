import { useState, useRef, useEffect, useCallback } from 'react';
import MoleculeCanvas from '@/components/MoleculeCanvas';
import MoleculeViewer3D from '@/components/MoleculeViewer3D';
import ElementPanel from '@/components/ElementPanel';
import InfoBar from '@/components/InfoBar';
import OperationBar from '@/components/OperationBar';
import { useChemStore } from '@/store/useChemStore';
import { MOLECULE_PRESETS } from '@/data/presets';
import {
  FlaskConical, Menu, Box, Pen, BookOpen, Plus, X,
  Save, FolderOpen, Trash2, Undo2, Redo2, HelpCircle,
} from 'lucide-react';

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'split'>('split');

  // Preset dropdown
  const [presetOpen, setPresetOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);

  // Save/Load dropdown
  const [loadOpen, setLoadOpen] = useState(false);
  const [savedList, setSavedList] = useState<ReturnType<typeof useChemStore.getState>['molecules']>([]);
  const loadRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Keyboard shortcuts popover
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const shortcutsRef = useRef<HTMLDivElement>(null);

  // Tab rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Store
  const molecules = useChemStore(s => s.molecules);
  const activeMoleculeId = useChemStore(s => s.activeMoleculeId);
  const addMolecule = useChemStore(s => s.addMolecule);
  const switchMolecule = useChemStore(s => s.switchMolecule);
  const removeMolecule = useChemStore(s => s.removeMolecule);
  const renameMolecule = useChemStore(s => s.renameMolecule);
  const saveMolecule = useChemStore(s => s.saveMolecule);
  const loadMolecule = useChemStore(s => s.loadMolecule);
  const getSavedMolecules = useChemStore(s => s.getSavedMolecules);
  const deleteSavedMolecule = useChemStore(s => s.deleteSavedMolecule);
  const undo = useChemStore(s => s.undo);
  const redo = useChemStore(s => s.redo);
  const history = useChemStore(s => s.history);
  const historyIndex = useChemStore(s => s.historyIndex);
  const addAtom = useChemStore(s => s.addAtom);
  const addBond = useChemStore(s => s.addBond);
  const clearCanvas = useChemStore(s => s.clearCanvas);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const showTabs = molecules.length > 1;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setPresetOpen(false);
      }
      if (loadRef.current && !loadRef.current.contains(e.target as Node)) {
        setLoadOpen(false);
      }
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target as Node)) {
        setShortcutsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const handleLoadPreset = useCallback((preset: typeof MOLECULE_PRESETS[number]) => {
    clearCanvas();
    // Center offset: compute bounding box and center on canvas
    const xs = preset.atoms.map(a => a.dx);
    const ys = preset.atoms.map(a => a.dy);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    for (const a of preset.atoms) {
      addAtom(a.symbol, a.dx - cx, a.dy - cy);
      // We need the generated IDs; since addAtom generates them internally,
      // we'll rely on the order they appear in the store after all adds.
    }
    // Bonds reference by index, so we need to get the newly added atom IDs
    // After adding atoms, the last N atoms in the store are our preset atoms
    const currentAtoms = useChemStore.getState().atoms;
    const startIdx = currentAtoms.length - preset.atoms.length;
    for (const b of preset.bonds) {
      const fromAtom = currentAtoms[startIdx + b.from];
      const toAtom = currentAtoms[startIdx + b.to];
      if (fromAtom && toAtom) {
        addBond(fromAtom.id, toAtom.id, b.type);
      }
    }
    setPresetOpen(false);
    showToast(`已加载: ${preset.chineseName}`);
  }, [clearCanvas, addAtom, addBond, showToast]);

  const handleSave = useCallback(() => {
    saveMolecule();
    showToast('已保存');
  }, [saveMolecule, showToast]);

  const handleOpenLoad = useCallback(() => {
    setSavedList(getSavedMolecules());
    setLoadOpen(prev => !prev);
  }, [getSavedMolecules]);

  const handleLoadSaved = useCallback((id: string) => {
    loadMolecule(id);
    setLoadOpen(false);
    showToast('已加载');
  }, [loadMolecule, showToast]);

  const handleDeleteSaved = useCallback((id: string) => {
    deleteSavedMolecule(id);
    setSavedList(getSavedMolecules());
  }, [deleteSavedMolecule, getSavedMolecules]);

  const handleRenameSubmit = useCallback((id: string) => {
    if (renameValue.trim()) {
      renameMolecule(id, renameValue.trim());
    }
    setRenamingId(null);
  }, [renameMolecule, renameValue]);

  const handleTabContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const mol = molecules.find(m => m.id === id);
    if (mol) {
      setRenamingId(id);
      setRenameValue(mol.name);
    }
  }, [molecules]);

  return (
    <div className="h-screen w-screen flex flex-col bg-chem-bg overflow-hidden">
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-between px-4 py-2 bg-chem-panel/80 backdrop-blur-xl border-b border-chem-accent/10 z-50">
        <div className="flex items-center gap-2">
          <FlaskConical size={20} className="text-chem-accent" />
          <h1 className="text-sm font-['Orbitron'] tracking-[0.2em] text-white">
            Sy <span className="text-chem-accent">Organic Chemistry</span>
          </h1>
        </div>

        <div className="flex items-center gap-1">
          {/* 视图模式切换 */}
          <button
            onClick={() => setViewMode('2d')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === '2d' ? 'bg-chem-accent/20 text-chem-accent' : 'text-gray-500 hover:text-white'
            }`}
            title="2D编辑"
          >
            <Pen size={14} />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'split' ? 'bg-chem-accent/20 text-chem-accent' : 'text-gray-500 hover:text-white'
            }`}
            title="分屏模式"
          >
            <Box size={14} />
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === '3d' ? 'bg-chem-accent/20 text-chem-accent' : 'text-gray-500 hover:text-white'
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

          {/* 撤销/重做 */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-all ${
              canUndo ? 'text-gray-400 hover:text-chem-accent hover:bg-white/5' : 'text-gray-700 cursor-not-allowed'
            }`}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-all ${
              canRedo ? 'text-gray-400 hover:text-chem-accent hover:bg-white/5' : 'text-gray-700 cursor-not-allowed'
            }`}
            title="重做 (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* 保存/加载 */}
          <button
            onClick={handleSave}
            className="p-1.5 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-all"
            title="保存 (Ctrl+S)"
          >
            <Save size={14} />
          </button>
          <div ref={loadRef} className="relative">
            <button
              onClick={handleOpenLoad}
              className="p-1.5 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-all"
              title="加载分子"
            >
              <FolderOpen size={14} />
            </button>
            {loadOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
                {savedList.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center">暂无保存的分子</div>
                ) : (
                  savedList.map(mol => (
                    <div key={mol.id} className="flex items-center gap-1 px-2 py-1.5 hover:bg-white/5 group">
                      <button
                        onClick={() => handleLoadSaved(mol.id)}
                        className="flex-1 text-left text-xs text-gray-300 hover:text-chem-accent truncate"
                      >
                        {mol.name}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSaved(mol.id); }}
                        className="p-0.5 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* 预设分子 */}
          <div ref={presetRef} className="relative">
            <button
              onClick={() => setPresetOpen(!presetOpen)}
              className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-colors border border-chem-muted hover:border-chem-accent/30"
              title="预设分子"
            >
              <BookOpen size={12} />
              <span>预设</span>
            </button>
            <button
              onClick={() => setPresetOpen(!presetOpen)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-colors md:hidden"
              title="预设分子"
            >
              <BookOpen size={14} />
            </button>
            {presetOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
                {MOLECULE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLoadPreset(preset)}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-chem-accent hover:bg-white/5 transition-colors"
                  >
                    {preset.chineseName}
                    <span className="text-gray-600 ml-1">{preset.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 键盘快捷键提示 */}
          <div ref={shortcutsRef} className="relative">
            <button
              onClick={() => setShortcutsOpen(!shortcutsOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-chem-accent hover:bg-white/5 transition-colors"
              title="快捷键"
            >
              <HelpCircle size={14} />
            </button>
            {shortcutsOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl p-3 z-50">
                <div className="text-xs text-gray-400 mb-2 font-medium">快捷键</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">撤销</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Ctrl+Z</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">重做</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Ctrl+Y</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">保存</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Ctrl+S</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">导出PNG</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Ctrl+E</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">删除选中</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Delete</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">取消放置</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Esc</kbd></div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* 元素面板按钮 */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-chem-accent transition-colors md:hidden"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-colors border border-chem-muted hover:border-chem-accent/30"
          >
            <Menu size={12} />
            <span>元素面板</span>
          </button>
        </div>
      </header>

      {/* 多分子标签栏 */}
      {showTabs && (
        <div className="flex items-center bg-chem-panel/60 border-b border-chem-accent/10 px-2 overflow-x-auto scrollbar-none">
          {molecules.map(mol => (
            <div
              key={mol.id}
              className={`group flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer border-b-2 transition-colors shrink-0 ${
                mol.id === activeMoleculeId
                  ? 'border-chem-accent text-chem-accent bg-chem-accent/5'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
              onClick={() => {
                if (renamingId !== mol.id) switchMolecule(mol.id);
              }}
              onContextMenu={(e) => handleTabContextMenu(e, mol.id)}
            >
              {renamingId === mol.id ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(mol.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameSubmit(mol.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                  className="w-20 bg-chem-bg/80 text-chem-accent text-xs px-1 py-0.5 rounded border border-chem-accent/30 outline-none"
                />
              ) : (
                <span className="truncate max-w-[80px]">{mol.name}</span>
              )}
              {molecules.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeMolecule(mol.id); }}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                  title="关闭"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addMolecule}
            className="p-1.5 text-gray-500 hover:text-chem-accent transition-colors shrink-0"
            title="新建分子"
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`relative ${viewMode === '3d' ? 'hidden' : viewMode === 'split' ? 'w-1/2' : 'flex-1'}`}>
          <MoleculeCanvas />
        </div>
        <div className={`relative border-l border-chem-accent/10 ${viewMode === '2d' ? 'hidden' : viewMode === 'split' ? 'w-1/2' : 'flex-1'}`}>
          <MoleculeViewer3D />
        </div>
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

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-chem-accent/90 text-white text-xs rounded-lg shadow-lg animate-fade-in pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
