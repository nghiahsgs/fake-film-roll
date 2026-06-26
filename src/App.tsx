import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Download, ImagePlus, Sparkles, Trash2 } from 'lucide-react';

type FilmLook = 'kodak' | 'fuji' | 'mono' | 'disposable';
type Layout = 'story' | 'square' | 'wide';

type Photo = {
  id: string;
  file: File;
  url: string;
};

const LOOKS: Record<FilmLook, { label: string; accent: string; temp: number; contrast: number; saturation: number }> = {
  kodak: { label: 'Kodak Gold', accent: '#f6c04d', temp: 18, contrast: 1.09, saturation: 1.16 },
  fuji: { label: 'Fuji Green', accent: '#41b77a', temp: -10, contrast: 1.04, saturation: 1.1 },
  mono: { label: 'B&W 400TX', accent: '#e7e2d8', temp: 0, contrast: 1.22, saturation: 0 },
  disposable: { label: 'Disposable', accent: '#ff6f91', temp: 28, contrast: 0.98, saturation: 1.28 },
};

const LAYOUTS: Record<Layout, { label: string; width: number; height: number }> = {
  story: { label: 'Story 9:16', width: 1080, height: 1920 },
  square: { label: 'Square', width: 1080, height: 1080 },
  wide: { label: 'Wide post', width: 1600, height: 1000 },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, look: FilmLook) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;

  ctx.save();
  roundedRect(ctx, x, y, w, h, 18);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);

  const cfg = LOOKS[look];
  if (look === 'mono') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, w, h);
  } else {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = cfg.temp > 0 ? `rgba(255, 184, 92, ${cfg.temp / 100})` : `rgba(47, 165, 120, ${Math.abs(cfg.temp) / 90})`;
    ctx.fillRect(x, y, w, h);
  }

  ctx.globalCompositeOperation = 'multiply';
  const grad = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) / 5, x + w / 2, y + h / 2, Math.max(w, h) / 1.15);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawGrain(ctx: CanvasRenderingContext2D, width: number, height: number, opacity = 0.08) {
  const count = Math.floor((width * height) / 900);
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const shade = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${opacity})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
  }
  ctx.restore();
}

function drawLightLeaks(ctx: CanvasRenderingContext2D, width: number, height: number, accent: string) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const g1 = ctx.createRadialGradient(width * 0.04, height * 0.13, 10, width * 0.04, height * 0.13, width * 0.5);
  g1.addColorStop(0, `${accent}bb`);
  g1.addColorStop(0.55, `${accent}44`);
  g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, width, height);

  const g2 = ctx.createLinearGradient(width * 0.72, 0, width, height);
  g2.addColorStop(0, 'rgba(255,120,55,0.26)');
  g2.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawSprockets(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, horizontal: boolean) {
  ctx.fillStyle = '#080706';
  if (horizontal) {
    const holes = Math.floor(w / 72);
    for (let i = 0; i < holes; i += 1) {
      const hx = x + 24 + i * ((w - 48) / holes);
      roundedRect(ctx, hx, y + 16, 28, 42, 7);
      ctx.fill();
      roundedRect(ctx, hx, y + h - 58, 28, 42, 7);
      ctx.fill();
    }
  } else {
    const holes = Math.floor(h / 74);
    for (let i = 0; i < holes; i += 1) {
      const hy = y + 24 + i * ((h - 48) / holes);
      roundedRect(ctx, x + 16, hy, 42, 28, 7);
      ctx.fill();
      roundedRect(ctx, x + w - 58, hy, 42, 28, 7);
      ctx.fill();
    }
  }
}

