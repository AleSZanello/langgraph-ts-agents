/**
 * End-to-end smoke test using the FakeListChatModel offline fallback.
 * Verifies the graph compiles, executes the full supervisor → workers loop,
 * and reaches END without throwing.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Command } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

import { buildGraph } from "../src/graph/build.js";
import { resetLlmCache } from "../src/llm/provider.js";

describe("supervisor + workers graph", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    resetLlmCache();
  });

  afterEach(() => {
    resetLlmCache();
  });

  it("runs end-to-end with the fake LLM and reaches END", async () => {
    const graph = buildGraph();
    const config = { configurable: { thread_id: "e2e-1" } };
    const input = { messages: [new HumanMessage("Test the supervisor loop.")] };

    const events: unknown[] = [];
    let interrupted = false;

    for await (const ev of await graph.stream(input, { ...config, streamMode: "updates" })) {
      events.push(ev);
      if (ev && typeof ev === "object" && "__interrupt__" in (ev as Record<string, unknown>)) {
        interrupted = true;
      }
    }

    if (interrupted) {
      for await (const ev of await graph.stream(new Command({ resume: true }), {
        ...config,
        streamMode: "updates",
      })) {
        events.push(ev);
      }
    }

    expect(events.length).toBeGreaterThan(0);

    const state = await graph.getState(config);
    expect(state.values.next).toBe("FINISH");
    expect(state.values.messages.length).toBeGreaterThan(0);
  }, 30_000);
});
