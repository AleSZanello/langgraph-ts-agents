/**
 * Worker node factory.
 *
 * Each worker is a small ReAct-style agent: it sees the conversation,
 * optionally uses tools, and appends its contribution with `name` set
 * so the supervisor can tell who spoke last.
 */
import { Command } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";

import { getLlm } from "../llm/provider.js";
import type { WorkerName } from "../types.js";
import type { GraphStateValue } from "./state.js";

interface WorkerConfig {
  name: WorkerName;
  rolePrompt: string;
  tools?: StructuredToolInterface[];
}

export function makeWorker(cfg: WorkerConfig) {
  return async function workerNode(state: GraphStateValue): Promise<Command> {
    const llm = cfg.tools && cfg.tools.length > 0 ? getLlm().bindTools(cfg.tools) : getLlm();
    const messages = [new SystemMessage(cfg.rolePrompt), ...state.messages];
    const reply = await llm.invoke(messages);

    // Stamp the message with the worker's name so the supervisor can route around it.
    const named = new HumanMessage({
      content: typeof reply.content === "string" ? reply.content : JSON.stringify(reply.content),
      name: cfg.name,
    });

    // After contributing, hand control back to the supervisor.
    return new Command({
      goto: "supervisor",
      update: { messages: [named] },
    });
  };
}

export const RESEARCHER_PROMPT = `
You are the researcher. Pull together the raw facts, numbers, and context
relevant to the user's task. Be exhaustive — analyst will refine later.
`.trim();

export const ANALYST_PROMPT = `
You are the analyst. Read what the researcher gathered and the user's request.
Produce a short structured outline (3-5 bullets) with the key findings.
`.trim();

export const WRITER_PROMPT = `
You are the writer. Read the analyst's outline and the original request.
Produce the final deliverable — well-paced prose, no bullet dumps.
`.trim();
