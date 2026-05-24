/**
 * CLI entrypoint — runs the graph in streaming mode against a task.
 *
 *   pnpm dev "Draft a market summary for LangGraph.js adoption"
 */
import "dotenv/config";
import { Command } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

import { buildGraph } from "./graph/build.js";
import { renderEvent } from "./stream/render.js";

async function main(): Promise<void> {
  const task = process.argv.slice(2).join(" ") || "Draft a market summary for LangGraph.js adoption";
  process.stdout.write(`\nTask: ${task}\n`);

  const graph = buildGraph();
  const config = { configurable: { thread_id: `cli-${Date.now()}` } };
  const input = { messages: [new HumanMessage(task)] };

  // First pass — runs until END or HITL interrupt.
  let pending = await streamUntilInterrupt(graph, input, config);

  // If the graph was interrupted by HITL, prompt the user once and resume.
  if (pending.interrupted) {
    process.stdout.write("\n— writer awaiting human approval (auto-approving in 1s for demo) —\n");
    pending = await streamUntilInterrupt(graph, new Command({ resume: true }), config);
  }

  process.stdout.write("\nDone.\n");
}

interface StreamResult {
  interrupted: boolean;
}

async function streamUntilInterrupt(
  graph: ReturnType<typeof buildGraph>,
  input: unknown,
  config: { configurable: { thread_id: string } },
): Promise<StreamResult> {
  let interrupted = false;
  for await (const event of await graph.stream(input as never, {
    ...config,
    streamMode: "updates",
  })) {
    renderEvent(event);
    if (
      event &&
      typeof event === "object" &&
      "__interrupt__" in (event as Record<string, unknown>)
    ) {
      interrupted = true;
    }
  }
  return { interrupted };
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
