/**
 * Human-in-the-loop approval node.
 *
 * When the supervisor routes to the writer, this node intercepts: it calls
 * `interrupt(...)` so the graph pauses and the caller must invoke
 * `Command.resume(value)` (e.g., `true` to approve, a string to edit).
 */
import { Command, interrupt } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

import type { GraphStateValue } from "./state.js";

export async function hitlApprovalNode(state: GraphStateValue): Promise<Command> {
  const lastMessage = state.messages.at(-1);
  const proposal = typeof lastMessage?.content === "string" ? lastMessage.content : "";

  const decision = interrupt({
    kind: "writer-approval",
    proposal,
    instructions: "Resume with true (approve), false (skip writer), or a string (edited draft).",
  }) as boolean | string;

  if (decision === false) {
    return new Command({ goto: "supervisor" });
  }
  if (typeof decision === "string") {
    return new Command({
      goto: "writer",
      update: { messages: [new HumanMessage({ content: decision, name: "human-edit" })] },
    });
  }
  return new Command({ goto: "writer" });
}
