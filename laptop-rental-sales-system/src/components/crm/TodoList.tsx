import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, CheckCircle2, Circle, Flag, Calendar,
  Tag, Search, Filter, X, ClipboardList,
} from "lucide-react";

/* ── Design tokens (match CRM theme) ── */
const D = {
  blue:   { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5" },
  amber:  { bg: "#fff8e6", text: "#8a5c00", border: "#ffdfa0", solid: "#d4930a" },
  red:    { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
  green:  { bg: "#eefaf0", text: "#166534", border: "#b0e8bc", solid: "#22c55e" },
  gray:   { bg: "#f4f3f0", text: "#555250", border: "#dddbd6", solid: "#8c8a85" },
  purple: { bg: "#f5f0ff", text: "#5b21b6", border: "#ddd6fe", solid: "#7c3aed" },
};

type Priority = "HIGH" | "MEDIUM" | "LOW";
type Category = "LEAD" | "FOLLOW_UP" | "CALL" | "MEETING" | "TASK" | "OTHER";
type Filter_ = "all" | "pending" | "done" | Priority | Category;

interface Todo {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  category: Category;
  due_date: string;
  done: boolean;
  created_at: string;
}

const PRIORITY_LABEL: Record<Priority, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
const PRIORITY_TOKEN: Record<Priority, any> = { HIGH: D.red, MEDIUM: D.amber, LOW: D.green };

const CATEGORY_LABEL: Record<Category, string> = {
  LEAD: "Lead", FOLLOW_UP: "Follow-up", CALL: "Call",
  MEETING: "Meeting", TASK: "Task", OTHER: "Other",
};
const CATEGORY_EMOJI: Record<Category, string> = {
  LEAD: "🎯", FOLLOW_UP: "📞", CALL: "☎️", MEETING: "🤝", TASK: "✅", OTHER: "📌",
};

const STORAGE_KEY = "crm_todos_v1";

function loadTodos(): Todo[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ── Empty state ── */
function Empty({ filtered }: { filtered: boolean }) {
  return (
    <div style={{ padding: "64px 24px", textAlign: "center", color: "#c0bbb5" }}>
      <ClipboardList size={40} style={{ margin: "0 auto 14px", display: "block", opacity: 0.4 }} />
      <div style={{ fontSize: "15px", fontWeight: 600, color: "#aaa", marginBottom: "6px" }}>
        {filtered ? "No matching tasks" : "No tasks yet"}
      </div>
      <div style={{ fontSize: "13px" }}>
        {filtered ? "Try clearing your filters" : 'Click "Add Task" to get started'}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export function TodoList() {
  const [todos, setTodos]       = useState<Todo[]>(() => loadTodos());
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<Filter_>("all");
  const [showForm, setShowForm] = useState(false);

  /* New task form state */
  const [newTitle, setNewTitle]     = useState("");
  const [newNotes, setNewNotes]     = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("MEDIUM");
  const [newCategory, setNewCategory] = useState<Category>("TASK");
  const [newDue, setNewDue]         = useState("");
  const [titleError, setTitleError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveTodos(todos); }, [todos]);

  /* ── Persist cross-tab ── */
  useEffect(() => {
    const handler = () => setTodos(loadTodos());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addTodo = () => {
    if (!newTitle.trim()) { setTitleError(true); titleRef.current?.focus(); return; }
    const todo: Todo = {
      id: genId(), title: newTitle.trim(), notes: newNotes.trim(),
      priority: newPriority, category: newCategory,
      due_date: newDue, done: false, created_at: new Date().toISOString(),
    };
    setTodos(prev => [todo, ...prev]);
    setNewTitle(""); setNewNotes(""); setNewPriority("MEDIUM");
    setNewCategory("TASK"); setNewDue(""); setShowForm(false); setTitleError(false);
  };

  const toggle = (id: string) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const remove = (id: string) =>
    setTodos(prev => prev.filter(t => t.id !== id));

  const clearDone = () =>
    setTodos(prev => prev.filter(t => !t.done));

  /* ── Filtering ── */
  const filtered = todos.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q);
    const matchF =
      filter === "all"    ? true :
      filter === "pending"? !t.done :
      filter === "done"   ? t.done :
      Object.keys(PRIORITY_LABEL).includes(filter) ? t.priority === filter :
      t.category === filter;
    return matchQ && matchF;
  });

  /* ── Computed counts ── */
  const doneCount    = todos.filter(t => t.done).length;
  const pendingCount = todos.filter(t => !t.done).length;
  const overdueCount = todos.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date()).length;

  const fmtDate = (d: string) => {
    if (!d) return null;
    const date = new Date(d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (date < today) return { label: "Overdue", color: D.red.text };
    if (date.toDateString() === today.toDateString()) return { label: "Today", color: D.amber.text };
    if (date.toDateString() === tomorrow.toDateString()) return { label: "Tomorrow", color: D.blue.text };
    return { label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), color: D.gray.text };
  };

  const selectSt: React.CSSProperties = {
    border: "1px solid #e8e6e1", borderRadius: "8px", padding: "7px 10px",
    fontSize: "13px", background: "#fff", color: "#333", cursor: "pointer",
    outline: "none", appearance: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a" }}>CRM To-Do List</div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>
            {pendingCount} pending · {doneCount} done
            {overdueCount > 0 && <span style={{ color: D.red.text, marginLeft: "8px" }}>· {overdueCount} overdue</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {doneCount > 0 && (
            <button
              onClick={clearDone}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "8px 14px", border: `1px solid ${D.red.border}`,
                borderRadius: "8px", background: D.red.bg, color: D.red.text,
                fontSize: "13px", fontWeight: 500, cursor: "pointer",
              }}
            >
              <Trash2 size={14} /> Clear Done
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setTimeout(() => titleRef.current?.focus(), 50); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", background: D.blue.solid, color: "#fff",
              border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* ── Add Task Form ── */}
      {showForm && (
        <div style={{
          background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px",
          padding: "20px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>New Task</div>
            <button onClick={() => { setShowForm(false); setTitleError(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: "4px", borderRadius: "6px" }}>
              <X size={16} />
            </button>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "12px" }}>
            <input
              ref={titleRef}
              type="text"
              placeholder="Task title…"
              value={newTitle}
              onChange={e => { setNewTitle(e.target.value); setTitleError(false); }}
              onKeyDown={e => e.key === "Enter" && addTodo()}
              style={{
                width: "100%", border: `1px solid ${titleError ? D.red.solid : "#e8e6e1"}`,
                borderRadius: "8px", padding: "9px 12px", fontSize: "14px",
                outline: "none", boxSizing: "border-box", fontWeight: 500, color: "#1a1a1a",
                background: titleError ? D.red.bg : "#fff",
              }}
            />
            {titleError && <div style={{ fontSize: "11px", color: D.red.text, marginTop: "4px" }}>Title is required</div>}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "12px" }}>
            <textarea
              placeholder="Notes (optional)…"
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              rows={2}
              style={{
                width: "100%", border: "1px solid #e8e6e1", borderRadius: "8px",
                padding: "8px 12px", fontSize: "13px", outline: "none",
                boxSizing: "border-box", resize: "none", color: "#555",
              }}
            />
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            {/* Priority */}
            <select value={newPriority} onChange={e => setNewPriority(e.target.value as Priority)} style={selectSt}>
              <option value="HIGH">🔴 High Priority</option>
              <option value="MEDIUM">🟡 Medium Priority</option>
              <option value="LOW">🟢 Low Priority</option>
            </select>

            {/* Category */}
            <select value={newCategory} onChange={e => setNewCategory(e.target.value as Category)} style={selectSt}>
              {(Object.entries(CATEGORY_LABEL) as [Category, string][]).map(([k, v]) => (
                <option key={k} value={k}>{CATEGORY_EMOJI[k]} {v}</option>
              ))}
            </select>

            {/* Due date */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} color="#aaa" />
              <input
                type="date"
                value={newDue}
                onChange={e => setNewDue(e.target.value)}
                style={{ ...selectSt, color: newDue ? "#1a1a1a" : "#aaa" }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button onClick={() => { setShowForm(false); setTitleError(false); }} style={{
              padding: "8px 18px", border: "1px solid #e8e6e1", borderRadius: "8px",
              background: "#f4f3f0", color: "#555", fontSize: "13px", fontWeight: 500, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={addTodo} style={{
              padding: "8px 22px", background: D.blue.solid, color: "#fff",
              border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}>Add Task</button>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{
        background: "#fff", border: "1px solid #ebebeb", borderRadius: "12px",
        padding: "12px 16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 180px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", border: "1px solid #e8e6e1", borderRadius: "8px",
              padding: "7px 10px 7px 30px", fontSize: "13px", outline: "none",
              boxSizing: "border-box", background: "#fafaf8",
            }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { key: "all",     label: "All",     count: todos.length },
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "done",    label: "Done",    count: doneCount },
            { key: "HIGH",    label: "High",    count: todos.filter(t => t.priority === "HIGH").length },
            { key: "MEDIUM",  label: "Medium",  count: todos.filter(t => t.priority === "MEDIUM").length },
          ].map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as Filter_)}
                style={{
                  padding: "5px 12px", borderRadius: "99px", fontSize: "12px",
                  fontWeight: active ? 600 : 400, cursor: "pointer",
                  border: active ? "none" : "1px solid #e8e6e1",
                  background: active ? D.blue.solid : "#fff",
                  color: active ? "#fff" : "#555",
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
                <span style={{
                  fontSize: "10px", fontWeight: 700, padding: "1px 5px", borderRadius: "99px",
                  background: active ? "rgba(255,255,255,0.25)" : D.gray.bg,
                  color: active ? "#fff" : D.gray.text,
                }}>{f.count}</span>
              </button>
            );
          })}
        </div>

        {/* Category filter */}
        <div style={{ position: "relative" }}>
          <Filter size={12} style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }} />
          <select
            value={Object.keys(CATEGORY_LABEL).includes(filter) ? filter : ""}
            onChange={e => setFilter(e.target.value as Filter_ || "all")}
            style={{ ...selectSt, paddingLeft: "26px", fontSize: "12px" }}
          >
            <option value="">All Categories</option>
            {(Object.entries(CATEGORY_LABEL) as [Category, string][]).map(([k, v]) => (
              <option key={k} value={k}>{CATEGORY_EMOJI[k]} {v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Todo Items ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px" }}>
            <Empty filtered={search !== "" || filter !== "all"} />
          </div>
        ) : (
          filtered.map(todo => {
            const pc = PRIORITY_TOKEN[todo.priority];
            const due = todo.due_date ? fmtDate(todo.due_date) : null;
            const isOverdue = !todo.done && todo.due_date && new Date(todo.due_date) < new Date();

            return (
              <div
                key={todo.id}
                style={{
                  background: todo.done ? "#fafaf8" : "#fff",
                  border: `1px solid ${isOverdue ? D.red.border : "#ebebeb"}`,
                  borderRadius: "12px", padding: "14px 16px",
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  transition: "box-shadow 0.15s",
                  opacity: todo.done ? 0.7 : 1,
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggle(todo.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "2px", flexShrink: 0, color: todo.done ? D.green.solid : "#ccc",
                    marginTop: "1px",
                  }}
                  title={todo.done ? "Mark as pending" : "Mark as done"}
                >
                  {todo.done
                    ? <CheckCircle2 size={20} />
                    : <Circle size={20} />
                  }
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "14px", fontWeight: 500, color: todo.done ? "#aaa" : "#1a1a1a",
                    textDecoration: todo.done ? "line-through" : "none",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {todo.title}
                  </div>
                  {todo.notes && (
                    <div style={{ fontSize: "12px", color: "#aaa", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {todo.notes}
                    </div>
                  )}

                  {/* Meta chips */}
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {/* Priority */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
                      background: pc.bg, color: pc.text, border: `0.5px solid ${pc.border}`,
                    }}>
                      <Flag size={9} />
                      {PRIORITY_LABEL[todo.priority]}
                    </span>

                    {/* Category */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "3px",
                      padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 500,
                      background: D.gray.bg, color: D.gray.text,
                    }}>
                      <Tag size={9} />
                      {CATEGORY_EMOJI[todo.category]} {CATEGORY_LABEL[todo.category]}
                    </span>

                    {/* Due date */}
                    {due && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "3px",
                        padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
                        background: isOverdue ? D.red.bg : "#f4f3f0",
                        color: due.color,
                      }}>
                        <Calendar size={9} />
                        {due.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => remove(todo.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "4px", borderRadius: "6px", color: "#ddd", flexShrink: 0,
                    transition: "color 0.15s",
                  }}
                  title="Delete task"
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = D.red.text)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#ddd")}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── Progress bar ── */}
      {todos.length > 0 && (
        <div style={{
          background: "#fff", border: "1px solid #ebebeb", borderRadius: "12px", padding: "14px 18px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}>Overall Progress</span>
            <span style={{ fontSize: "12px", color: "#888" }}>
              {doneCount} / {todos.length} completed ({Math.round((doneCount / todos.length) * 100)}%)
            </span>
          </div>
          <div style={{ height: "8px", background: "#f0eeeb", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{
              width: `${(doneCount / todos.length) * 100}%`, height: "100%",
              background: D.green.solid, borderRadius: "99px",
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
