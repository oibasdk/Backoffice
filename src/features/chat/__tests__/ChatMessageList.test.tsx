import React from "react";
import { render, screen } from "@testing-library/react";

import "../../../app/i18n";
import { ChatMessageList } from "../components/ChatMessageList";

const baseMessage = {
  id: "msg-1",
  thread: "thread-1",
  sender_id: "user-1",
  sender_role: "support_agent",
  sender_type: "internal",
  content: "Hello from support",
  attachments: [],
  moderation_state: "visible",
  moderation_reason: null,
  moderated_by_id: null,
  moderated_by_label: null,
  moderated_at: null,
  policy_version_id: null,
  edited_at: null,
  deleted_at: null,
  expires_at: null,
  created_at: new Date().toISOString(),
};

test("shows empty state when no messages", () => {
  render(<ChatMessageList messages={[]} />);
  expect(screen.getByText("No messages yet.")).toBeInTheDocument();
});

test("renders message content", () => {
  render(<ChatMessageList messages={[baseMessage]} />);
  expect(screen.getByText("Hello from support")).toBeInTheDocument();
});
