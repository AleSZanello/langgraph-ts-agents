/**
 * Pretty-print LangGraph stream events to the terminal.
 *
 * `streamMode: "updates"` yields one record per node step:
 *   { [nodeName]: PartialState }
 */
const C = {
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
};

const NODE_COLOR: Record<string, string> = {
  supervisor: C.cyan,
  researcher: C.yellow,
  analyst: C.green,
  "writer-approval": C.magenta,
  writer: C.magenta,
};

export function renderEvent(event: unknown): void {
  if (!event || typeof event !== "object") return;
  for (const [nodeName, update] of Object.entries(event as Record<string, unknown>)) {
    const color = NODE_COLOR[nodeName] ?? C.dim;
    process.stdout.write(`\n${C.bold}${color}▸ ${nodeName}${C.reset}\n`);
    process.stdout.write(`${C.dim}${truncate(JSON.stringify(update, null, 2), 800)}${C.reset}\n`);
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + `… (+${s.length - max} chars)` : s;
}
