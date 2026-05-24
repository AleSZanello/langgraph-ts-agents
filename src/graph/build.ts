/**
 * Wire the graph: supervisor + 3 workers + HITL approval node.
 *
 *   START → supervisor → {researcher | analyst | writer | END}
 *   workers → supervisor (round-trip)
 *   writer → END (after HITL approval)
 */
import { MemorySaver, START, StateGraph } from "@langchain/langgraph";

import { GraphState } from "./state.js";
import { supervisorNode } from "./supervisor.js";
import { makeWorker, RESEARCHER_PROMPT, ANALYST_PROMPT, WRITER_PROMPT } from "./workers.js";
import { hitlApprovalNode } from "./hitl.js";
import { calcTool, wordCountTool } from "./tools.js";

export function buildGraph() {
  const graph = new StateGraph(GraphState)
    .addNode("supervisor", supervisorNode, {
      ends: ["researcher", "analyst", "writer-approval", "__end__"],
    })
    .addNode("researcher", makeWorker({ name: "researcher", rolePrompt: RESEARCHER_PROMPT }), {
      ends: ["supervisor"],
    })
    .addNode(
      "analyst",
      makeWorker({ name: "analyst", rolePrompt: ANALYST_PROMPT, tools: [wordCountTool] }),
      { ends: ["supervisor"] },
    )
    .addNode("writer-approval", hitlApprovalNode, { ends: ["writer", "supervisor"] })
    .addNode(
      "writer",
      makeWorker({ name: "writer", rolePrompt: WRITER_PROMPT, tools: [calcTool] }),
      { ends: ["supervisor"] },
    )
    .addEdge(START, "supervisor");

  return graph.compile({ checkpointer: new MemorySaver() });
}
