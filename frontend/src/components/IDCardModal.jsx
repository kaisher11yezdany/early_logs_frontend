import { X, Printer, CreditCard } from 'lucide-react';

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

  // All pixel values are in the 296×502 native coordinate space.
  // The outer div is exactly W×H so absolute children hit the right spots.
  return (
    <div style={{ position: 'relative', width: W, height: H, flexShrink: 0 }}>

      {/* Background template */}
      <img
        src="/id-card-front.png"
        alt="ID card front"
        style={{ width: W, height: H, display: 'block' }}
      />

      {/* ── Student photo ────────────────────────────────────────── */}
      {/* Fills the full inner area of the blue border frame.
          Blue frame inner area: left≈56, top≈100, width≈184, height≈162  */}
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

      {/* ── Student name ─────────────────────────────────────────── */}
      {/* Sits below the blue border frame with clear gap */}
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

      {/* ── Field values ─────────────────────────────────────────── */}
      {/* Labels (Class / Phone No. / Date of Birth / Blood Group) are
          baked into the image. We overlay only the values to the right
          of each colon. Y positions measured in 296×502 native space. */}
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

// ── Back card: pure image, no overlays needed ────────────────────────────────
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
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
              >
                <Printer className="w-4 h-4" /> Print ID Card
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
              Preview — click <strong>Print ID Card</strong> to open the print dialog
            </p>

            {/* Column labels (hidden during print) */}
            <div className="flex gap-8 justify-center mb-2">
              <div style={{ width: W }} className="text-xs text-center text-gray-400 font-medium uppercase tracking-wide">Front</div>
              <div style={{ width: W }} className="text-xs text-center text-gray-400 font-medium uppercase tracking-wide">Back</div>
            </div>

            {/* Print root — only this div is visible when printing */}
            <div id="id-card-print-root" className="flex gap-8 justify-center items-start">
              <CardFront s={student} />
              <CardBack />
            </div>
          </div>

          <div className="px-6 pb-5 text-center">
            <p className="text-xs text-gray-400">
              Use <strong>landscape</strong> orientation in the print dialog for best results.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
