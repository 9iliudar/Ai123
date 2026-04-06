import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const FILE_PATH = "data/concept-mastery.json";

function jsonResponse(body, init) {
  return NextResponse.json(body, init);
}

function normalizeMastery(mastery) {
  if (!mastery || typeof mastery !== "object" || Array.isArray(mastery)) {
    throw new Error("invalid_mastery");
  }

  return Object.fromEntries(
    Object.entries(mastery).filter(
      ([key, value]) => typeof key === "string" && Number.isInteger(value) && value >= 0 && value <= 5
    )
  );
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
      "User-Agent": "Ai123 Concept Mastery API",
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
      "User-Agent": "Ai123 Concept Mastery API",
    },
    body: JSON.stringify({
      message: "Update concept mastery",
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
    const mastery = normalizeMastery(payload?.mastery);
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER || "9iliudar";
    const repo = process.env.GITHUB_REPO_NAME || "Ai123";
    const branch = process.env.GITHUB_REPO_BRANCH || "main";

    if (token) {
      await writeGithubFile(FILE_PATH, mastery, owner, repo, branch, token);
    } else if (process.env.NODE_ENV !== "production") {
      await writeLocalJsonFile(FILE_PATH, mastery);
    } else {
      return jsonResponse(
        { error: "missing_github_token", message: "服务端未配置 GITHUB_TOKEN，暂时无法写入仓库。" },
        { status: 500 }
      );
    }

    return jsonResponse({ ok: true, path: FILE_PATH, mastery });
  } catch (error) {
    const status = error.message === "invalid_mastery" ? 400 : 500;
    const message = status === 400 ? "掌握程度数据无效。" : "保存掌握程度失败，请稍后重试。";
    return jsonResponse({ error: error.message, message }, { status });
  }
}
