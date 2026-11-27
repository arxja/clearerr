import { installAgentHandler } from "clearerr";
import { loadConfig } from "../src/config";

installAgentHandler(); // default: agent format -> stderr

// uncaught -> handler fires
loadConfig({ PORT: "99999" });