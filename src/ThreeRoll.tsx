import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Download } from 'lucide-react';

type Photo = { id: string; url: string; name: string };
type FilmLook = 'gold' | 'tokyo' | 'noir';

type Props = {
  photos: Photo[];
  look: FilmLook;
  caption: string;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function makeStripTexture(photos: Photo[], look: FilmLook, caption: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 4096;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imgs = await Promise.all(photos.slice(0, 6).map((p) => loadImage(p.url)));
  const frameH = 520;
  const gap = 70;
  const x = 170;
  const w = 684;
  let y = 180;

  for (let i = 0; i < 38; i++) {
    const hy = 34 + i * 106;
    ctx.fillStyle = '#020202';
    ctx.roundRect(28, hy, 82, 58, 12); ctx.fill();
    ctx.roundRect(914, hy, 82, 58, 12); ctx.fill();
  }

  imgs.forEach((img, i) => {
    ctx.save();
    ctx.roundRect(x, y, w, frameH, 28);
    ctx.clip();
    const s = Math.max(w / img.width, frameH / img.height);
    const sw = w / s;
    const sh = frameH / s;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, frameH);
    ctx.globalCompositeOperation = look === 'noir' ? 'saturation' : 'screen';
    ctx.fillStyle = look === 'tokyo' ? 'rgba(40,220,190,.22)' : 'rgba(255,210,120,.20)';
    ctx.fillRect(x, y, w, frameH);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 8;
    ctx.strokeRect(x, y, w, frameH);
    ctx.fillStyle = '#f6d28a';
    ctx.font = '900 42px ui-monospace, monospace';
    ctx.fillText(`FRAME ${String(i + 1).padStart(2, '0')}`, x, y + frameH + 46);
    y += frameH + gap;
  });

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(255,255,255,.04)');
  grad.addColorStop(.38, 'rgba(255,255,255,.26)');
  grad.addColorStop(.52, 'rgba(0,0,0,.08)');
  grad.addColorStop(1, 'rgba(0,0,0,.34)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  ctx.save();
  ctx.translate(928, 300);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = 'rgba(246,210,138,.82)';
  ctx.font = '900 54px ui-monospace, monospace';
  ctx.fillText(`FAKE FILM ROLL / ${caption.toUpperCase() || 'MEMORY'} / 36 EXP`, 0, 0);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export default function ThreeRoll({ photos, look, caption }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pullRef = useRef(62);
  const [pull, setPull] = useState(62);

  useEffect(() => {
    if (!mountRef.current || photos.length === 0) return;
    const mount = mountRef.current;
    mount.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0907);
    scene.fog = new THREE.Fog(0x0b0907, 7, 15);

    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0.2, 2.0, 8.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const group = new THREE.Group();
    group.rotation.x = -0.15;
    scene.add(group);

    const hemi = new THREE.HemisphereLight(0xffefd0, 0x161616, 1.35);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffdfab, 4.5);
    key.position.set(-3.5, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(key);
    const rim = new THREE.PointLight(look === 'tokyo' ? 0x33e1c3 : 0xff8d45, 18, 8);
    rim.position.set(3.4, 2.2, 2.2);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.72, metalness: 0.04 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.15;
    floor.receiveShadow = true;
    scene.add(floor);

    let strip: THREE.Mesh | null = null;
    makeStripTexture(photos, look, caption).then((texture) => {
      const geo = new THREE.PlaneGeometry(2.25, 6.9, 36, 150);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const x = pos.getX(i);
        const t = (y + 3.45) / 6.9;
        pos.setZ(i, Math.sin(t * Math.PI * 1.35) * 1.05 + x * x * 0.08);
        pos.setX(i, x + Math.sin(t * Math.PI * 1.1) * 0.35);
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshPhysicalMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.35,
        metalness: 0.0,
        clearcoat: 0.82,
        clearcoatRoughness: 0.18,
        transparent: false,
      });
      strip = new THREE.Mesh(geo, mat);
      strip.castShadow = true;
      strip.receiveShadow = true;
      strip.position.set(0, -0.25, 0.15);
      strip.rotation.x = -0.08;
      group.add(strip);
    });

    const metal = new THREE.MeshPhysicalMaterial({ color: 0x15110e, roughness: 0.28, metalness: 0.78, clearcoat: 0.65 });
    const label = new THREE.MeshStandardMaterial({ color: look === 'tokyo' ? 0x38d8bd : 0xf4bd36, roughness: 0.48 });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 2.55, 80), metal);
    can.rotation.z = Math.PI / 2;
    can.position.set(0, 2.65, .03);
    can.castShadow = true;
    group.add(can);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.775, 0.775, 1.72, 80, 1, true, 0.2, Math.PI * 1.35), label);
    sleeve.rotation.z = Math.PI / 2;
    sleeve.position.copy(can.position);
    sleeve.castShadow = true;
    group.add(sleeve);

    const capMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.35, metalness: 0.55 });
    [-1.36, 1.36].forEach((x) => {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.14, 80), capMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(x, 2.65, .03);
      cap.castShadow = true;
      group.add(cap);
    });

    const particles = new THREE.Group();
    for (let i = 0; i < 90; i++) {
      const dust = new THREE.Mesh(new THREE.SphereGeometry(Math.random() * .012 + .004, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe1aa, transparent: true, opacity: Math.random() * .5 }));
      dust.position.set((Math.random() - .5) * 6, (Math.random() - .5) * 5 + .4, (Math.random() - .5) * 4);
      particles.add(dust);
    }
    scene.add(particles);

    let dragging = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      group.rotation.y += (e.clientX - lastX) * 0.008;
      lastX = e.clientX;
    };
    const onUp = () => { dragging = false; };
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let frame = 0;
    let raf = 0;
    const animate = () => {
      frame += 0.01;
      if (!dragging) group.rotation.y += 0.0025;
      group.position.y = Math.sin(frame) * 0.035;
      const p = pullRef.current / 100;
      if (strip) {
        strip.scale.y = 0.42 + p * 0.78;
        strip.position.y = 1.15 - p * 1.9;
        strip.position.z = -0.25 + p * 0.5;
      }
      can.rotation.x += 0.01 + p * 0.018;
      particles.rotation.y -= 0.0015;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
      mount.innerHTML = '';
    };
  }, [photos, look, caption]);

  function save() {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const a = document.createElement('a');
    a.href = renderer.domElement.toDataURL('image/png');
    a.download = `fake-film-roll-3d-${Date.now()}.png`;
    a.click();
  }

  return <div className="threeWrap">
    <div ref={mountRef} className="threeMount" />
    <div className="threeHud">
      <span>Drag to rotate</span>
      <label className="pullControl">Pull film
        <input type="range" min="18" max="100" value={pull} onChange={(e) => { const v = Number(e.target.value); pullRef.current = v; setPull(v); }} />
      </label>
      <button onClick={save}><Download size={16}/> Save 3D</button>
    </div>
  </div>;
}
