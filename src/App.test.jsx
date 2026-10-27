import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

const column = (name) => screen.getByRole("region", { name });

describe("Project board", () => {
  it("shows the five stages in order", () => {
    render(<App />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Backlog", "In Progress", "In Review", "Ready", "Completed"]);
  });

  it("shows starter items in the right columns", () => {
    render(<App />);
    expect(within(column("Completed")).getByText("Set up project repository")).toBeInTheDocument();
    expect(within(column("Backlog")).getByText("Add search and filters")).toBeInTheDocument();
  });

  it("adds an item to the column it was typed in", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Add an item to Ready"), "Write release notes");
    await user.click(within(column("Ready")).getByRole("button", { name: "Add" }));
    expect(within(column("Ready")).getByText("Write release notes")).toBeInTheDocument();
  });

  it("ignores empty titles", async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = within(column("Backlog")).getAllByRole("listitem").length;
    await user.type(screen.getByLabelText("Add an item to Backlog"), "   ");
    await user.click(within(column("Backlog")).getByRole("button", { name: "Add" }));
    expect(within(column("Backlog")).getAllByRole("listitem").length).toBe(before);
  });

  it("moves an item to another column", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(
      screen.getByLabelText('Move "Add search and filters" to another column'),
      "In Progress"
    );
    expect(within(column("In Progress")).getByText("Add search and filters")).toBeInTheDocument();
    expect(within(column("Backlog")).queryByText("Add search and filters")).not.toBeInTheDocument();
  });

  it("deletes an item", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: 'Delete "Add drag and drop"' }));
    expect(screen.queryByText("Add drag and drop")).not.toBeInTheDocument();
  });

  it("keeps items after a reload", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByLabelText("Add an item to Backlog"), "Persist me");
    await user.click(within(column("Backlog")).getByRole("button", { name: "Add" }));
    unmount();
    render(<App />);
    expect(screen.getByText("Persist me")).toBeInTheDocument();
  });
});
