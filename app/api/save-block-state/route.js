import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const FILE_PATH = "data/block-state.json";

function jsonResponse(body, init) {
  return NextResponse.json(body, init);
}

function resolveWriteMode(syncCode) {
  const incomingCode = syncCode?.trim() || "";

  if (!incomingCode) {
    return "local";
  }

  const writeToken = process.env.WRITE_API_TOKEN?.trim();

  if (!writeToken) {
    throw new Error("missing_write_token");
  }

  if (incomingCode !== writeToken) {
    throw new Error("invalid_sync_code");
  }

  return "remote";
}

function normalizeState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("invalid_state");
  }

  return state;
}

async function writeLocalJsonFile(relativePath, content) {
  const absolutePath = path.join(process.cwd(), relativePath);
  await fs.writeFile(absolutePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

async function readGithubFile(relativePath, owner, repo, branch, token) {
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}?ref=${branch}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Ai123 Block State API",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return { sha: null };
  }

  if (!response.ok) {
    throw new Error(`github_read_failed:${response.status}`);
  }

  const payload = await response.json();
  return { sha: payload.sha };
}

async function writeGithubFile(relativePath, content, owner, repo, branch, token) {
  const current = await readGithubFile(relativePath, owner, repo, branch, token);
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}`;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "Ai123 Block State API",
    },
    body: JSON.stringify({
      message: "Update building block research state",
      content: Buffer.from(`${JSON.stringify(content, null, 2)}\n`, "utf8").toString("base64"),
      sha: current.sha ?? undefined,
      branch,
    }),
  });

  if (!response.ok) {
    throw new Error(`github_write_failed:${response.status}`);
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const state = normalizeState(payload?.state);
    const writeMode = resolveWriteMode(payload?.syncCode);

    if (writeMode === "local") {
      return jsonResponse({ ok: true, mode: "local", state });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER || "9iliudar";
    const repo = process.env.GITHUB_REPO_NAME || "Ai123";
    const branch = process.env.GITHUB_REPO_BRANCH || "main";

    if (token) {
      await writeGithubFile(FILE_PATH, state, owner, repo, branch, token);
    } else if (process.env.NODE_ENV !== "production") {
      await writeLocalJsonFile(FILE_PATH, state);
    } else {
      return jsonResponse(
        { error: "missing_github_token", message: "服务端未配置 GITHUB_TOKEN，暂时无法写入仓库。" },
        { status: 500 }
      );
    }

    return jsonResponse({ ok: true, mode: "remote", path: FILE_PATH, state });
  } catch (error) {
    const status =
      error.message === "invalid_state"
        ? 400
        : error.message === "invalid_sync_code"
          ? 403
          : 500;

    const message =
      status === 400
        ? "研究状态数据无效。"
        : status === 403
          ? "入库校验码不正确。"
          : error.message === "missing_write_token"
            ? "服务端未配置入库校验码。"
            : "保存研究状态失败，请稍后重试。";

    return jsonResponse({ error: error.message, message }, { status });
  }
}
