import { useState } from 'react';
import { X, Printer, CreditCard, Download } from 'lucide-react';

// Native image size (both cards are 296×502 px)
const W = 296;
const H = 502;

function fmt(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return '—'; }
}

// ── Canvas helpers ────────────────────────────────────────────────────────────
function loadImage(src, crossOrigin = false) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedClip(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

async function downloadCards(student) {
  const name  = student.user?.name  || '—';
  const cls   = student.class
    ? `${student.class.name}${student.class.section ? ' - ' + student.class.section : ''}`
    : '—';
  const phone = student.user?.phone || '—';
  const dob   = fmt(student.dateOfBirth);
  const blood = student.bloodGroup  || '—';
  const base  = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  const photoUrl = student.photo
    ? (student.photo.startsWith('http') ? student.photo : `${base}${student.photo}`)
    : null;

  const safeName = name.replace(/\s+/g, '_');

  // ── Front card ──────────────────────────────────────────────────────────────
  const fc = document.createElement('canvas');
  fc.width = W; fc.height = H;
  const ctx = fc.getContext('2d');

  const frontImg = await loadImage('/id-card-front.png');
  ctx.drawImage(frontImg, 0, 0, W, H);

  // Photo box (mirrors React: left=79 top=130 w=144 h=150 r=10)
  ctx.save();
  roundedClip(ctx, 79, 130, 144, 150, 10);
  ctx.clip();
  ctx.fillStyle = '#fff';
  ctx.fillRect(79, 130, 144, 150);

  if (photoUrl) {
    try {
      const photo = await loadImage(photoUrl, true);
      // Cover fit
      const pr = photo.width / photo.height;
      const br = 144 / 150;
      let sx = 0, sy = 0, sw = photo.width, sh = photo.height;
      if (pr > br) { sw = photo.height * br; sx = (photo.width - sw) / 2; }
      else         { sh = photo.width / br;  sy = (photo.height - sh) / 2; }
      ctx.drawImage(photo, sx, sy, sw, sh, 79, 130, 144, 150);
    } catch {
      // Fallback: draw initial
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 52px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.charAt(0).toUpperCase(), 79 + 72, 130 + 75);
    }
  } else {
    // No photo — draw initial
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), 79 + 72, 130 + 75);
  }
  ctx.restore();

  // Student name (mirrors React: top=292, center, uppercase, bold 17px)
  ctx.fillStyle = '#1e3a8a';
  ctx.font = '900 17px "Arial Black", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(name.toUpperCase(), W / 2, 292);

  // Field values (mirrors React: left=154, fontSize=11, top=330/356/381/407)
  ctx.font = '600 11px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  [[cls, 330], [phone, 356], [dob, 381], [blood, 407]].forEach(([val, top]) => {
    ctx.fillText(val, 154, top);
  });

  // Trigger download
  const a = document.createElement('a');
  a.download = `${safeName}_id-card-front.png`;
  a.href = fc.toDataURL('image/png');
  a.click();

  // Small delay so browser doesn't block the second download
  await new Promise(r => setTimeout(r, 400));

  // ── Back card (pure image, no overlays) ────────────────────────────────────
  const bc = document.createElement('canvas');
  bc.width = W; bc.height = H;
  const bctx = bc.getContext('2d');
  const backImg = await loadImage('/id-card-back.png');
  bctx.drawImage(backImg, 0, 0, W, H);

  const b = document.createElement('a');
  b.download = `${safeName}_id-card-back.png`;
  b.href = bc.toDataURL('image/png');
  b.click();
}

// ── Front card: image template + absolute overlays ──────────────────────────
function CardFront({ s }) {
  const name  = s.user?.name  || '—';
  const cls   = s.class ? `${s.class.name}${s.class.section ? ' - ' + s.class.section : ''}` : '—';
  const phone = s.user?.phone || '—';
  const dob   = fmt(s.dateOfBirth);
  const blood = s.bloodGroup  || '—';

  const base    = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
    : '';
  const photoUrl = s.photo
    ? (s.photo.startsWith('http') ? s.photo : `${base}${s.photo}`)
    : null;

  return (
    <div style={{ position: 'relative', width: W, height: H, flexShrink: 0 }}>

      {/* Background template */}
      <img
        src="/id-card-front.png"
        alt="ID card front"
        style={{ width: W, height: H, display: 'block' }}
      />

      {/* Student photo */}
      <div style={{
        position: 'absolute', left: 79, top: 130, width: 144, height: 150,
        borderRadius: 10, overflow: 'hidden',
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {photoUrl
          ? <img src={photoUrl} alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{
              fontSize: 52, fontWeight: 'bold', color: '#1e3a8a',
              fontFamily: 'Arial,sans-serif', userSelect: 'none',
            }}>
              {name.charAt(0).toUpperCase()}
            </span>
        }
      </div>

      {/* Student name */}
      <div style={{
        position: 'absolute', left: 0, top: 292, width: W,
        textAlign: 'center',
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: 17, fontWeight: '900',
        color: '#1e3a8a', letterSpacing: 0.5,
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>
        {name}
      </div>

      {/* Field values */}
      {[
        { value: cls,   top: 330 },
        { value: phone, top: 356 },
        { value: dob,   top: 381 },
        { value: blood, top: 407 },
      ].map(({ value, top }) => (
        <div key={top} style={{
          position: 'absolute', left: 154, top,
          fontFamily: 'Arial,sans-serif', fontSize: 11,
          fontWeight: '600', color: '#1e3a8a',
          whiteSpace: 'nowrap', maxWidth: 140,
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {value}
        </div>
      ))}

    </div>
  );
}

// ── Back card: pure image, no overlays needed ─────────────────────────────────
function CardBack() {
  return (
    <div style={{ position: 'relative', width: W, height: H, flexShrink: 0 }}>
      <img
        src="/id-card-back.png"
        alt="ID card back"
        style={{ width: W, height: H, display: 'block' }}
      />
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export default function IDCardModal({ student, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCards(student);
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Print CSS: only #id-card-print-root visible, landscape page */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #id-card-print-root, #id-card-print-root * { visibility: visible !important; }
          #id-card-print-root {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 32px !important;
            background: white !important;
            padding: 20px !important;
          }
          @page { size: landscape; margin: 8mm; }
        }
      `}} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Student ID Card</h2>
                <p className="text-xs text-gray-400">{student?.user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold transition"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Downloading…' : 'Download PNG'}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="p-6 overflow-auto">
            <p className="text-xs text-center text-gray-400 mb-4">
              Preview — <strong>Download PNG</strong> saves front &amp; back as separate images
            </p>

            {/* Column labels (hidden during print) */}
            <div className="flex gap-8 justify-center mb-2">
              <div style={{ width: W }} className="text-xs text-center text-gray-400 font-medium uppercase tracking-wide">Front</div>
              <div style={{ width: W }} className="text-xs text-center text-gray-400 font-medium uppercase tracking-wide">Back</div>
            </div>

            {/* Print root */}
            <div id="id-card-print-root" className="flex gap-8 justify-center items-start">
              <CardFront s={student} />
              <CardBack />
            </div>
          </div>

          <div className="px-6 pb-5 text-center">
            <p className="text-xs text-gray-400">
              Use <strong>landscape</strong> orientation in the print dialog · PNG downloads front &amp; back separately
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
