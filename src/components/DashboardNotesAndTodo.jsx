import React, { useState, useMemo } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Pin,
  StickyNote,
  Copy,
  Check,
  Tag,
  AlertCircle,
  Flame,
  Zap,
  Sparkles,
  BookOpen,
  Layers,
  ChevronDown,
  Edit3,
  X,
  FileText,
  Clock,
  Filter
} from "lucide-react";

// Predefined Color Themes for Sticky Notes within the Palette
export const NOTE_COLORS = [
  { id: "yellow", name: "Steady Renewal", bg: "bg-steady-renewal", border: "border-rooted-strength", text: "text-liminal-night", accent: "#C0A381", dot: "bg-vital-spark" },
  { id: "green", name: "Calm Awakening", bg: "bg-calm-awakening/20", border: "border-calm-awakening/50", text: "text-liminal-night", accent: "#92A5A8", dot: "bg-calm-awakening" },
  { id: "blue", name: "Inner Resolve", bg: "bg-inner-resolve/15", border: "border-inner-resolve/40", text: "text-liminal-night", accent: "#556574", dot: "bg-inner-resolve" },
  { id: "rose", name: "Rooted Strength", bg: "bg-rooted-strength/20", border: "border-rooted-strength", text: "text-liminal-night", accent: "#C0A381", dot: "bg-rooted-strength" },
  { id: "dark", name: "Liminal Night", bg: "bg-liminal-night", border: "border-liminal-night", text: "text-wild-light", accent: "#E06F32", dot: "bg-liminal-night" }
];

export const TODO_TAGS = [
  { label: "Quick Task", icon: Zap, color: "bg-vital-spark/20 text-liminal-night border-vital-spark/40" },
  { label: "Assignment", icon: BookOpen, color: "bg-inner-resolve/20 text-liminal-night border-inner-resolve/40" },
  { label: "Revision", icon: Sparkles, color: "bg-calm-awakening/20 text-liminal-night border-calm-awakening/40" },
  { label: "Reminder", icon: Clock, color: "bg-steady-renewal text-liminal-night border-rooted-strength/60" },
  { label: "General", icon: Tag, color: "bg-wild-light text-liminal-night border-rooted-strength/40" }
];

