"use client";

import { useEffect, useMemo, useState } from "react";
import BrickWarehouse from "@/components/brick-warehouse";
import ConceptUniverse from "@/components/concept-universe";
import { categories, categoryLabels, defaultTools } from "@/data/default-tools";
import { blockCategories, blockCategoryLabels } from "@/data/building-blocks";
import { conceptUniverse } from "@/data/concept-graph";
import repoCustomTools from "@/data/custom-tools.json";

const CUSTOM_TOOLS_KEY = "ai123_custom_tools";
const CUSTOM_BLOCKS_KEY = "ai123_custom_blocks";
const CUSTOM_CONCEPTS_KEY = "ai123_custom_concepts";
const TOOLS_ORDER_KEY = "ai123_tools_order";
const ICON_VERSION = "2";
const ADDABLE_TYPES = ["tool", "block", "concept"];

function getInitialOrder() {
  return defaultTools.map((tool) => tool.id);
}

function getIconSeed(value) {
  return [...value].reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
}

function getIconPalette(value) {
  const palettes = [
    ["#7c3aed", "#a78bfa"],
    ["#2563eb", "#60a5fa"],
    ["#059669", "#34d399"],
    ["#ea580c", "#fb923c"],
    ["#dc2626", "#f87171"],
    ["#0891b2", "#22d3ee"],
    ["#ca8a04", "#facc15"],
    ["#9333ea", "#c084fc"],
  ];

  return palettes[getIconSeed(value) % palettes.length];
}

