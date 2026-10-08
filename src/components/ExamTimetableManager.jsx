import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { 
  Award, 
  Plus, 
  Trash2, 
  Pencil, 
  Clock, 
  Calendar, 
  MapPin, 
  Upload, 
  Sparkles, 
  AlertTriangle,
  BookOpen,
  FileText,
  X,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  Scan
} from 'lucide-react';

const EXAM_TYPES = ["Midterm", "Final Exam", "Quiz / Test", "Practical / Lab Exam", "Viva / Oral"];
const EXAM_TYPE_BADGES = {
  Midterm: "bg-blush-rose/15 text-liminal-night border-blush-rose/40 font-semibold",
  "Final Exam": "bg-liminal-night text-wild-light border-liminal-night font-bold",
  "Quiz / Test": "bg-inner-resolve/20 text-liminal-night border-inner-resolve/40 font-semibold",
  "Practical / Lab Exam": "bg-calm-awakening/20 text-calm-awakening border-calm-awakening/40 font-semibold",
  "Viva / Oral": "bg-vital-spark/30 text-liminal-night border-vital-spark font-semibold"
};

function pad(n) { return String(n).padStart(2, '0'); }
function fmtDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${period}`;
}

function normalizeExamType(str) {
  if (!str) return 'Midterm';
  const clean = str.trim().toLowerCase();
  if (clean.includes('final') || clean.includes('end') || clean.includes('sem')) return 'Final Exam';
  if (clean.includes('quiz') || clean.includes('test')) return 'Quiz / Test';
  if (clean.includes('prac') || clean.includes('lab')) return 'Practical / Lab Exam';
  if (clean.includes('viva') || clean.includes('oral')) return 'Viva / Oral';
  return 'Midterm';
}

function normalizeDate(str) {
  if (!str) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }
  const clean = str.trim().replace(/^["']|["']$/g, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${pad(ddmmyyyy[2])}-${pad(ddmmyyyy[1])}`;
  }

  // MM/DD/YYYY
  const dateObj = new Date(clean);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().split('T')[0];
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  return fallback.toISOString().split('T')[0];
}

function normalizeTime(str) {
  if (!str) return '10:00';
  let t = str.trim().toLowerCase();
  const isPM = t.includes('pm');
  const isAM = t.includes('am');
  t = t.replace(/(am|pm)/g, '').trim();
  
  if (t.includes(':')) {
    let [h, m] = t.split(':').map(Number);
    if (isNaN(h)) h = 10;
    if (isNaN(m)) m = 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return `${pad(h)}:${pad(m)}`;
  } else {
    let h = parseInt(t, 10);
    if (isNaN(h)) h = 10;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return `${pad(h)}:00`;
  }
}

function getExamCountdown(dateStr, timeStr) {
  if (!dateStr) return { label: 'Upcoming', color: 'bg-steady-renewal text-liminal-night/70 border-rooted-strength/40' };
  const now = new Date();
  const examDate = new Date(`${dateStr}T${timeStr || '09:00'}:00`);
  const diffMs = examDate.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    return { label: 'Completed Exam', color: 'bg-rooted-strength/20 text-rooted-strength border-rooted-strength/30 line-through' };
  }
  if (diffHours <= 24) {
    return { label: '🚨 Exam Today / Tomorrow!', color: 'bg-vital-spark text-liminal-night font-bold border border-vital-spark shadow-xs' };
  }
  if (diffDays <= 3) {
    return { label: `⚡ In ${diffDays} Days`, color: 'bg-vital-spark/30 text-liminal-night border-vital-spark font-bold' };
  }
  if (diffDays <= 7) {
    return { label: `🗓️ In ${diffDays} Days`, color: 'bg-inner-resolve/20 text-liminal-night border-inner-resolve/40 font-semibold' };
  }
  return { label: `🗓️ In ${diffDays} Days`, color: 'bg-steady-renewal text-liminal-night/80 border-rooted-strength/40' };
}

