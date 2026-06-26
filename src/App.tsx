import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Camera, Download, ImagePlus, RefreshCw, Sparkles, X } from 'lucide-react';
import ThreeRoll from './ThreeRoll';

type FilmLook = 'gold' | 'tokyo' | 'noir';
type Template = 'stamp' | 'roll3d' | 'roll' | 'cover' | 'strip' | 'contact';

type Photo = { id: string; url: string; name: string };

const looks: Record<FilmLook, { name: string; bg: string; ink: string; wash: string; warm: string }> = {
  gold: { name: 'Kodak summer', bg: '#ead2a2', ink: '#22170d', wash: 'rgba(255,184,74,.28)', warm: 'rgba(255,126,45,.16)' },
  tokyo: { name: 'Tokyo night', bg: '#11131b', ink: '#f6ead9', wash: 'rgba(81,202,168,.22)', warm: 'rgba(255,64,129,.16)' },
  noir: { name: 'Noir diary', bg: '#d9d2c4', ink: '#171513', wash: 'rgba(0,0,0,.18)', warm: 'rgba(255,255,255,.06)' },
};

const templates: Record<Template, string> = {
  stamp: 'Film stamp',
  roll3d: '3D pull roll',
  roll: 'Fake roll',
  cover: 'Instant cover',
  strip: 'Film strip',
  contact: 'Contact sheet',
};

function image(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function photoFrame(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, look: FilmLook, radius = 26) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.38)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  rr(ctx, x, y, w, h, radius);
  ctx.fillStyle = '#f8f0df';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  rr(ctx, x + 22, y + 22, w - 44, h - 72, radius - 8);
  ctx.clip();
  cover(ctx, img, x + 22, y + 22, w - 44, h - 72);
  ctx.globalCompositeOperation = look === 'noir' ? 'saturation' : 'soft-light';
  ctx.fillStyle = looks[look].wash;
  ctx.fillRect(x + 22, y + 22, w - 44, h - 72);
  ctx.restore();

  ctx.fillStyle = '#2d2118';
  ctx.font = '700 24px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText('35MM / ' + new Date().toLocaleDateString(), x + 34, y + h - 28);
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  for (let i = 0; i < 1800; i++) {
    const v = Math.random() > .5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},.055)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 1.8, Math.random() * 1.8);
  }
}

function filmHoles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#080705';
  for (let i = 0; i < 13; i++) {
    const hx = x + 26 + i * ((w - 80) / 12);
    rr(ctx, hx, y + 18, 30, 44, 8); ctx.fill();
    rr(ctx, hx, y + h - 62, 30, 44, 8); ctx.fill();
  }
}

function verticalHoles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = 'rgba(4,4,4,.72)';
  for (let i = 0; i < 17; i++) {
    const hy = y + 22 + i * ((h - 70) / 16);
    rr(ctx, x + 12, hy, 28, 36, 7); ctx.fill();
    rr(ctx, x + w - 40, hy, 28, 36, 7); ctx.fill();
  }
}

function drawStamp(ctx: CanvasRenderingContext2D, img: HTMLImageElement, look: FilmLook, caption: string) {
  const W = 1200, H = 1600;
  cover(ctx, img, 0, 0, W, H);
  ctx.globalCompositeOperation = look === 'noir' ? 'saturation' : 'soft-light';
  ctx.fillStyle = looks[look].wash;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  const top = ctx.createLinearGradient(0, 0, 0, 360);
  top.addColorStop(0, 'rgba(0,0,0,.62)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, W, 360);
  const bottom = ctx.createLinearGradient(0, H - 430, 0, H);
  bottom.addColorStop(0, 'rgba(0,0,0,0)');
  bottom.addColorStop(1, 'rgba(0,0,0,.72)');
  ctx.fillStyle = bottom; ctx.fillRect(0, H - 430, W, 430);

  ctx.strokeStyle = 'rgba(255,238,198,.78)';
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, W - 96, H - 96);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,238,198,.34)';
  ctx.strokeRect(76, 76, W - 152, H - 152);

  ctx.fillStyle = 'rgba(255,238,198,.92)';
  ctx.font = '900 42px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText('35MM', 82, 125);
  ctx.font = '800 23px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(new Date().toLocaleString().toUpperCase(), 82, 162);
  ctx.fillText('ISO 400   F/2.8   1/125', 82, 196);

  ctx.save();
  ctx.translate(W - 92, 210);
  ctx.rotate(Math.PI / 2);
  ctx.font = '900 31px ui-monospace, monospace';
  ctx.fillText('FAKE FILM ROLL  /  EXP. 27  /  NO. 04', 0, 0);
  ctx.restore();

  for (let i = 0; i < 36; i++) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,238,198,.85)' : 'rgba(255,238,198,.45)';
    ctx.fillRect(82 + i * 16, H - 176, i % 4 === 0 ? 9 : 5, 66);
  }
  ctx.font = '900 52px ui-sans-serif, system-ui';
  ctx.fillText(caption || 'SHOT ON FAKE FILM', 82, H - 245);
  ctx.font = '800 22px ui-monospace, monospace';
  ctx.fillText('FRAME 01  •  LIGHT LEAK VERIFIED  •  FAKEFILMROLL.APP', 82, H - 92);
}

