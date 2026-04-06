import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const ORDER_PATH = "data/tool-order.json";

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

function normalizeOrder(order) {
  if (!Array.isArray(order)) {
    throw new Error("invalid_order");
  }

  return [...new Set(order.filter((item) => typeof item === "string" && item.trim()))];
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
      "User-Agent": "Ai123 Tool Order API",
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
      "User-Agent": "Ai123 Tool Order API",
    },
    body: JSON.stringify({
      message: "Update homepage tool order",
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
    const order = normalizeOrder(payload?.order);
    const writeMode = resolveWriteMode(payload?.syncCode);

    if (writeMode === "local") {
      return jsonResponse({ ok: true, mode: "local", order });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER || "9iliudar";
    const repo = process.env.GITHUB_REPO_NAME || "Ai123";
    const branch = process.env.GITHUB_REPO_BRANCH || "main";

    if (token) {
      await writeGithubFile(ORDER_PATH, order, owner, repo, branch, token);
    } else if (process.env.NODE_ENV !== "production") {
      await writeLocalJsonFile(ORDER_PATH, order);
    } else {
      return jsonResponse(
        { error: "missing_github_token", message: "服务端未配置 GITHUB_TOKEN，暂时无法写入仓库。" },
        { status: 500 }
      );
    }

    return jsonResponse({ ok: true, mode: "remote", order, path: ORDER_PATH });
  } catch (error) {
    const status =
      error.message === "invalid_order"
        ? 400
        : error.message === "invalid_sync_code"
          ? 403
          : 500;

    const message =
      status === 400
        ? "排序数据无效。"
        : status === 403
          ? "入库校验码不正确。"
          : error.message === "missing_write_token"
            ? "服务端未配置入库校验码。"
            : "保存排序失败，请稍后重试。";

    return jsonResponse(
      {
        error: error.message,
        message,
      },
      { status }
    );
  }
}
