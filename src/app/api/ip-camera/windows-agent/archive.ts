import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";

const execFileAsync = promisify(execFile);

function quoteForPowerShell(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function ensureDirectory(path: string) {
  await fs.mkdir(path, { recursive: true });
}

export async function extractArchive(zipPath: string, destination: string) {
  await ensureDirectory(destination);

  if (process.platform === "win32") {
    const script = `Expand-Archive -Path ${quoteForPowerShell(zipPath)} -DestinationPath ${quoteForPowerShell(destination)} -Force`;
    await execFileAsync("powershell.exe", ["-NoLogo", "-NoProfile", "-Command", script]);
    return;
  }

  await execFileAsync("unzip", ["-q", zipPath, "-d", destination]);
}

export async function createArchive(sourceDir: string, targetZip: string) {
  await fs.rm(targetZip, { force: true });

  if (process.platform === "win32") {
    const script = `Compress-Archive -Path ${quoteForPowerShell(`${sourceDir}\\*`)} -DestinationPath ${quoteForPowerShell(targetZip)} -Force`;
    await execFileAsync("powershell.exe", ["-NoLogo", "-NoProfile", "-Command", script]);
    return;
  }

  await execFileAsync("zip", ["-qry", targetZip, "."], { cwd: sourceDir });
}