export default function DashboardNotesAndTodo({
  todos = [],
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onClearCompletedTodos,
  notes = [],
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onPinNote,
  scratchpad = "",
  onUpdateScratchpad
}) {
  // Active Section Mode: 'dual' (both side by side) | 'todos' | 'notes' | 'scratchpad'
  const [activeTab, setActiveTab] = useState("dual");

  // To-Do local state
  const [todoInput, setTodoInput] = useState("");
  const [todoPriority, setTodoPriority] = useState("Medium"); // High | Medium | Low
  const [todoTag, setTodoTag] = useState("Quick Task");
  const [todoFilter, setTodoFilter] = useState("all"); // 'all' | 'active' | 'completed'

  // Notes local state
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteColor, setNoteColor] = useState("yellow");
  const [noteTag, setNoteTag] = useState("Study Tip");
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState(null);
  const [notesSearch, setNotesSearch] = useState("");

  // Scratchpad local state with instant debounced feedback
  const [localScratchpad, setLocalScratchpad] = useState(scratchpad || "");

  React.useEffect(() => {
    setLocalScratchpad(scratchpad || "");
  }, [scratchpad]);

  const handleScratchpadChange = (e) => {
    const val = e.target.value;
    setLocalScratchpad(val);
    if (onUpdateScratchpad) {
      onUpdateScratchpad(val);
    }
  };

  /* ----------------- TO-DO HANDLERS ----------------- */
  const handleAddTodoSubmit = (e) => {
    if (e) e.preventDefault();
    if (!todoInput.trim()) return;

    const newTodo = {
      id: "td-" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4),
      text: todoInput.trim(),
      completed: false,
      priority: todoPriority,
      tag: todoTag,
      createdAt: new Date().toISOString()
    };

    if (onAddTodo) {
      onAddTodo(newTodo);
    }
    setTodoInput("");
  };

  // Filtered To-Dos
  const filteredTodos = useMemo(() => {
    return todos.filter(t => {
      if (todoFilter === "active") return !t.completed;
      if (todoFilter === "completed") return t.completed;
      return true;
    });
  }, [todos, todoFilter]);

  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);
  const totalTodos = todos.length;
  const progressPercent = totalTodos === 0 ? 0 : Math.round((completedCount / totalTodos) * 100);

  /* ----------------- NOTES HANDLERS ----------------- */
  const startCreateNote = () => {
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteColor("yellow");
    setNoteTag("Study Tip");
    setNoteIsPinned(false);
    setIsCreatingNote(true);
  };

  const startEditNote = (n) => {
    setEditingNoteId(n.id);
    setNoteTitle(n.title || "");
    setNoteContent(n.content || "");
    setNoteColor(n.color || "yellow");
    setNoteTag(n.tag || "General");
    setNoteIsPinned(Boolean(n.isPinned));
    setIsCreatingNote(true);
  };

  const handleSaveNote = (e) => {
    if (e) e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    if (editingNoteId) {
      if (onUpdateNote) {
        onUpdateNote(editingNoteId, {
          title: noteTitle.trim() || "Untitled Note",
          content: noteContent.trim(),
          color: noteColor,
          tag: noteTag,
          isPinned: noteIsPinned,
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      const newNote = {
        id: "nt-" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4),
        title: noteTitle.trim() || "Quick Note",
        content: noteContent.trim(),
        color: noteColor,
        tag: noteTag,
        isPinned: noteIsPinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (onAddNote) {
        onAddNote(newNote);
      }
    }

    setIsCreatingNote(false);
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
  };

  const handleCopyNote = (n) => {
    const textToCopy = `${n.title ? n.title + "\n" : ""}${n.content || ""}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNoteId(n.id);
    setTimeout(() => {
      setCopiedNoteId(null);
    }, 2000);
  };

  const filteredNotes = useMemo(() => {
    let list = [...notes];
    if (notesSearch.trim()) {
      const q = notesSearch.toLowerCase();
      list = list.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tag && n.tag.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });
  }, [notes, notesSearch]);

  const getColorConfig = (colorId) => {
    return NOTE_COLORS.find(c => c.id === colorId) || NOTE_COLORS[0];
  };

  return (
    <div className="bg-white rounded-none p-5 sm:p-6 shadow-xs border border-rooted-strength/40 space-y-5">
      {/* ----------------- SECTION HEADER & NAVIGATION ----------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rooted-strength/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-calm-awakening text-wild-light flex items-center justify-center shadow-xs">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base text-liminal-night tracking-tight">
                Daily Focus & Notes
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-steady-renewal border border-rooted-strength/60 text-[10px] font-bold text-liminal-night">
                {completedCount}/{totalTodos} To-Dos Done
              </span>
            </div>
            <p className="text-[11px] text-liminal-night/70 font-medium">
              Manage your quick daily checklists & study notes
            </p>
          </div>
        </div>

        {/* View Switcher Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-steady-renewal border border-rooted-strength/50 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("dual")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "dual"
                ? "bg-calm-awakening text-wild-light shadow-2xs"
                : "text-liminal-night hover:text-liminal-night hover:bg-white/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dual View</span>
          </button>
          <button
            onClick={() => setActiveTab("todos")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "todos"
                ? "bg-calm-awakening text-wild-light shadow-2xs"
                : "text-liminal-night hover:text-liminal-night hover:bg-white/60"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>To-Do List</span>
            {todos.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-vital-spark text-liminal-night text-[9px] font-bold flex items-center justify-center">
                {todos.filter(t => !t.completed).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "bg-calm-awakening text-wild-light shadow-2xs"
                : "text-liminal-night hover:text-liminal-night hover:bg-white/60"
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Notes</span>
            {notes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-vital-spark/30 text-liminal-night text-[9px] font-bold">
                {notes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ----------------- DUAL / MULTI-PANEL CANVAS ----------------- */}
      <div className={`grid gap-6 ${
        activeTab === "dual" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
      }`}>
        
        {/* =========================================================================
            PANEL 1: ACTIONABLE TO-DO CHECKLIST (Left side or Full)
            ========================================================================= */}
        {(activeTab === "dual" || activeTab === "todos") && (
          <div className={`${activeTab === "dual" ? "lg:col-span-6 xl:col-span-6" : "w-full"} flex flex-col justify-between space-y-4`}>
            
            {/* To-Do Header & Filters */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-liminal-night flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-vital-spark fill-vital-spark" />
                  Daily To-Do List
                </h3>
                <span className="text-[11px] font-bold text-liminal-night/60">
                  ({filteredTodos.length} items)
                </span>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 text-[10px] font-bold bg-steady-renewal p-0.5 rounded-full border border-rooted-strength/50">
                <button
                  onClick={() => setTodoFilter("all")}
                  className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                    todoFilter === "all" ? "bg-white text-liminal-night shadow-2xs font-black" : "text-liminal-night/80 hover:text-liminal-night"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTodoFilter("active")}
                  className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                    todoFilter === "active" ? "bg-white text-liminal-night shadow-2xs font-black" : "text-liminal-night/80 hover:text-liminal-night"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setTodoFilter("completed")}
                  className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                    todoFilter === "completed" ? "bg-white text-liminal-night shadow-2xs font-black" : "text-liminal-night/80 hover:text-liminal-night"
                  }`}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Quick Progress Bar */}
            {totalTodos > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-liminal-night">
                  <span>Progress today</span>
                  <span className="text-calm-awakening font-bold">{progressPercent}% Completed</span>
                </div>
                <div className="w-full h-2 rounded-full bg-steady-renewal overflow-hidden border border-rooted-strength/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-vital-spark via-calm-awakening to-calm-awakening transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Add Bar */}
            <form onSubmit={handleAddTodoSubmit} className="space-y-2">
              <div className="flex items-center gap-2 p-1.5 rounded-full bg-wild-light border border-rooted-strength focus-within:border-liminal-night focus-within:ring-1 focus-within:ring-liminal-night/20 transition-all shadow-2xs">
                <input
                  type="text"
                  value={todoInput}
                  onChange={(e) => setTodoInput(e.target.value)}
                  placeholder="Add a to-do, task or daily focus... (Press Enter)"
                  className="flex-1 px-3 py-1 bg-transparent text-xs text-liminal-night placeholder-liminal-night/40 font-medium outline-none"
                />
                
                {/* Priority Selector Pill */}
                <select
                  value={todoPriority}
                  onChange={(e) => setTodoPriority(e.target.value)}
                  className="px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-liminal-night border border-rooted-strength outline-none cursor-pointer"
                >
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>

                {/* Tag Selector Pill */}
                <select
                  value={todoTag}
                  onChange={(e) => setTodoTag(e.target.value)}
                  className="px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-liminal-night border border-rooted-strength outline-none cursor-pointer hidden sm:inline-block"
                >
                  {TODO_TAGS.map(t => (
                    <option key={t.label} value={t.label}>{t.label}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={!todoInput.trim()}
                  className="w-7 h-7 rounded-full bg-liminal-night hover:bg-liminal-night/90 disabled:opacity-40 text-wild-light flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-2xs"
                  title="Add To-Do"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* To-Do Items List */}
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {filteredTodos.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-none border border-dashed border-rooted-strength bg-wild-light space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-steady-renewal text-liminal-night mx-auto flex items-center justify-center border border-rooted-strength/50">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-liminal-night">
                    {todoFilter === "completed" ? "No completed items yet" : "No to-dos on your list!"}
                  </p>
                  <p className="text-[11px] text-liminal-night/60">
                    {todoFilter === "completed"
                      ? "Check off tasks above to see them marked as done."
                      : "Add your first study goal or task for today using the input bar."}
                  </p>
                </div>
              ) : (
                filteredTodos.map((todo) => {
                  const isHigh = todo.priority === "High";
                  const isMed = todo.priority === "Medium";
                  return (
                    <div
                      key={todo.id}
                      className={`group p-2.5 rounded-none border transition-all flex items-center justify-between gap-2.5 ${
                        todo.completed
                          ? "bg-wild-light/60 border-rooted-strength/30 opacity-75"
                          : "bg-wild-light hover:bg-steady-renewal/40 border-rooted-strength/50 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Custom Interactive Checkbox */}
                        <button
                          type="button"
                          onClick={() => onToggleTodo && onToggleTodo(todo.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            todo.completed
                              ? "bg-calm-awakening text-wild-light shadow-2xs"
                              : "border-2 border-rooted-strength hover:border-calm-awakening bg-white text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold leading-snug break-words ${
                              todo.completed
                                ? "line-through text-liminal-night/50"
                                : "text-liminal-night"
                            }`}
                          >
                            {todo.text}
                          </p>
                        </div>
                      </div>

                      {/* Right Meta Badges & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Priority Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isHigh
                              ? "bg-liminal-night text-wild-light"
                              : isMed
                              ? "bg-vital-spark text-liminal-night"
                              : "bg-calm-awakening/20 text-calm-awakening"
                          }`}
                        >
                          {todo.priority || "Med"}
                        </span>

                        {/* Tag Badge */}
                        {todo.tag && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-steady-renewal text-liminal-night text-[9px] font-semibold border border-rooted-strength/40">
                            {todo.tag}
                          </span>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteTodo && onDeleteTodo(todo.id)}
                          className="w-6 h-6 rounded-full text-liminal-night/40 hover:text-liminal-night hover:bg-white flex items-center justify-center opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Delete to-do"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Clear Completed Footer */}
            {completedCount > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-rooted-strength/30 text-xs">
                <span className="text-[11px] font-bold text-liminal-night/60">
                  {completedCount} completed task{completedCount > 1 ? "s" : ""}
                </span>
                <button
                  onClick={onClearCompletedTodos}
                  className="text-[11px] font-bold text-calm-awakening hover:text-liminal-night transition-all cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Completed
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PANEL 2: STICKY STUDY NOTES & SCRATCHPAD (Right side or Full)
            ========================================================================= */}
        {(activeTab === "dual" || activeTab === "notes") && (
          <div className={`${activeTab === "dual" ? "lg:col-span-6 xl:col-span-6" : "w-full"} flex flex-col justify-between space-y-4`}>
            
            {/* Notes Header with Add & Search */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-liminal-night flex items-center gap-1.5">
                  <StickyNote className="w-4 h-4 text-inner-resolve" />
                  Notes & Highlights
                </h3>
                <span className="text-[11px] font-bold text-liminal-night/60">
                  ({filteredNotes.length} notes)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={startCreateNote}
                  className="px-3 py-1 rounded-full bg-liminal-night hover:bg-liminal-night/90 text-wild-light text-[10px] font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Note</span>
                </button>
              </div>
            </div>

            {/* Sticky Notes Mode */}
            <div className="space-y-3">
                
                {/* Note Creator Form Modal / Inline Box */}
                {isCreatingNote && (
                  <form
                    onSubmit={handleSaveNote}
                    className="p-4 rounded-none bg-steady-renewal border border-rooted-strength space-y-3 shadow-sm animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Note title (e.g., Physics Formula, Quiz Reminder)"
                        className="w-full bg-white px-3 py-1.5 rounded-xl border border-rooted-strength text-xs font-bold text-liminal-night placeholder-liminal-night/40 outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsCreatingNote(false)}
                        className="w-6 h-6 rounded-full text-liminal-night/60 hover:bg-white flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                      placeholder="Write your note, equations, link, or key concept here..."
                      className="w-full bg-white p-3 rounded-xl border border-rooted-strength text-xs font-medium text-liminal-night placeholder-liminal-night/40 outline-none resize-none leading-relaxed"
                    />

                    {/* Color Picker & Tag Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-rooted-strength/30">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-liminal-night">Palette:</span>
                        <div className="flex items-center gap-1.5">
                          {NOTE_COLORS.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setNoteColor(c.id)}
                              className={`w-5 h-5 rounded-full ${c.dot} border border-rooted-strength/60 transition-all cursor-pointer ${
                                noteColor === c.id ? "scale-125 ring-2 ring-liminal-night ring-offset-1" : "opacity-80 hover:opacity-100"
                              }`}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[10px] font-bold text-liminal-night cursor-pointer">
                          <input
                            type="checkbox"
                            checked={noteIsPinned}
                            onChange={(e) => setNoteIsPinned(e.target.checked)}
                            className="rounded text-calm-awakening"
                          />
                          <Pin className="w-3 h-3 text-calm-awakening fill-calm-awakening" />
                          <span>Pin note</span>
                        </label>

                        <button
                          type="submit"
                          className="px-3.5 py-1 rounded-full bg-liminal-night hover:bg-liminal-night/90 text-wild-light text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          {editingNoteId ? "Update Note" : "Save Note"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Sticky Notes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
                  {filteredNotes.length === 0 && !isCreatingNote ? (
                    <div className="sm:col-span-2 py-8 px-4 text-center rounded-none border border-dashed border-rooted-strength bg-wild-light space-y-1.5">
                      <div className="w-8 h-8 rounded-full bg-steady-renewal text-liminal-night mx-auto flex items-center justify-center border border-rooted-strength/50">
                        <StickyNote className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-liminal-night">No sticky notes yet</p>
                      <p className="text-[11px] text-liminal-night/60">
                        Click "+ New Note" above to pin study formulas, lecture takeaways, or revision reminders.
                      </p>
                    </div>
                  ) : (
                    filteredNotes.map((note) => {
                      const colorCfg = getColorConfig(note.color);
                      const isCopied = copiedNoteId === note.id;

                      return (
                        <div
                          key={note.id}
                          className={`group p-3.5 rounded-2xl border shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-2.5 relative ${colorCfg.bg} ${colorCfg.border} ${colorCfg.text}`}
                        >
                          {/* Note Top Bar: Title & Pin status */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {note.isPinned && (
                                <Pin className="w-3.5 h-3.5 text-calm-awakening fill-calm-awakening shrink-0" />
                              )}
                              <h4 className="font-serif font-bold text-xs leading-snug truncate">
                                {note.title || "Note"}
                              </h4>
                            </div>

                            {/* Action Buttons Toolbar */}
                            <div className="flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-all shrink-0">
                              <button
                                onClick={() => onPinNote && onPinNote(note.id)}
                                className="w-5 h-5 rounded hover:bg-black/5 flex items-center justify-center cursor-pointer transition-all"
                                title={note.isPinned ? "Unpin note" : "Pin note to top"}
                              >
                                <Pin className={`w-3 h-3 ${note.isPinned ? "text-calm-awakening fill-calm-awakening" : "text-liminal-night/40"}`} />
                              </button>

                              <button
                                onClick={() => handleCopyNote(note)}
                                className="w-5 h-5 rounded hover:bg-black/5 flex items-center justify-center cursor-pointer transition-all"
                                title="Copy note text"
                              >
                                {isCopied ? (
                                  <Check className="w-3 h-3 text-calm-awakening stroke-[3]" />
                                ) : (
                                  <Copy className="w-3 h-3 text-liminal-night/50" />
                                )}
                              </button>

                              <button
                                onClick={() => startEditNote(note)}
                                className="w-5 h-5 rounded hover:bg-black/5 flex items-center justify-center cursor-pointer transition-all"
                                title="Edit note"
                              >
                                <Edit3 className="w-3 h-3 text-liminal-night/50" />
                              </button>

                              <button
                                onClick={() => onDeleteNote && onDeleteNote(note.id)}
                                className="w-5 h-5 rounded hover:bg-black/10 flex items-center justify-center cursor-pointer transition-all"
                                title="Delete note"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Note Body */}
                          <p className="text-[11.5px] font-medium leading-relaxed whitespace-pre-wrap line-clamp-4 select-text opacity-90">
                            {note.content}
                          </p>

                          {/* Note Footer: Tag & Date */}
                          <div className="flex items-center justify-between text-[9px] font-bold opacity-75 pt-1.5 border-t border-rooted-strength/20">
                            <span>{note.tag || "General"}</span>
                            <span>{new Date(note.updatedAt || note.createdAt || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
