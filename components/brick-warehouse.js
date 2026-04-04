"use client";

import { useEffect, useMemo, useState } from "react";
import {
  blockCategories,
  blockCategoryLabels,
  blockStatuses,
  buildingBlocks,
} from "@/data/building-blocks";

const BLOCK_STATE_KEY = "ai123_building_blocks_state";

const IDEA_EXAMPLES = [
  "做一个自动抓网页并进入知识库的研究助手",
  "做一个能操作浏览器和桌面的办公代理",
  "做一个企业内部多模型 AI 工作台",
];

const IDEA_SIGNAL_MAP = [
  {
    phrases: ["浏览器", "网页", "表单", "抓取", "采集", "站点", "web", "browser", "crawl"],
    category: "Browser Automation",
    labels: ["Browser Agent", "Automation", "Crawling"],
  },
  {
    phrases: ["桌面", "界面", "应用", "电脑", "gui", "desktop", "computer use"],
    category: "GUI Agent",
    labels: ["GUI Agent", "Computer Use", "Desktop"],
  },
  {
    phrases: ["知识库", "文档", "rag", "检索", "问答", "pdf", "资料", "搜索"],
    category: "Knowledge",
    labels: ["RAG", "Knowledge Base", "Search", "Documents"],
  },
  {
    phrases: ["工作流", "自动化", "流程", "编排", "连接器", "触发", "automation", "workflow"],
    category: "Workflow",
    labels: ["Workflow", "Automation", "Integrations"],
  },
  {
    phrases: ["代码", "开发", "编程", "仓库", "修复", "coding", "repo", "developer"],
    category: "Coding",
    labels: ["Coding", "Code Agent", "Developer Experience"],
  },
  {
    phrases: ["多模态", "视觉", "图片", "图像", "视频", "音频", "语音", "vision", "multimodal"],
    category: "Multimodal",
    labels: ["Multimodal", "Vision", "Image Generation"],
  },
  {
    phrases: ["本地", "部署", "推理", "网关", "路由", "模型服务", "infra", "serving", "gateway"],
    category: "Infra",
    labels: ["Serving", "Gateway", "Inference", "Model Router"],
  },
  {
    phrases: ["机器人", "机械臂", "具身", "robot", "robotics"],
    category: "Robotics",
    labels: ["Robotics", "Embodied AI", "Policies"],
  },
  {
    phrases: ["代理", "智能体", "agent", "copilot"],
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

  return Object.fromEntries(
    Object.entries(rawState).map(([blockId, value]) => {
      const status = value?.status && blockStatuses.includes(value.status) ? value.status : "未开始";
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
    .split(/[\s,，。；;、/]+/)
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
      summary: "先抓信息，再整理入库，最后接成可问可用的知识系统。",
      stack: [browserBlock, knowledgeBlock, workflowBlock].filter(Boolean).map((block) => block.name),
    });
  }

  if (categories.has("GUI Agent") || categories.has("Browser Automation")) {
    const executionBlock = categories.get("GUI Agent") ?? categories.get("Browser Automation");
    const agentBlock = categories.get("Agent");
    const infraBlock = categories.get("Infra");

    plans.push({
      title: "执行型代理",
      summary: "让代理不仅会理解任务，还能真正操作界面、调用工具并跑完整流程。",
      stack: [agentBlock, executionBlock, infraBlock].filter(Boolean).map((block) => block.name),
    });
  }

  if (categories.has("Coding") || categories.has("Workflow")) {
    const codingBlock = categories.get("Coding");
    const workflowBlock = categories.get("Workflow");
    const infraBlock = categories.get("Infra");

    plans.push({
      title: "研发加速台",
      summary: "把代码生成、任务编排和模型路由放在一条链路里，适合快速出原型。",
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
  const [query, setQuery] = useState("");
  const [ideaInput, setIdeaInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState("全部");
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
      const status = blockState[block.id]?.status ?? "未开始";
      const matchCategory = activeCategory === "All" || block.category === activeCategory;
      const matchStatus = activeStatus === "全部" || status === activeStatus;
      return matchCategory && matchStatus && matchesText(block, keyword);
    });
  }, [activeCategory, activeStatus, blockState, query]);

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

    const selectedStillVisible = filteredBlocks.some((block) => block.id === selectedId);
    if (!selectedStillVisible) {
      setSelectedId(filteredBlocks[0].id);
    }
  }, [filteredBlocks, selectedId]);

  if (!open) {
    return null;
  }

  const selectedBlock = filteredBlocks.find((block) => block.id === selectedId) ?? filteredBlocks[0] ?? null;
  const selectedStatus = selectedBlock ? blockState[selectedBlock.id]?.status ?? "未开始" : "未开始";
  const selectedRecords = selectedBlock ? [...(blockState[selectedBlock.id]?.records ?? [])].reverse() : [];

  function updateSelectedBlock(nextPatch) {
    if (!selectedBlock) {
      return;
    }

    setBlockState((current) => ({
      ...current,
      [selectedBlock.id]: {
        status: current[selectedBlock.id]?.status ?? "未开始",
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
            <label className="blocks-search">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索项目、能力标签、相关概念..."
              />
              {query ? (
                <button
                  type="button"
                  className="blocks-search-clear"
                  aria-label="清除搜索"
                  title="清除搜索"
                  onClick={() => setQuery("")}
                >
                  ×
                </button>
              ) : null}
            </label>
            <button type="button" className="blocks-close" aria-label="关闭积木仓库" title="关闭积木仓库" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="blocks-layout">
          <aside className="blocks-sidebar scroll-surface">
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
                {["全部", ...blockStatuses].map((status) => (
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
                <span>能力标签</span>
              </div>
              <div className="blocks-tag-cloud">
                {tags.map((tag) => (
                  <button key={tag} type="button" className="blocks-mini-tag" onClick={() => setQuery(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="blocks-grid-panel scroll-surface">
            <section className="blocks-idea-lab">
              <div className="blocks-idea-copy">
                <p className="blocks-panel-kicker">一句话想法</p>
                <h3>先写目标，再反推积木组合</h3>
                <p>描述你想做的东西，我先给你适合参考的积木与组合路径。</p>
              </div>

              <div className="blocks-idea-input-wrap">
                <textarea
                  value={ideaInput}
                  onChange={(event) => setIdeaInput(event.target.value)}
                  placeholder="例如：做一个能自动抓网页、整理资料、进入知识库并持续回答问题的研究助手"
                />
                <div className="blocks-idea-examples">
                  {IDEA_EXAMPLES.map((example) => (
                    <button key={example} type="button" onClick={() => setIdeaInput(example)}>
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {ideaInput.trim() ? (
                <div className="blocks-idea-results">
                  <div className="blocks-idea-column">
                    <div className="blocks-section-head">
                      <span>推荐积木</span>
                      <strong>{ideaRecommendations.length}</strong>
                    </div>
                    <div className="blocks-pill-row">
                      {ideaRecommendations.map((block) => (
                        <button
                          key={block.id}
                          type="button"
                          className="blocks-pill blocks-pill-strong"
                          onClick={() => setSelectedId(block.id)}
                        >
                          {block.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="blocks-idea-column">
                    <div className="blocks-section-head">
                      <span>组合方案</span>
                    </div>
                    <div className="blocks-plan-list">
                      {ideaPlans.map((plan) => (
                        <article key={plan.title} className="blocks-plan-card">
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
                  </div>
                </div>
              ) : null}
            </section>

            <div className="blocks-grid-copy">
              <div>
                <p className="blocks-panel-kicker">精选项目</p>
                <h3>像整理能力积木一样整理开源项目</h3>
              </div>
              <p>这里不追热度榜单，只收那些值得你反复理解、未来能与其他能力发生化学反应的模块。</p>
            </div>

            <div className="blocks-grid">
              {filteredBlocks.map((block) => {
                const status = blockState[block.id]?.status ?? "未开始";
                return (
                  <button
                    key={block.id}
                    type="button"
                    className={`blocks-card ${selectedBlock?.id === block.id ? "active" : ""}`}
                    onClick={() => setSelectedId(block.id)}
                  >
                    <div className="blocks-card-top">
                      <span className="blocks-card-category">{blockCategoryLabels[block.category] ?? block.category}</span>
                      <span className="blocks-card-status">{status}</span>
                    </div>
                    <h4>{block.name}</h4>
                    <p>{block.summary}</p>
                    <div className="blocks-card-tags">
                      {block.tags.slice(0, 2).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="blocks-detail scroll-surface">
            {selectedBlock ? (
              <>
                <div className="blocks-detail-top">
                  <div>
                    <p className="blocks-panel-kicker">当前积木</p>
                    <h3>{selectedBlock.name}</h3>
                  </div>
                  <span className="blocks-detail-category">{blockCategoryLabels[selectedBlock.category] ?? selectedBlock.category}</span>
                </div>

                <p className="blocks-detail-summary">{selectedBlock.summary}</p>

                <div className="blocks-link-list">
                  <a href={selectedBlock.github} target="_blank" rel="noreferrer" className="blocks-link-row">
                    <span>GitHub 地址</span>
                    <code>{selectedBlock.github}</code>
                  </a>
                  <a href={selectedBlock.website} target="_blank" rel="noreferrer" className="blocks-link-row">
                    <span>官网 / 文档</span>
                    <code>{selectedBlock.website}</code>
                  </a>
                </div>

                <section className="blocks-detail-section">
                  <span>它解决什么问题</span>
                  <p>{selectedBlock.solves}</p>
                </section>

                <section className="blocks-detail-section">
                  <span>可以和谁组合</span>
                  <div className="blocks-pill-row">
                    {selectedBlock.composeWith.map((item) => (
                      <button key={item} type="button" className="blocks-pill" onClick={() => setQuery(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="blocks-detail-section">
                  <span>适合产出什么</span>
                  <div className="blocks-pill-row">
                    {selectedBlock.outputs.map((item) => (
                      <span key={item} className="blocks-pill blocks-pill-static">
                        {item}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="blocks-detail-section">
                  <span>相关概念</span>
                  <div className="blocks-pill-row">
                    {(selectedBlock.relatedConcepts ?? []).map((item) => (
                      <button key={item} type="button" className="blocks-pill" onClick={() => jumpToConcept(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="blocks-detail-section">
                  <span>能力标签</span>
                  <div className="blocks-pill-row">
                    {selectedBlock.tags.map((item) => (
                      <button key={item} type="button" className="blocks-pill" onClick={() => setQuery(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="blocks-detail-section">
                  <span>研究状态</span>
                  <select value={selectedStatus} onChange={(event) => updateSelectedBlock({ status: event.target.value })}>
                    {blockStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </section>

                <section className="blocks-detail-section">
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
              </>
            ) : (
              <div className="blocks-empty">
                <h3>没有匹配结果</h3>
                <p>换一个关键词、分类或状态试试。</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
