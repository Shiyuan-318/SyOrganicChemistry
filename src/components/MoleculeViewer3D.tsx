import { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useChemStore } from '@/store/useChemStore';
import { ELEMENT_MAP } from '@/data/elements';

type ModelType = 'ballStick' | 'spaceFill';

// 范德华半径（用于空间填充模型），单位：Å
const VDW_RADII: Record<string, number> = {
  H: 1.2, He: 1.4, Li: 1.82, Be: 1.53, B: 1.92, C: 1.7, N: 1.55, O: 1.52,
  F: 1.47, Ne: 1.54, Na: 2.27, Mg: 1.73, Al: 1.84, Si: 2.1, P: 1.8, S: 1.8,
  Cl: 1.75, Ar: 1.88, K: 2.75, Ca: 2.31, Fe: 2.04, Cu: 1.4, Zn: 1.39,
  Br: 1.85, I: 1.98,
};
const DEFAULT_VDW = 1.7;

// 共价半径（用于球棍模型原子大小）
const COVALENT_RADII: Record<string, number> = {
  H: 0.31, He: 0.28, Li: 1.28, Be: 0.96, B: 0.84, C: 0.76, N: 0.71, O: 0.66,
  F: 0.57, Ne: 0.58, Na: 1.66, Mg: 1.41, Al: 1.21, Si: 1.11, P: 1.07, S: 1.05,
  Cl: 1.02, Ar: 1.06, K: 2.03, Ca: 1.76, Fe: 1.32, Cu: 1.32, Zn: 1.22,
  Br: 1.2, I: 1.39,
};
const DEFAULT_COVALENT = 0.76;

const SCALE_2D_TO_3D = 0.05; // 2D像素坐标转3D单位