// Extract exam timetable items from OCR-scanned text or document images
function extractExamsFromOCRText(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 2);
  const detected = [];
  const currentYear = new Date().getFullYear();

  const MONTHS = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };

  lines.forEach((line) => {
    let matchedDate = null;
    
    // Check YYYY-MM-DD
    const isoMatch = line.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
    if (isoMatch) {
      matchedDate = `${isoMatch[1]}-${pad(isoMatch[2])}-${pad(isoMatch[3])}`;
    } else {
      // Check DD/MM/YYYY
      const ddmmyyyy = line.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})\b/);
      if (ddmmyyyy) {
        matchedDate = `${ddmmyyyy[3]}-${pad(ddmmyyyy[2])}-${pad(ddmmyyyy[1])}`;
      } else {
        // Check DD Month [YYYY] e.g. "15 Oct", "15 October 2026", "Oct 15"
        const monthWordMatch = line.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(20\d{2}))?\b/i) ||
                               line.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(20\d{2}))?\b/i);
        if (monthWordMatch) {
          let dayNum, monthWord, yr = currentYear;
          if (isNaN(monthWordMatch[1])) {
            monthWord = monthWordMatch[1].toLowerCase();
            dayNum = monthWordMatch[2];
            if (monthWordMatch[3]) yr = monthWordMatch[3];
          } else {
            dayNum = monthWordMatch[1];
            monthWord = monthWordMatch[2].toLowerCase();
            if (monthWordMatch[3]) yr = monthWordMatch[3];
          }
          const mKey = Object.keys(MONTHS).find(k => monthWord.startsWith(k));
          if (mKey) {
            matchedDate = `${yr}-${MONTHS[mKey]}-${pad(dayNum)}`;
          }
        }
      }
    }

    // Check time range in line
    let start = '10:00', end = '13:00';
    const timeRangeMatch = line.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (timeRangeMatch) {
      start = normalizeTime(timeRangeMatch[1]);
      end = normalizeTime(timeRangeMatch[2]);
    } else {
      const singleTimeMatch = line.match(/\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/i);
      if (singleTimeMatch) {
        start = normalizeTime(singleTimeMatch[1]);
        const [sh, sm] = start.split(':').map(Number);
        end = `${pad(Math.min(23, sh + 3))}:${pad(sm)}`;
      }
    }

    // Subject extraction
    let subjectCandidate = line
      .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '')
      .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g, '')
      .replace(/\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+20\d{2})?\b/gi, '')
      .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+20\d{2})?\b/gi, '')
      .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:-|to|–)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
      .replace(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi, '')
      .replace(/(exam|examination|midterm|final|quiz|theory|practical|paper|time|date|subject|course|hall|room|no|code|sem|semester)/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .trim();

    subjectCandidate = subjectCandidate.replace(/\s+/g, ' ');

    if (subjectCandidate.length >= 3 && matchedDate) {
      detected.push({
        id: Math.random().toString(36).slice(2, 10),
        subject: subjectCandidate.charAt(0).toUpperCase() + subjectCandidate.slice(1),
        title: `${subjectCandidate} Exam`,
        date: matchedDate,
        start,
        end,
        weightage: normalizeExamType(line),
        room: line.toLowerCase().includes('hall') || line.toLowerCase().includes('room') ? (line.match(/(?:hall|room|lab|auditorium)\s*[a-z0-9-]+/i)?.[0] || '') : '',
        syllabus: ''
      });
    }
  });

  return detected;
}

