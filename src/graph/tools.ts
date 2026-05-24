/**
 * Demo tools with Zod schemas — fully typed inputs end-to-end.
 *
 * Real workers would wire in retrieval, web fetch, etc. These two are
 * deterministic so smoke tests can assert on them.
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const calcTool = tool(
  async ({ a, b, op }) => {
    switch (op) {
      case "add":
        return a + b;
      case "sub":
        return a - b;
      case "mul":
        return a * b;
      case "div":
        return b === 0 ? Number.NaN : a / b;
    }
  },
  {
    name: "calc",
    description: "Perform a basic arithmetic op on two numbers.",
    schema: z.object({
      a: z.number(),
      b: z.number(),
      op: z.enum(["add", "sub", "mul", "div"]),
    }),
  },
);

export const wordCountTool = tool(
  async ({ text }) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return { words, chars: text.length };
  },
  {
    name: "word_count",
    description: "Count words and characters in a string.",
    schema: z.object({ text: z.string() }),
  },
);
