import { useEffect, useState, useRef } from 'react';
import { Calendar, Save, RefreshCw, Printer, Coffee } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIOD_COUNT = 6;

const DEFAULT_TIMESLOTS = [
  { no: 1, startTime: '09:20', endTime: '10:05' },
  { no: 2, startTime: '10:05', endTime: '10:50' },
  { no: 3, startTime: '11:05', endTime: '11:50' },
  { no: 4, startTime: '11:50', endTime: '12:35' },
  { no: 5, startTime: '13:20', endTime: '14:05' },
  { no: 6, startTime: '14:05', endTime: '14:50' },
];

const DEFAULT_BREAKS = [
  { after: 2, label: 'Break',       startTime: '10:50', endTime: '11:05' },
  { after: 4, label: 'Lunch Break', startTime: '12:35', endTime: '13:20' },
];

const emptySchedule = () =>
  Object.fromEntries(DAYS.map(d => [d, Array(PERIOD_COUNT).fill('')]));

// ─── Shared grid used by editor & print ──────────────────────────────────────
export function TimetableGrid({ schedule, timeSlots, breaks, onCellChange, readonly = false }) {
  // Build column sequence interleaving periods and breaks
  const columns = [];
  for (let i = 0; i < PERIOD_COUNT; i++) {
    const slot = timeSlots[i];
    columns.push({ type: 'period', slot, index: i });
    const brk = breaks.find(b => b.after === i + 1);
    if (brk) columns.push({ type: 'break', info: brk });
  }

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    const suffix = hr >= 12 ? 'PM' : 'AM';
    const disp = hr > 12 ? hr - 12 : hr || 12;
    return `${disp}:${m} ${suffix}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-sm print-table">
        {/* ── Header ── */}
        <thead>
          <tr>
            <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-100 border border-gray-200 w-28 print-day-header">
              Day
            </th>
            {columns.map((col, ci) =>
              col.type === 'period' ? (
                <th key={ci} className="border border-gray-200 bg-blue-700 text-white text-center min-w-[105px]">
                  <p className="font-bold text-sm pt-2">Period {col.slot.no}</p>
                  {readonly ? (
                    <p className="text-blue-200 text-xs pb-2">
                      {fmtTime(col.slot.startTime)} – {fmtTime(col.slot.endTime)}
                    </p>
                  ) : (
                    <div className="flex items-center justify-center gap-1 px-2 pb-2 pt-1">
                      <input
                        type="time"
                        value={col.slot.startTime}
                        onChange={e => onCellChange?.('slot', col.index, 'startTime', e.target.value)}
                        className="text-xs bg-blue-600 border border-blue-400 rounded px-1 py-0.5 w-[68px] text-white"
                      />
                      <span className="text-blue-300 text-xs">–</span>
                      <input
                        type="time"
                        value={col.slot.endTime}
                        onChange={e => onCellChange?.('slot', col.index, 'endTime', e.target.value)}
                        className="text-xs bg-blue-600 border border-blue-400 rounded px-1 py-0.5 w-[68px] text-white"
                      />
                    </div>
                  )}
                </th>
              ) : (
                <th key={ci} className="border border-gray-200 bg-amber-50 text-center min-w-[90px]">
                  <div className="flex flex-col items-center py-2 gap-0.5">
                    <Coffee className="w-4 h-4 text-amber-500" />
                    <p className="font-semibold text-amber-600 text-xs">{col.info.label}</p>
                    {readonly ? (
                      <p className="text-amber-400 text-[10px]">
                        {fmtTime(col.info.startTime)} – {fmtTime(col.info.endTime)}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1 px-1">
                        <input
                          type="time"
                          value={col.info.startTime}
                          onChange={e => onCellChange?.('break', col.info.after, 'startTime', e.target.value)}
                          className="text-[10px] bg-amber-50 border border-amber-200 rounded px-1 py-0.5 w-[66px] text-amber-600"
                        />
                        <span className="text-amber-300 text-[10px]">–</span>
                        <input
                          type="time"
                          value={col.info.endTime}
                          onChange={e => onCellChange?.('break', col.info.after, 'endTime', e.target.value)}
                          className="text-[10px] bg-amber-50 border border-amber-200 rounded px-1 py-0.5 w-[66px] text-amber-600"
                        />
                      </div>
                    )}
                  </div>
                </th>
              )
            )}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {DAYS.map((day, di) => (
            <tr key={day} className={di % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
              <td className="px-4 py-3 font-bold text-gray-700 border border-gray-200 whitespace-nowrap">
                {day}
              </td>
              {columns.map((col, ci) =>
                col.type === 'period' ? (
                  <td key={ci} className="border border-gray-100 text-center p-1.5">
                    {readonly ? (
                      <span className={`text-sm font-semibold ${schedule[day]?.[col.index] ? 'text-gray-800' : 'text-gray-300'}`}>
                        {schedule[day]?.[col.index] || '—'}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={schedule[day]?.[col.index] || ''}
                        onChange={e => onCellChange?.('cell', day, col.index, e.target.value)}
                        placeholder="—"
                        className="w-full text-center text-sm border border-transparent hover:border-blue-200 focus:border-blue-500 rounded-lg px-2 py-1.5 outline-none transition bg-transparent focus:bg-white placeholder-gray-200 font-semibold text-gray-700 uppercase"
                      />
                    )}
                  </td>
                ) : (
                  <td key={ci} className="border border-gray-100 text-center p-1 bg-amber-50/60">
                    <span className="text-amber-300 text-xs">☕</span>
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Timetable() {
  const [classes, setClasses]           = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [timeSlots, setTimeSlots]       = useState(DEFAULT_TIMESLOTS);
  const [breaks, setBreaks]             = useState(DEFAULT_BREAKS);
  const [schedule, setSchedule]         = useState(emptySchedule());
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [loaded, setLoaded]             = useState(false);

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes || []));
  }, []);

  const loadTimetable = async () => {
    if (!selectedClass) { toast.error('Please select a class first'); return; }
    setLoading(true);
    try {
      const res = await api.get(`/timetable?classId=${selectedClass}&year=${encodeURIComponent(academicYear)}`);
      if (res.data.timetable) {
        const tt = res.data.timetable;
        setTimeSlots(tt.timeSlots?.length  ? tt.timeSlots  : DEFAULT_TIMESLOTS);
        setBreaks(tt.breaks?.length        ? tt.breaks     : DEFAULT_BREAKS);
        // Normalise: ensure each day has exactly 6 slots
        const sch = emptySchedule();
        DAYS.forEach(d => {
          if (Array.isArray(tt.schedule?.[d])) {
            sch[d] = [...tt.schedule[d], ...Array(6)].slice(0, 6).map(v => v || '');
          }
        });
        setSchedule(sch);
        toast.success('Timetable loaded');
      } else {
        setTimeSlots(DEFAULT_TIMESLOTS);
        setBreaks(DEFAULT_BREAKS);
        setSchedule(emptySchedule());
        toast('No timetable yet — starting fresh', { icon: '📋' });
      }
      setLoaded(true);
    } catch {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  // Unified cell-change handler for schedule cells, time slots, and breaks
  const handleChange = (type, ...args) => {
    if (type === 'cell') {
      const [day, idx, value] = args;
      setSchedule(s => ({ ...s, [day]: s[day].map((v, i) => i === idx ? value : v) }));
    } else if (type === 'slot') {
      const [idx, field, value] = args;
      setTimeSlots(ts => ts.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    } else if (type === 'break') {
      const [after, field, value] = args;
      setBreaks(bs => bs.map(b => b.after === after ? { ...b, [field]: value } : b));
    }
  };

  const handleSave = async () => {
    if (!selectedClass) { toast.error('Please select a class first'); return; }
    setSaving(true);
    try {
      await api.put('/timetable', {
        classId: selectedClass, academicYear, timeSlots, breaks, schedule
      });
      toast.success('Timetable saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const className = classes.find(c => c._id === selectedClass);

  return (
    <div className="fade-in space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-gray-800">Time Table Manager</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create and manage weekly timetable for each class</p>
        </div>
      </div>

      {/* Class selector bar */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Select Class</label>
            <select className="input-field" value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setLoaded(false); }}>
              <option value="">— Select a class —</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="label">Academic Year</label>
            <input className="input-field" value={academicYear}
              onChange={e => setAcademicYear(e.target.value)} placeholder="2025-2026" />
          </div>
          <button onClick={loadTimetable} disabled={loading || !selectedClass}
            className="btn-primary flex items-center gap-2 h-10 px-5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Load'}
          </button>
          {loaded && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition h-10 disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Timetable'}
            </button>
          )}
        </div>
      </div>

      {/* Timetable grid */}
      {loaded ? (
        <div className="card p-0 overflow-hidden">
          {/* Title strip */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-5 py-3 flex items-center justify-between print:bg-none print:text-black print:border-b">
            <div>
              <p className="font-bold text-lg">
                {className?.name}{className?.section ? ` – ${className.section}` : ''} &nbsp;·&nbsp; Class Time Table
              </p>
              <p className="text-blue-200 text-xs print:text-gray-500">Academic Year: {academicYear}</p>
            </div>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition print:hidden">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>

          <TimetableGrid
            schedule={schedule}
            timeSlots={timeSlots}
            breaks={breaks}
            onCellChange={handleChange}
            readonly={false}
          />

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3 print:hidden">
            <p className="text-xs text-gray-400">
              Click any cell to type a subject · Time slots are editable in the header · Changes are not saved until you click Save
            </p>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Timetable'}
            </button>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-blue-300" />
          </div>
          <h3 className="text-gray-600 font-semibold">No timetable loaded</h3>
          <p className="text-gray-400 text-sm mt-1">
            Select a class above and click <strong>Load</strong> to view or create its timetable
          </p>
        </div>
      )}
    </div>
  );
}
