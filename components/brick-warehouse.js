"use client";

import { useEffect, useMemo, useState } from "react";
import {
  blockCategories,
  blockCategoryLabels,
  blockStatuses,
  buildingBlocks,
} from "@/data/building-blocks";

const BLOCK_STATE_KEY = "ai123_building_blocks_state";
const ALL_STATUS = "ALL_STATUS";

const IDEA_EXAMPLES = [
  "做一个自动抓网页并进入知识库的研究助手",
  "做一个能操作浏览器和本地应用的桌面代理",
  "做一个企业内部多模型 AI 工作台",
];

const IDEA_SIGNAL_MAP = [
  {
    phrases: ["browser", "web", "crawl", "scrape", "form", "website"],
    category: "Browser Automation",
    labels: ["Browser Agent", "Automation", "Crawling"],
  },
  {
    phrases: ["desktop", "gui", "computer use", "app", "screen"],
    category: "GUI Agent",
    labels: ["GUI Agent", "Computer Use", "Desktop"],
  },
  {
    phrases: ["knowledge", "docs", "rag", "search", "pdf", "qa"],
    category: "Knowledge",
    labels: ["RAG", "Knowledge Base", "Search", "Documents"],
  },
  {
    phrases: ["workflow", "automation", "pipeline", "orchestration", "trigger"],
    category: "Workflow",
    labels: ["Workflow", "Automation", "Integrations"],
  },
  {
    phrases: ["code", "coding", "repo", "developer", "debug", "fix"],
    category: "Coding",
    labels: ["Coding", "Code Agent", "Developer Experience"],
  },
  {
    phrases: ["multimodal", "vision", "image", "video", "audio", "voice"],
    category: "Multimodal",
    labels: ["Multimodal", "Vision", "Image Generation"],
  },
  {
    phrases: ["infra", "serving", "gateway", "routing", "inference", "deploy"],
    category: "Infra",
    labels: ["Serving", "Gateway", "Inference", "Model Router"],
  },
  {
    phrases: ["robot", "robotics", "embodied"],
    category: "Robotics",
    labels: ["Robotics", "Embodied AI", "Policies"],
  },
  {
    phrases: ["agent", "copilot", "assistant"],
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

export default function BrickWarehouse({ open, onClose, onOpenConcept, initialSelectedId }) {
  const defaultStatus = blockStatuses[0] ?? "";
  const [activeWorkspace, setActiveWorkspace] = useState("digest");
  const [query, setQuery] = useState("");
  const [ideaInput, setIdeaInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState(ALL_STATUS);
  const [selectedId, setSelectedId] = useState(buildingBlocks[0]?.id ?? null);
  const [blockState, setBlockState] = useState(getInitialBlockState);
  const [recordDraft, setRecordDraft] = useState("");

  useEffect(() => {
    const storedState = window.localStorage.getItem(BLOCK_STATE_KEY);
    if (storedState) {
      setBlockState(normalizeStoredState(JSON.parse(storedState)));
    }
  }, []);

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

    const exists = buildingBlocks.some((block) => block.id === initialSelectedId);
    if (exists) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId, open]);

  useEffect(() => {
    setRecordDraft("");
  }, [selectedId]);

  const tags = useMemo(() => {
    return [...new Set(buildingBlocks.flatMap((block) => block.tags))].sort((left, right) => left.localeCompare(right));
  }, []);

  const filteredBlocks = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return buildingBlocks.filter((block) => {
      const status = blockState[block.id]?.status ?? defaultStatus;
      const matchCategory = activeCategory === "All" || block.category === activeCategory;
      const matchStatus = activeStatus === ALL_STATUS || status === activeStatus;
      return matchCategory && matchStatus && matchesText(block, keyword);
    });
  }, [activeCategory, activeStatus, blockState, defaultStatus, query]);

  const ideaRecommendations = useMemo(() => {
    const scored = buildingBlocks
      .map((block) => ({
        block,
        score: scoreBlockForIdea(block, ideaInput),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score);

    return scored.slice(0, 6).map((item) => item.block);
  }, [ideaInput]);

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

  if (!open) {
    return null;
  }

  const selectedBlock = buildingBlocks.find((block) => block.id === selectedId) ?? null;
  const digestSelectedBlock = filteredBlocks.find((block) => block.id === selectedId) ?? null;
  const selectedStatus = selectedBlock ? blockState[selectedBlock.id]?.status ?? defaultStatus : defaultStatus;
  const selectedRecords = selectedBlock ? [...(blockState[selectedBlock.id]?.records ?? [])].reverse() : [];

  function updateSelectedBlock(nextPatch) {
    if (!selectedBlock) {
      return;
    }

    setBlockState((current) => ({
      ...current,
      [selectedBlock.id]: {
        status: current[selectedBlock.id]?.status ?? defaultStatus,
        records: current[selectedBlock.id]?.records ?? [],
        ...current[selectedBlock.id],
        ...nextPatch,
      },
    }));
  }

  function appendRecord() {
    if (!selectedBlock || !recordDraft.trim()) {
      return;
    }

    const nextRecord = {
      id: `${selectedBlock.id}-${Date.now()}`,
      content: recordDraft.trim(),
      status: selectedStatus,
      createdAt: new Date().toISOString(),
    };

    updateSelectedBlock({
      records: [...(blockState[selectedBlock.id]?.records ?? []), nextRecord],
    });
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

  function focusBlock(blockId) {
    setSelectedId(blockId);
    setActiveWorkspace("digest");
  }

  return (
    <div className="blocks-overlay" role="presentation" onClick={onClose}>
      <div className="blocks-shell" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="blocks-topbar">
          <div className="blocks-brand">
            <p className="blocks-kicker">Open Source Building Blocks</p>
            <h2>积木仓库</h2>
            <p>把值得反复研究的开源能力模块沉淀下来，未来再拼成真正适合你的产品。</p>
          </div>

          <div className="blocks-top-actions">
            <button type="button" className="blocks-close" aria-label="关闭积木仓库" title="关闭积木仓库" onClick={onClose}>
              x
            </button>
          </div>
        </div>

        <div className="blocks-workspace-switch">
          <button
            type="button"
            className={`blocks-workspace-tab ${activeWorkspace === "digest" ? "active" : ""}`}
            onClick={() => setActiveWorkspace("digest")}
          >
            <span>项目消化</span>
            <small>搜索、深读、批注</small>
          </button>
          <button
            type="button"
            className={`blocks-workspace-tab ${activeWorkspace === "idea" ? "active" : ""}`}
            onClick={() => setActiveWorkspace("idea")}
          >
            <span>想法组合</span>
            <small>输入目标，展开组合</small>
          </button>
        </div>

        {activeWorkspace === "digest" ? (
          <div className="blocks-browse-layout">
            <aside className="blocks-explorer scroll-surface">
              <div className="blocks-explorer-head">
                <div>
                  <p className="blocks-panel-kicker">项目探索</p>
                  <h3>先搜到项目，再把它放上主舞台</h3>
                </div>
                <strong>{filteredBlocks.length}</strong>
              </div>

              <label className="blocks-search blocks-digest-search">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索项目、标签、概念..."
                />
                {query ? (
                  <button
                    type="button"
                    className="blocks-search-clear"
                    aria-label="清空搜索"
                    title="清空搜索"
                    onClick={() => setQuery("")}
                  >
                    x
                  </button>
                ) : null}
              </label>

              <div className="blocks-explorer-stack">
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
                        onClick={() => setActiveCategory(category)}
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
                      onClick={() => setActiveStatus(ALL_STATUS)}
                    >
                      全部
                    </button>
                    {blockStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`blocks-chip ${activeStatus === status ? "active" : ""}`}
                        onClick={() => setActiveStatus(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="blocks-filter-card blocks-filter-card-muted">
                  <div className="blocks-filter-head">
                    <span>标签</span>
                  </div>
                  <div className="blocks-tag-cloud">
                    {tags.map((tag) => (
                      <button key={tag} type="button" className="blocks-mini-tag" onClick={() => setQuery(tag)}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

            </aside>

            <section className="blocks-focus scroll-surface">
              {digestSelectedBlock ? (
                <>
                  <div className="blocks-focus-hero">
                    <div className="blocks-focus-copy">
                      <p className="blocks-panel-kicker">当前聚焦项目</p>
                      <div className="blocks-detail-top">
                        <div>
                          <h3>{digestSelectedBlock.name}</h3>
                          <p className="blocks-detail-summary">{digestSelectedBlock.summary}</p>
                        </div>
                        <span className="blocks-detail-category">{blockCategoryLabels[digestSelectedBlock.category] ?? digestSelectedBlock.category}</span>
                      </div>
                    </div>

                    <div className="blocks-focus-actions">
                      <button type="button" className="blocks-inline-action blocks-back-action" onClick={() => setSelectedId(null)}>
                        返回结果列表
                      </button>
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

                  <div className="blocks-focus-grid">
                    <section className="blocks-focus-main">
                      <section className="blocks-detail-section">
                        <span>它解决什么问题</span>
                        <p>{digestSelectedBlock.solves}</p>
                      </section>

                      <section className="blocks-detail-section">
                        <span>可以和谁组合</span>
                        <div className="blocks-pill-row">
                          {digestSelectedBlock.composeWith.map((item) => (
                            <button key={item} type="button" className="blocks-pill" onClick={() => setQuery(item)}>
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

                      <section className="blocks-detail-section">
                        <span>标签</span>
                        <div className="blocks-pill-row">
                          {digestSelectedBlock.tags.map((item) => (
                            <button key={item} type="button" className="blocks-pill" onClick={() => setQuery(item)}>
                              {item}
                            </button>
                          ))}
                        </div>
                      </section>
                    </section>

                    <aside className="blocks-focus-side">
                      <section className="blocks-detail-section blocks-side-card">
                        <span>研究状态</span>
                        <select
                          className="blocks-status-select"
                          value={selectedStatus}
                          onChange={(event) => updateSelectedBlock({ status: event.target.value })}
                        >
                          {blockStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </section>

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
                          <button type="button" className="primary-button blocks-record-submit" onClick={appendRecord}>
                            追加记录
                          </button>
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
                  <div className="blocks-results-head">
                    <div>
                      <p className="blocks-panel-kicker">检索结果</p>
                      <h3>{filteredBlocks.length ? "先看结果，再决定深入哪个项目" : "没有匹配结果"}</h3>
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
                              <span className="blocks-card-status">{status}</span>
                            </div>
                            <h4>{block.name}</h4>
                            <p>{block.summary}</p>
                            <div className="blocks-card-tags">
                              {block.tags.slice(0, 3).map((tag) => (
                                <span key={tag}>{tag}</span>
                              ))}
                            </div>
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
                            <span className="blocks-card-status">{selectedStatus}</span>
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
