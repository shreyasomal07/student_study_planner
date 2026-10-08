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
  Lecture: "bg-steady-renewal text-liminal-night border-rooted-strength/60",
  Lab: "bg-calm-awakening/20 text-calm-awakening border-calm-awakening/40",
  Tutorial: "bg-inner-resolve/20 text-liminal-night border-inner-resolve/40",
  Seminar: "bg-vital-spark/20 text-liminal-night border-vital-spark/40",
  Workshop: "bg-wild-light text-liminal-night border-rooted-strength/40",
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-none border border-rooted-strength/50 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-liminal-night text-base sm:text-lg flex items-center gap-2">
              <School className="w-5 h-5 text-liminal-night" />
              Class & College Timetable
            </h2>
            {timetablePhoto && (
              <span className="px-2.5 py-0.5 rounded-full bg-steady-renewal border border-rooted-strength/60 text-liminal-night text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-calm-awakening" /> Photo Added
              </span>
            )}
          </div>
          <p className="text-xs text-liminal-night/70 mt-0.5 font-medium">
            View your original timetable photo directly or manage scheduled lectures.
          </p>
        </div>

        {/* View Switcher Tabs & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-steady-renewal border border-rooted-strength/50 rounded-full shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'photo'
                  ? 'bg-calm-awakening text-wild-light shadow-2xs'
                  : 'text-liminal-night hover:text-liminal-night'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo Timetable</span>
              {timetablePhoto && (
                <span className="w-2 h-2 rounded-full bg-vital-spark" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'classes'
                  ? 'bg-calm-awakening text-wild-light shadow-2xs'
                  : 'text-liminal-night hover:text-liminal-night'
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
            className="px-4 py-2 rounded-full text-xs font-bold bg-wild-light hover:bg-steady-renewal text-liminal-night border border-rooted-strength transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-liminal-night" /> Upload Photo / File
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-full text-xs font-bold bg-liminal-night hover:bg-liminal-night/90 text-wild-light shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-vital-spark" /> Add Class
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
            <div className="bg-white border border-rooted-strength/50 rounded-none p-2.5 px-4 flex items-center justify-between text-xs text-liminal-night shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-liminal-night shrink-0" />
                <span className="font-bold">Original Timetable Photo Attached:</span>
                <span className="text-liminal-night/80 truncate max-w-xs">{timetablePhoto.name || 'Uploaded Photo'}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className="px-3.5 py-1 rounded-full bg-steady-renewal text-liminal-night font-bold hover:bg-rooted-strength/30 text-[11px] border border-rooted-strength/60 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Eye className="w-3 h-3 text-calm-awakening" /> View Timetable Photo
              </button>
            </div>
          )}

          {/* Day Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedDayFilter('All')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedDayFilter === 'All' ? 'bg-calm-awakening text-wild-light shadow-xs' : 'bg-white border border-rooted-strength text-liminal-night hover:bg-steady-renewal'
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
                    isActive ? 'bg-calm-awakening text-wild-light shadow-xs' : 'bg-white border border-rooted-strength text-liminal-night hover:bg-steady-renewal'
                  }`}
                >
                  <span>{d}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-vital-spark text-liminal-night' : 'bg-steady-renewal text-liminal-night'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Classes Grid View */}
          {classes.length === 0 ? (
            <div className="rounded-none border border-dashed border-theme-border bg-theme-card p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-theme-card text-theme-accent-green flex items-center justify-center mx-auto shadow-2xs">
                <School className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-theme-text text-base">No Structured Lectures Added</h3>
              <p className="text-xs text-theme-muted max-w-md mx-auto">
                You can upload a photo of your timetable to display directly, or add individual class lectures so the AI can build your study routine around them.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setBulkModalOpen(true);
                    setUploadTab('photo_direct');
                  }}
                  className="px-4 py-2.5 rounded-full bg-liminal-night hover:bg-liminal-night/90 text-wild-light text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-vital-spark" /> Upload Timetable Photo (Direct View)
                </button>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2.5 rounded-full bg-steady-renewal hover:bg-rooted-strength/30 text-liminal-night text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-rooted-strength/40"
                >
                  <Plus className="w-4 h-4 text-calm-awakening" /> Add Class Manually
                </button>
              </div>
            </div>
          ) : selectedDayFilter === 'All' ? (
            /* Week Day Column View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DAY_KEYS.map((day) => {
                const dayList = classesByDay[day] || [];
                return (
                  <div key={day} className="rounded-none border border-rooted-strength/40 bg-steady-renewal shadow-2xs overflow-hidden flex flex-col">
                    <div className="p-3.5 bg-wild-light border-b border-rooted-strength/30 flex items-center justify-between">
                      <span className="font-display font-bold text-liminal-night text-sm">{DAY_LABELS[day]}</span>
                      <span className="text-xs font-bold text-liminal-night/60">{dayList.length} classes</span>
                    </div>
                    <div className="p-3 flex-1 space-y-2.5 min-h-[140px]">
                      {dayList.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center py-6 text-liminal-night/50 text-xs font-medium">
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
            <div className="rounded-none border border-rooted-strength/40 bg-steady-renewal p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-rooted-strength/30">
                <h3 className="font-display font-bold text-liminal-night">{DAY_LABELS[selectedDayFilter]} Schedule</h3>
                <span className="text-xs text-liminal-night/70 font-semibold">{filteredClasses.length} sessions</span>
              </div>
              {filteredClasses.length === 0 ? (
                <p className="text-xs text-liminal-night/50 py-8 text-center font-medium">No classes on {DAY_LABELS[selectedDayFilter]}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-liminal-night/30 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-wild-light rounded-3xl shadow-2xl p-6 relative border border-rooted-strength/40">
            <div className="flex items-center justify-between pb-3 border-b border-rooted-strength/30 mb-4">
              <h3 className="font-display font-bold text-liminal-night flex items-center gap-2">
                <School className="w-4 h-4 text-calm-awakening" />
                {editingClass ? 'Edit Class' : 'Add Class / Lecture'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-liminal-night/50 hover:text-liminal-night cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-liminal-night/70 mb-1">Subject / Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full p-2.5 rounded-full border border-rooted-strength/40 text-xs focus:outline-none focus:border-liminal-night bg-steady-renewal font-medium text-liminal-night"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-liminal-night/70 mb-1">Day of Week</label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full p-2.5 rounded-full border border-rooted-strength/40 text-xs focus:outline-none focus:border-liminal-night bg-steady-renewal font-bold text-liminal-night cursor-pointer"
                  >
                    {DAY_KEYS.map((d) => (
                      <option key={d} value={d}>{DAY_LABELS[d]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-liminal-night/70 mb-1">Class Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-2.5 rounded-full border border-rooted-strength/40 text-xs focus:outline-none focus:border-liminal-night bg-steady-renewal font-bold text-liminal-night cursor-pointer"
                  >
                    {CLASS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-liminal-night/70 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                    className="w-full p-2.5 rounded-full border border-rooted-strength/40 text-xs focus:outline-none focus:border-liminal-night bg-steady-renewal font-bold text-liminal-night"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-liminal-night/70 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                    className="w-full p-2.5 rounded-full border border-rooted-strength/40 text-xs focus:outline-none focus:border-liminal-night bg-steady-renewal font-bold text-liminal-night"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-liminal-night/70 mb-1">Room / Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hall 302 / Online Teams"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full p-2.5 rounded-full border border-rooted-strength/40 text-xs focus:outline-none focus:border-liminal-night bg-steady-renewal font-medium text-liminal-night"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-rooted-strength/30">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-liminal-night/70 hover:bg-steady-renewal cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-bold bg-liminal-night hover:bg-liminal-night/90 text-wild-light shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-liminal-night/30 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-wild-light rounded-3xl shadow-2xl p-6 relative my-8 max-h-[90vh] flex flex-col border border-rooted-strength/40">
            <div className="flex items-center justify-between pb-3 border-b border-rooted-strength/30 mb-4 shrink-0">
              <h3 className="font-display font-bold text-liminal-night flex items-center gap-2 text-base">
                <ImageIcon className="w-5 h-5 text-calm-awakening" />
                Upload Timetable Photo & Routine
              </h3>
              <button onClick={() => setBulkModalOpen(false)} className="text-liminal-night/50 hover:text-liminal-night cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode switch */}
            <div className="flex items-center gap-2 p-1 bg-steady-renewal rounded-2xl mb-4 shrink-0 border border-rooted-strength/40">
              <button
                type="button"
                onClick={() => setUploadTab('photo_direct')}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadTab === 'photo_direct' ? 'bg-liminal-night text-wild-light shadow-2xs' : 'text-liminal-night/70 hover:text-liminal-night'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Upload Photo (Direct View)
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('paste')}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadTab === 'paste' ? 'bg-liminal-night text-wild-light shadow-2xs' : 'text-liminal-night/70 hover:text-liminal-night'
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
                        ? 'border-calm-awakening bg-steady-renewal'
                        : 'border-rooted-strength/50 hover:border-liminal-night/50 hover:bg-steady-renewal/50'
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

                    <div className="w-14 h-14 rounded-2xl bg-steady-renewal text-calm-awakening flex items-center justify-center shadow-2xs border border-rooted-strength/40">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-liminal-night">
                        Select or Drop Timetable Photo
                      </p>
                      <p className="text-xs text-liminal-night/65 mt-1 max-w-sm">
                        Displays your original timetable picture directly on the page with instant zoom, pan, and full screen view.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="mt-2 px-4 py-2 rounded-full bg-liminal-night text-wild-light text-xs font-bold shadow-xs hover:bg-liminal-night/90 transition-all pointer-events-none"
                    >
                      Browse Image File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-liminal-night/70">
                    Paste your schedule below (Format: <code className="bg-steady-renewal px-1.5 py-0.5 rounded text-liminal-night font-mono">Day, StartTime, EndTime, Subject, Type, Room</code>):
                  </p>
                  <textarea
                    rows={5}
                    value={bulkText}
                    onChange={(e) => {
                      setBulkText(e.target.value);
                      parseRawSchedule(e.target.value);
                    }}
                    placeholder={`Mon, 09:00, 10:30, Calculus, Lecture, Room 101\nMon, 11:00, 13:00, Data Structures, Lab, CS Lab\nTue, 10:00, 11:30, Physics, Lecture, Hall A`}
                    className="w-full p-3 font-mono text-xs bg-steady-renewal border border-rooted-strength/50 rounded-2xl text-liminal-night focus:outline-none focus:border-liminal-night"
                  />

                  {/* Detected items preview table */}
                  {parsedPreview.length > 0 && (
                    <div className="border border-rooted-strength/50 bg-steady-renewal/50 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-liminal-night flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-calm-awakening" />
                          Detected Classes ({parsedPreview.length} items)
                        </span>
                        <button
                          type="button"
                          onClick={() => setParsedPreview([])}
                          className="text-[11px] text-liminal-night/70 hover:text-liminal-night hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {parsedPreview.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-wild-light p-2.5 rounded-xl border border-rooted-strength/40 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-calm-awakening bg-calm-awakening/15 px-2 py-0.5 rounded-full text-[10px]">
                                {item.day}
                              </span>
                              <span className="font-semibold text-liminal-night truncate">{item.subject}</span>
                              <span className="text-[10px] text-liminal-night/60">
                                {fmtTime12(item.start)} – {fmtTime12(item.end)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setParsedPreview(parsedPreview.filter((_, i) => i !== idx))}
                              className="text-liminal-night/40 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-liminal-night/70 px-1 pt-1">
                    <span>Need template?</span>
                    <button
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="inline-flex items-center gap-1 text-liminal-night font-bold hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download CSV Template
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-rooted-strength/30 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-liminal-night/70 hover:bg-rooted-strength/20 cursor-pointer"
              >
                Cancel
              </button>
              {uploadTab === 'paste' && (
                <button
                  type="button"
                  disabled={parsedPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-calm-awakening hover:bg-calm-awakening/90 text-wild-light disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-1.5"
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
    <div className="p-3 rounded-none border border-rooted-strength/40 bg-steady-renewal/80 hover:border-rooted-strength hover:shadow-xs transition-all space-y-1.5 group">
      <div className="flex items-start justify-between gap-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
          {item.type}
        </span>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1 rounded-lg text-liminal-night/60 hover:text-liminal-night hover:bg-wild-light cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 rounded-lg text-liminal-night/60 hover:text-rose-600 hover:bg-wild-light cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-liminal-night leading-snug">{item.subject}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-liminal-night/70">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-liminal-night/50" />
            {fmtTime12(item.start)} – {fmtTime12(item.end)}
          </span>
          {item.room && (
            <span className="flex items-center gap-1 text-liminal-night/60">
              <MapPin className="w-3 h-3 text-liminal-night/50" />
              {item.room}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
