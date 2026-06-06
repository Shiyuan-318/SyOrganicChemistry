export type Lang = 'zh' | 'en';

export const translations: Record<string, { zh: string; en: string }> = {
  // Header
  'app.title': { zh: 'Sy Organic Chemistry', en: 'Sy Organic Chemistry' },
  'app.titleShort': { zh: 'Sy Organic Chemistry', en: 'Sy Organic Chemistry' },
  'menu.elementPanel': { zh: '元素面板', en: 'Element Panel' },
  'menu.presets': { zh: '预设', en: 'Presets' },
  'menu.shortcuts': { zh: '快捷键', en: 'Shortcuts' },
  'menu.save': { zh: '保存', en: 'Save' },
  'menu.load': { zh: '加载', en: 'Load' },
  'menu.undo': { zh: '撤销', en: 'Undo' },
  'menu.redo': { zh: '重做', en: 'Redo' },

  // View modes
  'view.2d': { zh: '2D编辑', en: '2D Edit' },
  'view.split': { zh: '分屏模式', en: 'Split View' },
  'view.3d': { zh: '3D预览', en: '3D Preview' },

  // Info bar
  'info.molecularFormula': { zh: '分子式', en: 'Molecular Formula' },
  'info.structuralFormula': { zh: '结构简式', en: 'Structural Formula' },
  'info.chineseName': { zh: '中文名称', en: 'Chinese Name' },
  'info.molecularWeight': { zh: '分子量', en: 'Molecular Weight' },
  'info.iupac': { zh: 'IUPAC', en: 'IUPAC' },
  'info.chiralCenters': { zh: '手性中心', en: 'Chiral Centers' },
  'info.isomers': { zh: '同分异构体', en: 'Isomers' },
  'info.atoms': { zh: '原子', en: 'Atoms' },
  'info.bonds': { zh: '化学键', en: 'Bonds' },
  'info.elementTypes': { zh: '元素种类', en: 'Element Types' },
  'info.none': { zh: '无', en: 'None' },
  'info.unit.gmol': { zh: 'g/mol', en: 'g/mol' },

  // Operations
  'op.heat': { zh: '加热', en: 'Heat' },
  'op.catalyst': { zh: '催化', en: 'Catalyst' },
  'op.polymerize': { zh: '加聚', en: 'Polymerize' },
  'op.burn': { zh: '燃烧', en: 'Burn' },
  'op.substitute': { zh: '取代', en: 'Substitute' },
  'op.addition': { zh: '加成', en: 'Addition' },
  'op.eliminate': { zh: '消去', en: 'Eliminate' },
  'op.hydrolyze': { zh: '水解', en: 'Hydrolyze' },
  'op.clear': { zh: '清空', en: 'Clear' },

  // Element panel
  'panel.title': { zh: '元素面板', en: 'Element Panel' },
  'panel.search': { zh: '搜索元素 / 官能团...', en: 'Search elements / groups...' },
  'panel.functionalGroups': { zh: '官能团', en: 'Functional Groups' },
  'panel.legend': { zh: '元素图例', en: 'Element Legend' },
  'panel.singleBond': { zh: '单键', en: 'Single' },
  'panel.doubleBond': { zh: '双键', en: 'Double' },
  'panel.tripleBond': { zh: '三键', en: 'Triple' },
  'panel.hint': { zh: '点击元素后在画布上点击放置，或直接拖拽到画布', en: 'Click element then click canvas, or drag to canvas' },

  // 3D viewer
  '3d.ballStick': { zh: '球棍模型', en: 'Ball & Stick' },
  '3d.spaceFill': { zh: '空间填充', en: 'Space Fill' },
  '3d.angles': { zh: '键角', en: 'Bond Angles' },
  '3d.hybridization': { zh: '杂化', en: 'Hybridization' },
  '3d.hint': { zh: '拖拽旋转 · 滚轮缩放 · Ctrl+/- 缩放', en: 'Drag rotate · Scroll zoom · Ctrl+/- zoom' },
  '3d.empty': { zh: '在2D画布构建分子后查看3D预览', en: 'Build molecule in 2D canvas first' },
  '3d.noWebGL': { zh: 'WebGL 不可用', en: 'WebGL not available' },

  // Canvas
  'canvas.hint': { zh: '点击或拖拽元素到此处', en: 'Click or drag elements here' },
  'canvas.hintSub': { zh: 'Click or drag elements here to build molecules', en: 'Click or drag elements here to build molecules' },
  'canvas.placeElement': { zh: '点击画布放置 · 按 Esc 取消', en: 'Click canvas to place · Esc to cancel' },
  'canvas.delete': { zh: '删除', en: 'Delete' },

  // Presets
  'preset.methane': { zh: '甲烷', en: 'Methane' },
  'preset.ethane': { zh: '乙烷', en: 'Ethane' },
  'preset.ethene': { zh: '乙烯', en: 'Ethene' },
  'preset.ethyne': { zh: '乙炔', en: 'Ethyne' },
  'preset.methanol': { zh: '甲醇', en: 'Methanol' },
  'preset.ethanol': { zh: '乙醇', en: 'Ethanol' },
  'preset.formaldehyde': { zh: '甲醛', en: 'Formaldehyde' },
  'preset.aceticAcid': { zh: '乙酸', en: 'Acetic Acid' },
  'preset.benzene': { zh: '苯', en: 'Benzene' },
  'preset.propane': { zh: '丙烷', en: 'Propane' },
  'preset.propene': { zh: '丙烯', en: 'Propene' },
  'preset.glycerol': { zh: '甘油', en: 'Glycerol' },
  'preset.acetone': { zh: '丙酮', en: 'Acetone' },
  'preset.methylamine': { zh: '甲胺', en: 'Methylamine' },
  'preset.chloromethane': { zh: '氯甲烷', en: 'Chloromethane' },
  'preset.cyclohexane': { zh: '环己烷', en: 'Cyclohexane' },
  'preset.acetaldehyde': { zh: '乙醛', en: 'Acetaldehyde' },
  'preset.formicAcid': { zh: '甲酸', en: 'Formic Acid' },

  // Shortcuts
  'shortcut.title': { zh: '快捷键', en: 'Shortcuts' },
  'shortcut.undo': { zh: '撤销', en: 'Undo' },
  'shortcut.redo': { zh: '重做', en: 'Redo' },
  'shortcut.save': { zh: '保存', en: 'Save' },
  'shortcut.exportPNG': { zh: '导出PNG', en: 'Export PNG' },
  'shortcut.deleteSelected': { zh: '删除选中', en: 'Delete Selected' },
  'shortcut.cancelPlace': { zh: '取消放置', en: 'Cancel Place' },

  // Toast
  'toast.saved': { zh: '已保存', en: 'Saved' },
  'toast.loaded': { zh: '已加载', en: 'Loaded' },
  'toast.exported': { zh: '已导出', en: 'Exported' },

  // Molecules tab
  'mol.newMolecule': { zh: '新分子', en: 'New Molecule' },

  // Save/Load
  'save.noSaved': { zh: '暂无保存的分子', en: 'No saved molecules' },

  // Theme
  'theme.light': { zh: '亮色', en: 'Light' },
  'theme.dark': { zh: '暗色', en: 'Dark' },

  // New v1.3.0 features
  'feature.smiles': { zh: 'SMILES', en: 'SMILES' },
  'feature.autoLayout': { zh: '自动布局', en: 'Auto Layout' },
  'feature.fitView': { zh: '适配视图', en: 'Fit View' },
  'feature.copy': { zh: '复制', en: 'Copy' },
  'feature.paste': { zh: '粘贴', en: 'Paste' },
  'feature.lewis': { zh: '路易斯结构', en: 'Lewis Structure' },
  'feature.formalCharge': { zh: '形式电荷', en: 'Formal Charge' },
  'feature.oxidationState': { zh: '氧化态', en: 'Oxidation State' },
  'feature.wedgeBond': { zh: '楔形键', en: 'Wedge Bond' },
  'feature.dashBond': { zh: '虚线键', en: 'Dash Bond' },
  'feature.ringDetection': { zh: '环检测', en: 'Ring Detection' },
  'feature.resonance': { zh: '共振结构', en: 'Resonance' },
  'feature.irSpectrum': { zh: 'IR光谱', en: 'IR Spectrum' },
  'feature.nmrSpectrum': { zh: 'NMR光谱', en: 'NMR Spectrum' },
  'feature.pka': { zh: 'pKa', en: 'pKa' },
  'feature.periodicTable': { zh: '周期表', en: 'Periodic Table' },
  'feature.language': { zh: '语言', en: 'Language' },
  'feature.smilesImport': { zh: 'SMILES导入', en: 'SMILES Import' },

  // Info bar v1.3.0
  'info.smiles': { zh: 'SMILES', en: 'SMILES' },
  'info.totalCharge': { zh: '总电荷', en: 'Total Charge' },
  'info.rings': { zh: '环', en: 'Rings' },
  'info.irPeaks': { zh: 'IR', en: 'IR' },
  'info.nmrShifts': { zh: 'NMR', en: 'NMR' },
  'info.pka': { zh: 'pKa', en: 'pKa' },
  'info.resonance': { zh: '共振', en: 'Resonance' },
  'info.resonanceCount': { zh: '共振结构', en: 'Resonance Structures' },
  'info.possibleIsomers': { zh: '可能的同分异构体', en: 'Possible Isomers' },

  // Spectrum table headers
  'spectrum.wavenumber': { zh: '波数(cm⁻¹)', en: 'Wavenumber(cm⁻¹)' },
  'spectrum.intensity': { zh: '强度', en: 'Intensity' },
  'spectrum.assignment': { zh: '归属', en: 'Assignment' },
  'spectrum.atom': { zh: '原子', en: 'Atom' },
  'spectrum.ppm': { zh: 'ppm', en: 'ppm' },
  'spectrum.type': { zh: '类型', en: 'Type' },
  'spectrum.pkaValue': { zh: 'pKa', en: 'pKa' },
  'spectrum.strong': { zh: '强', en: 'Strong' },
  'spectrum.medium': { zh: '中', en: 'Medium' },
  'spectrum.weak': { zh: '弱', en: 'Weak' },
  'spectrum.broad': { zh: '宽', en: 'Broad' },

  // Categories
  'cat.nonmetal': { zh: '非金属', en: 'Nonmetal' },
  'cat.nobleGas': { zh: '惰性气体', en: 'Noble Gas' },
  'cat.alkaliMetal': { zh: '碱金属', en: 'Alkali Metal' },
  'cat.alkalineEarth': { zh: '碱土金属', en: 'Alkaline Earth' },
  'cat.metalloid': { zh: '类金属', en: 'Metalloid' },
  'cat.halogen': { zh: '卤素', en: 'Halogen' },
  'cat.transitionMetal': { zh: '过渡金属', en: 'Transition Metal' },
  'cat.metal': { zh: '金属', en: 'Metal' },
  'cat.lanthanide': { zh: '镧系', en: 'Lanthanide' },
  'cat.actinide': { zh: '锕系', en: 'Actinide' },
};

export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) {
    return key;
  }
  return entry[lang] ?? key;
}
