"use client";

import { useEffect, useMemo, useState } from "react";
import {
  blockCategories,
  blockCategoryLabels,
  blockStatuses,
  buildingBlocks,
} from "@/data/building-blocks";

const BLOCK_STATE_KEY = "ai123_building_blocks_state";

function getInitialBlockState() {
  return {};
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

export default function BrickWarehouse({ open, onClose, onOpenConcept, initialSelectedId }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState("全部");
  const [selectedId, setSelectedId] = useState(buildingBlocks[0]?.id ?? null);
  const [blockState, setBlockState] = useState(getInitialBlockState);

  useEffect(() => {
    const storedState = window.localStorage.getItem(BLOCK_STATE_KEY);
    if (storedState) {
      setBlockState(JSON.parse(storedState));
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
  const selectedNote = selectedBlock ? blockState[selectedBlock.id]?.note ?? "" : "";

  function updateSelectedBlock(nextPatch) {
    if (!selectedBlock) {
      return;
    }

    setBlockState((current) => ({
      ...current,
      [selectedBlock.id]: {
        status: current[selectedBlock.id]?.status ?? "未开始",
        note: current[selectedBlock.id]?.note ?? "",
        ...current[selectedBlock.id],
        ...nextPatch,
      },
    }));
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
            </label>
            <button type="button" className="blocks-close" aria-label="关闭积木仓库" title="关闭积木仓库" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="blocks-layout">
          <aside className="blocks-sidebar scroll-surface">
            <section className="blocks-filter-card">
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

            <section className="blocks-filter-card">
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

            <section className="blocks-filter-card">
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
                    <div className="blocks-card-links">
                      <span>GitHub</span>
                      <code>{block.github.replace("https://github.com/", "")}</code>
                    </div>
                    <div className="blocks-card-tags">
                      {block.tags.slice(0, 3).map((tag) => (
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

                <div className="blocks-detail-actions">
                  <a href={selectedBlock.github} target="_blank" rel="noreferrer">
                    GitHub 地址
                  </a>
                  <a href={selectedBlock.website} target="_blank" rel="noreferrer">
                    官网 / 文档
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
                  <span>我的进度</span>
                  <select value={selectedStatus} onChange={(event) => updateSelectedBlock({ status: event.target.value })}>
                    {blockStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </section>

                <section className="blocks-detail-section">
                  <span>我的备注</span>
                  <textarea
                    value={selectedNote}
                    onChange={(event) => updateSelectedBlock({ note: event.target.value })}
                    placeholder="记下这个项目最吸引你的能力、未来可能与谁组合、或者你亲自试过后的判断。"
                  />
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