async function renderFilmRoll(canvas: HTMLCanvasElement, photos: Photo[], look: FilmLook, layout: Layout, caption: string) {
  const { width, height } = LAYOUTS[layout];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cfg = LOOKS[look];
  ctx.fillStyle = '#14110f';
  ctx.fillRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#2a211c');
  bg.addColorStop(0.45, '#111');
  bg.addColorStop(1, '#302016');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#f5ead9';
  ctx.font = `700 ${Math.round(width * 0.045)}px ui-sans-serif, system-ui`;
  ctx.fillText('FAKE FILM ROLL', width * 0.06, height * 0.07);
  ctx.fillStyle = cfg.accent;
  ctx.font = `600 ${Math.round(width * 0.022)}px ui-monospace, SFMono-Regular`;
  ctx.fillText(`${cfg.label} • ${new Date().toLocaleDateString()}`, width * 0.06, height * 0.098);

  const horizontal = layout !== 'story';
  const stripX = width * 0.055;
  const stripY = horizontal ? height * 0.22 : height * 0.14;
  const stripW = width * 0.89;
  const stripH = horizontal ? height * 0.54 : height * 0.72;

  roundedRect(ctx, stripX, stripY, stripW, stripH, 28);
  ctx.fillStyle = '#0d0b09';
  ctx.fill();
  drawSprockets(ctx, stripX, stripY, stripW, stripH, horizontal);

  const maxFrames = horizontal ? Math.min(photos.length, 4) : Math.min(photos.length, 5);
  const imgs = await Promise.all(photos.slice(0, maxFrames).map((p) => loadImage(p.url)));
  const pad = horizontal ? 82 : 84;
  const gap = 22;
  const frameAreaX = stripX + (horizontal ? 34 : pad);
  const frameAreaY = stripY + (horizontal ? pad : 34);
  const frameAreaW = stripW - (horizontal ? 68 : pad * 2);
  const frameAreaH = stripH - (horizontal ? pad * 2 : 68);

  imgs.forEach((img, i) => {
    const fw = horizontal ? (frameAreaW - gap * (maxFrames - 1)) / maxFrames : frameAreaW;
    const fh = horizontal ? frameAreaH : (frameAreaH - gap * (maxFrames - 1)) / maxFrames;
    const fx = horizontal ? frameAreaX + i * (fw + gap) : frameAreaX;
    const fy = horizontal ? frameAreaY : frameAreaY + i * (fh + gap);

    drawCover(ctx, img, fx, fy, fw, fh, look);
    ctx.strokeStyle = '#27201a';
    ctx.lineWidth = 7;
    roundedRect(ctx, fx, fy, fw, fh, 18);
    ctx.stroke();

    ctx.fillStyle = '#e8d7b7';
    ctx.font = `700 ${Math.round(width * 0.015)}px ui-monospace, SFMono-Regular`;
    ctx.fillText(String(i + 1).padStart(2, '0'), fx + 14, fy + fh - 16);
  });

  ctx.save();
  ctx.translate(width * 0.5, height * 0.94);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f1dfc7';
  ctx.font = `600 ${Math.round(width * 0.026)}px ui-sans-serif, system-ui`;
  ctx.fillText(caption || 'your memories, shot on fake 35mm', 0, 0);
  ctx.fillStyle = 'rgba(245,234,217,0.62)';
  ctx.font = `500 ${Math.round(width * 0.016)}px ui-monospace, SFMono-Regular`;
  ctx.fillText('made with fakefilmroll.app', 0, 32);
  ctx.restore();

  drawLightLeaks(ctx, width, height, cfg.accent);
  drawGrain(ctx, width, height, look === 'mono' ? 0.12 : 0.08);
}

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [look, setLook] = useState<FilmLook>('kodak');
  const [layout, setLayout] = useState<Layout>('story');
  const [caption, setCaption] = useState('summer looked better on film');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const previewPhotos = useMemo(() => photos.slice(0, layout === 'story' ? 5 : 4), [photos, layout]);

  useEffect(() => {
    if (!canvasRef.current || previewPhotos.length === 0) return;
    renderFilmRoll(canvasRef.current, previewPhotos, look, layout, caption);
  }, [previewPhotos, look, layout, caption]);

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/'));
    setPhotos((current) => [
      ...current,
      ...files.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file) })),
    ].slice(0, 12));
    e.target.value = '';
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `fake-film-roll-${Date.now()}.png`;
    link.click();
  }

  function clearPhotos() {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
  }

  return (
    <main className="app">
      <section className="hero">
        <div className="badge"><Sparkles size={16} /> instant nostalgia generator</div>
        <h1>Turn your camera roll into a 35mm film strip.</h1>
        <p>Upload a few photos, pick a film look, export a ready-to-share retro roll for Stories, posts, or moodboards.</p>
      </section>

      <section className="workspace">
        <aside className="panel">
          <label className="upload">
            <ImagePlus />
            <span>Upload photos</span>
            <small>3–12 images works best</small>
            <input type="file" accept="image/*" multiple onChange={onFiles} />
          </label>

          <div className="control">
            <span>Film look</span>
            <div className="chips">
              {(Object.keys(LOOKS) as FilmLook[]).map((key) => (
                <button key={key} className={look === key ? 'active' : ''} onClick={() => setLook(key)}>
                  {LOOKS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="control">
            <span>Export size</span>
            <div className="chips">
              {(Object.keys(LAYOUTS) as Layout[]).map((key) => (
                <button key={key} className={layout === key ? 'active' : ''} onClick={() => setLayout(key)}>
                  {LAYOUTS[key].label}
                </button>
              ))}
            </div>
          </div>

          <label className="control">
            <span>Caption</span>
            <input value={caption} maxLength={48} onChange={(e) => setCaption(e.target.value)} placeholder="your memories, shot on fake 35mm" />
          </label>

          <div className="thumbs">
            {photos.length === 0 ? <p>No photos yet. Drop in your favorites.</p> : photos.map((photo) => <img key={photo.id} src={photo.url} alt={photo.file.name} />)}
          </div>

          <div className="actions">
            <button className="primary" disabled={photos.length === 0} onClick={download}><Download size={18} /> Export PNG</button>
            <button className="ghost" disabled={photos.length === 0} onClick={clearPhotos}><Trash2 size={18} /> Clear</button>
          </div>
        </aside>

        <div className="preview">
          {photos.length === 0 ? (
            <div className="empty">
              <Camera size={64} />
              <h2>Your film roll preview appears here</h2>
              <p>Start with a few photos. The app renders everything locally in your browser.</p>
            </div>
          ) : null}
          <canvas ref={canvasRef} className={photos.length === 0 ? 'hidden' : ''} />
        </div>
      </section>
    </main>
  );
}
