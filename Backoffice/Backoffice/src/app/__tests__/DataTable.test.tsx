import React from "react";
import { render, screen } from "@testing-library/react";

import "../i18n";
import { DataTable } from "../../components/DataTable";

const columns = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
];

test("renders empty state when no rows", () => {
  render(<DataTable columns={columns} rows={[]} />);
  expect(screen.getByText("No records found")).toBeInTheDocument();
});

test("renders loading state", () => {
  render(<DataTable columns={columns} rows={[]} loading />);
  expect(document.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
});

test("renders error state", () => {
  render(<DataTable columns={columns} rows={[]} error />);
  expect(screen.getByText("Unable to load data")).toBeInTheDocument();
});
