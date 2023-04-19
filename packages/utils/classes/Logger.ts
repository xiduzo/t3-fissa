import Winston from "winston";

export const Logger = Winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: Winston.format.json(),
  transports: [new Winston.transports.Console()],
});
