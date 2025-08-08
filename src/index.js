import { v4 as uuidv4 } from "uuid";

const id = uuidv4();

function logLine() {
  const ts = new Date().toISOString();
  console.log(`${ts}: ${id}`);
}

logLine();
setInterval(logLine, 5000);
