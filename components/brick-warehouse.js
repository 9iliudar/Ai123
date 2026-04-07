"use client";

import { useEffect, useMemo, useState } from "react";
import {
  blockCategories,
  blockCategoryLabels,
  blockStatuses,
  buildingBlocks,
} from "@/data/building-blocks";
import repoCustomBlocks from "@/data/custom-blocks.json";
import repoBlockState from "@/data/block-state.json";

const BLOCK_STATE_KEY = "ai123_building_blocks_state";
const CUSTOM_BLOCKS_KEY = "ai123_custom_blocks";
const LAST_SELECTED_BLOCK_KEY = "ai123_last_selected_block";
const DAILY_FEATURE_DISMISSED_KEY = "ai123_daily_feature_dismissed_at";
const ALL_STATUS = "ALL_STATUS";
const ALL_FRESHNESS = "ALL_FRESHNESS";
const RECENT_FRESHNESS = "RECENT_FRESHNESS";
const RECENT_RESEARCH_FRESHNESS = "RECENT_RESEARCH_FRESHNESS";
const REMOVED_TEST_BLOCK_NAMES = new Set(["积木本地测试", "积木入库测试", "这是一条积木新增测试"]);
const REMOVED_TEST_BLOCK_IDS = new Set([
  "custom-block-绉湪鍏ュ簱娴嬭瘯-1775478163643",
  "custom-block-杩欐槸涓€鏉＄Ｎ鏈ㄦ柊澧炴祴璇?1775469920381",
]);

function sanitizeCustomBlocks(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item) =>
      item?.id &&
      !REMOVED_TEST_BLOCK_IDS.has(item.id) &&
      !REMOVED_TEST_BLOCK_NAMES.has(item.name?.trim())
  );
}

function mergeUniqueById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

const IDEA_EXAMPLES = [
  "做一个自动抓网页并进入知识库的研究助手",
  "做一个能操作浏览器和本地应用的桌面代理",
  "做一个企业内部多模型 AI 工作台",
];

const IDEA_SIGNAL_MAP = [
  {
    phrases: ["浏览器", "网页", "网站", "抓取", "爬取", "采集", "表单", "browser", "web", "crawl", "scrape", "form", "website"],
    category: "Browser Automation",
    labels: ["Browser Agent", "Automation", "Crawling"],
  },
  {
    phrases: ["桌面", "界面", "应用", "本地应用", "电脑", "屏幕", "desktop", "gui", "computer use", "app", "screen"],
    category: "GUI Agent",
    labels: ["GUI Agent", "Computer Use", "Desktop"],
  },
  {
    phrases: ["知识库", "文档", "资料", "检索", "问答", "搜索", "pdf", "knowledge", "docs", "rag", "search", "qa"],
    category: "Knowledge",
    labels: ["RAG", "Knowledge Base", "Search", "Documents"],
  },
  {
    phrases: ["工作流", "自动化", "流程", "编排", "触发", "workflow", "automation", "pipeline", "orchestration", "trigger"],
    category: "Workflow",
    labels: ["Workflow", "Automation", "Integrations"],
  },
  {
    phrases: ["代码", "编程", "开发", "仓库", "调试", "修复", "code", "coding", "repo", "developer", "debug", "fix"],
    category: "Coding",
    labels: ["Coding", "Code Agent", "Developer Experience"],
  },
  {
    phrases: ["多模态", "视觉", "图像", "图片", "视频", "音频", "语音", "multimodal", "vision", "image", "video", "audio", "voice"],
    category: "Multimodal",
    labels: ["Multimodal", "Vision", "Image Generation"],
  },
  {
    phrases: ["基础设施", "部署", "推理", "路由", "网关", "服务", "infra", "serving", "gateway", "routing", "inference", "deploy"],
    category: "Infra",
    labels: ["Serving", "Gateway", "Inference", "Model Router"],
  },
  {
    phrases: ["机器人", "具身", "robot", "robotics", "embodied"],
    category: "Robotics",
    labels: ["Robotics", "Embodied AI", "Policies"],
  },
  {
    phrases: ["代理", "智能体", "助手", "agent", "copilot", "assistant"],
    category: "Agent",
    labels: ["Agent", "Autonomous", "Planner"],
  },
];

