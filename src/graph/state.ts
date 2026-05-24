/**
 * Graph state via the modern Annotation.Root API.
 *
 * Each annotation declares its own reducer + default, so the graph runtime
 * knows how to merge partial state returned from nodes.
 *
 * Equivalent to Python's:
 *   class State(MessagesState):
 *       next: str
 *       votes: Annotated[list, operator.add]
 */
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

import type { SupervisorDecision } from "../types.js";

export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  next: Annotation<SupervisorDecision>({
    reducer: (_old, next) => next,
    default: () => "researcher",
  }),
  votes: Annotation<string[]>({
    reducer: (old, next) => [...old, ...next],
    default: () => [],
  }),
});

export type GraphStateValue = typeof GraphState.State;
export type GraphStateUpdate = typeof GraphState.Update;
