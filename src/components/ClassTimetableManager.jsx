import React, { useState, useRef } from 'react';
import { 
  School, 
  Plus, 
  Trash2, 
  Pencil, 
  Clock, 
  MapPin, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  Calendar,
  X,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  Scan,
  Eye,
  CalendarRange
} from 'lucide-react';
import TimetablePhotoViewer from './TimetablePhotoViewer';

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

const CLASS_TYPES = ["Lecture", "Lab", "Tutorial", "Seminar", "Workshop"];
const CLASS_TYPE_BADGES = {
  Lecture: "bg-blue-50 text-blue-700 border-blue-200",
  Lab: "bg-purple-50 text-purple-700 border-purple-200",
  Tutorial: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Seminar: "bg-amber-50 text-amber-700 border-amber-200",
  Workshop: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function pad(n) { return String(n).padStart(2, '0'); }
function fmtTime12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${period}`;
}

function normalizeDay(str) {
  if (!str) return 'Mon';
  const clean = str.trim().toLowerCase();
  if (clean.startsWith('mon')) return 'Mon';
  if (clean.startsWith('tue')) return 'Tue';
  if (clean.startsWith('wed')) return 'Wed';
  if (clean.startsWith('thu')) return 'Thu';
  if (clean.startsWith('fri')) return 'Fri';
  if (clean.startsWith('sat')) return 'Sat';
  if (clean.startsWith('sun')) return 'Sun';
  return 'Mon';
}

function normalizeTime(str) {
  if (!str) return '09:00';
  let t = str.trim().toLowerCase();
  const isPM = t.includes('pm');
  const isAM = t.includes('am');
  t = t.replace(/(am|pm)/g, '').trim();
  
  if (t.includes(':')) {
    let [h, m] = t.split(':').map(Number);
    if (isNaN(h)) h = 9;
    if (isNaN(m)) m = 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return `${pad(h)}:${pad(m)}`;
  } else {
    let h = parseInt(t, 10);
    if (isNaN(h)) h = 9;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return `${pad(h)}:00`;
  }
}

function normalizeClassType(str) {
  if (!str) return 'Lecture';
  const clean = str.trim().toLowerCase();
  if (clean.includes('lab') || clean.includes('prac')) return 'Lab';
  if (clean.includes('tut')) return 'Tutorial';
  if (clean.includes('sem')) return 'Seminar';
  if (clean.includes('work')) return 'Workshop';
  return 'Lecture';
}

export default function ClassTimetableManager({ 
  classes = [], 
  onSaveClass, 
  onDeleteClass, 
  onImportBulkClasses, 
  subjectList = [],
  timetablePhoto = null,
  onSaveTimetablePhoto,
  onRemoveTimetablePhoto
}) {
  const [activeTab, setActiveTab] = useState(timetablePhoto ? 'photo' : 'classes'); // 'photo' or 'classes'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  
  // Upload & Import Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState('photo_direct'); // 'photo_direct' or 'paste'
  const [bulkText, setBulkText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [selectedDayFilter, setSelectedDayFilter] = useState('All');

  // Single Class Add/Edit Form State
  const [form, setForm] = useState({
    day: 'Mon',
    subject: '',
    type: 'Lecture',
    start: '09:00',
    end: '10:30',
    room: ''
  });

  const openAddModal = () => {
    setEditingClass(null);
    setForm({
      day: 'Mon',
      subject: subjectList[0] || '',
      type: 'Lecture',
      start: '09:00',
      end: '10:30',
      room: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingClass(item);
    setForm({ ...item });
    setModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    onSaveClass({
      ...form,
      id: editingClass ? editingClass.id : undefined
    });
    setModalOpen(false);
  };

  const parseRawSchedule = (raw) => {
    if (!raw || !raw.trim()) {
      setParsedPreview([]);
      return;
    }

    // Try JSON first
    if (raw.trim().startsWith('[') && raw.trim().endsWith(']')) {
      try {
        const jsonArr = JSON.parse(raw);
        if (Array.isArray(jsonArr)) {
          const items = jsonArr.map(item => ({
            id: Math.random().toString(36).slice(2, 10),
            day: normalizeDay(item.day || item.Day || 'Mon'),
            start: normalizeTime(item.start || item.startTime || item.Start || '09:00'),
            end: normalizeTime(item.end || item.endTime || item.End || '10:30'),
            subject: (item.subject || item.course || item.name || 'Subject').trim(),
            type: normalizeClassType(item.type || item.category || 'Lecture'),
            room: (item.room || item.venue || item.hall || '').trim()
          }));
          setParsedPreview(items);
          return;
        }
      } catch (e) {}
    }

    // Parse CSV lines
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed = [];

    lines.forEach((line) => {
      if (line.startsWith('#') || line.toLowerCase().startsWith('day,') || line.toLowerCase().startsWith('day\t')) return;

      const delimiter = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
      const parts = line.split(delimiter).map(s => s.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 3) {
        let day, start, end, subject, type = 'Lecture', room = '';

        if (DAY_KEYS.includes(normalizeDay(parts[0])) || parts[0].toLowerCase().includes('day')) {
          day = normalizeDay(parts[0]);
          start = normalizeTime(parts[1]);
          end = normalizeTime(parts[2]);
          subject = parts[3] || 'Class';
          type = normalizeClassType(parts[4] || 'Lecture');
          room = parts[5] || '';
        } else {
          subject = parts[0];
          day = normalizeDay(parts[1]);
          start = normalizeTime(parts[2]);
          end = normalizeTime(parts[3] || '10:30');
          type = normalizeClassType(parts[4] || 'Lecture');
          room = parts[5] || '';
        }

        if (subject && start) {
          parsed.push({
            id: Math.random().toString(36).slice(2, 10),
            day,
            start,
            end,
            subject,
            type,
            room
          });
        }
      }
    });

    setParsedPreview(parsed);
  };

  const handleDirectPhotoUpload = (file) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const photoData = {
          url: dataUrl,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          uploadedAt: new Date().toISOString()
        };
        if (onSaveTimetablePhoto) {
          onSaveTimetablePhoto(photoData);
        }
        setActiveTab('photo');
        setBulkModalOpen(false);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setBulkText(text);
        parseRawSchedule(text);
        setUploadTab('paste');
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDirectPhotoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) {
      alert('No valid classes detected. Please enter or paste your schedule.');
      return;
    }
    onImportBulkClasses(parsedPreview);
    setBulkModalOpen(false);
    setBulkText('');
    setParsedPreview([]);
    setUploadedFileName('');
    setImagePreviewUrl(null);
  };

  const downloadCSVTemplate = () => {
    const csvContent = "Day,Start,End,Subject,Type,Room\nMon,09:00,10:30,Calculus,Lecture,Hall 101\nMon,11:00,13:00,Data Structures,Lab,CS Lab 2\nTue,10:00,11:30,Physics,Lecture,Hall A\nWed,14:00,15:30,Electronics,Tutorial,Room 204\nThu,09:00,10:30,Algorithms,Lecture,Hall B\nFri,10:00,11:30,Database Systems,Lecture,Hall C\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "college_classes_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredClasses = selectedDayFilter === 'All'
    ? classes
    : classes.filter(c => c.day === selectedDayFilter);

  // Group by day
  const classesByDay = {};
  DAY_KEYS.forEach(d => { classesByDay[d] = []; });
  classes.forEach(c => {
    if (classesByDay[c.day]) classesByDay[c.day].push(c);
  });
  Object.values(classesByDay).forEach(arr => arr.sort((a, b) => a.start.localeCompare(b.start)));

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-[28px] border border-[#ECE6DC] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-[#181A1D] text-base sm:text-lg flex items-center gap-2">
              <School className="w-5 h-5 text-[#181A1D]" />
              Class & College Timetable
            </h2>
            {timetablePhoto && (
              <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Photo Added
              </span>
            )}
          </div>
          <p className="text-xs text-[#8E8880] mt-0.5">
            View your original timetable photo directly or manage scheduled lectures.
          </p>
        </div>

        {/* View Switcher Tabs & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-[#FAF8F5] border border-[#ECE6DC] rounded-full shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'photo'
                  ? 'bg-[#181A1D] text-white shadow-2xs'
                  : 'text-[#78716C] hover:text-[#181A1D]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Photo Timetable</span>
              {timetablePhoto && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'classes'
                  ? 'bg-[#181A1D] text-white shadow-2xs'
                  : 'text-[#78716C] hover:text-[#181A1D]'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Classes List ({classes.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              setBulkModalOpen(true);
              setParsedPreview([]);
              setBulkText('');
              setUploadedFileName('');
              setImagePreviewUrl(null);
            }}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#F4F1EB] hover:bg-[#EAE4DA] text-[#181A1D] border border-[#ECE6DC] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#181A1D]" /> Upload Photo / File
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#181A1D] hover:bg-black text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#FACC15]" /> Add Class
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'photo' ? (
        <TimetablePhotoViewer
          photo={timetablePhoto}
          onSavePhoto={onSaveTimetablePhoto}
          onRemovePhoto={onRemoveTimetablePhoto}
          title="Class & College Timetable Photo"
          subtitle="Your uploaded timetable image displayed directly on the screen."
        />
      ) : (
        <div className="space-y-4">
          {/* If photo is uploaded, show a subtle quick toggle banner */}
          {timetablePhoto && (
            <div className="bg-white/80 border border-[#ECE6DC] rounded-2xl p-2.5 px-4 flex items-center justify-between text-xs text-[#181A1D] shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-[#D97706] shrink-0" />
                <span className="font-bold">Original Timetable Photo Attached:</span>
                <span className="text-[#78716C] truncate max-w-xs">{timetablePhoto.name || 'Uploaded Photo'}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className="px-3 py-1 rounded-full bg-[#181A1D] text-white font-bold hover:bg-[#2D3139] text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Eye className="w-3 h-3 text-[#FACC15]" /> View Timetable Photo
              </button>
            </div>
          )}

          {/* Day Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedDayFilter('All')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedDayFilter === 'All' ? 'bg-[#181A1D] text-white shadow-xs' : 'bg-white border border-[#ECE6DC] text-[#8E8880] hover:text-[#181A1D]'
              }`}
            >
              All Days ({classes.length})
            </button>
            {DAY_KEYS.map((d) => {
              const count = (classesByDay[d] || []).length;
              const isActive = selectedDayFilter === d;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDayFilter(d)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive ? 'bg-[#181A1D] text-white shadow-xs' : 'bg-white border border-[#ECE6DC] text-[#8E8880] hover:text-[#181A1D]'
                  }`}
                >
                  <span>{d}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive ? 'bg-[#FACC15] text-[#181A1D]' : 'bg-[#F4F1EB] text-[#8E8880]'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Classes Grid View */}
          {classes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <School className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-base">No Structured Lectures Added</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You can upload a photo of your timetable to display directly, or add individual class lectures so the AI can build your study routine around them.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setBulkModalOpen(true);
                    setUploadTab('photo_direct');
                  }}
                  className="px-4 py-2.5 rounded-full bg-[#181A1D] hover:bg-black text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-[#FACC15]" /> Upload Timetable Photo (Direct View)
                </button>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-indigo-600" /> Add Class Manually
                </button>
              </div>
            </div>
          ) : selectedDayFilter === 'All' ? (
            /* Week Day Column View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DAY_KEYS.map((day) => {
                const dayList = classesByDay[day] || [];
                return (
                  <div key={day} className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col">
                    <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-display font-bold text-slate-800 text-sm">{DAY_LABELS[day]}</span>
                      <span className="text-xs font-bold text-slate-400">{dayList.length} classes</span>
                    </div>
                    <div className="p-3 flex-1 space-y-2.5 min-h-[140px]">
                      {dayList.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center py-6 text-slate-400 text-xs">
                          No classes scheduled
                        </div>
                      ) : (
                        dayList.map((item) => (
                          <ClassCard key={item.id} item={item} onEdit={openEditModal} onDelete={onDeleteClass} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single Day List View */
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-800">{DAY_LABELS[selectedDayFilter]} Schedule</h3>
                <span className="text-xs text-slate-500 font-semibold">{filteredClasses.length} sessions</span>
              </div>
              {filteredClasses.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No classes on {DAY_LABELS[selectedDayFilter]}</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredClasses.map((item) => (
                    <ClassCard key={item.id} item={item} onEdit={openEditModal} onDelete={onDeleteClass} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Single Class Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
                <School className="w-4 h-4 text-indigo-600" />
                {editingClass ? 'Edit Class' : 'Add Class / Lecture'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium cursor-pointer"
                  >
                    {DAY_KEYS.map((d) => (
                      <option key={d} value={d}>{DAY_LABELS[d]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium cursor-pointer"
                  >
                    {CLASS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room / Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hall 302 / Online Teams"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
                >
                  {editingClass ? 'Update Class' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Timetable Photo & Document Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 relative my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="font-display font-bold text-slate-800 flex items-center gap-2 text-base">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                Upload Timetable Photo & Routine
              </h3>
              <button onClick={() => setBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode switch */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setUploadTab('photo_direct')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadTab === 'photo_direct' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Upload Photo (Direct View)
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('paste')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadTab === 'paste' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Paste CSV / Text
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {uploadTab === 'photo_direct' ? (
                <div className="space-y-3">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
                      dragActive
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*, .png, .jpg, .jpeg, .webp, .bmp"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleDirectPhotoUpload(e.target.files[0]);
                      }}
                      className="hidden"
                    />

                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Select or Drop Timetable Photo
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Displays your original timetable picture directly on the page with instant zoom, pan, and full screen view.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="mt-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all pointer-events-none"
                    >
                      Browse Image File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Paste your schedule below (Format: <code className="bg-slate-100 px-1 rounded text-indigo-600">Day, StartTime, EndTime, Subject, Type, Room</code>):
                  </p>
                  <textarea
                    rows={5}
                    value={bulkText}
                    onChange={(e) => {
                      setBulkText(e.target.value);
                      parseRawSchedule(e.target.value);
                    }}
                    placeholder={`Mon, 09:00, 10:30, Calculus, Lecture, Room 101\nMon, 11:00, 13:00, Data Structures, Lab, CS Lab\nTue, 10:00, 11:30, Physics, Lecture, Hall A`}
                    className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500"
                  />

                  {/* Detected items preview table */}
                  {parsedPreview.length > 0 && (
                    <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Detected Classes ({parsedPreview.length} items)
                        </span>
                        <button
                          type="button"
                          onClick={() => setParsedPreview([])}
                          className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {parsedPreview.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[10px]">
                                {item.day}
                              </span>
                              <span className="font-semibold text-slate-800 truncate">{item.subject}</span>
                              <span className="text-[10px] text-slate-400">
                                {fmtTime12(item.start)} – {fmtTime12(item.end)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setParsedPreview(parsedPreview.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                    <span>Need template?</span>
                    <button
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download CSV Template
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              {uploadTab === 'paste' && (
                <button
                  type="button"
                  disabled={parsedPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Import ({parsedPreview.length}) Classes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClassCard({ item, onEdit, onDelete }) {
  const badgeClass = CLASS_TYPE_BADGES[item.type] || CLASS_TYPE_BADGES.Lecture;
  return (
    <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-all shadow-2xs space-y-1.5 group">
      <div className="flex items-start justify-between gap-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
          {item.type}
        </span>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-800 leading-snug">{item.subject}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {fmtTime12(item.start)} – {fmtTime12(item.end)}
          </span>
          {item.room && (
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-slate-400" />
              {item.room}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
