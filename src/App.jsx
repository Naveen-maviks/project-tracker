import { useEffect, useState } from "react";

export const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "#8a94a6" },
  { id: "in-progress", title: "In Progress", color: "#d98e04" },
  { id: "in-review", title: "In Review", color: "#7c5cd6" },
  { id: "ready", title: "Ready", color: "#1f8fb5" },
  { id: "completed", title: "Completed", color: "#2f9e5f" },
];

const SEED = [
  { id: 1, title: "Set up project repository", status: "completed" },
  { id: 2, title: "Design board layout", status: "in-review" },
  { id: 3, title: "Build column components", status: "in-progress" },
  { id: 4, title: "Add card creation form", status: "ready" },
  { id: 5, title: "Add search and filters", status: "backlog" },
  { id: 6, title: "Add drag and drop", status: "backlog" },
];

const STORAGE_KEY = "project-tracker:cards";

function loadCards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : SEED;
  } catch {
    return SEED;
  }
}

function Card({ card, onMove, onDelete }) {
  return (
    <li className="card">
      <p className="card-title">{card.title}</p>
      <div className="card-actions">
        <select
          aria-label={`Move "${card.title}" to another column`}
          value={card.status}
          onChange={(e) => onMove(card.id, e.target.value)}
        >
          {COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button
          className="ghost"
          onClick={() => onDelete(card.id)}
          aria-label={`Delete "${card.title}"`}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function Column({ column, cards, onAdd, onMove, onDelete }) {
  const [draft, setDraft] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onAdd(title, column.id);
    setDraft("");
  };

  return (
    <section className="column" aria-label={column.title}>
      <header className="column-head">
        <span className="dot" style={{ background: column.color }} />
        <h2>{column.title}</h2>
        <span className="count">{cards.length}</span>
      </header>

      <ul className="cards">
        {cards.length === 0 && <li className="empty">No items yet</li>}
        {cards.map((card) => (
          <Card key={card.id} card={card} onMove={onMove} onDelete={onDelete} />
        ))}
      </ul>

      <form className="add" onSubmit={submit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an item"
          aria-label={`Add an item to ${column.title}`}
        />
        <button type="submit">Add</button>
      </form>
    </section>
  );
}

export default function App() {
  const [cards, setCards] = useState(loadCards);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
      /* storage unavailable; board still works in memory */
    }
  }, [cards]);

  const addCard = (title, status) =>
    setCards((prev) => [...prev, { id: Date.now(), title, status }]);
  const moveCard = (id, status) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  const deleteCard = (id) => setCards((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="app">
      <header className="topbar">
        <h1>Project Tracker</h1>
        <p>{cards.length} items across {COLUMNS.length} stages</p>
      </header>
      <main className="board">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            cards={cards.filter((c) => c.status === column.id)}
            onAdd={addCard}
            onMove={moveCard}
            onDelete={deleteCard}
          />
        ))}
      </main>
    </div>
  );
}
