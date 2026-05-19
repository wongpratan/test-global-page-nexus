export const customTool = {
  schema: {
    type: "function" as const,
    function: {
      name: "current_time",
      description: "Return the current server time as an ISO 8601 string. Example custom tool — replace with real domain logic.",
      parameters: {
        type: "object",
        properties: {
          timezone: { type: "string", description: "IANA timezone, e.g. 'UTC' or 'Asia/Bangkok'", default: "UTC" },
        },
      },
    },
  },
  async execute(args: { timezone?: string }): Promise<string> {
    const tz = args.timezone ?? "UTC";
    try {
      const now = new Date().toLocaleString("sv-SE", { timeZone: tz });
      return JSON.stringify({ timezone: tz, time: now });
    } catch {
      return JSON.stringify({ error: `invalid timezone: ${tz}` });
    }
  },
};
