import { useRef, useEffect, useCallback, useState } from 'react';
import { useChemStore } from '@/store/useChemStore';
import { ELEMENT_MAP } from '@/data/elements';

const ATOM_RADIUS = 22;
const BOND_HIT_DISTANCE = 8;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'fire' | 'sparkle' | 'connect' | 'droplet';
  targetX?: number;
  targetY?: number;
  progress?: number;
}

export default function MoleculeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);

  const atoms = useChemStore(s => s.atoms);
  const bonds = useChemStore(s => s.bonds);
  const canvasOffset = useChemStore(s => s.canvasOffset);
  const canvasScale = useChemStore(s => s.canvasScale);
  const selectedAtomId = useChemStore(s => s.selectedAtomId);
  const selectedBondId = useChemStore(s => s.selectedBondId);
  const draggingAtomId = useChemStore(s => s.draggingAtomId);
  const operationEffect = useChemStore(s => s.operationEffect);
  const pendingElement = useChemStore(s => s.pendingElement);
  const getHybridization = useChemStore(s => s.getHybridization);
  const getChiralCenters = useChemStore(s => s.getChiralCenters);

  const addAtom = useChemStore(s => s.addAtom);
  const addFunctionalGroup = useChemStore(s => s.addFunctionalGroup);
  const moveAtom = useChemStore(s => s.moveAtom);
  const selectAtom = useChemStore(s => s.selectAtom);
  const selectBond = useChemStore(s => s.selectBond);
  const cycleBondType = useChemStore(s => s.cycleBondType);
  const setDraggingAtom = useChemStore(s => s.setDraggingAtom);
  const setCanvasOffset = useChemStore(s => s.setCanvasOffset);
  const setCanvasScale = useChemStore(s => s.setCanvasScale);
  const removeAtom = useChemStore(s => s.removeAtom);
  const setPendingElement = useChemStore(s => s.setPendingElement);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  // Long press detection for touch
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressAtomId = useRef<string | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const [longPressTargetId, setLongPressTargetId] = useState<string | null>(null);

  // Particles for reaction animation
  const particlesRef = useRef<Particle[]>([]);
  const lastEffectTimestamp = useRef<number>(0);

  // ===== Export PNG =====
  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentAtoms = useChemStore.getState().atoms;
    const currentBonds = useChemStore.getState().bonds;
    if (currentAtoms.length === 0) return;

    // Calculate bounding box of all atoms
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const atom of currentAtoms) {
      minX = Math.min(minX, atom.x);
      minY = Math.min(minY, atom.y);
      maxX = Math.max(maxX, atom.x);
      maxY = Math.max(maxY, atom.y);
    }

    const padding = 60;
    const molWidth = maxX - minX + padding * 2;
    const molHeight = maxY - minY + padding * 2;

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = molWidth * 2;
    tmpCanvas.height = molHeight * 2;
    const ctx = tmpCanvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(2, 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, molWidth, molHeight);

    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Draw bonds
    for (const bond of currentBonds) {
      const fromAtom = currentAtoms.find(a => a.id === bond.from);
      const toAtom = currentAtoms.find(a => a.id === bond.to);
      if (!fromAtom || !toAtom) continue;

      const dx = toAtom.x - fromAtom.x;
      const dy = toAtom.y - fromAtom.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      const nx = -dy / len;
      const ny = dx / len;

      ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
      ctx.lineWidth = 2;

      if (bond.type === 1) {
        ctx.beginPath();
        ctx.moveTo(fromAtom.x, fromAtom.y);
        ctx.lineTo(toAtom.x, toAtom.y);
        ctx.stroke();
      } else if (bond.type === 2) {
        const offset = 4;
        ctx.beginPath();
        ctx.moveTo(fromAtom.x + nx * offset, fromAtom.y + ny * offset);
        ctx.lineTo(toAtom.x + nx * offset, toAtom.y + ny * offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fromAtom.x - nx * offset, fromAtom.y - ny * offset);
        ctx.lineTo(toAtom.x - nx * offset, toAtom.y - ny * offset);
        ctx.stroke();
      } else if (bond.type === 3) {
        const offset = 5;
        ctx.beginPath();
        ctx.moveTo(fromAtom.x, fromAtom.y);
        ctx.lineTo(toAtom.x, toAtom.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fromAtom.x + nx * offset, fromAtom.y + ny * offset);
        ctx.lineTo(toAtom.x + nx * offset, toAtom.y + ny * offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fromAtom.x - nx * offset, fromAtom.y - ny * offset);
        ctx.lineTo(toAtom.x - nx * offset, toAtom.y - ny * offset);
        ctx.stroke();
      }
    }

    // Draw atoms
    for (const atom of currentAtoms) {
      const element = ELEMENT_MAP.get(atom.symbol);
      if (!element) continue;
      const radius = ATOM_RADIUS;

      const gradient = ctx.createRadialGradient(
        atom.x - radius * 0.3, atom.y - radius * 0.3, radius * 0.1,
        atom.x, atom.y, radius
      );
      gradient.addColorStop(0, lightenColor(element.color, 60));
      gradient.addColorStop(0.7, element.color);
      gradient.addColorStop(1, darkenColor(element.color, 40));

      ctx.beginPath();
      ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = getContrastColor(element.color);
      ctx.font = `bold ${atom.symbol.length > 1 ? 11 : 14}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(atom.symbol, atom.x, atom.y);
    }

    ctx.restore();

    const dataURL = tmpCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'molecule.png';
    link.href = dataURL;
    link.click();
  }, []);

  // ===== Export SVG =====
  const exportSVG = useCallback(() => {
    const currentAtoms = useChemStore.getState().atoms;
    const currentBonds = useChemStore.getState().bonds;
    if (currentAtoms.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const atom of currentAtoms) {
      minX = Math.min(minX, atom.x);
      minY = Math.min(minY, atom.y);
      maxX = Math.max(maxX, atom.x);
      maxY = Math.max(maxY, atom.y);
    }

    const padding = 60;
    const svgW = maxX - minX + padding * 2;
    const svgH = maxY - minY + padding * 2;
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    const lines: string[] = [];
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`);
    lines.push(`<rect width="${svgW}" height="${svgH}" fill="#0a0a0a"/>`);
    lines.push(`<g transform="translate(${offsetX},${offsetY})">`);

    // Bonds
    for (const bond of currentBonds) {
      const fromAtom = currentAtoms.find(a => a.id === bond.from);
      const toAtom = currentAtoms.find(a => a.id === bond.to);
      if (!fromAtom || !toAtom) continue;

      const dx = toAtom.x - fromAtom.x;
      const dy = toAtom.y - fromAtom.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      const nx = -dy / len;
      const ny = dx / len;
      const stroke = 'rgba(200, 200, 200, 0.8)';
      const sw = 2;

      if (bond.type === 1) {
        lines.push(`<line x1="${fromAtom.x}" y1="${fromAtom.y}" x2="${toAtom.x}" y2="${toAtom.y}" stroke="${stroke}" stroke-width="${sw}"/>`);
      } else if (bond.type === 2) {
        const off = 4;
        lines.push(`<line x1="${fromAtom.x + nx * off}" y1="${fromAtom.y + ny * off}" x2="${toAtom.x + nx * off}" y2="${toAtom.y + ny * off}" stroke="${stroke}" stroke-width="${sw}"/>`);
        lines.push(`<line x1="${fromAtom.x - nx * off}" y1="${fromAtom.y - ny * off}" x2="${toAtom.x - nx * off}" y2="${toAtom.y - ny * off}" stroke="${stroke}" stroke-width="${sw}"/>`);
      } else if (bond.type === 3) {
        const off = 5;
        lines.push(`<line x1="${fromAtom.x}" y1="${fromAtom.y}" x2="${toAtom.x}" y2="${toAtom.y}" stroke="${stroke}" stroke-width="${sw}"/>`);
        lines.push(`<line x1="${fromAtom.x + nx * off}" y1="${fromAtom.y + ny * off}" x2="${toAtom.x + nx * off}" y2="${toAtom.y + ny * off}" stroke="${stroke}" stroke-width="${sw}"/>`);
        lines.push(`<line x1="${fromAtom.x - nx * off}" y1="${fromAtom.y - ny * off}" x2="${toAtom.x - nx * off}" y2="${toAtom.y - ny * off}" stroke="${stroke}" stroke-width="${sw}"/>`);
      }
    }

    // Atoms
    for (const atom of currentAtoms) {
      const element = ELEMENT_MAP.get(atom.symbol);
      if (!element) continue;
      const r = ATOM_RADIUS;
      const textColor = getContrastColor(element.color);
      const fontSize = atom.symbol.length > 1 ? 11 : 14;
      lines.push(`<circle cx="${atom.x}" cy="${atom.y}" r="${r}" fill="${element.color}" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`);
      lines.push(`<text x="${atom.x}" y="${atom.y}" text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-size="${fontSize}" font-weight="bold" font-family="Orbitron, sans-serif">${atom.symbol}</text>`);
    }

    lines.push('</g>');
    lines.push('</svg>');

    const svgContent = lines.join('\n');
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'molecule.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // ===== Spawn particles for reaction animation =====
  const spawnParticles = useCallback((type: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const newParticles: Particle[] = [];

    if (type === '加热' || type === '燃烧') {
      for (let i = 0; i < 40; i++) {
        newParticles.push({
          x: Math.random() * w,
          y: h + Math.random() * 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(1 + Math.random() * 3),
          life: 60 + Math.random() * 40,
          maxLife: 100,
          size: 2 + Math.random() * 4,
          color: Math.random() > 0.5 ? '#ff6600' : '#ff3300',
          type: 'fire',
        });
      }
    } else if (type === '催化') {
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          x: w / 2 + (Math.random() - 0.5) * w * 0.6,
          y: h / 2 + (Math.random() - 0.5) * h * 0.6,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 40 + Math.random() * 30,
          maxLife: 70,
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() > 0.5 ? '#66ccff' : '#3399ff',
          type: 'sparkle',
        });
      }
    } else if (type === '加聚') {
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          life: 60 + Math.random() * 40,
          maxLife: 100,
          size: 2,
          color: '#00ff88',
          type: 'connect',
          targetX: w / 2 + (Math.random() - 0.5) * 200,
          targetY: h / 2 + (Math.random() - 0.5) * 200,
          progress: 0,
        });
      }
    } else if (type === '水解') {
      for (let i = 0; i < 25; i++) {
        newParticles.push({
          x: w / 2 + (Math.random() - 0.5) * 200,
          y: h / 2 - 50 + Math.random() * 30,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 1 + Math.random() * 2,
          life: 50 + Math.random() * 40,
          maxLife: 90,
          size: 3 + Math.random() * 3,
          color: '#0099ff',
          type: 'droplet',
        });
      }
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // 绘制画布
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // 拖拽悬停高亮
    if (isDragOver) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.03)';
      ctx.fillRect(0, 0, w, h);
    }

    // 网格
    ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);
    ctx.scale(canvasScale, canvasScale);

    const gridSize = 40;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.05)';
    ctx.lineWidth = 0.5;
    const startX = Math.floor(-canvasOffset.x / canvasScale / gridSize) * gridSize - gridSize;
    const startY = Math.floor(-canvasOffset.y / canvasScale / gridSize) * gridSize - gridSize;
    const endX = startX + w / canvasScale + gridSize * 2;
    const endY = startY + h / canvasScale + gridSize * 2;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    ctx.restore();

    // 操作效果
    if (operationEffect) {
      const elapsed = Date.now() - operationEffect.timestamp;
      if (elapsed < 2000) {
        const alpha = Math.max(0, 1 - elapsed / 2000);
        const effectColors: Record<string, string> = {
          '加热': `rgba(255, 100, 0, ${alpha * 0.3})`,
          '催化': `rgba(100, 200, 255, ${alpha * 0.3})`,
          '加聚': `rgba(0, 255, 136, ${alpha * 0.3})`,
          '燃烧': `rgba(255, 50, 0, ${alpha * 0.4})`,
          '取代': `rgba(255, 255, 0, ${alpha * 0.3})`,
          '加成': `rgba(0, 200, 255, ${alpha * 0.3})`,
          '消去': `rgba(200, 100, 255, ${alpha * 0.3})`,
          '氧化': `rgba(255, 0, 0, ${alpha * 0.3})`,
          '还原': `rgba(0, 100, 255, ${alpha * 0.3})`,
          '酯化': `rgba(255, 150, 200, ${alpha * 0.3})`,
          '水解': `rgba(0, 150, 255, ${alpha * 0.3})`,
        };
        ctx.fillStyle = effectColors[operationEffect.type] || `rgba(0, 255, 136, ${alpha * 0.2})`;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.font = `bold ${32 * (1 + (1 - alpha) * 0.5)}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = effectColors[operationEffect.type] || 'rgba(0, 255, 136, 0.5)';
        ctx.shadowBlur = 20;
        ctx.fillText(operationEffect.label, 0, 0);
        ctx.restore();

        // Spawn particles when effect starts
        if (operationEffect.timestamp !== lastEffectTimestamp.current) {
          lastEffectTimestamp.current = operationEffect.timestamp;
          spawnParticles(operationEffect.type);
        }
      }
    }

    // ===== Draw particles =====
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const lifeRatio = p.life / p.maxLife;

      if (p.type === 'fire') {
        p.x += p.vx;
        p.y += p.vy;
        p.vx += (Math.random() - 0.5) * 0.3;
        ctx.save();
        ctx.globalAlpha = lifeRatio;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'sparkle') {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        ctx.save();
        ctx.globalAlpha = lifeRatio;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        // Draw a small star/cross shape
        const s = p.size * lifeRatio;
        ctx.fillRect(p.x - s, p.y - 0.5, s * 2, 1);
        ctx.fillRect(p.x - 0.5, p.y - s, 1, s * 2);
        ctx.restore();
      } else if (p.type === 'connect') {
        if (p.progress !== undefined) {
          p.progress = Math.min(1, (p.progress as number) + 0.02);
        }
        ctx.save();
        ctx.globalAlpha = lifeRatio * 0.6;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        const prog = (p.progress as number) || 0;
        const endX = p.x + ((p.targetX || p.x) - p.x) * prog;
        const endY = p.y + ((p.targetY || p.y) - p.y) * prog;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else if (p.type === 'droplet') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        ctx.save();
        ctx.globalAlpha = lifeRatio;
        ctx.fillStyle = p.color;
        // Draw a teardrop shape
        const s = p.size * lifeRatio;
        ctx.beginPath();
        ctx.arc(p.x, p.y + s * 0.3, s * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.quadraticCurveTo(p.x + s * 0.5, p.y, p.x, p.y + s * 0.3);
        ctx.quadraticCurveTo(p.x - s * 0.5, p.y, p.x, p.y - s);
        ctx.fill();
        ctx.restore();
      }
    }

    // 应用画布变换
    ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);
    ctx.scale(canvasScale, canvasScale);

    // Get chiral centers
    const chiralCenterIds = getChiralCenters();

    // 绘制化学键
    for (const bond of bonds) {
      const fromAtom = atoms.find(a => a.id === bond.from);
      const toAtom = atoms.find(a => a.id === bond.to);
      if (!fromAtom || !toAtom) continue;

      const isSelected = bond.id === selectedBondId;
      const dx = toAtom.x - fromAtom.x;
      const dy = toAtom.y - fromAtom.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      const nx = -dy / len;
      const ny = dx / len;

      ctx.strokeStyle = isSelected ? '#00ff88' : 'rgba(200, 200, 200, 0.8)';
      ctx.lineWidth = isSelected ? 3 : 2;

      if (bond.type === 1) {
        ctx.beginPath();
        ctx.moveTo(fromAtom.x, fromAtom.y);
        ctx.lineTo(toAtom.x, toAtom.y);
        ctx.stroke();
      } else if (bond.type === 2) {
        const offset = 4;
        ctx.beginPath();
        ctx.moveTo(fromAtom.x + nx * offset, fromAtom.y + ny * offset);
        ctx.lineTo(toAtom.x + nx * offset, toAtom.y + ny * offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fromAtom.x - nx * offset, fromAtom.y - ny * offset);
        ctx.lineTo(toAtom.x - nx * offset, toAtom.y - ny * offset);
        ctx.stroke();
      } else if (bond.type === 3) {
        const offset = 5;
        ctx.beginPath();
        ctx.moveTo(fromAtom.x, fromAtom.y);
        ctx.lineTo(toAtom.x, toAtom.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fromAtom.x + nx * offset, fromAtom.y + ny * offset);
        ctx.lineTo(toAtom.x + nx * offset, toAtom.y + ny * offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fromAtom.x - nx * offset, fromAtom.y - ny * offset);
        ctx.lineTo(toAtom.x - nx * offset, toAtom.y - ny * offset);
        ctx.stroke();
      }

      if (isSelected) {
        ctx.save();
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(fromAtom.x, fromAtom.y);
        ctx.lineTo(toAtom.x, toAtom.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 绘制原子
    // 先绘制拖拽时靠近的吸附提示
    if (draggingAtomId) {
      const dragAtom = atoms.find(a => a.id === draggingAtomId);
      if (dragAtom) {
        for (const atom of atoms) {
          if (atom.id === draggingAtomId) continue;
          const dx = atom.x - dragAtom.x;
          const dy = atom.y - dragAtom.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100 && dist > 0) {
            // 检查是否已有键
            const hasBond = bonds.some(
              b => (b.from === atom.id && b.to === draggingAtomId) ||
                   (b.from === draggingAtomId && b.to === atom.id)
            );
            if (!hasBond) {
              ctx.save();
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(dragAtom.x, dragAtom.y);
              ctx.lineTo(atom.x, atom.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }
    }

    for (const atom of atoms) {
      const element = ELEMENT_MAP.get(atom.symbol);
      if (!element) continue;

      const isSelected = atom.id === selectedAtomId;
      const isDragging = atom.id === draggingAtomId;
      const isLongPressed = longPressActive && atom.id === longPressTargetId;
      const radius = ATOM_RADIUS;

      if (isSelected || isDragging) {
        ctx.save();
        ctx.shadowColor = element.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.fill();
        ctx.restore();
      }

      const gradient = ctx.createRadialGradient(
        atom.x - radius * 0.3, atom.y - radius * 0.3, radius * 0.1,
        atom.x, atom.y, radius
      );

      // Long press visual feedback: atom turns red
      if (isLongPressed) {
        gradient.addColorStop(0, lightenColor('#ff3333', 60));
        gradient.addColorStop(0.7, '#ff3333');
        gradient.addColorStop(1, darkenColor('#ff3333', 40));
      } else {
        gradient.addColorStop(0, lightenColor(element.color, 60));
        gradient.addColorStop(0.7, element.color);
        gradient.addColorStop(1, darkenColor(element.color, 40));
      }

      ctx.beginPath();
      ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#00ff88' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();

      ctx.fillStyle = isLongPressed ? '#ffffff' : getContrastColor(element.color);
      ctx.font = `bold ${atom.symbol.length > 1 ? 11 : 14}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(atom.symbol, atom.x, atom.y);

      // ===== Hybridization label for selected atom =====
      if (isSelected) {
        const hybridization = getHybridization(atom.id);
        if (hybridization) {
          ctx.save();
          ctx.font = 'bold 10px Orbitron, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = 'rgba(0, 255, 136, 0.85)';
          ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
          ctx.shadowBlur = 4;
          ctx.fillText(hybridization, atom.x, atom.y + radius + 4);
          ctx.restore();
        }
      }

      // ===== Chiral center marker =====
      if (chiralCenterIds.includes(atom.id)) {
        ctx.save();
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 6;
        ctx.fillText('✱', atom.x + radius + 6, atom.y - radius - 2);
        ctx.restore();
      }
    }

    ctx.restore();

    // 删除区域指示器（屏幕空间绘制）
    if (draggingAtomId) {
      const dzSize = 100;
      const dzX = w - dzSize;
      const dzY = h - dzSize;

      // 背景
      ctx.fillStyle = isOverDeleteZone
        ? 'rgba(255, 50, 50, 0.2)'
        : 'rgba(255, 50, 50, 0.05)';
      ctx.strokeStyle = isOverDeleteZone
        ? 'rgba(255, 50, 50, 0.6)'
        : 'rgba(255, 50, 50, 0.2)';
      ctx.lineWidth = isOverDeleteZone ? 2 : 1;
      ctx.setLineDash(isOverDeleteZone ? [] : [4, 4]);
      ctx.beginPath();
      ctx.roundRect(dzX, dzY, dzSize - 4, dzSize - 4, 12);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // 垃圾桶图标
      ctx.fillStyle = isOverDeleteZone ? 'rgba(255, 68, 68, 0.9)' : 'rgba(255, 68, 68, 0.5)';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🗑', dzX + dzSize / 2 - 2, dzY + dzSize / 2 - 8);

      ctx.fillStyle = isOverDeleteZone ? '#ff4444' : 'rgba(255, 68, 68, 0.5)';
      ctx.font = 'bold 10px Orbitron, sans-serif';
      ctx.fillText('删除', dzX + dzSize / 2 - 2, dzY + dzSize / 2 + 16);
    }

    // ===== Export buttons (screen space, top-right) =====
    const btnSize = 32;
    const btnMargin = 8;
    const btnY = btnMargin;

    // PNG export button
    const pngBtnX = w - btnSize - btnMargin;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pngBtnX, btnY, btnSize, btnSize, 6);
    ctx.fill();
    ctx.stroke();
    // Camera/image icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷', pngBtnX + btnSize / 2, btnY + btnSize / 2);
    ctx.restore();

    // SVG export button
    const svgBtnX = w - btnSize * 2 - btnMargin * 2;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(svgBtnX, btnY, btnSize, btnSize, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SVG', svgBtnX + btnSize / 2, btnY + btnSize / 2);
    ctx.restore();

    ctx.restore();
  }, [atoms, bonds, canvasOffset, canvasScale, selectedAtomId, selectedBondId, draggingAtomId, operationEffect, isDragOver, isOverDeleteZone, getHybridization, getChiralCenters, longPressActive, longPressTargetId, spawnParticles]);

  function lightenColor(hex: string, amount: number): string {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function darkenColor(hex: string, amount: number): string {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  // 调整画布大小
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // 动画循环
  useEffect(() => {
    let animId: number;
    const loop = () => {
      draw();
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // 屏幕坐标转画布坐标
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - canvasOffset.x) / canvasScale,
      y: (clientY - rect.top - canvasOffset.y) / canvasScale,
    };
  }, [canvasOffset, canvasScale]);

  // 命中检测 - 原子
  const hitTestAtom = useCallback((cx: number, cy: number) => {
    for (let i = atoms.length - 1; i >= 0; i--) {
      const atom = atoms[i];
      const dx = atom.x - cx;
      const dy = atom.y - cy;
      if (Math.sqrt(dx * dx + dy * dy) <= ATOM_RADIUS + 4) {
        return atom;
      }
    }
    return null;
  }, [atoms]);

  // 命中检测 - 化学键
  const hitTestBond = useCallback((cx: number, cy: number) => {
    for (const bond of bonds) {
      const fromAtom = atoms.find(a => a.id === bond.from);
      const toAtom = atoms.find(a => a.id === bond.to);
      if (!fromAtom || !toAtom) continue;
      const dist = pointToSegmentDist(cx, cy, fromAtom.x, fromAtom.y, toAtom.x, toAtom.y);
      if (dist <= BOND_HIT_DISTANCE) return bond;
    }
    return null;
  }, [atoms, bonds]);

  function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }

  // 放置元素（点击模式或拖放模式共用）
  const placeElement = useCallback((data: string, clientX: number, clientY: number) => {
    const pos = screenToCanvas(clientX, clientY);
    const isElement = ELEMENT_MAP.has(data);
    if (isElement) {
      addAtom(data, pos.x, pos.y);
    } else {
      addFunctionalGroup(data, pos.x, pos.y);
    }
  }, [screenToCanvas, addAtom, addFunctionalGroup]);

  // Check if click is on export buttons
  const isOnExportButton = useCallback((clientX: number, clientY: number): 'png' | 'svg' | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const btnSize = 32;
    const btnMargin = 8;
    const btnY = btnMargin;

    const pngBtnX = w - btnSize - btnMargin;
    const svgBtnX = w - btnSize * 2 - btnMargin * 2;

    if (x >= pngBtnX && x <= pngBtnX + btnSize && y >= btnY && y <= btnY + btnSize) {
      return 'png';
    }
    if (x >= svgBtnX && x <= svgBtnX + btnSize && y >= btnY && y <= btnY + btnSize) {
      return 'svg';
    }
    return null;
  }, []);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check export buttons first
    const exportBtn = isOnExportButton(e.clientX, e.clientY);
    if (exportBtn === 'png') {
      exportPNG();
      return;
    }
    if (exportBtn === 'svg') {
      exportSVG();
      return;
    }

    // 如果有待放置的元素，先放置
    if (pendingElement) {
      placeElement(pendingElement, e.clientX, e.clientY);
      setPendingElement(null);
      return;
    }

    const pos = screenToCanvas(e.clientX, e.clientY);
    const hitAtom = hitTestAtom(pos.x, pos.y);

    if (hitAtom) {
      selectAtom(hitAtom.id);
      setDraggingAtom(hitAtom.id);
    } else {
      const hitBond = hitTestBond(pos.x, pos.y);
      if (hitBond) {
        selectBond(hitBond.id);
      } else {
        selectAtom(null);
        selectBond(null);
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        offsetStart.current = { ...canvasOffset };
      }
    }
  }, [pendingElement, placeElement, setPendingElement, screenToCanvas, hitTestAtom, hitTestBond, selectAtom, selectBond, setDraggingAtom, canvasOffset, isOnExportButton, exportPNG, exportSVG]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setCanvasOffset({
        x: offsetStart.current.x + dx,
        y: offsetStart.current.y + dy,
      });
    } else if (draggingAtomId) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      moveAtom(draggingAtomId, pos.x, pos.y);
      // 检查是否在删除区域
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const dzSize = 100;
        const inZone = e.clientX > rect.right - dzSize && e.clientY > rect.bottom - dzSize;
        setIsOverDeleteZone(inZone);
      }
    }
  }, [draggingAtomId, screenToCanvas, moveAtom, setCanvasOffset]);

  const handleMouseUp = useCallback(() => {
    if (draggingAtomId && isOverDeleteZone) {
      removeAtom(draggingAtomId);
    }
    isPanning.current = false;
    setDraggingAtom(null);
    setIsOverDeleteZone(false);
  }, [setDraggingAtom, draggingAtomId, isOverDeleteZone, removeAtom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(3, canvasScale * delta));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setCanvasOffset({
      x: mx - (mx - canvasOffset.x) * (newScale / canvasScale),
      y: my - (my - canvasOffset.y) * (newScale / canvasScale),
    });
    setCanvasScale(newScale);
  }, [canvasScale, canvasOffset, setCanvasScale, setCanvasOffset]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Check export buttons first
    const exportBtn = isOnExportButton(e.clientX, e.clientY);
    if (exportBtn) return;

    // 点击放置模式已由 handleMouseDown 处理
    // 这里只处理化学键点击
    const pos = screenToCanvas(e.clientX, e.clientY);
    const hitBond = hitTestBond(pos.x, pos.y);
    if (hitBond) {
      cycleBondType(hitBond.id);
    }
  }, [screenToCanvas, hitTestBond, cycleBondType, isOnExportButton]);

  // 触摸事件处理
  const touchState = useRef<{ lastDist: number; lastCenter: { x: number; y: number } } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];

      // Check export buttons
      const exportBtn = isOnExportButton(touch.clientX, touch.clientY);
      if (exportBtn === 'png') {
        exportPNG();
        return;
      }
      if (exportBtn === 'svg') {
        exportSVG();
        return;
      }

      // 如果有待放置的元素，放置它
      if (pendingElement) {
        placeElement(pendingElement, touch.clientX, touch.clientY);
        setPendingElement(null);
        return;
      }

      const pos = screenToCanvas(touch.clientX, touch.clientY);
      const hitAtom = hitTestAtom(pos.x, pos.y);

      if (hitAtom) {
        selectAtom(hitAtom.id);
        setDraggingAtom(hitAtom.id);

        // Start long press timer
        longPressAtomId.current = hitAtom.id;
        setLongPressTargetId(hitAtom.id);
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = setTimeout(() => {
          // Long press triggered - delete the atom
          if (longPressAtomId.current) {
            removeAtom(longPressAtomId.current);
            longPressAtomId.current = null;
            setLongPressTargetId(null);
            setLongPressActive(false);
          }
        }, 500);
        setLongPressActive(false);
      } else {
        isPanning.current = true;
        panStart.current = { x: touch.clientX, y: touch.clientY };
        offsetStart.current = { ...canvasOffset };
      }
    } else if (e.touches.length === 2) {
      // Cancel long press on two-finger touch
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      longPressAtomId.current = null;
      setLongPressTargetId(null);
      setLongPressActive(false);

      isPanning.current = false;
      setDraggingAtom(null);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchState.current = {
        lastDist: Math.sqrt(dx * dx + dy * dy),
        lastCenter: {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        },
      };
    }
  }, [pendingElement, placeElement, setPendingElement, screenToCanvas, hitTestAtom, selectAtom, setDraggingAtom, canvasOffset, isOnExportButton, exportPNG, exportSVG, removeAtom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    // Cancel long press on touch move
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressAtomId.current = null;
    setLongPressTargetId(null);
    setLongPressActive(false);

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (draggingAtomId) {
        const pos = screenToCanvas(touch.clientX, touch.clientY);
        moveAtom(draggingAtomId, pos.x, pos.y);
        // 检查删除区域
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const dzSize = 100;
          const inZone = touch.clientX > rect.right - dzSize && touch.clientY > rect.bottom - dzSize;
          setIsOverDeleteZone(inZone);
        }
      } else if (isPanning.current) {
        const dx = touch.clientX - panStart.current.x;
        const dy = touch.clientY - panStart.current.y;
        setCanvasOffset({
          x: offsetStart.current.x + dx,
          y: offsetStart.current.y + dy,
        });
      }
    } else if (e.touches.length === 2 && touchState.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / touchState.current.lastDist;
      const newScale = Math.max(0.2, Math.min(3, canvasScale * scale));

      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mx = center.x - rect.left;
        const my = center.y - rect.top;
        setCanvasOffset({
          x: mx - (mx - canvasOffset.x) * (newScale / canvasScale),
          y: my - (my - canvasOffset.y) * (newScale / canvasScale),
        });
      }
      setCanvasScale(newScale);
      touchState.current = { lastDist: dist, lastCenter: center };
    }
  }, [draggingAtomId, screenToCanvas, moveAtom, canvasScale, canvasOffset, setCanvasScale, setCanvasOffset]);

  const handleTouchEnd = useCallback(() => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressAtomId.current = null;
    setLongPressTargetId(null);
    setLongPressActive(false);

    if (draggingAtomId && isOverDeleteZone) {
      removeAtom(draggingAtomId);
    }
    isPanning.current = false;
    setDraggingAtom(null);
    setIsOverDeleteZone(false);
    touchState.current = null;
  }, [setDraggingAtom, draggingAtomId, isOverDeleteZone, removeAtom]);

  // ===== HTML5 拖放处理 =====
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 只在真正离开容器时才关闭高亮
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        setIsDragOver(false);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    placeElement(data, e.clientX, e.clientY);
  }, [placeElement]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useChemStore.getState();
        if (state.selectedAtomId) {
          removeAtom(state.selectedAtomId);
        } else if (state.selectedBondId) {
          useChemStore.getState().removeBond(state.selectedBondId);
        }
      }
      // Escape 取消待放置元素
      if (e.key === 'Escape') {
        setPendingElement(null);
      }
      // Ctrl+Z: undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useChemStore.getState().undo();
      }
      // Ctrl+Y or Ctrl+Shift+Z: redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        useChemStore.getState().redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useChemStore.getState().redo();
      }
      // Ctrl+S: save molecule
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        useChemStore.getState().saveMolecule();
      }
      // Ctrl+E: export PNG
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportPNG();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeAtom, setPendingElement, exportPNG]);

  // Long press visual feedback
  useEffect(() => {
    if (!longPressTargetId) {
      setLongPressActive(false);
      return;
    }
    // After a short delay, show visual feedback before the actual delete
    const feedbackTimer = setTimeout(() => {
      if (longPressTargetId) {
        setLongPressActive(true);
      }
    }, 200); // Show red after 200ms, delete at 500ms
    return () => clearTimeout(feedbackTimer);
  }, [longPressTargetId]);

  // 光标样式
  const cursorClass = pendingElement
    ? 'cursor-crosshair'
    : 'cursor-grab active:cursor-grabbing';

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden ${isDragOver ? 'canvas-drop-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${cursorClass}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {/* 空画布提示 */}
      {atoms.length === 0 && !pendingElement && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30">
            <p className="text-lg font-['Orbitron'] text-chem-accent mb-2">点击或拖拽元素到此处</p>
            <p className="text-sm text-gray-500">Click or drag elements here to build molecules</p>
          </div>
        </div>
      )}
      {/* 待放置元素提示 */}
      {pendingElement && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="px-4 py-1.5 rounded-full bg-chem-accent/20 border border-chem-accent/40 text-chem-accent text-xs font-['Orbitron'] animate-pulse">
            点击画布放置 {pendingElement} · 按 Esc 取消
          </div>
        </div>
      )}
      {/* 删除区域 */}
      <div
        className={`
          absolute bottom-4 right-4 w-24 h-24 rounded-xl pointer-events-none
          flex flex-col items-center justify-center gap-1
          transition-all duration-200
          ${draggingAtomId
            ? (isOverDeleteZone
                ? 'bg-red-500/20 border-2 border-red-500/60 shadow-[0_0_20px_rgba(255,50,50,0.3)]'
                : 'bg-red-500/5 border border-dashed border-red-500/20')
            : 'opacity-0'}
        `}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isOverDeleteZone ? '#ff4444' : '#ff444488'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        <span className={`text-[10px] font-['Orbitron'] ${isOverDeleteZone ? 'text-red-400' : 'text-red-400/50'}`}>
          删除
        </span>
      </div>
    </div>
  );
}
