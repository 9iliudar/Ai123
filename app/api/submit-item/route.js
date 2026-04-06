import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { categories } from "@/data/default-tools";
import { blockCategories } from "@/data/building-blocks";
import { conceptUniverse } from "@/data/concept-graph";

export const runtime = "nodejs";

const FILE_PATHS = {
  tool: "data/custom-tools.json",
  block: "data/custom-blocks.json",
  concept: "data/custom-concepts.json",
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function jsonResponse(body, init) {
  return NextResponse.json(body, init);
}

function normalizeUrl(value) {
  if (!value?.trim()) {
    return "";
  }

  return value.startsWith("http") ? value : `https://${value}`;
}

function assertType(type) {
  if (!FILE_PATHS[type]) {
    throw new Error("unsupported_type");
  }
}

function buildToolItem(payload, timestamp) {
  if (!payload.name?.trim() || !payload.link?.trim()) {
    throw new Error("missing_required_fields");
  }

  return {
    id: `custom_${Date.now()}`,
    name: payload.name.trim(),
    link: normalizeUrl(payload.link),
    desc: payload.desc?.trim() || "自定义快捷入口",
    cat: categories.includes(payload.cat) ? payload.cat : "Other",
    isCustom: true,
    addedAt: timestamp,
  };
}

function buildBlockItem(payload, timestamp) {
  if (!payload.name?.trim()) {
    throw new Error("missing_required_fields");
  }

  const category = blockCategories.includes(payload.cat) && payload.cat !== "All" ? payload.cat : "Agent";

  return {
    id: `custom-block-${slugify(payload.name)}-${Date.now()}`,
    name: payload.name.trim(),
    category,
    github: "",
    website: "",
    summary: payload.desc?.trim() || `${payload.name.trim()} 的自定义积木条目`,
    tags: [],
    solves: payload.desc?.trim() || `${payload.name.trim()} 的能力说明`,
    composeWith: [],
    outputs: [],
    relatedConcepts: [],
    isCustom: true,
    needsEnrichment: true,
    addedAt: timestamp,
  };
}

function buildConceptItem(payload, timestamp) {
  if (!payload.name?.trim()) {
    throw new Error("missing_required_fields");
  }

  const cluster =
    conceptUniverse.clusters.find((item) => item.id === payload.clusterId) ??
    conceptUniverse.clusters[0];

  return {
    id: `custom-concept-${slugify(payload.name)}-${Date.now()}`,
    name: payload.name.trim(),
    summary: payload.desc?.trim() || `${payload.name.trim()} 的概念摘要`,
    detail: payload.desc?.trim() || `${payload.name.trim()} 的概念说明`,
    importance: 3,
    english: "",
    chinese: "",
    domain: cluster?.label ?? "",
    theme: cluster?.theme ?? "violet",
    related: [],
    isCustom: true,
    needsLinking: true,
    addedAt: timestamp,
  };
}

function buildItem(type, payload, timestamp) {
  if (type === "tool") {
    return buildToolItem(payload, timestamp);
  }

  if (type === "block") {
    return buildBlockItem(payload, timestamp);
  }

  return buildConceptItem(payload, timestamp);
}

async function readLocalJsonFile(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath);

  try {
    const raw = await fs.readFile(absolutePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeLocalJsonFile(relativePath, content) {
  const absolutePath = path.join(process.cwd(), relativePath);
  await fs.writeFile(absolutePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

async function updateLocalFile(relativePath, item) {
  const current = await readLocalJsonFile(relativePath);
  const next = [item, ...current.filter((entry) => entry.id !== item.id)];
  await writeLocalJsonFile(relativePath, next);
}

async function readGithubFile(relativePath, owner, repo, branch, token) {
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}?ref=${branch}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Ai123 Submit API",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return { sha: null, content: [] };
  }

  if (!response.ok) {
    throw new Error(`github_read_failed:${response.status}`);
  }

  const payload = await response.json();
  const decoded = Buffer.from(payload.content, "base64").toString("utf8");
  return {
    sha: payload.sha,
    content: JSON.parse(decoded),
  };
}

async function writeGithubFile(relativePath, item, owner, repo, branch, token) {
  const current = await readGithubFile(relativePath, owner, repo, branch, token);
  const next = [item, ...current.content.filter((entry) => entry.id !== item.id)];
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}`;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "Ai123 Submit API",
    },
    body: JSON.stringify({
      message: `Add ${item.name}`,
      content: Buffer.from(`${JSON.stringify(next, null, 2)}\n`, "utf8").toString("base64"),
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
    const type = payload?.type;
    assertType(type);

    const timestamp = new Date().toISOString();
    const item = buildItem(type, payload, timestamp);
    const relativePath = FILE_PATHS[type];

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER || "9iliudar";
    const repo = process.env.GITHUB_REPO_NAME || "Ai123";
    const branch = process.env.GITHUB_REPO_BRANCH || "main";

    if (token) {
      await writeGithubFile(relativePath, item, owner, repo, branch, token);
    } else if (process.env.NODE_ENV !== "production") {
      await updateLocalFile(relativePath, item);
    } else {
      return jsonResponse(
        { error: "missing_github_token", message: "服务端未配置 GITHUB_TOKEN，暂时无法写入仓库。" },
        { status: 500 }
      );
    }

    return jsonResponse({ ok: true, item, path: relativePath });
  } catch (error) {
    const status =
      error.message === "unsupported_type" || error.message === "missing_required_fields" ? 400 : 500;

    return jsonResponse(
      {
        error: error.message,
        message:
          status === 400 ? "提交内容不完整或类型无效。" : "写入仓库失败，请检查 GitHub Token 或稍后重试。",
      },
      { status }
    );
  }
}