function getInitialBlockState() {
  return {};
}

function normalizeStoredState(rawState) {
  if (!rawState || typeof rawState !== "object") {
    return {};
  }

  const defaultStatus = blockStatuses[0] ?? "";

  return Object.fromEntries(
    Object.entries(rawState).map(([blockId, value]) => {
      const status = value?.status && blockStatuses.includes(value.status) ? value.status : defaultStatus;
      const records = Array.isArray(value?.records)
        ? value.records
        : value?.note
          ? [
              {
                id: `legacy-${blockId}`,
                content: value.note,
                status,
                createdAt: new Date().toISOString(),
              },
            ]
          : [];

      return [
        blockId,
        {
          status,
          records,
        },
      ];
    })
  );
}

function matchesText(block, keyword) {
  if (!keyword) {
    return true;
  }

  const corpus = [
    block.name,
    block.summary,
    block.category,
    block.solves,
    block.github,
    block.website,
    ...block.tags,
    ...block.composeWith,
    ...block.outputs,
    ...(block.relatedConcepts ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return corpus.includes(keyword);
}

function scoreBlockForIdea(block, idea) {
  const normalizedIdea = idea.trim().toLowerCase();
  if (!normalizedIdea) {
    return 0;
  }

  const searchable = [
    block.name,
    block.summary,
    block.solves,
    ...block.tags,
    ...block.composeWith,
    ...block.outputs,
    ...(block.relatedConcepts ?? []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  if (searchable.includes(normalizedIdea)) {
    score += 12;
  }

  for (const signal of IDEA_SIGNAL_MAP) {
    const matched = signal.phrases.some((phrase) => normalizedIdea.includes(phrase));
    if (!matched) {
      continue;
    }

    if (signal.category === block.category) {
      score += 18;
    }

    score += signal.labels.reduce((accumulator, label) => {
      return accumulator + (searchable.includes(label.toLowerCase()) ? 8 : 0);
    }, 0);
  }

  const customKeywords = normalizedIdea
    .split(/[\s,.;:/\\|_-]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);

  score += customKeywords.reduce((accumulator, keyword) => {
    return accumulator + (searchable.includes(keyword) ? 6 : 0);
  }, 0);

  return score;
}

function buildIdeaPlans(recommendedBlocks) {
  if (!recommendedBlocks.length) {
    return [];
  }

  const plans = [];
  const categories = new Map(recommendedBlocks.map((block) => [block.category, block]));

  if (categories.has("Browser Automation") && categories.has("Knowledge")) {
    const browserBlock = categories.get("Browser Automation");
    const knowledgeBlock = categories.get("Knowledge");
    const workflowBlock = categories.get("Workflow") ?? categories.get("Agent");

    plans.push({
      title: "采集到知识库",
      summary: "先抓信息，再整理入库，最后接成可搜索、可追问、可复用的知识系统。",
      stack: [browserBlock, knowledgeBlock, workflowBlock].filter(Boolean).map((block) => block.name),
    });
  }

  if (categories.has("GUI Agent") || categories.has("Browser Automation")) {
    const executionBlock = categories.get("GUI Agent") ?? categories.get("Browser Automation");
    const agentBlock = categories.get("Agent");
    const infraBlock = categories.get("Infra");

    plans.push({
      title: "执行型代理",
      summary: "让代理不只会理解任务，还能真正操作界面、调用工具并跑完整流程。",
      stack: [agentBlock, executionBlock, infraBlock].filter(Boolean).map((block) => block.name),
    });
  }

  if (categories.has("Coding") || categories.has("Workflow")) {
    const codingBlock = categories.get("Coding");
    const workflowBlock = categories.get("Workflow");
    const infraBlock = categories.get("Infra");

    plans.push({
      title: "研发加速台",
      summary: "把代码生成、工作流编排和模型路由放在一条链路里，适合快速出原型。",
      stack: [codingBlock, workflowBlock, infraBlock].filter(Boolean).map((block) => block.name),
    });
  }

  if (!plans.length) {
    plans.push({
      title: "首选组合",
      summary: "先从当前最相关的积木开始，尽快拼出第一条可验证的路径，再决定后续补哪些模块。",
      stack: recommendedBlocks.slice(0, 3).map((block) => block.name),
    });
  }

  if (plans.length < 3) {
    const diverseBlocks = [];
    const seenCategories = new Set();

    for (const block of recommendedBlocks) {
      if (seenCategories.has(block.category)) {
        continue;
      }

      seenCategories.add(block.category);
      diverseBlocks.push(block.name);

      if (diverseBlocks.length >= 4) {
        break;
      }
    }

    if (diverseBlocks.length >= 2) {
      plans.push({
        title: "探索组合",
        summary: "把不同类别的积木先拉到一张桌上，快速判断是走自动化、知识库还是代理路线更合适。",
        stack: diverseBlocks,
      });
    }
  }

  return plans.slice(0, 3);
}

function formatRecordDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isRecentAdded(value) {
  if (!value) {
    return false;
  }

  const addedAt = new Date(value).getTime();
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  return Number.isFinite(addedAt) && addedAt >= ninetyDaysAgo;
}

function isRecentlyResearched(entry) {
  const records = entry?.records;
  if (!Array.isArray(records) || !records.length) {
    return false;
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return records.some((record) => {
    const createdAt = new Date(record?.createdAt).getTime();
    return Number.isFinite(createdAt) && createdAt >= thirtyDaysAgo;
  });
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function pickDailyFeaturedBlock(items, todayKey) {
  if (!items.length) {
    return null;
  }

  const seed = todayKey.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return items[seed % items.length] ?? items[0] ?? null;
}

export default function BrickWarehouse({ open, onClose, onOpenConcept, initialSelectedId }) {
  const defaultStatus = blockStatuses[0] ?? "";
  const [activeWorkspace, setActiveWorkspace] = useState("digest");
  const [query, setQuery] = useState("");
  const [ideaInput, setIdeaInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState(ALL_STATUS);
  const [activeFreshness, setActiveFreshness] = useState(ALL_FRESHNESS);
  const [customBlocks, setCustomBlocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [blockState, setBlockState] = useState(() => normalizeStoredState(repoBlockState));
  const [recordDraft, setRecordDraft] = useState("");
  const [showDailyFeature, setShowDailyFeature] = useState(false);

  useEffect(() => {
    const storedState = window.localStorage.getItem(BLOCK_STATE_KEY);
    if (storedState) {
      setBlockState((current) =>
        normalizeStoredState({
          ...current,
          ...JSON.parse(storedState),
        })
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedBlocks = window.localStorage.getItem(CUSTOM_BLOCKS_KEY);
    if (storedBlocks) {
      const parsed = sanitizeCustomBlocks(JSON.parse(storedBlocks));
      setCustomBlocks(parsed);
      window.localStorage.setItem(CUSTOM_BLOCKS_KEY, JSON.stringify(parsed));
    }
  }, []);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const storedBlocks = window.localStorage.getItem(CUSTOM_BLOCKS_KEY);
    const parsed = sanitizeCustomBlocks(storedBlocks ? JSON.parse(storedBlocks) : []);
    setCustomBlocks(parsed);
    window.localStorage.setItem(CUSTOM_BLOCKS_KEY, JSON.stringify(parsed));
  }, [open]);

  useEffect(() => {
    window.localStorage.setItem(BLOCK_STATE_KEY, JSON.stringify(blockState));
  }, [blockState]);

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.classList.add("overlay-open");
    return () => {
      document.body.classList.remove("overlay-open");
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !initialSelectedId) {
      return;
    }

    const exists = [...customBlocks, ...buildingBlocks].some((block) => block.id === initialSelectedId);
    if (exists) {
      setSelectedId(initialSelectedId);
    }
  }, [customBlocks, initialSelectedId, open]);

  useEffect(() => {
    if (!open || initialSelectedId || typeof window === "undefined") {
      return;
    }

    const storedSelectedId = window.localStorage.getItem(LAST_SELECTED_BLOCK_KEY);
    if (!storedSelectedId) {
      setSelectedId(null);
      return;
    }

    const exists = [...customBlocks, ...repoCustomBlocks, ...buildingBlocks].some((block) => block.id === storedSelectedId);
    setSelectedId(exists ? storedSelectedId : null);
  }, [customBlocks, initialSelectedId, open]);

  useEffect(() => {
    setRecordDraft("");
  }, [selectedId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!selectedId) {
      return;
    }

    window.localStorage.setItem(LAST_SELECTED_BLOCK_KEY, selectedId);
  }, [selectedId]);

  const mergedBlocks = useMemo(
    () => mergeUniqueById([...customBlocks, ...repoCustomBlocks, ...buildingBlocks]),
    [customBlocks]
  );
  const todayKey = useMemo(() => getTodayKey(), []);
  const dailyFeaturedBlock = useMemo(
    () => pickDailyFeaturedBlock(mergedBlocks.filter((block) => !block.isCustom), todayKey),
    [mergedBlocks, todayKey]
  );

  const recentBlocksCount = useMemo(() => mergedBlocks.filter((block) => isRecentAdded(block.addedAt)).length, [mergedBlocks]);
  const recentResearchCount = useMemo(
    () => mergedBlocks.filter((block) => isRecentlyResearched(blockState[block.id])).length,
    [blockState, mergedBlocks]
  );
  const activeFreshnessCount =
    activeFreshness === RECENT_FRESHNESS
      ? recentBlocksCount
      : activeFreshness === RECENT_RESEARCH_FRESHNESS
        ? recentResearchCount
        : mergedBlocks.length;

  const filteredBlocks = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return mergedBlocks.filter((block) => {
      const status = blockState[block.id]?.status ?? defaultStatus;
      const matchCategory = activeCategory === "All" || block.category === activeCategory;
      const matchStatus = activeStatus === ALL_STATUS || status === activeStatus;
      const matchFreshness =
        activeFreshness === ALL_FRESHNESS ||
        (activeFreshness === RECENT_FRESHNESS && isRecentAdded(block.addedAt)) ||
        (activeFreshness === RECENT_RESEARCH_FRESHNESS && isRecentlyResearched(blockState[block.id]));
      return matchCategory && matchStatus && matchFreshness && matchesText(block, keyword);
    });
  }, [activeCategory, activeFreshness, activeStatus, blockState, defaultStatus, mergedBlocks, query]);

  const ideaRecommendations = useMemo(() => {
    const scored = mergedBlocks
      .map((block) => ({
        block,
        score: scoreBlockForIdea(block, ideaInput),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score);

    return scored.slice(0, 6).map((item) => item.block);
  }, [ideaInput, mergedBlocks]);

  const ideaPlans = useMemo(() => buildIdeaPlans(ideaRecommendations), [ideaRecommendations]);

  useEffect(() => {
    if (!filteredBlocks.length) {
      setSelectedId(null);
      return;
    }

    if (selectedId && !filteredBlocks.some((block) => block.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredBlocks, selectedId]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const dismissedAt = window.localStorage.getItem(DAILY_FEATURE_DISMISSED_KEY);
    setShowDailyFeature(dismissedAt !== todayKey);
  }, [open, todayKey]);

  if (!open) {
    return null;
  }

  const selectedBlock = mergedBlocks.find((block) => block.id === selectedId) ?? null;
  const digestSelectedBlock = filteredBlocks.find((block) => block.id === selectedId) ?? null;
  const selectedRecords = selectedBlock ? [...(blockState[selectedBlock.id]?.records ?? [])].reverse() : [];

  async function persistBlockState(nextState) {
    try {
      const response = await fetch("/api/save-block-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: nextState,
        }),
      });

      if (!response.ok) {
        return false;
      }

      return true;

      if (!response.ok) {
        throw new Error(payload.message || "保存研究状态失败");
      }
    } catch (error) {
      window.alert(error.message || "保存研究状态失败，请稍后重试。");
    }
  }

  function updateSelectedBlock(nextPatch, options = {}) {
    if (!selectedBlock) {
      return;
    }

    const { persist = false } = options;

    setBlockState((current) => {
      const nextState = {
        ...current,
        [selectedBlock.id]: {
          status: current[selectedBlock.id]?.status ?? defaultStatus,
          records: current[selectedBlock.id]?.records ?? [],
          ...current[selectedBlock.id],
          ...nextPatch,
        },
      };

      if (persist) {
        void persistBlockState(nextState);
      }

      return nextState;
    });
  }

  function appendRecord() {
    if (!selectedBlock || !recordDraft.trim()) {
      return;
    }

    const nextRecord = {
      id: `${selectedBlock.id}-${Date.now()}`,
      content: recordDraft.trim(),
      status: blockState[selectedBlock.id]?.status ?? defaultStatus,
      createdAt: new Date().toISOString(),
    };

    updateSelectedBlock(
      {
        records: [...(blockState[selectedBlock.id]?.records ?? []), nextRecord],
      },
      { persist: true }
    );
    setRecordDraft("");
  }

  function jumpToConcept(conceptName) {
    if (onOpenConcept) {
      onClose();
      onOpenConcept(conceptName);
    } else {
      setQuery(conceptName);
    }
  }

  function showResultsWithQuery(nextQuery) {
    setQuery(nextQuery);
    setSelectedId(null);
  }

  function showResultsWithFreshness(nextFreshness) {
    setActiveFreshness(nextFreshness);
    setSelectedId(null);
  }

  function showResultsWithCategory(nextCategory) {
    setActiveCategory(nextCategory);
    setSelectedId(null);
  }

  function showResultsWithStatus(nextStatus) {
    setActiveStatus(nextStatus);
    setSelectedId(null);
  }

  function focusBlock(blockId) {
    setSelectedId(blockId);
    setActiveWorkspace("digest");
  }

  function dismissDailyFeature() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DAILY_FEATURE_DISMISSED_KEY, todayKey);
    }

    setShowDailyFeature(false);
  }

  function openDailyFeature() {
    if (!dailyFeaturedBlock) {
      return;
    }

    setSelectedId(dailyFeaturedBlock.id);
    dismissDailyFeature();
  }

  return (
    <div className="blocks-overlay" role="presentation" onClick={onClose}>
      <div className="blocks-shell" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="blocks-topbar">
          <div className="blocks-brand">
            <h2>积木仓库</h2>
          </div>

          <div className="blocks-top-actions">
            <div className="blocks-workspace-switch blocks-workspace-switch-compact">
              <button
                type="button"
                className={`blocks-workspace-tab ${activeWorkspace === "digest" ? "active" : ""}`}
                onClick={() => setActiveWorkspace("digest")}
              >
                <span>Building blocks</span>
              </button>
              <button
                type="button"
                className={`blocks-workspace-tab ${activeWorkspace === "idea" ? "active" : ""}`}
                onClick={() => setActiveWorkspace("idea")}
              >
                <span>idea</span>
              </button>
            </div>
            <button type="button" className="blocks-close" aria-label="关闭积木仓库" title="关闭积木仓库" onClick={onClose} />
          </div>
        </div>

        {activeWorkspace === "digest" ? (
          <div className="blocks-browse-layout">
            <aside className="blocks-explorer scroll-surface">
              <div className="blocks-explorer-head">
                <div>
                  <p className="blocks-panel-kicker">检索</p>
                </div>
                <strong>{filteredBlocks.length}</strong>
              </div>

              <label className="blocks-search blocks-digest-search">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => showResultsWithQuery(event.target.value)}
                  placeholder="搜索项目、概念..."
                />
                {query ? (
                  <button
                    type="button"
                    className="blocks-search-clear"
                    aria-label="清空搜索"
                    title="清空搜索"
                    onClick={() => showResultsWithQuery("")}
                  >
                    x
                  </button>
                ) : null}
              </label>

              <div className="blocks-explorer-stack">
                <section className="blocks-filter-card blocks-filter-card-muted">
                  <div className="blocks-filter-head">
                    <span>时间</span>
                    <strong>{activeFreshnessCount}</strong>
                  </div>
                  <div className="blocks-chip-group">
                    <button
                      type="button"
                      className={`blocks-chip ${activeFreshness === ALL_FRESHNESS ? "active" : ""}`}
                      onClick={() => showResultsWithFreshness(ALL_FRESHNESS)}
                    >
                      全部
                    </button>
                    <button
                      type="button"
                      className={`blocks-chip ${activeFreshness === RECENT_FRESHNESS ? "active" : ""}`}
                      onClick={() => showResultsWithFreshness(RECENT_FRESHNESS)}
                    >
                      最近添加
                    </button>
                    <button
                      type="button"
                      className={`blocks-chip ${activeFreshness === RECENT_RESEARCH_FRESHNESS ? "active" : ""}`}
                      onClick={() => showResultsWithFreshness(RECENT_RESEARCH_FRESHNESS)}
                    >
                      最近研究
                    </button>
                  </div>
                </section>

                <section className="blocks-filter-card blocks-filter-card-muted">
                  <div className="blocks-filter-head">
                    <span>分类</span>
                    <strong>{filteredBlocks.length}</strong>
                  </div>
                  <div className="blocks-chip-group">
                    {blockCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`blocks-chip ${activeCategory === category ? "active" : ""}`}
                        onClick={() => showResultsWithCategory(category)}
                      >
                        {blockCategoryLabels[category] ?? category}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="blocks-filter-card blocks-filter-card-muted">
                  <div className="blocks-filter-head">
                    <span>状态</span>
                  </div>
                  <div className="blocks-chip-group">
                    <button
                      type="button"
                      className={`blocks-chip ${activeStatus === ALL_STATUS ? "active" : ""}`}
                      onClick={() => showResultsWithStatus(ALL_STATUS)}
                    >
                      全部
                    </button>
                    {blockStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`blocks-chip ${activeStatus === status ? "active" : ""}`}
                        onClick={() => showResultsWithStatus(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </section>

              </div>

            </aside>

            <section className="blocks-focus scroll-surface">
              {digestSelectedBlock ? (
                <>
                  <div className="blocks-focus-toolbar">
                    <button type="button" className="blocks-inline-action blocks-back-action" onClick={() => setSelectedId(null)}>
                      返回结果列表
                    </button>
                  </div>

                  <div className="blocks-focus-grid">
                    <div className="blocks-focus-main-column">
                      <div className="blocks-focus-hero">
                    <div className="blocks-focus-copy">
                      <p className="blocks-panel-kicker">当前聚焦项目</p>
                      <div className="blocks-detail-top">
                        <div>
                          <h3>{digestSelectedBlock.name}</h3>
                          <p className="blocks-detail-summary">{digestSelectedBlock.positioning ?? digestSelectedBlock.summary}</p>
                          <p className="blocks-detail-summary blocks-detail-summary-secondary">{digestSelectedBlock.summary}</p>
                        </div>
                        <div className="blocks-detail-meta">
                          <span className="blocks-detail-category">{blockCategoryLabels[digestSelectedBlock.category] ?? digestSelectedBlock.category}</span>
                          {digestSelectedBlock.needsEnrichment ? <span className="blocks-sync-flag">待补全</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="blocks-focus-actions">
                      <a href={digestSelectedBlock.github} target="_blank" rel="noreferrer" className="blocks-link-row">
                        <span>GitHub 地址</span>
                        <code>{digestSelectedBlock.github}</code>
                      </a>
                      <a href={digestSelectedBlock.website} target="_blank" rel="noreferrer" className="blocks-link-row">
                        <span>官网 / 文档</span>
                        <code>{digestSelectedBlock.website}</code>
                      </a>
                    </div>
                  </div>

                      <section className="blocks-focus-main">
                      <section className="blocks-detail-section">
                        <span>它解决什么问题</span>
                        <p>{digestSelectedBlock.solves}</p>
                      </section>

                      <section className="blocks-detail-section">
                        <span>最适合先拿来做什么</span>
                        <p>{digestSelectedBlock.bestFor}</p>
                      </section>

                      <section className="blocks-detail-section">
                        <span>可以和谁组合</span>
                        <div className="blocks-pill-row">
                          {digestSelectedBlock.composeWith.map((item) => (
                            <button key={item} type="button" className="blocks-pill" onClick={() => showResultsWithQuery(item)}>
                              {item}
                            </button>
                          ))}
                        </div>
                      </section>

                      <section className="blocks-detail-section">
                        <span>适合产出什么</span>
                        <div className="blocks-pill-row">
                          {digestSelectedBlock.outputs.map((item) => (
                            <span key={item} className="blocks-pill blocks-pill-static">
                              {item}
                            </span>
                          ))}
                        </div>
                      </section>

                      <section className="blocks-detail-section">
                        <span>相关概念</span>
                        <div className="blocks-pill-row">
                          {(digestSelectedBlock.relatedConcepts ?? []).map((item) => (
                            <button key={item} type="button" className="blocks-pill" onClick={() => jumpToConcept(item)}>
                              {item}
                            </button>
                          ))}
                        </div>
                      </section>

                      </section>
                    </div>

                    <aside className="blocks-focus-side">
                      <section className="blocks-detail-section blocks-side-card">
                        <div className="blocks-section-head">
                          <span>研究记录</span>
                          <strong>{selectedRecords.length}</strong>
                        </div>
                        <div className="blocks-record-composer">
                          <textarea
                            value={recordDraft}
                            onChange={(event) => setRecordDraft(event.target.value)}
                            placeholder="追加一条新的判断、试用结论、组合灵感或待验证问题。"
                          />
                          <div className="blocks-record-actions">
                            <button type="button" className="primary-button blocks-record-submit" onClick={appendRecord}>
                              追加记录
                            </button>
                          </div>
                        </div>
                        <div className="blocks-record-list">
                          {selectedRecords.length ? (
                            selectedRecords.map((record) => (
                              <article key={record.id} className="blocks-record-item">
                                <div className="blocks-record-meta">
                                  <span>{record.status}</span>
                                  <time dateTime={record.createdAt}>{formatRecordDate(record.createdAt)}</time>
                                </div>
                                <p>{record.content}</p>
                              </article>
                            ))
                          ) : (
                            <div className="blocks-record-empty">还没有记录，先记下你对它的第一印象。</div>
                          )}
                        </div>
                      </section>
                    </aside>
                  </div>
                </>
              ) : (
                <div className="blocks-results-stage">
                  {showDailyFeature && dailyFeaturedBlock ? (
                    <section className="blocks-daily-feature" aria-label="每日一木">
                      <div className="blocks-daily-feature-copy">
                        <div className="blocks-daily-feature-head">
                          <div>
                            <span className="blocks-panel-kicker">每日一木</span>
                            <strong>{dailyFeaturedBlock.name}</strong>
                          </div>
                          <button type="button" className="blocks-inline-action" onClick={dismissDailyFeature}>
                            稍后再看
                          </button>
                        </div>
                        <p>{dailyFeaturedBlock.summary}</p>
                      </div>

                      <div className="blocks-daily-feature-side">
                        <div className="blocks-daily-feature-meta">
                          <span className="blocks-detail-category">
                            {blockCategoryLabels[dailyFeaturedBlock.category] ?? dailyFeaturedBlock.category}
                          </span>
                        </div>
                        <button type="button" className="primary-button blocks-daily-feature-action" onClick={openDailyFeature}>
                          进入看看
                        </button>
                      </div>
                    </section>
                  ) : null}
                  <div className="blocks-results-head">
                    <div>
                      <h3>{filteredBlocks.length ? "结果列表" : "没有匹配结果"}</h3>
                    </div>
                    <p>{filteredBlocks.length ? `当前共有 ${filteredBlocks.length} 个结果` : "换一个关键词、分类或状态试试。"}</p>
                  </div>

                  {filteredBlocks.length ? (
                    <div className="blocks-results-grid">
                      {filteredBlocks.map((block) => {
                        const status = blockState[block.id]?.status ?? defaultStatus;
                        return (
                          <button
                            key={block.id}
                            type="button"
                            className="blocks-card blocks-results-card"
                            onClick={() => setSelectedId(block.id)}
                          >
                            <div className="blocks-card-top">
                              <span className="blocks-card-category">{blockCategoryLabels[block.category] ?? block.category}</span>
                              <div className="blocks-card-meta">
                                {block.needsEnrichment ? <span className="blocks-sync-flag blocks-sync-flag-compact">待补全</span> : null}
                                <span className="blocks-card-status">{status}</span>
                              </div>
                            </div>
                            <h4>{block.name}</h4>
                            <p>{block.summary}</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="blocks-idea-layout">
            <section className="blocks-idea-workspace scroll-surface">
              <section className="blocks-idea-hero">
                <div className="blocks-idea-copy">
                  <p className="blocks-panel-kicker">想法工作台</p>
                  <h3>先写一句目标，再批量展开组合</h3>
                  <p>这里优先服务你的组合创新，在你需要之前，尽量不让整个项目库干扰你。</p>
                </div>

                <div className="blocks-idea-input-wrap">
                  <textarea
                    value={ideaInput}
                    onChange={(event) => setIdeaInput(event.target.value)}
                    placeholder="例如：做一个能自动抓网页、整理资料、进入知识库并持续回答问题的研究助手。"
                  />
                  <div className="blocks-idea-examples">
                    {IDEA_EXAMPLES.map((example) => (
                      <button key={example} type="button" onClick={() => setIdeaInput(example)}>
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {ideaInput.trim() ? (
                <div className="blocks-idea-stage">
                  <section className="blocks-idea-main">
                    <div className="blocks-section-head">
                      <span>组合方案</span>
                      <strong>{ideaPlans.length}</strong>
                    </div>
                    {ideaPlans.length ? (
                      <div className="blocks-plan-grid">
                        {ideaPlans.map((plan) => (
                          <article key={plan.title} className="blocks-plan-card blocks-plan-card-featured">
                            <strong>{plan.title}</strong>
                            <p>{plan.summary}</p>
                            <div className="blocks-plan-stack">
                              {plan.stack.map((item) => (
                                <span key={item}>{item}</span>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <section className="blocks-idea-empty">
                        <h3>还没拼出可用方案</h3>
                        <p>当前输入没有形成足够明确的组合方向。你可以换一种说法，或者先从右侧推荐积木里挑一个继续深入。</p>
                      </section>
                    )}
                  </section>

                  <aside className="blocks-idea-side">
                    <section className="blocks-idea-column blocks-side-card">
                      <div className="blocks-section-head">
                        <span>推荐积木</span>
                        <strong>{ideaRecommendations.length}</strong>
                      </div>
                      <div className="blocks-recommendation-list">
                        {ideaRecommendations.map((block) => (
                          <button
                            key={block.id}
                            type="button"
                            className={`blocks-recommendation-item ${selectedBlock?.id === block.id ? "active" : ""}`}
                            onClick={() => setSelectedId(block.id)}
                          >
                            <strong>{block.name}</strong>
                            <span>{block.summary}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    {selectedBlock ? (
                      <section className="blocks-idea-column blocks-side-card">
                        <div className="blocks-section-head">
                          <span>当前聚焦项目</span>
                          <button type="button" className="blocks-inline-action" onClick={() => focusBlock(selectedBlock.id)}>
                            进入深读
                          </button>
                        </div>
                        <div className="blocks-spotlight-card">
                          <div className="blocks-card-top">
                            <span className="blocks-card-category">{blockCategoryLabels[selectedBlock.category] ?? selectedBlock.category}</span>
                          </div>
                          <h4>{selectedBlock.name}</h4>
                          <p>{selectedBlock.summary}</p>
                          <div className="blocks-pill-row">
                            {selectedBlock.composeWith.slice(0, 4).map((item) => (
                              <span key={item} className="blocks-pill blocks-pill-static">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </aside>
                </div>
              ) : (
                <section className="blocks-idea-empty">
                  <h3>先把想法放上桌</h3>
                  <p>输入一句目标后，这里会优先展示组合方案和推荐积木，而不是把你丢进完整项目列表里。</p>
                </section>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

