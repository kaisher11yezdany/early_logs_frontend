import { useState } from 'react';
import { X, Printer, Download } from 'lucide-react';

/* ── Native template dimensions (employee-card-front.png) ── */
const NW = 1011;
const NH = 639;

/* ── Display scale (fits on screen) ── */
const SC = 0.60;
const W  = Math.round(NW * SC);   // 607
const H  = Math.round(NH * SC);   // 383

function fmt(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }); }
  catch { return ''; }
}

/* ────────────────── Card face (JSX) ────────────────── */
function CardFront({ teacher }) {
  const t        = teacher;
  const name     = (t.user?.name  || '').toUpperCase();
  const desig    = t.designation  || '';
  const dob      = fmt(t.dateOfBirth);
  const phone    = t.user?.phone  || '';
  const base     = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  const photoUrl = t.photo
    ? (t.photo.startsWith('http') ? t.photo : `${base}${t.photo}`)
    : null;

  /* Positions scaled from native 1011×639 */
  const PHOTO = { cx: Math.round(200*SC), cy: Math.round(365*SC), r: Math.round(170*SC) };

  /* Field value positions: right side, after the colon on each label line */
  const VALS = [
    { value: name,  left: Math.round(518*SC), top: Math.round(342*SC), size: Math.round(20*SC), bold: true  },
    { value: desig, left: Math.round(628*SC), top: Math.round(390*SC), size: Math.round(20*SC), bold: true },
    { value: dob,   left: Math.round(496*SC), top: Math.round(445*SC), size: Math.round(20*SC), bold: true },
    { value: phone, left: Math.round(675*SC), top: Math.round(495*SC), size: Math.round(18*SC), bold: true },
  ];

  return (
    <div style={{ position:'relative', width:W, height:H, flexShrink:0 }}>

      {/* Background template */}
      <img
        src="/employee-card-front.png"
        alt="Employee Card"
        style={{ width:W, height:H, display:'block' }}
      />

      {/* Teacher photo in the circular area */}
      <div style={{
        position:'absolute',
        left:  PHOTO.cx - PHOTO.r,
        top:   PHOTO.cy - PHOTO.r,
        width: PHOTO.r * 2,
        height:PHOTO.r * 2,
        borderRadius:'50%',
        overflow:'hidden',
        background:'#d0e8f4',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {photoUrl
          ? <img src={photoUrl} alt={name}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <span style={{
              fontSize: PHOTO.r * 0.75,
              fontWeight:'900',
              color:'#1a4db5',
              fontFamily:'Arial Black, Arial, sans-serif',
              userSelect:'none',
            }}>
              {(t.user?.name || 'T').charAt(0).toUpperCase()}
            </span>
        }
      </div>

      {/* Data overlays */}
      {VALS.map(({ value, left, top, size, bold }, i) => (
        value ? (
          <div key={i} style={{
            position:  'absolute',
            left, top,
            fontFamily:'Arial, sans-serif',
            fontSize:  size,
            fontWeight: bold ? '900' : '700',
            color:     '#0d2b6b',
            whiteSpace:'nowrap',
            lineHeight: 1,
          }}>
            {value}
          </div>
        ) : null
      ))}
    </div>
  );
}

/* ────────────────── Canvas download ────────────────── */
function loadImg(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function downloadCard(teacher, photoUrl, setDownloading) {
  setDownloading(true);
  try {
    const name  = (teacher.user?.name || '').toUpperCase();
    const desig = teacher.designation  || '';
    const dob   = fmt(teacher.dateOfBirth);
    const phone = teacher.user?.phone  || '';

    /* Draw at native resolution for print quality */
    const canvas = document.createElement('canvas');
    canvas.width  = NW;
    canvas.height = NH;
    const ctx = canvas.getContext('2d');

    /* 1. Draw background template */
    const bg = await loadImg('/employee-card-front.png');
    ctx.drawImage(bg, 0, 0, NW, NH);

    /* 2. Draw teacher photo in circle */
    const PCX = 200, PCY = 365, PR = 170;
    ctx.save();
    ctx.beginPath();
    ctx.arc(PCX, PCY, PR, 0, Math.PI * 2);
    ctx.clip();
    if (photoUrl) {
      try {
        const pImg = await loadImg(photoUrl);
        ctx.drawImage(pImg, PCX - PR, PCY - PR, PR * 2, PR * 2);
      } catch { drawInitial(ctx, PCX, PCY, PR, teacher.user?.name || 'T'); }
    } else {
      drawInitial(ctx, PCX, PCY, PR, teacher.user?.name || 'T');
    }
    ctx.restore();

    /* 3. Overlay field values */
    const fields = [
      { value: name,  x: 518, y: 342, size: 20, bold: true },
      { value: desig, x: 628, y: 390, size: 20, bold: true },
      { value: dob,   x: 496, y: 445, size: 20, bold: true },
      { value: phone, x: 675, y: 495, size: 18, bold: true },
    ];

    fields.forEach(({ value, x, y, size, bold }) => {
      if (!value) return;
      ctx.fillStyle    = '#0d2b6b';
      ctx.font         = `${bold ? '900' : '700'} ${size}px Arial`;
      ctx.textBaseline = 'top';
      ctx.fillText(value, x, y);
    });

    /* 4. Download */
    const link = document.createElement('a');
    link.download = `${teacher.user?.name || 'teacher'}_employee_card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch {
    window.print();
  } finally {
    setDownloading(false);
  }
}

function drawInitial(ctx, cx, cy, r, name) {
  ctx.fillStyle = '#c8dff0';
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = '#1a4db5';
  ctx.font = `900 ${Math.round(r * 0.75)}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name || 'T').charAt(0).toUpperCase(), cx, cy);
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

/* ────────────────── Modal ────────────────── */
export default function TeacherIDCardModal({ teacher, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const base     = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  const photoUrl = teacher.photo
    ? (teacher.photo.startsWith('http') ? teacher.photo : `${base}${teacher.photo}`)
    : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #tc-id-card-root, #tc-id-card-root * { visibility: visible !important; }
          #tc-id-card-root {
            position: fixed !important; inset: 0 !important;
            display: flex !important; justify-content: center !important;
            align-items: center !important; background: white !important;
          }
          @page { size: landscape; margin: 4mm; }
        }
      `}} />

      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between gap-8">
            <h2 className="text-base font-bold text-gray-800">Employee ID Card</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div id="tc-id-card-root" style={{ overflowX:'auto' }}>
            <CardFront teacher={teacher} />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => downloadCard(teacher, photoUrl, setDownloading)}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading…' : 'Download PNG'}
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
