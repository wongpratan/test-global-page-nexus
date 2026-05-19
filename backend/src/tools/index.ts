import { searchTool } from "./search.js";
import { customTool } from "./custom.js";

type Tool = {
  schema: {
    type: "function";
    function: { name: string; description: string; parameters: Record<string, unknown> };
  };
  execute: (args: any) => Promise<string>;
};

const registry: Record<string, Tool> = {
  web_search: searchTool,
  current_time: customTool,
};

export const toolSchemas = Object.values(registry).map((t) => t.schema);

export async function dispatchTool(name: string, rawArgs: string): Promise<string> {
  const tool = registry[name];
  if (!tool) return JSON.stringify({ error: `unknown tool: ${name}` });
  let args: unknown;
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    return JSON.stringify({ error: "invalid JSON arguments" });
  }
  try {
    return await tool.execute(args);
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}
