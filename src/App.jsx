import { useEffect, useState } from "react";

export const COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "in-review", title: "In Review" },
  { id: "ready", title: "Ready" },
  { id: "completed", title: "Completed" },
];
const TYPES = {
  task: { label: "Task", glyph: "✓" },
  story: { label: "Story", glyph: "★" },
  bug: { label: "Bug", glyph: "●" },
};
const PRIORITIES = {
  highest: { label: "Highest", glyph: "▲" },
  high: { label: "High", glyph: "▲" },
  medium: { label: "Medium", glyph: "=" },
  low: { label: "Low", glyph: "▼" },
};
const PEOPLE = ["Unassigned", "Naveen", "Asha", "Ravi"];

const issue = (n, title, status, type = "task", priority = "medium", assignee = "Unassigned", description = "") => ({
  id: n, key: `PT-${n}`, title, status, type, priority, assignee, description,
});
const SEED = [
  issue(1, "Set up project repository", "completed", "task", "medium", "Naveen"),
  issue(2, "Design board layout", "in-review", "story", "high", "Asha"),
  issue(3, "Build column components", "in-progress", "task", "high", "Naveen"),
  issue(4, "Add card creation form", "ready", "story", "medium", "Ravi"),
  issue(5, "Add search and filters", "backlog", "story", "low"),
  issue(6, "Add drag and drop", "backlog", "task", "highest", "Naveen"),
];

const STORAGE_KEY = "project-tracker:issues:v2";
function loadIssues() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : SEED;
  } catch {
    return SEED;
  }
}

function Avatar({ name }) {
  const none = name === "Unassigned";
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className="avatar"
      aria-label={`Assignee: ${name}`}
      title={name}
      style={none ? undefined : { background: `hsl(${hue} 55% 42%)` }}
    >
      {none ? "?" : name[0]}
    </span>
  );
}

