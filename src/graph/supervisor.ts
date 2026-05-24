/**
 * Supervisor node — uses `withStructuredOutput` so routing is type-safe.
 *
 * No more parsing strings like `response.content.strip().upper()`. Zod schema
 * + structured output = supervisor returns a typed `next` enum guaranteed
 * to be a valid worker name or "FINISH".
 */
import { z } from "zod";
import { Command, END } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";

import { getLlm } from "../llm/provider.js";
import { SUPERVISOR_DECISIONS, WORKERS } from "../types.js";
import type { GraphStateValue } from "./state.js";

const RouterSchema = z.object({
  next: z.enum(SUPERVISOR_DECISIONS),
  reason: z.string().describe("Short justification (one sentence)."),
});

const SUPERVISOR_PROMPT = `
You orchestrate three workers:
- researcher: gathers raw information about the user's task.
- analyst: extracts findings and synthesizes structure from research.
- writer: produces the final deliverable (the user reads this).

Workers must run in order: researcher → analyst → writer → FINISH.
Inspect the conversation so far. If a worker has already contributed,
move on to the next one. When the writer has produced output, return FINISH.
`.trim();

export async function supervisorNode(
  state: GraphStateValue,
): Promise<Command> {
  const llm = getLlm().withStructuredOutput(RouterSchema, { name: "router" });
  const contributors = new Set(
    state.messages.filter((m) => "name" in m && m.name).map((m) => (m as { name: string }).name),
  );

  const promptMessages = [
    new SystemMessage(SUPERVISOR_PROMPT),
    new SystemMessage(`Workers that have contributed: ${[...contributors].join(", ") || "(none)"}`),
    ...state.messages,
  ];

  const decision = await llm.invoke(promptMessages);
  const next = decision.next;

  if (next === "FINISH") {
    return new Command({ goto: END, update: { next: "FINISH" } });
  }
  // Type-safety: WorkerName is the union of WORKERS values, so `next` is narrowed.
  return new Command({
    goto: next as (typeof WORKERS)[number],
    update: { next },
  });
}
