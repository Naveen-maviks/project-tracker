import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

const column = (name) => screen.getByRole("region", { name });
const card = (title) => screen.getByText(title).closest("li");
const dataTransfer = () => ({ setData: vi.fn(), getData: vi.fn(() => ""), effectAllowed: "", dropEffect: "" });

describe("Board layout", () => {
  it("shows the five stages in order", () => {
    render(<App />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Backlog", "In Progress", "In Review", "Ready", "Completed"]);
  });

  it("shows starter issues with keys in the right columns", () => {
    render(<App />);
    expect(within(column("Completed")).getByText("Set up project repository")).toBeInTheDocument();
    expect(within(column("Backlog")).getByText("Add search and filters")).toBeInTheDocument();
    expect(within(card("Set up project repository")).getByText("PT-1")).toBeInTheDocument();
  });
});

describe("Creating issues", () => {
  it("quick-creates an issue in the column and gives it the next key", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Create issue in Ready" }));
    await user.type(screen.getByLabelText("Summary for new issue in Ready"), "Write release notes");
    await user.keyboard("{Enter}");
    const created = within(column("Ready")).getByText("Write release notes").closest("li");
    expect(within(created).getByText("PT-7")).toBeInTheDocument();
  });

  it("ignores an empty summary", async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = within(column("Backlog")).getAllByRole("listitem").length;
    await user.click(screen.getByRole("button", { name: "Create issue in Backlog" }));
    await user.type(screen.getByLabelText("Summary for new issue in Backlog"), "   ");
    await user.keyboard("{Enter}");
    expect(within(column("Backlog")).getAllByRole("listitem").length).toBe(before);
  });

  it("creates a full issue from the Create dialog", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Create" }));
    const dialog = screen.getByRole("dialog", { name: "Create issue" });
    await user.type(within(dialog).getByLabelText("Summary"), "Fix login bug");
    await user.selectOptions(within(dialog).getByLabelText("Issue type"), "bug");
    await user.selectOptions(within(dialog).getByLabelText("Priority"), "high");
    await user.selectOptions(within(dialog).getByLabelText("Assignee"), "Asha");
    await user.selectOptions(within(dialog).getByLabelText("Status"), "ready");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const created = within(column("Ready")).getByText("Fix login bug").closest("li");
    expect(within(created).getByLabelText("Type: Bug")).toBeInTheDocument();
    expect(within(created).getByLabelText("Priority: High")).toBeInTheDocument();
    expect(within(created).getByLabelText("Assignee: Asha")).toBeInTheDocument();
  });

  it("does not create from the dialog without a summary", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Create" }));
    const dialog = screen.getByRole("dialog", { name: "Create issue" });
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(dialog).getByText("Summary is required")).toBeInTheDocument();
  });
});

describe("Moving issues", () => {
  it("moves an issue by dragging it to another column", () => {
    render(<App />);
    const dt = dataTransfer();
    fireEvent.dragStart(card("Add search and filters"), { dataTransfer: dt });
    fireEvent.dragOver(column("In Progress"), { dataTransfer: dt });
    fireEvent.drop(column("In Progress"), { dataTransfer: dt });
    expect(within(column("In Progress")).getByText("Add search and filters")).toBeInTheDocument();
    expect(within(column("Backlog")).queryByText("Add search and filters")).not.toBeInTheDocument();
  });

  it("highlights the column being dragged over and clears it after drop", () => {
    render(<App />);
    const dt = dataTransfer();
    fireEvent.dragStart(card("Add drag and drop"), { dataTransfer: dt });
    fireEvent.dragOver(column("Ready"), { dataTransfer: dt });
    expect(column("Ready")).toHaveClass("drop-target");
    fireEvent.drop(column("Ready"), { dataTransfer: dt });
    expect(column("Ready")).not.toHaveClass("drop-target");
  });

  it("still lets you move an issue with the keyboard-friendly dropdown", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByLabelText('Move "Add search and filters" to another column'), "Completed");
    expect(within(column("Completed")).getByText("Add search and filters")).toBeInTheDocument();
  });
});

describe("Deleting and saving", () => {
  it("deletes an issue", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: 'Delete "Add drag and drop"' }));
    expect(screen.queryByText("Add drag and drop")).not.toBeInTheDocument();
  });

  it("keeps issues, and a dragged move, after a reload", () => {
    const { unmount } = render(<App />);
    const dt = dataTransfer();
    fireEvent.dragStart(card("Add drag and drop"), { dataTransfer: dt });
    fireEvent.drop(column("Completed"), { dataTransfer: dt });
    unmount();
    render(<App />);
    expect(within(column("Completed")).getByText("Add drag and drop")).toBeInTheDocument();
  });
});