function ToolIcon({ tool }) {
  const [failed, setFailed] = useState(false);
  const seed = `${tool.id}-${tool.name}`;
  const [start, end] = getIconPalette(seed);
  const label = tool.name.trim().charAt(0).toUpperCase();

  if (!failed) {
    return (
      <img
        src={`/api/icon?url=${encodeURIComponent(tool.icon || tool.link)}&v=${ICON_VERSION}`}
        alt={`${tool.name} logo`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="icon-fallback"
      style={{
        background: `linear-gradient(135deg, ${start}, ${end})`,
      }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

function sortTools(tools, order) {
  const rankMap = new Map(order.map((id, index) => [id, index]));
  const dedupedTools = [...new Map(tools.map((tool) => [tool.id, tool])).values()];
  return dedupedTools.sort((left, right) => {
    const leftRank = rankMap.has(left.id) ? rankMap.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightRank = rankMap.has(right.id) ? rankMap.get(right.id) : Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftTime = left.addedAt ? new Date(left.addedAt).getTime() : 0;
    const rightTime = right.addedAt ? new Date(right.addedAt).getTime() : 0;
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return left.name.localeCompare(right.name);
  });
}

function normalizeUrl(value) {
  if (!value.trim()) {
    return "";
  }

  return value.startsWith("http") ? value : `https://${value}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitDraftList(value) {
  return value
    .split(/[,，、\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getEmptyDraft() {
  return {
    name: "",
    link: "",
    cat: "Other",
    desc: "",
    clusterId: conceptUniverse.clusters[0]?.id ?? "",
  };
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [customTools, setCustomTools] = useState([]);
  const [order, setOrder] = useState(getInitialOrder);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftType, setDraftType] = useState("tool");
  const [isConceptOpen, setIsConceptOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [requestedConcept, setRequestedConcept] = useState("");
  const [requestedBlockId, setRequestedBlockId] = useState(null);
  const [draft, setDraft] = useState(getEmptyDraft);
  const [draggedId, setDraggedId] = useState(null);
  const [dragArmedId, setDragArmedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingToolId, setEditingToolId] = useState(null);

  useEffect(() => {
    const storedTools = window.localStorage.getItem(CUSTOM_TOOLS_KEY);
    const storedOrder = window.localStorage.getItem(TOOLS_ORDER_KEY);

    if (storedTools) {
      setCustomTools(JSON.parse(storedTools));
    }

    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_TOOLS_KEY, JSON.stringify(customTools));
  }, [customTools]);

  useEffect(() => {
    window.localStorage.setItem(TOOLS_ORDER_KEY, JSON.stringify(order));
  }, [order]);

  useEffect(() => {
    if (!isModalOpen) {
      document.body.classList.remove("overlay-open");
      return;
    }

    document.body.classList.add("overlay-open");
    return () => {
      document.body.classList.remove("overlay-open");
    };
  }, [isModalOpen]);

  const tools = useMemo(() => {
    const mergedTools = sortTools([...repoCustomTools, ...defaultTools, ...customTools], order);
    return mergedTools.filter((tool) => {
      const matchCategory = activeCategory === "All" || tool.cat === activeCategory;
      const content = `${tool.name} ${tool.desc}`.toLowerCase();
      return matchCategory && content.includes(search.toLowerCase());
    });
  }, [activeCategory, customTools, order, search]);

  function handleDraftChange(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function resetDraft(type = "tool") {
    setDraft({
      ...getEmptyDraft(),
      cat: type === "block" ? "Agent" : "Other",
    });
  }

  function handleDraftTypeChange(type) {
    setDraftType(type);
    resetDraft(type);
    setEditingToolId(null);
  }

  function openAddModal(type = "tool") {
    setEditingToolId(null);
    setDraftType(type);
    resetDraft(type);
    setIsModalOpen(true);
  }

  function handleEditTool(tool) {
    setEditingToolId(tool.id);
    setDraftType("tool");
    setDraft({
      ...getEmptyDraft(),
      name: tool.name ?? "",
      link: tool.link ?? "",
      cat: tool.cat ?? "Other",
      desc: tool.desc ?? "",
    });
    setIsModalOpen(true);
  }

  function handleExportDraftType() {
    if (typeof window === "undefined") {
      return;
    }

    const exportTime = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    if (draftType === "tool") {
      downloadJson(
        `ai123-tools-${exportTime}.json`,
        customTools.filter((tool) => tool.isCustom)
      );
      return;
    }

    if (draftType === "block") {
      downloadJson(
        `ai123-blocks-${exportTime}.json`,
        JSON.parse(window.localStorage.getItem(CUSTOM_BLOCKS_KEY) ?? "[]")
      );
      return;
    }

    downloadJson(
      `ai123-concepts-${exportTime}.json`,
      JSON.parse(window.localStorage.getItem(CUSTOM_CONCEPTS_KEY) ?? "[]")
    );
  }

  function mergeStoredItems(key, item) {
    const current = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    const next = [item, ...current.filter((entry) => entry.id !== item.id)];
    window.localStorage.setItem(key, JSON.stringify(next));
    return next;
  }

  function handleDeleteTool(id) {
    setCustomTools((current) => current.filter((tool) => tool.id !== id));
    setOrder((current) => current.filter((item) => item !== id));
  }

  async function handleAddItemSubmit(event) {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    if (draftType === "tool" && !draft.link.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: draftType,
          ...(editingToolId ? { id: editingToolId } : {}),
          ...draft,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "提交失败");
      }

      const item = payload.item;

      if (draftType === "tool") {
        setCustomTools((current) => {
          const next = [item, ...current.filter((entry) => entry.id !== item.id)];
          return next;
        });
        setOrder((current) =>
          editingToolId ? current : [item.id, ...current.filter((id) => id !== item.id)]
        );
      } else if (draftType === "block") {
        mergeStoredItems(CUSTOM_BLOCKS_KEY, item);
      } else {
        mergeStoredItems(CUSTOM_CONCEPTS_KEY, item);
      }

      resetDraft(draftType);
      setEditingToolId(null);
      setIsModalOpen(false);
    } catch (error) {
      window.alert(error.message || "提交失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    window.localStorage.removeItem(CUSTOM_TOOLS_KEY);
    window.localStorage.removeItem(CUSTOM_BLOCKS_KEY);
    window.localStorage.removeItem(CUSTOM_CONCEPTS_KEY);
    window.localStorage.removeItem(TOOLS_ORDER_KEY);
    setCustomTools([]);
    setOrder(getInitialOrder());
    setSearch("");
    setActiveCategory("All");
  }

  function handleDragStart(event, id) {
    if (dragArmedId !== id) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  }

  function handleDrop(targetId) {
    if (!draggedId || draggedId === targetId) {
      setDropTargetId(null);
      setDragArmedId(null);
      return;
    }

    setOrder((current) => {
      const next = current.filter((id) => id !== draggedId);
      const targetIndex = next.indexOf(targetId);
      next.splice(targetIndex, 0, draggedId);
      return next;
    });
    setDraggedId(null);
    setDropTargetId(null);
    setDragArmedId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDropTargetId(null);
    setDragArmedId(null);
  }

  function openConceptUniverse(conceptName = "") {
    setRequestedConcept(conceptName);
    setIsWarehouseOpen(false);
    setIsConceptOpen(true);
  }

  function openBrickWarehouse(blockId = null) {
    setRequestedBlockId(blockId);
    setIsConceptOpen(false);
    setIsWarehouseOpen(true);
  }

  return (
    <main className="page-shell">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />

      <nav className="topbar">
        <a className="brand" href="/">
          AI <span>123</span>
        </a>
        <div className="topbar-actions">
          <a className="ghost-link" href="https://github.com/9iliudar/Ai123.git" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <button className="ghost-button" type="button" onClick={() => setIsWarehouseOpen(true)}>
            积木仓库
          </button>
          <button className="ghost-button" type="button" onClick={() => openConceptUniverse()}>
            概念宇宙
          </button>
          <button className="primary-button topbar-add-button" type="button" aria-label="添加内容" title="添加内容" onClick={() => openAddModal("tool")}>
            +
          </button>
        </div>
      </nav>

      <section className="hero">
        <p className="hero-kicker">Personal Startpage</p>
        <h1>你的专属 AI 导航页</h1>
        <p className="hero-copy">
          常用站点负责效率，概念宇宙负责认知，积木仓库负责沉淀未来可以反复组合的开源能力。
        </p>

        <div className="search-wrap">
          <input
            id="search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索工具名称，例如：coding、video、chat..."
          />
        </div>

        <div className="filter-row">
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-chip ${activeCategory === category ? "active" : ""}`}
              type="button"
              onClick={() => setActiveCategory(category)}
            >
              {categoryLabels[category] ?? category}
            </button>
          ))}
        </div>

        <div className="portal-strip">
          <button type="button" className="portal-card" onClick={() => openBrickWarehouse()}>
            <span className="portal-kicker">Open Source Building Blocks</span>
            <strong>积木仓库</strong>
            <p>收纳值得你反复理解、未来可以拼成新产品的开源能力模块。</p>
          </button>
          <button type="button" className="portal-card" onClick={() => openConceptUniverse()}>
            <span className="portal-kicker">Concept Universe</span>
            <strong>概念宇宙</strong>
            <p>用沉浸式视图持续强化 AI 术语、方法论和它们之间的关系。</p>
          </button>
        </div>
      </section>

      <section className="grid">
        {tools.map((tool) => (
          <article
            key={tool.id}
            className={`card ${draggedId === tool.id ? "is-dragging" : ""} ${dropTargetId === tool.id ? "is-drop-target" : ""}`}
            draggable={dragArmedId === tool.id}
            onDragStart={(event) => handleDragStart(event, tool.id)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDragEnter={() => {
              if (draggedId && draggedId !== tool.id) {
                setDropTargetId(tool.id);
              }
            }}
            onDragLeave={() => {
              if (dropTargetId === tool.id) {
                setDropTargetId(null);
              }
            }}
            onDrop={() => handleDrop(tool.id)}
            onDragEnd={handleDragEnd}
          >
            {tool.isCustom ? (
              <div className="card-actions">
                <button className="card-action-button" type="button" onClick={() => handleEditTool(tool)}>
                  编辑
                </button>
                <button className="card-action-button delete-button" type="button" onClick={() => handleDeleteTool(tool.id)}>
                  删除
                </button>
              </div>
            ) : null}

            <a className="card-link" href={tool.link} target="_blank" rel="noreferrer">
              <div className="card-top">
                <div className="icon-wrap">
                  <ToolIcon tool={tool} />
                </div>
                <div className="card-top-meta">
                  {tool.badge ? <span className={`badge ${tool.badgeClass}`}>{tool.badge}</span> : <span className="badge badge-placeholder" aria-hidden="true" />}
                  <button
                    className="drag-handle"
                    type="button"
                    aria-label={`拖动 ${tool.name}`}
                    onMouseDown={() => setDragArmedId(tool.id)}
                    onMouseUp={() => setDragArmedId(null)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setDragArmedId(tool.id);
                      }
                    }}
                  >
                    ⋮⋮
                  </button>
                </div>
              </div>

              <h2>{tool.name}</h2>
              <p>{tool.desc}</p>

              <div className="tag-row">
                <span className="tag">{categoryLabels[tool.cat] ?? tool.cat}</span>
                {tool.isCustom ? <span className="tag tag-user">我的</span> : null}
              </div>
            </a>
          </article>
        ))}
      </section>

      <footer className="footer">
        <p>Ai123 会先用浏览器本地存储保存你的自定义站点；概念宇宙与积木仓库则负责把认知地图和开源能力持续沉淀下来。</p>
        <button className="reset-button" type="button" onClick={handleReset}>
          重置布局和自定义数据
        </button>
      </footer>

      {isModalOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => {
            setIsModalOpen(false);
            setEditingToolId(null);
            resetDraft(draftType);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>{editingToolId ? "编辑网站信息" : "追加信息项"}</h3>
            <form onSubmit={handleAddItemSubmit}>
              <div className="modal-type-row">
                {ADDABLE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={Boolean(editingToolId) && type !== "tool"}
                    className={`modal-type-chip ${draftType === type ? "active" : ""}`}
                    onClick={() => handleDraftTypeChange(type)}
                  >
                    {type === "tool" ? "网站" : type === "block" ? "积木" : "概念"}
                  </button>
                ))}
              </div>
              <label>
                名称
                <input
                  name="name"
                  type="text"
                  value={draft.name}
                  onChange={handleDraftChange}
                  placeholder={draftType === "tool" ? "例如：飞书后台" : draftType === "block" ? "例如：Browser Use" : "例如：RAG"}
                />
              </label>
              {draftType === "tool" ? (
                <label>
                  URL
                  <input name="link" type="text" value={draft.link} onChange={handleDraftChange} placeholder="https://..." />
                </label>
              ) : null}
              <label>
                {draftType === "concept" ? "类别" : "分类"}
                <select name={draftType === "concept" ? "clusterId" : "cat"} value={draftType === "concept" ? draft.clusterId : draft.cat} onChange={handleDraftChange}>
                  {(draftType === "tool"
                    ? categories.filter((category) => category !== "All").map((category) => ({ value: category, label: categoryLabels[category] ?? category }))
                    : draftType === "block"
                      ? blockCategories.filter((category) => category !== "All").map((category) => ({ value: category, label: blockCategoryLabels[category] ?? category }))
                      : conceptUniverse.clusters.map((cluster) => ({ value: cluster.id, label: cluster.label }))).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                梗概
                <input
                  name="desc"
                  type="text"
                  value={draft.desc}
                  onChange={handleDraftChange}
                  placeholder={draftType === "tool" ? "一句话说明用途" : "先记下关键描述，可留空"}
                />
              </label>
              <p className="modal-hint">提交后会写入仓库 JSON。网站可直接使用，积木和概念后续再由你本地拉取做补全、关联和网络化。</p>
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingToolId(null);
                    resetDraft(draftType);
                  }}
                >
                  取消
                </button>
                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "提交中..."
                    : editingToolId
                      ? "保存修改"
                      : draftType === "tool"
                        ? "保存网站"
                        : draftType === "block"
                          ? "保存积木"
                          : "保存概念"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConceptUniverse
        open={isConceptOpen}
        onClose={() => setIsConceptOpen(false)}
        requestedConcept={requestedConcept}
        onOpenWarehouse={openBrickWarehouse}
      />
      <BrickWarehouse
        open={isWarehouseOpen}
        onClose={() => setIsWarehouseOpen(false)}
        onOpenConcept={openConceptUniverse}
        initialSelectedId={requestedBlockId}
      />
    </main>
  );
}

