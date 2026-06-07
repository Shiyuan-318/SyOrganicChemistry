import { useState, useRef, useEffect, useCallback } from 'react';
import MoleculeCanvas from '@/components/MoleculeCanvas';
import MoleculeViewer3D from '@/components/MoleculeViewer3D';
import ElementPanel from '@/components/ElementPanel';
import InfoBar from '@/components/InfoBar';
import OperationBar from '@/components/OperationBar';
import { useChemStore } from '@/store/useChemStore';
import { MOLECULE_PRESETS } from '@/data/presets';
import { t } from '@/data/i18n';
import {
  FlaskConical, Menu, Box, Pen, BookOpen, Plus, X,
  Save, FolderOpen, Trash2, Undo2, Redo2, HelpCircle,
  Sun, Moon, Languages, FileInput, Activity, Layers, Copy,
  ChevronDown, ChevronUp,
} from 'lucide-react';

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'split'>('split');
  const [infoBarCollapsed, setInfoBarCollapsed] = useState(false);

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

  // SMILES dialog
  const [smilesOpen, setSmilesOpen] = useState(false);
  const [smilesInput, setSmilesInput] = useState('');

  // Spectrum panel
  const [spectrumOpen, setSpectrumOpen] = useState(false);

  // Resonance viewer
  const [resonanceOpen, setResonanceOpen] = useState(false);

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
  const theme = useChemStore(s => s.theme);
  const language = useChemStore(s => s.language);
  const toggleTheme = useChemStore(s => s.toggleTheme);
  const setLanguage = useChemStore(s => s.setLanguage);
  const getSMILES = useChemStore(s => s.getSMILES);
  const importSMILES = useChemStore(s => s.importSMILES);
  const getResonanceStructures = useChemStore(s => s.getResonanceStructures);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const showTabs = molecules.length > 1;

  // Resonance structures
  const resonanceStructures = getResonanceStructures();

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
    showToast(`${t('toast.loaded', language)}: ${preset.chineseName}`);
  }, [clearCanvas, addAtom, addBond, showToast, language]);

  const handleSave = useCallback(() => {
    saveMolecule();
    showToast(t('toast.saved', language));
  }, [saveMolecule, showToast, language]);

  const handleOpenLoad = useCallback(() => {
    setSavedList(getSavedMolecules());
    setLoadOpen(prev => !prev);
  }, [getSavedMolecules]);

  const handleLoadSaved = useCallback((id: string) => {
    loadMolecule(id);
    setLoadOpen(false);
    showToast(t('toast.loaded', language));
  }, [loadMolecule, showToast, language]);

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

  const handleImportSMILES = useCallback(() => {
    if (smilesInput.trim()) {
      importSMILES(smilesInput.trim());
      setSmilesInput('');
      setSmilesOpen(false);
      showToast(t('toast.loaded', language));
    }
  }, [importSMILES, smilesInput, language]);

  const handleCopySMILES = useCallback(() => {
    const smiles = getSMILES();
    if (smiles) {
      navigator.clipboard.writeText(smiles);
      showToast(language === 'zh' ? '已复制' : 'Copied');
    }
  }, [getSMILES, language, showToast]);

  const handleApplyResonance = useCallback((structure: { atoms: unknown[]; bonds: unknown[] }, index: number) => {
    // Apply resonance structure by loading it into the store
    useChemStore.setState({
      atoms: JSON.parse(JSON.stringify(structure.atoms)),
      bonds: JSON.parse(JSON.stringify(structure.bonds)),
    });
    setResonanceOpen(false);
    showToast(language === 'zh' ? `已应用共振结构 #${index + 1}` : `Applied resonance #${index + 1}`);
  }, [language, showToast]);

  return (
    <div className={`h-screen w-screen flex flex-col bg-chem-bg overflow-hidden ${theme === 'light' ? 'theme-light' : ''}`}>
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
            title={t('view.2d', language)}
          >
            <Pen size={14} />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'split' ? 'bg-chem-accent/20 text-chem-accent' : 'text-gray-500 hover:text-white'
            }`}
            title={t('view.split', language)}
          >
            <Box size={14} />
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === '3d' ? 'bg-chem-accent/20 text-chem-accent' : 'text-gray-500 hover:text-white'
            }`}
            title={t('view.3d', language)}
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
            title={`${t('menu.undo', language)} (Ctrl+Z)`}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-all ${
              canRedo ? 'text-gray-400 hover:text-chem-accent hover:bg-white/5' : 'text-gray-700 cursor-not-allowed'
            }`}
            title={`${t('menu.redo', language)} (Ctrl+Y)`}
          >
            <Redo2 size={14} />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* 保存/加载 */}
          <button
            onClick={handleSave}
            className="p-1.5 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-all"
            title={`${t('menu.save', language)} (Ctrl+S)`}
          >
            <Save size={14} />
          </button>
          <div ref={loadRef} className="relative">
            <button
              onClick={handleOpenLoad}
              className="p-1.5 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-all"
              title={t('menu.load', language)}
            >
              <FolderOpen size={14} />
            </button>
            {loadOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
                {savedList.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center">{t('save.noSaved', language)}</div>
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
                        title={language === 'zh' ? '删除' : 'Delete'}
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
              title={t('menu.presets', language)}
            >
              <BookOpen size={12} />
              <span>{t('menu.presets', language)}</span>
            </button>
            <button
              onClick={() => setPresetOpen(!presetOpen)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-colors md:hidden"
              title={t('menu.presets', language)}
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
              title={t('shortcut.title', language)}
            >
              <HelpCircle size={14} />
            </button>
            {shortcutsOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-lg shadow-xl p-3 z-50">
                <div className="text-xs text-gray-400 mb-2 font-medium">{t('shortcut.title', language)}</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">{t('shortcut.undo', language)}</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Ctrl+Z</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('shortcut.redo', language)}</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Ctrl+Y</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('shortcut.save', language)}</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Ctrl+S</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('shortcut.exportPNG', language)}</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Ctrl+E</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('shortcut.deleteSelected', language)}</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Delete</kbd></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('shortcut.cancelPlace', language)}</span><kbd className="text-chem-accent bg-chem-accent/10 px-1.5 py-0.5 rounded text-[10px]">Esc</kbd></div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* SMILES 按钮 */}
          <button
            onClick={() => setSmilesOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-colors"
            title={t('feature.smiles', language)}
          >
            <FileInput size={14} />
          </button>

          {/* 光谱面板按钮 */}
          <button
            onClick={() => setSpectrumOpen(!spectrumOpen)}
            className={`p-1.5 rounded-lg transition-all ${
              spectrumOpen ? 'bg-chem-accent/20 text-chem-accent' : 'text-gray-400 hover:text-chem-accent hover:bg-white/5'
            }`}
            title={t('feature.irSpectrum', language)}
          >
            <Activity size={14} />
          </button>

          {/* 共振结构按钮 */}
          {resonanceStructures.length > 1 && (
            <button
              onClick={() => setResonanceOpen(!resonanceOpen)}
              className={`p-1.5 rounded-lg transition-all ${
                resonanceOpen ? 'bg-chem-accent/20 text-chem-accent' : 'text-gray-400 hover:text-chem-accent hover:bg-white/5'
              }`}
              title={t('feature.resonance', language)}
            >
              <Layers size={14} />
            </button>
          )}

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* 语言切换 */}
          <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-colors text-xs font-medium"
            title={t('feature.language', language)}
          >
            <Languages size={14} />
            <span className="ml-0.5">{language === 'zh' ? '中/EN' : 'EN/中'}</span>
          </button>

          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-colors"
            title={theme === 'dark' ? t('theme.light', language) : t('theme.dark', language)}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

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
            <span>{t('menu.elementPanel', language)}</span>
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
                  title={language === 'zh' ? '关闭' : 'Close'}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addMolecule}
            className="p-1.5 text-gray-500 hover:text-chem-accent transition-colors shrink-0"
            title={t('mol.newMolecule', language)}
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

        {/* Spectrum Panel */}
        {spectrumOpen && (
          <div className="w-72 bg-chem-panel/95 backdrop-blur-xl border-l border-chem-accent/10 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-chem-accent/10">
              <h2 className="text-sm font-['Orbitron'] text-chem-accent tracking-wider">
                {language === 'zh' ? '光谱预测' : 'Spectrum'}
              </h2>
              <button
                onClick={() => setSpectrumOpen(false)}
                className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* IR Spectrum */}
              <div>
                <h3 className="text-xs font-medium text-chem-accent mb-2">{t('feature.irSpectrum', language)}</h3>
                <div className="bg-chem-border/50 rounded-lg p-3 border border-chem-muted/30">
                  <div className="h-24 flex items-end gap-px">
                    {generateIRSpectrum().map((peak, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-chem-accent/60 rounded-t-sm transition-all hover:bg-chem-accent"
                        style={{ height: `${peak.intensity * 100}%` }}
                        title={`${t('spectrum.wavenumber', language)}: ${peak.wavenumber} cm⁻¹ | ${t('spectrum.intensity', language)}: ${peak.intensityLabel}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-500">4000</span>
                    <span className="text-[9px] text-gray-500">cm⁻¹</span>
                    <span className="text-[9px] text-gray-500">400</span>
                  </div>
                </div>
              </div>

              {/* NMR Spectrum */}
              <div>
                <h3 className="text-xs font-medium text-chem-accent mb-2">{t('feature.nmrSpectrum', language)}</h3>
                <div className="bg-chem-border/50 rounded-lg p-3 border border-chem-muted/30">
                  <div className="h-24 flex items-center gap-px">
                    {generateNMRSpectrum().map((peak, i) => (
                      <div
                        key={i}
                        className="flex-1 flex items-center justify-center"
                        style={{ position: 'relative' }}
                      >
                        <div
                          className="w-0.5 bg-blue-400/80 rounded-t-sm"
                          style={{ height: `${peak.intensity * 80}%` }}
                          title={`δ ${peak.ppm} ppm | ${peak.type}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-500">0</span>
                    <span className="text-[9px] text-gray-500">ppm</span>
                    <span className="text-[9px] text-gray-500">12</span>
                  </div>
                </div>
              </div>

              {/* pKa */}
              <div>
                <h3 className="text-xs font-medium text-chem-accent mb-2">{t('feature.pka', language)}</h3>
                <div className="bg-chem-border/50 rounded-lg p-3 border border-chem-muted/30">
                  <div className="space-y-1.5">
                    {generatePkaData().map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-300">{item.group}</span>
                        <span className="text-[10px] text-chem-accent font-mono">pKa ≈ {item.pka}</span>
                      </div>
                    ))}
                    {generatePkaData().length === 0 && (
                      <div className="text-[10px] text-gray-500 text-center py-2">
                        {language === 'zh' ? '无可电离基团' : 'No ionizable groups'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部信息栏和操作栏 */}
      <div className="flex flex-col">
        {/* 收起/展开按钮 */}
        <button
          onClick={() => setInfoBarCollapsed(!infoBarCollapsed)}
          className="w-full flex items-center justify-center py-0.5 bg-chem-panel/60 hover:bg-chem-panel/80 border-t border-chem-accent/10 transition-colors"
        >
          {infoBarCollapsed ? (
            <ChevronUp size={12} className="text-gray-500" />
          ) : (
            <ChevronDown size={12} className="text-gray-500" />
          )}
        </button>
        {!infoBarCollapsed && (
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 min-w-0">
              <InfoBar />
            </div>
            <div className="sm:w-auto flex-shrink-0">
              <OperationBar />
            </div>
          </div>
        )}
      </div>

      {/* SMILES Dialog */}
      {smilesOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSmilesOpen(false)} />
          <div className="relative w-96 bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-['Orbitron'] text-chem-accent tracking-wider">
                {t('feature.smiles', language)}
              </h2>
              <button
                onClick={() => setSmilesOpen(false)}
                className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current SMILES display */}
            <div className="mb-4">
              <label className="text-[10px] text-gray-400 mb-1 block">
                {language === 'zh' ? '当前SMILES' : 'Current SMILES'}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-chem-bg/80 border border-chem-muted rounded-lg px-3 py-2 text-xs text-white font-mono truncate">
                  {getSMILES() || (language === 'zh' ? '(空)' : '(empty)')}
                </div>
                <button
                  onClick={handleCopySMILES}
                  className="p-2 rounded-lg text-gray-400 hover:text-chem-accent hover:bg-white/5 transition-colors border border-chem-muted"
                  title={t('feature.copy', language)}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* SMILES Input */}
            <div className="mb-4">
              <label className="text-[10px] text-gray-400 mb-1 block">
                {language === 'zh' ? '导入SMILES' : 'Import SMILES'}
              </label>
              <input
                type="text"
                value={smilesInput}
                onChange={e => setSmilesInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleImportSMILES(); }}
                placeholder={language === 'zh' ? '输入SMILES字符串...' : 'Enter SMILES string...'}
                className="w-full bg-chem-bg/80 border border-chem-muted rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-chem-accent/50 transition-colors font-mono"
                autoFocus
              />
            </div>

            {/* Import button */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSmilesOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {language === 'zh' ? '关闭' : 'Close'}
              </button>
              <button
                onClick={handleImportSMILES}
                disabled={!smilesInput.trim()}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  smilesInput.trim()
                    ? 'bg-chem-accent/20 text-chem-accent hover:bg-chem-accent/30 border border-chem-accent/30'
                    : 'bg-chem-border text-gray-600 cursor-not-allowed border border-chem-muted'
                }`}
              >
                {language === 'zh' ? '导入' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resonance Structure Viewer Overlay */}
      {resonanceOpen && resonanceStructures.length > 1 && (
        <div className="fixed bottom-16 right-4 z-50 w-72">
          <div className="bg-chem-panel/95 backdrop-blur-xl border border-chem-accent/20 rounded-xl shadow-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-['Orbitron'] text-chem-accent tracking-wider">
                {t('feature.resonance', language)}
              </h3>
              <button
                onClick={() => setResonanceOpen(false)}
                className="p-0.5 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {resonanceStructures.map((structure, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyResonance(structure, idx)}
                  className="flex-shrink-0 w-28 bg-chem-border/50 border border-chem-muted/30 rounded-lg p-2 hover:border-chem-accent/50 hover:bg-chem-accent/5 transition-all group"
                >
                  <div className="text-[10px] text-gray-400 group-hover:text-chem-accent mb-1">
                    #{idx + 1}
                  </div>
                  <div className="text-[9px] text-gray-500">
                    {language === 'zh' ? '原子' : 'Atoms'}: {structure.atoms.length}
                  </div>
                  <div className="text-[9px] text-gray-500">
                    {language === 'zh' ? '键' : 'Bonds'}: {structure.bonds.length}
                  </div>
                  <div className="text-[8px] text-chem-accent/50 mt-1 group-hover:text-chem-accent">
                    {language === 'zh' ? '点击应用' : 'Click to apply'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-chem-accent/90 text-white text-xs rounded-lg shadow-lg animate-fade-in pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}

// Helper: generate mock IR spectrum peaks based on current molecule
function generateIRSpectrum(): { wavenumber: number; intensity: number; intensityLabel: string }[] {
  const atoms = useChemStore.getState().atoms;
  const bonds = useChemStore.getState().bonds;
  if (atoms.length === 0) return [];

  const peaks: { wavenumber: number; intensity: number; intensityLabel: string }[] = [];
  const symbols = new Set(atoms.map(a => a.symbol));
  const bondTypes = new Set(bonds.map(b => b.type));

  if (symbols.has('O') && bondTypes.has(1)) {
    peaks.push({ wavenumber: 3300, intensity: 0.8, intensityLabel: 'broad' });
  }
  if (symbols.has('N') && bondTypes.has(1)) {
    peaks.push({ wavenumber: 3400, intensity: 0.6, intensityLabel: 'medium' });
  }
  if (bondTypes.has(3)) {
    peaks.push({ wavenumber: 2200, intensity: 0.5, intensityLabel: 'medium' });
  }
  if (bondTypes.has(2)) {
    peaks.push({ wavenumber: 1650, intensity: 0.7, intensityLabel: 'strong' });
  }
  if (symbols.has('O') && bondTypes.has(2)) {
    peaks.push({ wavenumber: 1720, intensity: 0.9, intensityLabel: 'strong' });
  }
  if (symbols.has('C')) {
    peaks.push({ wavenumber: 2900, intensity: 0.5, intensityLabel: 'medium' });
  }
  if (symbols.has('F') || symbols.has('Cl') || symbols.has('Br') || symbols.has('I')) {
    peaks.push({ wavenumber: 700, intensity: 0.6, intensityLabel: 'strong' });
  }

  return peaks.length > 0 ? peaks : [{ wavenumber: 1000, intensity: 0.3, intensityLabel: 'weak' }];
}

// Helper: generate mock NMR spectrum peaks
function generateNMRSpectrum(): { ppm: number; intensity: number; type: string }[] {
  const atoms = useChemStore.getState().atoms;
  if (atoms.length === 0) return [];

  const peaks: { ppm: number; intensity: number; type: string }[] = [];
  const symbols = new Set(atoms.map(a => a.symbol));

  if (symbols.has('C')) {
    peaks.push({ ppm: 1.2, intensity: 0.6, type: 'C-H' });
    peaks.push({ ppm: 2.1, intensity: 0.4, type: 'C-H' });
  }
  if (symbols.has('O')) {
    peaks.push({ ppm: 3.5, intensity: 0.7, type: 'O-H' });
    peaks.push({ ppm: 9.8, intensity: 0.5, type: 'C=O-H' });
  }
  if (symbols.has('N')) {
    peaks.push({ ppm: 2.5, intensity: 0.5, type: 'N-H' });
  }

  return peaks;
}

// Helper: generate mock pKa data
function generatePkaData(): { group: string; pka: string }[] {
  const atoms = useChemStore.getState().atoms;
  const bonds = useChemStore.getState().bonds;
  if (atoms.length === 0) return [];

  const data: { group: string; pka: string }[] = [];
  const symbols = new Set(atoms.map(a => a.symbol));
  const bondTypes = new Set(bonds.map(b => b.type));

  if (symbols.has('O') && bondTypes.has(2)) {
    data.push({ group: '-COOH', pka: '4.8' });
  }
  if (symbols.has('O') && bondTypes.has(1)) {
    data.push({ group: '-OH', pka: '16' });
  }
  if (symbols.has('N')) {
    data.push({ group: '-NH₂', pka: '10.6' });
  }

  return data;
}
