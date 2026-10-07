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

// Predefined Color Themes for Sticky Notes
export const NOTE_COLORS = [
  { id: "yellow", name: "Amber Gold", bg: "bg-theme-bg", border: "border-theme-accent-green-light", text: "text-theme-text", accent: "#CA8A04", dot: "bg-theme-border" },
  { id: "purple", name: "Lavender", bg: "bg-theme-bg", border: "border-theme-accent-green", text: "text-theme-text", accent: "#9333EA", dot: "bg-theme-border" },
  { id: "green", name: "Mint Sage", bg: "bg-theme-bg", border: "border-theme-accent-green-light", text: "text-theme-text", accent: "#16A34A", dot: "bg-theme-border" },
  { id: "blue", name: "Sky Ice", bg: "bg-theme-bg", border: "border-theme-accent-green", text: "text-theme-text", accent: "#0284C7", dot: "bg-theme-border" },
  { id: "rose", name: "Rose Coral", bg: "bg-theme-bg", border: "border-theme-accent-green", text: "text-theme-text", accent: "#E11D48", dot: "bg-theme-border" },
  { id: "dark", name: "Dark Velvet", bg: "bg-[#B4C6A6]", border: "border-[#B4C6A6]", text: "text-theme-bg", accent: "#FACC15", dot: "bg-theme-muted" }
];

