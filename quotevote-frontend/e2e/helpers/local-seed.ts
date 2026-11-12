import { execFileSync } from "child_process";
import path from "path";
import { getApiUrl } from "./api";

export interface SeededUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
}

const BACKEND_DIR = path.resolve(__dirname, "../../../quotevote-backend");
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

/**
 * True only when the API under test is explicitly a local one. getApiUrl() falls back to the
 * hosted API when nothing is configured, so an unset environment is "not local" and the specs
 * that write test accounts skip instead of touching a shared server.
 */
export function isLocalApi(): boolean {
  try {
    return LOCAL_HOSTNAMES.includes(new URL(getApiUrl()).hostname);
  } catch {
    return false;
  }
}

/**
 * Creates a brand-new user in the local database (`pnpm seed:e2e-user` in quotevote-backend) and
 * returns its credentials. Each call makes a different user, so a spec that can only happen once
 * per account pair can repeat on the same database with no cleanup.
 */
export function seedFreshUser(): SeededUser {
  let output: string;
  try {
    output = execFileSync("pnpm", ["--silent", "seed:e2e-user"], {
      cwd: BACKEND_DIR,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(
      `[e2e] Could not seed a fresh user (pnpm seed:e2e-user in ${BACKEND_DIR}): ${
        stderr || (error instanceof Error ? error.message : String(error))
      }`
    );
  }

  const lastLine = output.trim().split("\n").filter(Boolean).pop() ?? "";
  try {
    return JSON.parse(lastLine) as SeededUser;
  } catch {
    throw new Error(`[e2e] seed:e2e-user did not print a JSON user. Output was: ${output}`);
  }
}