export default function ExamTimetableManager({
  exams = [],
  onSaveExam,
  onDeleteExam,
  onImportBulkExams,
  subjectList = []
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  
  // Upload Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState('image_file'); // 'image_file' or 'paste'
  const [bulkText, setBulkText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const fileInputRef = useRef(null);

  // Form State for Single Exam
  const [form, setForm] = useState({
    subject: '',
    title: '',
    date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    start: '10:00',
    end: '13:00',
    room: '',
    weightage: 'Midterm',
    syllabus: ''
  });

  const openAddModal = () => {
    setEditingExam(null);
    setForm({
      subject: subjectList[0] || '',
      title: '',
      date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      start: '10:00',
      end: '13:00',
      room: '',
      weightage: 'Midterm',
      syllabus: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingExam(item);
    setForm({ ...item });
    setModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    onSaveExam({
      ...form,
      id: editingExam ? editingExam.id : undefined
    });
    setModalOpen(false);
  };

  const parseRawExams = (raw) => {
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
            subject: (item.subject || item.course || item.name || 'Subject').trim(),
            title: (item.title || `${item.subject || 'Exam'} Paper`).trim(),
            date: normalizeDate(item.date || item.examDate || item.Date),
            start: normalizeTime(item.start || item.startTime || item.Start || '10:00'),
            end: normalizeTime(item.end || item.endTime || item.End || '13:00'),
            weightage: normalizeExamType(item.type || item.weightage || item.category || 'Midterm'),
            room: (item.room || item.venue || item.hall || '').trim(),
            syllabus: (item.syllabus || item.topics || '').trim()
          }));
          setParsedPreview(items);
          return;
        }
      } catch (e) {}
    }

    // Try standard CSV lines
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed = [];

    lines.forEach((line) => {
      if (line.startsWith('#') || line.toLowerCase().startsWith('subject,') || line.toLowerCase().startsWith('date,')) return;

      const delimiter = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
      const parts = line.split(delimiter).map(s => s.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 3) {
        let subject, title, date, start, end, weightage = 'Midterm', room = '', syllabus = '';

        if (parts[0].includes('-') || parts[0].includes('/')) {
          date = normalizeDate(parts[0]);
          start = normalizeTime(parts[1]);
          end = normalizeTime(parts[2]);
          subject = parts[3] || 'Exam';
          title = parts[4] || `${subject} Exam`;
          weightage = normalizeExamType(parts[5] || 'Midterm');
          room = parts[6] || '';
          syllabus = parts[7] || '';
        } else {
          subject = parts[0];
          date = normalizeDate(parts[1]);
          start = normalizeTime(parts[2]);
          end = normalizeTime(parts[3] || '13:00');
          title = parts[4] || `${subject} Examination`;
          weightage = normalizeExamType(parts[5] || 'Midterm');
          room = parts[6] || '';
          syllabus = parts[7] || '';
        }

        if (subject && date) {
          parsed.push({
            id: Math.random().toString(36).slice(2, 10),
            subject,
            title,
            date,
            start,
            end,
            weightage,
            room,
            syllabus
          });
        }
      }
    });

    // If CSV parsed items, use them; otherwise use intelligent OCR regex extractor
    if (parsed.length > 0) {
      setParsedPreview(parsed);
    } else {
      const ocrExtracted = extractExamsFromOCRText(raw);
      setParsedPreview(ocrExtracted);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadedFileName(file.name);

    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);

    if (isImage) {
      // Create local thumbnail preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objectUrl);
      setOcrLoading(true);
      setOcrProgress(0);
      setOcrStatusText('Initializing Optical Character Recognition (OCR)...');

      try {
        const result = await Tesseract.recognize(
          file,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setOcrProgress(Math.round(m.progress * 100));
                setOcrStatusText(`Scanning exam timetable image... ${Math.round(m.progress * 100)}%`);
              } else if (m.status === 'loading tesseract core') {
                setOcrStatusText('Loading AI Vision Engine...');
              }
            }
          }
        );

        const extractedText = result.data.text || '';
        setBulkText(extractedText);
        parseRawExams(extractedText);
      } catch (err) {
        console.error('OCR Error:', err);
        alert('Could not scan image text automatically. Please paste or enter the dates manually.');
      } finally {
        setOcrLoading(false);
      }
    } else {
      // Text / CSV / JSON file
      setImagePreviewUrl(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setBulkText(text);
        parseRawExams(text);
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) {
      alert('No valid exams detected. Please upload an image, CSV file, or paste your exam schedule.');
      return;
    }
    onImportBulkExams(parsedPreview);
    setBulkModalOpen(false);
    setBulkText('');
    setParsedPreview([]);
    setUploadedFileName('');
    setImagePreviewUrl(null);
  };

  const downloadCSVTemplate = () => {
    const today = new Date();
    const d1 = new Date(today); d1.setDate(d1.getDate() + 3);
    const d2 = new Date(today); d2.setDate(d2.getDate() + 7);
    const d3 = new Date(today); d3.setDate(d3.getDate() + 12);

    const d1ISO = d1.toISOString().split('T')[0];
    const d2ISO = d2.toISOString().split('T')[0];
    const d3ISO = d3.toISOString().split('T')[0];

    const csvContent = `Subject,Date,Start,End,Title,Type,Venue,Syllabus\nData Structures,${d1ISO},10:00,12:00,Mid-Term Theory Exam,Midterm,Hall A,Trees Graphs Sorting\nCalculus,${d2ISO},14:00,17:00,Calculus Final Exam,Final Exam,Main Auditorium,Integrals Series Differential Eq\nDigital Electronics,${d3ISO},09:30,12:30,Electronics Quiz,Quiz / Test,Room 302,Logic Gates K-Maps FlipFlops\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "exam_timetable_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sortedExams = [...exams].sort((a, b) => {
    return new Date(`${a.date}T${a.start || '00:00'}`) - new Date(`${b.date}T${b.start || '00:00'}`);
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-rooted-strength/30 shadow-xs">
        <div>
          <h2 className="font-display font-bold text-liminal-night text-lg sm:text-xl flex items-center gap-2">
            <Award className="w-5 h-5 text-blush-rose" />
            Exam Timetable & Syllabus Tracker
          </h2>
          <p className="text-xs text-liminal-night/70 mt-1">
            Upload an image of your exam schedule or enter dates. Dedicated revision blocks will be automatically scheduled.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setParsedPreview([]);
              setBulkText('');
              setUploadedFileName('');
              setImagePreviewUrl(null);
            }}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-wild-light hover:bg-white text-liminal-night border border-rooted-strength/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-inner-resolve" /> Upload Image / Document
          </button>

          <button
            onClick={openAddModal}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-liminal-night hover:opacity-90 text-wild-light shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-vital-spark" /> Add Exam
          </button>
        </div>
      </div>

      {/* Exam List Cards */}
      {sortedExams.length === 0 ? (
        <div className="rounded-none border border-dashed border-rooted-strength/40 bg-white/70 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-white border border-rooted-strength/30 text-liminal-night flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Award className="w-7 h-7 text-blush-rose" />
          </div>
          <h3 className="font-display font-bold text-liminal-night text-lg">No Upcoming Exams Added</h3>
          <p className="text-xs text-liminal-night/70 max-w-md mx-auto mt-1 mb-5">
            Upload a photo / screenshot of your exam timetable or add upcoming Midterms and Finals so the AI creates dedicated revision blocks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setBulkModalOpen(true);
                setParsedPreview([]);
                setBulkText('');
                setUploadedFileName('');
                setImagePreviewUrl(null);
              }}
              className="px-5 py-2.5 rounded-full bg-liminal-night hover:opacity-90 text-wild-light text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-vital-spark" /> Upload Exam Picture / File
            </button>
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-wild-light text-liminal-night border border-rooted-strength/40 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4 text-calm-awakening" /> Add Exam Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedExams.map((exam) => {
            const badgeClass = EXAM_TYPE_BADGES[exam.weightage] || EXAM_TYPE_BADGES.Midterm;
            const countdown = getExamCountdown(exam.date, exam.start);
            return (
              <div
                key={exam.id}
                className="p-5 rounded-none border border-rooted-strength/30 bg-white shadow-xs hover:border-blush-rose/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 relative overflow-hidden group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                      {exam.weightage}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${countdown.color}`}>
                      {countdown.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-liminal-night text-base leading-snug">{exam.subject}</h3>
                    {exam.title && (
                      <p className="text-xs text-liminal-night/70 font-medium mt-0.5">{exam.title}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-liminal-night/75 pt-1">
                    <p className="flex items-center gap-1.5 font-semibold text-liminal-night">
                      <Calendar className="w-3.5 h-3.5 text-blush-rose" />
                      {fmtDisplayDate(exam.date)}
                    </p>
                    <p className="flex items-center gap-1.5 text-liminal-night/70">
                      <Clock className="w-3.5 h-3.5 text-rooted-strength" />
                      {fmtTime12(exam.start)} – {fmtTime12(exam.end)}
                    </p>
                    {exam.room && (
                      <p className="flex items-center gap-1.5 text-liminal-night/70">
                        <MapPin className="w-3.5 h-3.5 text-rooted-strength" />
                        {exam.room}
                      </p>
                    )}
                  </div>

                  {exam.syllabus && (
                    <div className="p-3 bg-[#FAF8F6] rounded-2xl border-l-2 border-l-blush-rose border border-rooted-strength/20 text-[11px] text-liminal-night/80">
                      <span className="font-bold text-liminal-night block mb-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blush-rose"></span>
                        Syllabus Scope:
                      </span>
                      <p className="line-clamp-2">{exam.syllabus}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 pt-3 border-t border-rooted-strength/25">
                  <button
                    onClick={() => openEditModal(exam)}
                    className="p-1.5 rounded-lg text-liminal-night/60 hover:text-blush-rose hover:bg-blush-rose/10 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteExam(exam.id)}
                    className="p-1.5 rounded-lg text-liminal-night/60 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Single Exam Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-liminal-night/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-rooted-strength/30 shadow-2xl p-6 relative animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-rooted-strength/30 mb-4">
              <h3 className="font-display font-bold text-liminal-night text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-inner-resolve" />
                {editingExam ? 'Edit Exam' : 'Add Exam Schedule'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-liminal-night/50 hover:text-liminal-night p-1 rounded-full hover:bg-rooted-strength/20 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-liminal-night mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Data Structures, Physics"
                  className="w-full bg-wild-light border border-rooted-strength/60 rounded-xl px-3.5 py-2.5 text-xs text-liminal-night focus:outline-none focus:border-liminal-night shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-liminal-night mb-1">Exam Type</label>
                  <select
                    value={form.weightage}
                    onChange={(e) => setForm({ ...form, weightage: e.target.value })}
                    className="w-full bg-wild-light border border-rooted-strength/60 rounded-xl px-3.5 py-2.5 text-xs text-liminal-night focus:outline-none focus:border-liminal-night cursor-pointer shadow-2xs"
                  >
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-liminal-night mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-wild-light border border-rooted-strength/60 rounded-xl px-3.5 py-2.5 text-xs text-liminal-night focus:outline-none focus:border-liminal-night shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-liminal-night mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                    className="w-full bg-wild-light border border-rooted-strength/60 rounded-xl px-3.5 py-2.5 text-xs text-liminal-night focus:outline-none focus:border-liminal-night shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-liminal-night mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                    className="w-full bg-wild-light border border-rooted-strength/60 rounded-xl px-3.5 py-2.5 text-xs text-liminal-night focus:outline-none focus:border-liminal-night shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-liminal-night mb-1">Exam Hall / Venue (Optional)</label>
                <input
                  type="text"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  placeholder="e.g. Examination Hall A, Seat 42"
                  className="w-full bg-wild-light border border-rooted-strength/60 rounded-xl px-3.5 py-2.5 text-xs text-liminal-night focus:outline-none focus:border-liminal-night shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-liminal-night mb-1">Syllabus / Key Chapters (Optional)</label>
                <textarea
                  rows={2}
                  value={form.syllabus}
                  onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
                  placeholder="e.g. Modules 1 to 4, Trees, Graphs, Sorting Algorithms"
                  className="w-full bg-wild-light border border-rooted-strength/60 rounded-xl px-3.5 py-2.5 text-xs text-liminal-night focus:outline-none focus:border-liminal-night shadow-2xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-rooted-strength/30">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-liminal-night/70 hover:bg-wild-light cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-bold bg-liminal-night hover:opacity-90 text-wild-light shadow-xs cursor-pointer"
                >
                  {editingExam ? 'Update Exam' : 'Save Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Picture, Document & Bulk Import Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-liminal-night/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-rooted-strength/30 shadow-2xl p-6 relative my-8 max-h-[90vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-rooted-strength/30 mb-4 shrink-0">
              <h3 className="font-display font-bold text-liminal-night flex items-center gap-2 text-base">
                <Scan className="w-5 h-5 text-inner-resolve" />
                Upload Exam Timetable (Photo, PDF, or CSV)
              </h3>
              <button onClick={() => setBulkModalOpen(false)} className="text-liminal-night/50 hover:text-liminal-night p-1 rounded-full hover:bg-rooted-strength/20 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode switch */}
            <div className="flex items-center gap-1.5 p-1 bg-wild-light rounded-2xl border border-rooted-strength/40 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setUploadTab('image_file')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadTab === 'image_file' ? 'bg-steady-renewal text-liminal-night shadow-xs font-bold' : 'text-liminal-night/60 hover:text-liminal-night'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Upload Photo / CSV / File
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('paste')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadTab === 'paste' ? 'bg-steady-renewal text-liminal-night shadow-xs font-bold' : 'text-liminal-night/60 hover:text-liminal-night'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Paste Raw Schedule
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {uploadTab === 'image_file' ? (
                <div className="space-y-3">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
                      dragActive
                        ? 'border-liminal-night bg-wild-light/90'
                        : 'border-rooted-strength/70 hover:border-inner-resolve hover:bg-wild-light/60'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*, .png, .jpg, .jpeg, .webp, .bmp, .csv, .txt, .tsv, .json"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                      }}
                      className="hidden"
                    />

                    {imagePreviewUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={imagePreviewUrl}
                          alt="Uploaded Timetable"
                          className="max-h-36 rounded-xl border border-rooted-strength/40 shadow-xs object-contain"
                        />
                        <p className="text-xs font-bold text-liminal-night">{uploadedFileName}</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-wild-light text-inner-resolve border border-rooted-strength/40 flex items-center justify-center shadow-xs">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-liminal-night">
                            {uploadedFileName ? uploadedFileName : 'Click to upload a Picture (PNG/JPG) or CSV / Document'}
                          </p>
                          <p className="text-[11px] text-liminal-night/60 mt-0.5">
                            AI Optical Character Recognition (OCR) will automatically scan the photo and detect dates & subjects
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* OCR Progress Loading bar */}
                  {ocrLoading && (
                    <div className="p-4 rounded-2xl bg-wild-light border border-rooted-strength/40 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-bold text-liminal-night">
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-liminal-night" />
                          {ocrStatusText}
                        </span>
                        <span>{ocrProgress}%</span>
                      </div>
                      <div className="w-full bg-rooted-strength/30 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-calm-awakening h-full transition-all duration-200"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-liminal-night/70 px-1">
                    <span>Prefer entering into a spreadsheet?</span>
                    <button
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="inline-flex items-center gap-1 text-liminal-night font-bold hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-inner-resolve" /> Download CSV Template
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-liminal-night/70">
                    Paste your exam timetable text below:
                  </p>
                  <textarea
                    rows={5}
                    value={bulkText}
                    onChange={(e) => {
                      setBulkText(e.target.value);
                      parseRawExams(e.target.value);
                    }}
                    placeholder={`Data Structures, 2026-10-15, 10:00, 12:00, Mid-Term Exam, Midterm, Hall A, Trees and Graphs\nCalculus, 2026-10-20, 14:00, 17:00, Final Exam, Final Exam, Main Auditorium, All Modules`}
                    className="w-full p-3 font-mono text-xs bg-wild-light border border-rooted-strength/60 rounded-2xl text-liminal-night focus:outline-none focus:border-liminal-night shadow-2xs"
                  />
                </div>
              )}

              {/* Detected exams preview */}
              {parsedPreview.length > 0 && (
                <div className="border border-rooted-strength/40 bg-wild-light/80 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-liminal-night flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-calm-awakening" />
                      Detected Exams ({parsedPreview.length} items)
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedPreview([])}
                      className="text-[11px] text-liminal-night/70 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {parsedPreview.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-steady-renewal p-2.5 rounded-xl border border-rooted-strength/40 flex items-center justify-between text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="font-bold text-wild-light bg-liminal-night px-2 py-0.5 rounded-md text-[10px]">
                            {fmtDisplayDate(item.date)}
                          </span>
                          <span className="font-semibold text-liminal-night">{item.subject}</span>
                          <span className="text-[10px] text-liminal-night/60">
                            {fmtTime12(item.start)} – {fmtTime12(item.end)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-rooted-strength/40 bg-wild-light text-liminal-night/80">
                            {item.weightage}
                          </span>
                          {item.room && (
                            <span className="text-[10px] text-liminal-night/60">📍 {item.room}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setParsedPreview(parsedPreview.filter((_, i) => i !== idx))}
                          className="text-liminal-night/50 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-rooted-strength/30 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-liminal-night/70 hover:bg-wild-light cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedPreview.length === 0 || ocrLoading}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-full text-xs font-bold bg-liminal-night hover:opacity-90 text-wild-light disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin text-vital-spark" /> : <CheckCircle2 className="w-4 h-4 text-vital-spark" />}
                Import {parsedPreview.length > 0 ? `(${parsedPreview.length}) Exams` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