function IssueCard({ item, onMove, onDelete, onDragStart, onDragEnd, dragging }) {
  const t = TYPES[item.type];
  const p = PRIORITIES[item.priority];
  return (
    <li
      className={`card${dragging ? " dragging" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(item.id, e)}
      onDragEnd={onDragEnd}
    >
      <p className="card-title">{item.title}</p>
      <div className="card-tools">
        <select
          aria-label={`Move "${item.title}" to another column`}
          value={item.status}
          onChange={(e) => onMove(item.id, e.target.value)}
        >
          {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button className="ghost" onClick={() => onDelete(item.id)} aria-label={`Delete "${item.title}"`}>✕</button>
      </div>
      <div className="card-foot">
        <span className={`type type-${item.type}`} aria-label={`Type: ${t.label}`} title={t.label}>{t.glyph}</span>
        <span className="key">{item.key}</span>
        <span className="spacer" />
        <span className={`prio prio-${item.priority}`} aria-label={`Priority: ${p.label}`} title={p.label}>{p.glyph}</span>
        <Avatar name={item.assignee} />
      </div>
    </li>
  );
}

function QuickCreate({ column, onCreate }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const close = () => { setOpen(false); setDraft(""); };

  if (!open) {
    return (
      <button className="quick-open" aria-label={`Create issue in ${column.title}`} onClick={() => setOpen(true)}>
        + Create issue
      </button>
    );
  }
  const submit = (e) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onCreate({ title, status: column.id });
    close();
  };
  return (
    <form className="quick-form" onSubmit={submit}>
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && close()}
        placeholder="What needs to be done?"
        aria-label={`Summary for new issue in ${column.title}`}
      />
      <div className="row">
        <button type="submit">Add</button>
        <button type="button" className="ghost" onClick={close}>Cancel</button>
      </div>
    </form>
  );
}

function Column({ column, items, drag, onCreate, onMove, onDelete }) {
  const [over, setOver] = useState(false);
  return (
    <section
      className={`column${over ? " drop-target" : ""}`}
      aria-label={column.title}
      onDragOver={(e) => {
        if (drag.id === null) return;
        e.preventDefault();
        if (!over) setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        drag.drop(column.id, e);
      }}
    >
      <header className="column-head">
        <h2>{column.title}</h2>
        <span className="count">{items.length}</span>
      </header>
      <ul className="cards">
        {items.map((item) => (
          <IssueCard
            key={item.id}
            item={item}
            onMove={onMove}
            onDelete={onDelete}
            onDragStart={drag.start}
            onDragEnd={drag.end}
            dragging={drag.id === item.id}
          />
        ))}
      </ul>
      <QuickCreate column={column} onCreate={onCreate} />
    </section>
  );
}

function CreateDialog({ onCreate, onClose }) {
  const [form, setForm] = useState({
    title: "", description: "", type: "task", priority: "medium", assignee: "Unassigned", status: "backlog",
  });
  const [error, setError] = useState("");
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Summary is required");
    onCreate({ ...form, title: form.title.trim() });
    onClose();
  };
  const field = (label, control) => (
    <label className="field"><span>{label}</span>{control}</label>
  );

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="dialog"
        role="dialog"
        aria-label="Create issue"
        onSubmit={submit}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        noValidate
      >
        <h2>Create issue</h2>
        {field("Issue type", (
          <select value={form.type} onChange={set("type")}>
            {Object.entries(TYPES).map(([id, t]) => <option key={id} value={id}>{t.label}</option>)}
          </select>
        ))}
        {field("Summary", <input autoFocus value={form.title} onChange={set("title")} />)}
        {error && <p className="error" role="alert">{error}</p>}
        {field("Description", <textarea rows={4} value={form.description} onChange={set("description")} />)}
        <div className="row two">
          {field("Priority", (
            <select value={form.priority} onChange={set("priority")}>
              {Object.entries(PRIORITIES).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
            </select>
          ))}
          {field("Assignee", (
            <select value={form.assignee} onChange={set("assignee")}>
              {PEOPLE.map((p) => <option key={p}>{p}</option>)}
            </select>
          ))}
        </div>
        {field("Status", (
          <select value={form.status} onChange={set("status")}>
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        ))}
        <div className="row end">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button type="submit">Create</button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [issues, setIssues] = useState(loadIssues);
  const [dragId, setDragId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    } catch {
      /* storage unavailable; the board still works in memory */
    }
  }, [issues]);

  const createIssue = (data) =>
    setIssues((prev) => {
      const n = Math.max(0, ...prev.map((i) => i.id)) + 1;
      return [...prev, issue(n, data.title, data.status, data.type, data.priority, data.assignee, data.description)];
    });
  const moveIssue = (id, status) =>
    setIssues((prev) => {
      const found = prev.find((i) => i.id === id);
      if (!found || found.status === status) return prev;
      return [...prev.filter((i) => i.id !== id), { ...found, status }];
    });
  const deleteIssue = (id) => setIssues((prev) => prev.filter((i) => i.id !== id));

  const drag = {
    id: dragId,
    start: (id, e) => {
      setDragId(id);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(id));
    },
    end: () => setDragId(null),
    drop: (status, e) => {
      const id = dragId ?? Number(e.dataTransfer.getData("text/plain"));
      if (id) moveIssue(id, status);
      setDragId(null);
    },
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="crumbs">Projects / Project Tracker</p>
          <h1>PT board</h1>
        </div>
        <span className="summary">{issues.length} issues</span>
        <button className="create" onClick={() => setShowCreate(true)}>Create</button>
      </header>
      <main className="board">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            items={issues.filter((i) => i.status === column.id)}
            drag={drag}
            onCreate={createIssue}
            onMove={moveIssue}
            onDelete={deleteIssue}
          />
        ))}
      </main>
      {showCreate && <CreateDialog onCreate={createIssue} onClose={() => setShowCreate(false)} />}
    </div>
  );
}