function drawFakeRoll(ctx: CanvasRenderingContext2D, imgs: HTMLImageElement[], look: FilmLook, caption: string) {
  const W = 1200, H = 1600;
  const wood = ctx.createLinearGradient(0, 0, W, H);
  wood.addColorStop(0, '#e3c993'); wood.addColorStop(.48, '#b88b52'); wood.addColorStop(1, '#6f4729');
  ctx.fillStyle = wood; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 100; i++) {
    ctx.strokeStyle = `rgba(75,42,16,${Math.random() * .13})`;
    ctx.lineWidth = Math.random() * 5 + 1;
    ctx.beginPath(); ctx.moveTo(0, Math.random() * H); ctx.bezierCurveTo(350, Math.random() * H, 820, Math.random() * H, W, Math.random() * H); ctx.stroke();
  }

  const tableShadow = ctx.createRadialGradient(610, 855, 80, 610, 855, 470);
  tableShadow.addColorStop(0, 'rgba(0,0,0,.45)'); tableShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tableShadow; ctx.fillRect(150, 560, 900, 650);

  // 3D film canister core
  ctx.save();
  ctx.translate(600, 300); ctx.rotate(-0.08);
  ctx.shadowColor = 'rgba(0,0,0,.42)'; ctx.shadowBlur = 45; ctx.shadowOffsetY = 30;
  const body = ctx.createLinearGradient(-260, 0, 260, 0);
  body.addColorStop(0, '#080808'); body.addColorStop(.18, '#34312d'); body.addColorStop(.52, '#111'); body.addColorStop(.78, '#4b4135'); body.addColorStop(1, '#080808');
  rr(ctx, -285, 0, 570, 250, 36); ctx.fillStyle = body; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = look === 'tokyo' ? '#52d3bd' : '#f6c044'; rr(ctx, -210, 36, 420, 178, 20); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = '900 82px ui-sans-serif, system-ui'; ctx.fillText('250D', -176, 132);
  ctx.font = '900 30px ui-monospace, monospace'; ctx.fillText('FAKE COLOR NEGATIVE', -176, 178);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-255, 18, 510, 12);
  ctx.beginPath(); ctx.ellipse(-286, 125, 58, 126, 0, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(286, 125, 58, 126, 0, 0, Math.PI * 2); ctx.fillStyle = '#24211f'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(286, 125, 31, 72, 0, 0, Math.PI * 2); ctx.fillStyle = '#070707'; ctx.fill();
  ctx.restore();

  // Curved strip, rendered as slices for faux perspective
  ctx.save();
  ctx.translate(590, 445); ctx.rotate(-0.035);
  const stripW = 390, stripH = 900;
  for (let row = 0; row < 92; row++) {
    const t = row / 91;
    const wave = Math.sin(t * Math.PI * 1.2) * 46;
    const scale = .82 + t * .22;
    const sx = -stripW * scale / 2 + wave;
    const sy = row * (stripH / 92);
    ctx.fillStyle = `rgba(12,13,15,${.84 + t * .08})`;
    ctx.fillRect(sx, sy, stripW * scale, stripH / 80 + 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  verticalHoles(ctx, -210, 0, 420, stripH);
  const n = Math.min(Math.max(imgs.length, 1), 4);
  for (let i = 0; i < n; i++) {
    const fy = 78 + i * 198;
    const bend = Math.sin((fy / stripH) * Math.PI * 1.2) * 46;
    const fw = 250, fh = 168;
    ctx.save();
    ctx.translate(bend, fy); ctx.rotate((i - 1.5) * .012);
    rr(ctx, -fw / 2, 0, fw, fh, 13); ctx.clip();
    cover(ctx, imgs[i % imgs.length], -fw / 2, 0, fw, fh);
    ctx.globalCompositeOperation = look === 'noir' ? 'saturation' : 'screen';
    ctx.fillStyle = look === 'tokyo' ? 'rgba(54,220,180,.26)' : 'rgba(245,225,185,.24)'; ctx.fillRect(-fw / 2, 0, fw, fh);
    ctx.restore();
  }
  const hi = ctx.createLinearGradient(-210, 0, 210, 0);
  hi.addColorStop(0, 'rgba(255,255,255,0)'); hi.addColorStop(.42, 'rgba(255,255,255,.18)'); hi.addColorStop(.55, 'rgba(255,255,255,.02)'); hi.addColorStop(1, 'rgba(0,0,0,.25)');
  ctx.fillStyle = hi; ctx.fillRect(-210, 0, 420, stripH);
  for (let i = 0; i < 55; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * .28})`;
    ctx.beginPath(); ctx.moveTo(-160 + Math.random() * 320, Math.random() * stripH); ctx.lineTo(-160 + Math.random() * 320, Math.random() * stripH); ctx.stroke();
  }
  ctx.restore();

  ctx.save(); ctx.translate(318, 1270); ctx.rotate(.06);
  rr(ctx, 0, 0, 560, 176, 28); ctx.fillStyle = '#17110b'; ctx.fill();
  ctx.fillStyle = '#f7c543'; ctx.font = '900 58px ui-sans-serif, system-ui'; ctx.fillText('UNDEVELOPED', 34, 72);
  ctx.fillStyle = '#fff1ce'; ctx.font = '900 26px ui-monospace, monospace'; ctx.fillText('3D FILM OBJECT / 36 EXP', 34, 116);
  ctx.fillText((caption || 'MEMORY ROLL').toUpperCase(), 34, 150);
  ctx.restore();
}

async function render(canvas: HTMLCanvasElement, photos: Photo[], look: FilmLook, template: Template, caption: string) {
  const W = 1200;
  const H = 1600;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const l = looks[look];
  const imgs = await Promise.all(photos.slice(0, 6).map((p) => image(p.url)));

  if (template === 'stamp') {
    drawStamp(ctx, imgs[0], look, caption);
    grain(ctx, W, H);
    return;
  }

  if (template === 'roll') {
    drawFakeRoll(ctx, imgs, look, caption);
    grain(ctx, W, H);
    return;
  }

  ctx.fillStyle = l.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(150, 120, 10, 150, 120, 900);
  glow.addColorStop(0, l.warm);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = l.ink;
  ctx.font = '900 78px ui-sans-serif, system-ui';
  ctx.fillText('FILM ROLL', 74, 122);
  ctx.font = '700 26px ui-monospace, SFMono-Regular, monospace';
  ctx.globalAlpha = .72;
  ctx.fillText(`${l.name.toUpperCase()}  •  FRAME ${String(imgs.length).padStart(2, '0')}`, 80, 166);
  ctx.globalAlpha = 1;

  if (template === 'cover' || imgs.length === 1) {
    photoFrame(ctx, imgs[0], 105, 245, 990, 1040, look, 34);
  }

  if (template === 'strip' && imgs.length > 1) {
    const x = 80, y = 300, w = 1040, h = 780;
    rr(ctx, x, y, w, h, 36); ctx.fillStyle = '#12100e'; ctx.fill();
    filmHoles(ctx, x, y, w, h);
    const n = Math.min(imgs.length, 3);
    const fw = (w - 120 - (n - 1) * 26) / n;
    for (let i = 0; i < n; i++) {
      rr(ctx, x + 60 + i * (fw + 26), y + 105, fw, h - 210, 18); ctx.save(); ctx.clip();
      cover(ctx, imgs[i], x + 60 + i * (fw + 26), y + 105, fw, h - 210);
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = l.wash; ctx.fillRect(x + 60 + i * (fw + 26), y + 105, fw, h - 210); ctx.restore();
      ctx.fillStyle = '#f3dbae'; ctx.font = '700 22px ui-monospace, monospace'; ctx.fillText(`0${i + 1}`, x + 78 + i * (fw + 26), y + h - 76);
    }
  }

  if (template === 'contact' && imgs.length > 1) {
    const cols = 2, gap = 28, x0 = 90, y0 = 260, fw = 491, fh = 360;
    for (let i = 0; i < Math.min(imgs.length, 6); i++) {
      const x = x0 + (i % cols) * (fw + gap);
      const y = y0 + Math.floor(i / cols) * (fh + 76);
      photoFrame(ctx, imgs[i], x, y, fw, fh + 56, look, 18);
      ctx.fillStyle = l.ink; ctx.font = '800 22px ui-monospace, monospace'; ctx.fillText(`FRAME ${String(i + 1).padStart(2, '0')}`, x + 28, y + fh + 32);
    }
  }

  ctx.fillStyle = l.ink;
  ctx.textAlign = 'center';
  ctx.font = '800 36px ui-sans-serif, system-ui';
  ctx.fillText(caption || 'shot on fake film', W / 2, 1430);
  ctx.globalAlpha = .55;
  ctx.font = '700 20px ui-monospace, monospace';
  ctx.fillText('FAKEFILMROLL.APP', W / 2, 1472);
  ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = 'multiply';
  const vignette = ctx.createRadialGradient(W / 2, H / 2, 420, W / 2, H / 2, 980);
  vignette.addColorStop(0, 'rgba(255,255,255,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,.18)');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  grain(ctx, W, H);
}

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [look, setLook] = useState<FilmLook>('gold');
  const [template, setTemplate] = useState<Template>('stamp');
  const [caption, setCaption] = useState('today felt like a movie');
  const [cameraOpen, setCameraOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!photos.length || !canvasRef.current) return;
    render(canvasRef.current, photos, look, template, caption);
  }, [photos, look, template, caption]);

  async function openCamera() {
    setCameraOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    streamRef.current = stream;
    setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 0);
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function snap() {
    const video = videoRef.current;
    if (!video) return;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d')!.drawImage(video, 0, 0);
    setPhotos([{ id: crypto.randomUUID(), url: c.toDataURL('image/jpeg', .92), name: 'camera.jpg' }]);
    setTemplate('stamp');
    closeCamera();
  }

  function upload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    const next = files.map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), name: file.name }));
    setPhotos(next.slice(0, 6));
    setTemplate(next.length > 1 ? 'roll3d' : 'stamp');
    e.target.value = '';
  }

  function download() {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `fake-film-roll-${Date.now()}.png`;
    a.click();
  }

  return <main className="shell">
    <section className="top">
      <div className="mark"><Sparkles size={16}/> fake film roll</div>
      <h1>Shoot it. Make it look like film.</h1>
      <p>No timeline, no editing headache. Take one photo or upload a dump — get a beautiful retro frame instantly.</p>
      <div className="quick">
        <button className="shoot" onClick={openCamera}><Camera/> Take photo</button>
        <label className="uploadBtn"><ImagePlus/> Upload photos<input type="file" accept="image/*" multiple onChange={upload}/></label>
      </div>
    </section>

    <section className="studio">
      <aside className="controls">
        <div className="miniTitle">1. Pick a vibe</div>
        <div className="seg">{(Object.keys(looks) as FilmLook[]).map(k => <button key={k} className={look === k ? 'on' : ''} onClick={() => setLook(k)}>{looks[k].name}</button>)}</div>
        <div className="miniTitle">2. Pick format</div>
        <div className="seg">{(Object.keys(templates) as Template[]).map(k => <button key={k} className={template === k ? 'on' : ''} onClick={() => setTemplate(k)}>{templates[k]}</button>)}</div>
        <div className="miniTitle">3. Caption</div>
        <input className="caption" value={caption} maxLength={38} onChange={(e) => setCaption(e.target.value)} />
        <button className="download" disabled={!photos.length || template === 'roll3d'} onClick={download}><Download/> Save image</button>
        <button className="reset" disabled={!photos.length} onClick={() => setPhotos([])}><RefreshCw/> Start over</button>
      </aside>

      <div className="phone">
        {!photos.length ? <div className="placeholder"><Camera size={54}/><b>Tap “Take photo”</b><span>or upload one image — preview shows here instantly.</span></div> : template === 'roll3d' ? <ThreeRoll photos={photos} look={look} caption={caption} /> : <canvas ref={canvasRef}/>} 
      </div>
    </section>

    {cameraOpen && <div className="cameraModal">
      <button className="close" onClick={closeCamera}><X/></button>
      <video ref={videoRef} autoPlay playsInline />
      <button className="shutter" onClick={snap}></button>
    </div>}
  </main>;
}