export const TODO_TAGS = [
  { label: "Quick Task", icon: Zap, color: "bg-theme-accent-green-light text-theme-text border-theme-accent-green-light" },
  { label: "Assignment", icon: BookOpen, color: "bg-theme-accent-green-light text-theme-text border-theme-accent-green-light" },
  { label: "Revision", icon: Sparkles, color: "bg-theme-accent-green-light text-theme-text border-theme-accent-green-light" },
  { label: "Reminder", icon: Clock, color: "bg-theme-accent-green-light text-theme-text border-theme-accent-green-light" },
  { label: "General", icon: Tag, color: "bg-theme-bg text-theme-text border-theme-bg" }
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

  // Update local scratchpad if parent prop changes
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

  // Sorted and filtered notes (Pinned first)
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
    <div className="bg-theme-card rounded-[32px] p-5 sm:p-6 shadow-xs border border-theme-border space-y-5">
      {/* ----------------- SECTION HEADER & NAVIGATION ----------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#B4C6A6] text-theme-accent-green flex items-center justify-center shadow-xs">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-base text-theme-text tracking-tight">
                Daily Focus & Notes
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-theme-bg border border-theme-border text-[10px] font-bold text-theme-text">
                {completedCount}/{totalTodos} To-Dos Done
              </span>
            </div>
            <p className="text-[11px] text-theme-text font-medium">
              Manage your quick daily checklists & study notes
            </p>
          </div>
        </div>

        {/* View Switcher Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-theme-bg border border-theme-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("dual")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "dual"
                ? "bg-[#B4C6A6] text-theme-text shadow-2xs"
                : "text-theme-text hover:text-theme-text hover:bg-theme-card/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dual View</span>
          </button>
          <button
            onClick={() => setActiveTab("todos")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "todos"
                ? "bg-[#B4C6A6] text-theme-text shadow-2xs"
                : "text-theme-text hover:text-theme-text hover:bg-theme-card/60"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>To-Do List</span>
            {todos.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-theme-border text-theme-text text-[9px] font-black flex items-center justify-center">
                {todos.filter(t => !t.completed).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "bg-[#B4C6A6] text-theme-text shadow-2xs"
                : "text-theme-text hover:text-theme-text hover:bg-theme-card/60"
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Notes</span>
            {notes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-theme-accent-green-light text-theme-text text-[9px] font-bold">
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
                <h3 className="font-display font-bold text-sm text-theme-text flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-theme-accent-green fill-theme-border" />
                  Daily To-Do List
                </h3>
                <span className="text-[11px] font-bold text-theme-muted">
                  ({filteredTodos.length} items)
                </span>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 text-[10px] font-bold bg-theme-bg p-0.5 rounded-lg border border-theme-border">
                <button
                  onClick={() => setTodoFilter("all")}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    todoFilter === "all" ? "bg-theme-card text-theme-text shadow-2xs" : "text-theme-text"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTodoFilter("active")}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    todoFilter === "active" ? "bg-theme-card text-theme-text shadow-2xs" : "text-theme-text"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setTodoFilter("completed")}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    todoFilter === "completed" ? "bg-theme-card text-theme-text shadow-2xs" : "text-theme-text"
                  }`}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Quick Progress Bar */}
            {totalTodos > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-theme-text">
                  <span>Progress today</span>
                  <span className="text-theme-text">{progressPercent}% Completed</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-theme-bg overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-theme-border to-theme-accent-green transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Add Bar */}
            <form onSubmit={handleAddTodoSubmit} className="space-y-2">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-theme-bg border border-theme-border focus-within:border-[#B4C6A6] transition-all">
                <input
                  type="text"
                  value={todoInput}
                  onChange={(e) => setTodoInput(e.target.value)}
                  placeholder="Add a to-do, task or daily focus... (Press Enter)"
                  className="flex-1 px-2.5 py-1.5 bg-transparent text-xs text-theme-text placeholder-[#A8A29E] font-medium outline-none"
                />
                
                {/* Priority Selector Pill */}
                <select
                  value={todoPriority}
                  onChange={(e) => setTodoPriority(e.target.value)}
                  className="px-2 py-1 rounded-xl bg-theme-card text-[10px] font-bold text-theme-text border border-theme-border outline-none cursor-pointer"
                >
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>

                {/* Tag Selector Pill */}
                <select
                  value={todoTag}
                  onChange={(e) => setTodoTag(e.target.value)}
                  className="px-2 py-1 rounded-xl bg-theme-card text-[10px] font-bold text-theme-text border border-theme-border outline-none cursor-pointer hidden sm:inline-block"
                >
                  {TODO_TAGS.map(t => (
                    <option key={t.label} value={t.label}>{t.label}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={!todoInput.trim()}
                  className="w-7 h-7 rounded-xl bg-[#B4C6A6] hover:bg-[#B4C6A6] disabled:opacity-40 text-theme-text flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-2xs"
                  title="Add To-Do"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* To-Do Items List */}
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {filteredTodos.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-theme-border bg-theme-bg/60 space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-theme-accent-green-light text-theme-accent-green mx-auto flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-theme-text">
                    {todoFilter === "completed" ? "No completed items yet" : "No to-dos on your list!"}
                  </p>
                  <p className="text-[11px] text-theme-muted">
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
                      className={`group p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        todo.completed
                          ? "bg-theme-bg/70 border-theme-border opacity-75"
                          : "bg-theme-card hover:bg-theme-bg border-theme-border shadow-2xs hover:border-theme-border"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Custom Interactive Checkbox */}
                        <button
                          type="button"
                          onClick={() => onToggleTodo && onToggleTodo(todo.id)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            todo.completed
                              ? "bg-[#B4C6A6] text-theme-accent-green"
                              : "border-2 border-theme-border hover:border-[#B4C6A6] bg-theme-card text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold leading-snug break-words ${
                              todo.completed
                                ? "line-through text-theme-muted"
                                : "text-theme-text"
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
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            isHigh
                              ? "bg-theme-accent-green-light text-theme-accent-green border border-theme-accent-green-light"
                              : isMed
                              ? "bg-theme-accent-green-light text-theme-text border border-theme-accent-green-light"
                              : "bg-theme-accent-green-light text-theme-text border border-theme-accent-green-light"
                          }`}
                        >
                          {todo.priority || "Med"}
                        </span>

                        {/* Tag Badge */}
                        {todo.tag && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-theme-bg text-theme-text text-[9px] font-bold">
                            {todo.tag}
                          </span>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteTodo && onDeleteTodo(todo.id)}
                          className="w-6 h-6 rounded-lg text-theme-muted hover:text-theme-accent-green hover:bg-theme-card flex items-center justify-center opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
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
              <div className="flex items-center justify-between pt-2 border-t border-theme-border text-xs">
                <span className="text-[11px] font-bold text-theme-muted">
                  {completedCount} completed task{completedCount > 1 ? "s" : ""}
                </span>
                <button
                  onClick={onClearCompletedTodos}
                  className="text-[11px] font-bold text-theme-accent-green hover:text-theme-accent-green transition-all cursor-pointer flex items-center gap-1"
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
                <h3 className="font-display font-bold text-sm text-theme-text flex items-center gap-1.5">
                  <StickyNote className="w-4 h-4 text-theme-accent-green fill-theme-border" />
                  Notes
                </h3>
                <span className="text-[11px] font-bold text-theme-muted">
                  ({filteredNotes.length} notes)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={startCreateNote}
                  className="px-2.5 py-1 rounded-xl bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-text text-[10px] font-black shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-theme-accent-green" />
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
                    className="p-3.5 rounded-2xl bg-theme-bg border-2 border-[#B4C6A6] space-y-3 shadow-sm animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Note title (e.g., Physics Formula, Quiz Reminder)"
                        className="w-full bg-theme-card px-2.5 py-1.5 rounded-xl border border-theme-border text-xs font-bold text-theme-text placeholder-[#A8A29E] outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsCreatingNote(false)}
                        className="w-6 h-6 rounded-lg text-theme-text hover:bg-theme-card flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                      placeholder="Write your note, equations, link, or key concept here..."
                      className="w-full bg-theme-card p-2.5 rounded-xl border border-theme-border text-xs font-medium text-theme-text placeholder-[#A8A29E] outline-none resize-none leading-relaxed"
                    />

                    {/* Color Picker & Tag Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-theme-border">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-theme-text">Theme:</span>
                        <div className="flex items-center gap-1">
                          {NOTE_COLORS.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setNoteColor(c.id)}
                              className={`w-4.5 h-4.5 rounded-full ${c.dot} border transition-all cursor-pointer ${
                                noteColor === c.id ? "scale-125 ring-2 ring-theme-text ring-offset-1" : "opacity-80 hover:opacity-100"
                              }`}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[10px] font-bold text-theme-text cursor-pointer">
                          <input
                            type="checkbox"
                            checked={noteIsPinned}
                            onChange={(e) => setNoteIsPinned(e.target.checked)}
                            className="rounded text-theme-accent-green"
                          />
                          <Pin className="w-3 h-3 text-theme-accent-green fill-theme-border" />
                          <span>Pin to top</span>
                        </label>

                        <button
                          type="submit"
                          className="px-3 py-1 rounded-xl bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-text text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
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
                    <div className="sm:col-span-2 py-8 px-4 text-center rounded-2xl border border-dashed border-theme-border bg-theme-bg/60 space-y-1.5">
                      <div className="w-8 h-8 rounded-full bg-theme-accent-green-light text-theme-accent-green mx-auto flex items-center justify-center">
                        <StickyNote className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-theme-text">No sticky notes yet</p>
                      <p className="text-[11px] text-theme-muted">
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
                          className={`group p-3 rounded-2xl border shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-2.5 relative ${colorCfg.bg} ${colorCfg.border} ${colorCfg.text}`}
                        >
                          {/* Note Top Bar: Title & Pin status */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {note.isPinned && (
                                <Pin className="w-3.5 h-3.5 text-theme-accent-green fill-theme-border shrink-0" />
                              )}
                              <h4 className="font-display font-extrabold text-xs leading-snug truncate">
                                {note.title || "Note"}
                              </h4>
                            </div>

                            {/* Action Buttons Toolbar */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-all shrink-0">
                              <button
                                onClick={() => onPinNote && onPinNote(note.id)}
                                className="w-5 h-5 rounded hover:bg-[#B4C6A6]/10 flex items-center justify-center cursor-pointer transition-all"
                                title={note.isPinned ? "Unpin note" : "Pin note to top"}
                              >
                                <Pin className={`w-3 h-3 ${note.isPinned ? "text-theme-accent-green fill-theme-border" : "text-theme-muted"}`} />
                              </button>

                              <button
                                onClick={() => handleCopyNote(note)}
                                className="w-5 h-5 rounded hover:bg-[#B4C6A6]/10 flex items-center justify-center cursor-pointer transition-all"
                                title="Copy note text"
                              >
                                {isCopied ? (
                                  <Check className="w-3 h-3 text-theme-accent-green stroke-[3]" />
                                ) : (
                                  <Copy className="w-3 h-3 text-theme-muted" />
                                )}
                              </button>

                              <button
                                onClick={() => startEditNote(note)}
                                className="w-5 h-5 rounded hover:bg-[#B4C6A6]/10 flex items-center justify-center cursor-pointer transition-all"
                                title="Edit note"
                              >
                                <Edit3 className="w-3 h-3 text-theme-muted" />
                              </button>

                              <button
                                onClick={() => onDeleteNote && onDeleteNote(note.id)}
                                className="w-5 h-5 rounded hover:bg-theme-accent-green hover:text-theme-text flex items-center justify-center cursor-pointer transition-all"
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
                          <div className="flex items-center justify-between text-[9px] font-bold opacity-75 pt-1.5 border-t border-[#B4C6A6]/5">
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
