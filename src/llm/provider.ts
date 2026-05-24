/**
 * Provider switch: OpenAI → Anthropic → FakeListChatModel (offline fallback).
 *
 * Single source of LLM truth so swapping providers is one line of env config.
 */
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

let cached: BaseChatModel | undefined;

export function getLlm(): BaseChatModel {
  if (cached) return cached;

  if (process.env.OPENAI_API_KEY) {
    const { ChatOpenAI } = require("@langchain/openai") as typeof import("@langchain/openai");
    cached = new ChatOpenAI({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
    });
    return cached;
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const { ChatAnthropic } = require("@langchain/anthropic") as typeof import("@langchain/anthropic");
    cached = new ChatAnthropic({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
      temperature: 0.2,
    });
    return cached;
  }

  // Offline fallback for `pnpm test` in CI without API keys.
  const { FakeListChatModel } = require("@langchain/core/utils/testing") as {
    FakeListChatModel: new (opts: { responses: string[] }) => BaseChatModel;
  };
  cached = new FakeListChatModel({
    responses: [
      JSON.stringify({ next: "researcher", reason: "no contributors yet" }),
      "Researcher findings: market grew 3x in 12 months.",
      JSON.stringify({ next: "analyst", reason: "research is in" }),
      "Outline:\n- Adoption tripled\n- Driven by streaming + types\n- Risks: API churn",
      JSON.stringify({ next: "writer", reason: "analyst done" }),
      "LangGraph.js has tripled in adoption over the last 12 months...",
      JSON.stringify({ next: "FINISH", reason: "writer delivered" }),
    ],
  });
  return cached;
}

/** Test helper to clear the cached instance between runs. */
export function resetLlmCache(): void {
  cached = undefined;
}