export default function MoleculeViewer3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>(0);
  const [modelType, setModelType] = useState<ModelType>('ballStick');
  const [webglError, setWebglError] = useState(false);

  const atoms = useChemStore(s => s.atoms);
  const bonds = useChemStore(s => s.bonds);

  // 初始化Three.js场景
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 检测WebGL支持
    const testCanvas = document.createElement('canvas');
    const testGl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!testGl) {
      setWebglError(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setWebglError(true);
      return;
    }
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 动画循环
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 响应容器大小
    const observer = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Ctrl+/- 缩放快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        camera.position.addScaledVector(dir, 1);
        controls.update();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        camera.position.addScaledVector(dir, -1);
        controls.update();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 更新3D分子模型
  const buildMolecule = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 清除旧模型
    const toRemove: THREE.Object3D[] = [];
    scene.traverse(obj => {
      if (obj.userData.isMolecule) toRemove.push(obj);
    });
    toRemove.forEach(obj => {
      scene.remove(obj);
      obj.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) child.material.dispose();
        }
      });
    });

    if (atoms.length === 0) return;

    // 计算中心
    const cx = atoms.reduce((s, a) => s + a.x, 0) / atoms.length;
    const cy = atoms.reduce((s, a) => s + a.y, 0) / atoms.length;

    const isBallStick = modelType === 'ballStick';
    const posScale = isBallStick ? SCALE_2D_TO_3D : SCALE_2D_TO_3D * 0.4;

    // 创建原子球体
    const atomGroup = new THREE.Group();
    atomGroup.userData.isMolecule = true;

    for (const atom of atoms) {
      const element = ELEMENT_MAP.get(atom.symbol);
      if (!element) continue;

      const color = new THREE.Color(element.color);
      const pos = new THREE.Vector3(
        (atom.x - cx) * posScale,
        -(atom.y - cy) * posScale,
        0
      );

      let radius: number;
      if (isBallStick) {
        radius = (COVALENT_RADII[atom.symbol] || DEFAULT_COVALENT) * 0.5;
      } else {
        radius = (VDW_RADII[atom.symbol] || DEFAULT_VDW) * 0.8;
      }

      const geometry = new THREE.SphereGeometry(radius, 32, 24);
      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 80,
        specular: new THREE.Color(0x444444),
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(pos);
      mesh.userData = { isMolecule: true, atomId: atom.id };
      atomGroup.add(mesh);
    }
    scene.add(atomGroup);

    // 创建化学键（球棍模型显示，空间填充模型不显示）
    if (isBallStick) {
      const bondGroup = new THREE.Group();
      bondGroup.userData.isMolecule = true;

      for (const bond of bonds) {
        const fromAtom = atoms.find(a => a.id === bond.from);
        const toAtom = atoms.find(a => a.id === bond.to);
        if (!fromAtom || !toAtom) continue;

        const from = new THREE.Vector3(
          (fromAtom.x - cx) * SCALE_2D_TO_3D,
          -(fromAtom.y - cy) * SCALE_2D_TO_3D,
          0
        );
        const to = new THREE.Vector3(
          (toAtom.x - cx) * SCALE_2D_TO_3D,
          -(toAtom.y - cy) * SCALE_2D_TO_3D,
          0
        );

        const bondRadius = 0.08;
        const bondColor = new THREE.Color(0x888888);

        const createCylinder = (start: THREE.Vector3, end: THREE.Vector3, offset: THREE.Vector3) => {
          const direction = new THREE.Vector3().subVectors(end, start);
          const length = direction.length();
          if (length < 0.01) return;

          const geometry = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 8, 1);
          const material = new THREE.MeshPhongMaterial({ color: bondColor, shininess: 40 });
          const mesh = new THREE.Mesh(geometry, material);

          const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5).add(offset);
          mesh.position.copy(midpoint);

          const axis = new THREE.Vector3(0, 1, 0);
          const dir = direction.clone().normalize();
          const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);
          mesh.quaternion.copy(quaternion);

          mesh.userData = { isMolecule: true };
          bondGroup.add(mesh);
        };

        if (bond.type === 1) {
          createCylinder(from, to, new THREE.Vector3(0, 0, 0));
        } else if (bond.type === 2) {
          const direction = new THREE.Vector3().subVectors(to, from).normalize();
          const perp = new THREE.Vector3();
          if (Math.abs(direction.z) < 0.9) {
            perp.crossVectors(direction, new THREE.Vector3(0, 0, 1)).normalize();
          } else {
            perp.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
          }
          const offset = perp.multiplyScalar(0.12);
          createCylinder(from, to, offset);
          createCylinder(from, to, offset.clone().negate());
        } else if (bond.type === 3) {
          const direction = new THREE.Vector3().subVectors(to, from).normalize();
          const perp = new THREE.Vector3();
          if (Math.abs(direction.z) < 0.9) {
            perp.crossVectors(direction, new THREE.Vector3(0, 0, 1)).normalize();
          } else {
            perp.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
          }
          const offset1 = perp.clone().multiplyScalar(0.16);
          const offset2 = perp.clone().multiplyScalar(-0.16);
          createCylinder(from, to, new THREE.Vector3(0, 0, 0));
          createCylinder(from, to, offset1);
          createCylinder(from, to, offset2);
        }
      }
      scene.add(bondGroup);
    }

    // 自动调整相机距离
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      const maxDist = atoms.reduce((max, atom) => {
        const dx = (atom.x - cx) * posScale;
        const dy = (atom.y - cy) * posScale;
        return Math.max(max, Math.sqrt(dx * dx + dy * dy));
      }, 0);
      const fitDist = Math.max(8, maxDist * 3);
      camera.position.set(0, 0, fitDist);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [atoms, bonds, modelType]);

  useEffect(() => {
    buildMolecule();
  }, [buildMolecule]);

  // WebGL不可用时显示降级UI
  if (webglError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-chem-bg">
        <div className="text-center">
          <div className="text-3xl mb-3 opacity-30">🧊</div>
          <p className="text-sm text-gray-500 font-['Orbitron']">WebGL 不可用</p>
          <p className="text-xs text-gray-600 mt-1">请使用支持 WebGL 的浏览器查看 3D 预览</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      {/* 模型切换按钮 */}
      <div className="absolute top-3 left-3 flex gap-1 z-10">
        <button
          onClick={() => setModelType('ballStick')}
          className={`px-3 py-1.5 rounded-lg text-xs font-['Orbitron'] transition-all ${
            modelType === 'ballStick'
              ? 'bg-chem-accent/20 text-chem-accent border border-chem-accent/40'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:border-white/20'
          }`}
        >
          球棍模型
        </button>
        <button
          onClick={() => setModelType('spaceFill')}
          className={`px-3 py-1.5 rounded-lg text-xs font-['Orbitron'] transition-all ${
            modelType === 'spaceFill'
              ? 'bg-chem-accent/20 text-chem-accent border border-chem-accent/40'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:border-white/20'
          }`}
        >
          空间填充
        </button>
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-3 left-3 text-[10px] text-gray-500 font-['Orbitron'] space-y-0.5">
        <p>拖拽旋转 · 滚轮缩放 · Ctrl+/- 缩放</p>
      </div>

      {/* 空状态 */}
      {atoms.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30">
            <p className="text-sm font-['Orbitron'] text-chem-accent">在2D画布构建分子后查看3D预览</p>
          </div>
        </div>
      )}
    </div>
  );
}
