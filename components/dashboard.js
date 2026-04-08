"use client";

import { useEffect, useMemo, useState } from "react";
import BrickWarehouse from "@/components/brick-warehouse";
import ConceptUniverse from "@/components/concept-universe";
import { categories, categoryLabels, defaultTools } from "@/data/default-tools";
import { blockCategories, blockCategoryLabels } from "@/data/building-blocks";
import { conceptUniverse } from "@/data/concept-graph";
import repoCustomTools from "@/data/custom-tools.json";
import repoToolOrder from "@/data/tool-order.json";

const CUSTOM_TOOLS_KEY = "ai123_custom_tools";
const CUSTOM_BLOCKS_KEY = "ai123_custom_blocks";
const CUSTOM_CONCEPTS_KEY = "ai123_custom_concepts";
const TOOLS_ORDER_KEY = "ai123_tools_order";
const SYNC_CODE_KEY = "ai123_sync_code";
const ICON_VERSION = "2";
const ADDABLE_TYPES = ["tool", "block", "concept"];

function mergeOrderIds(...groups) {
  return [...new Set(groups.flat().filter(Boolean))];
}

function getInitialOrder() {
  return mergeOrderIds(
    repoToolOrder,
    defaultTools.map((tool) => tool.id),
    repoCustomTools.map((tool) => tool.id)
  );
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

function getEmptyDraft(syncCode = "") {
  return {
    name: "",
    link: "",
    github: "",
    cat: "Other",
    desc: "",
    importance: 1,
    syncCode,
    clusterId: conceptUniverse.clusters[0]?.id ?? "",
  };
}

function getEmptyDraftByType(type, syncCode = "") {
  return {
    ...getEmptyDraft(syncCode),
    cat: type === "block" ? "Agent" : "Other",
  };
}

function createDraftState(syncCode = "") {
  return Object.fromEntries(
    ADDABLE_TYPES.map((type) => [type, getEmptyDraftByType(type, syncCode)])
  );
}

function setAllDraftSyncCodes(drafts, syncCode) {
  return Object.fromEntries(
    Object.entries(drafts).map(([type, draft]) => [type, { ...draft, syncCode }])
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

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [customTools, setCustomTools] = useState([]);
  const [order, setOrder] = useState(getInitialOrder);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftType, setDraftType] = useState("tool");
  const [drafts, setDrafts] = useState(() => createDraftState());
  const [editingToolId, setEditingToolId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isConceptOpen, setIsConceptOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [requestedConcept, setRequestedConcept] = useState("");
  const [requestedBlockId, setRequestedBlockId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragArmedId, setDragArmedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const draft = drafts[draftType];

  useEffect(() => {
    const storedTools = window.localStorage.getItem(CUSTOM_TOOLS_KEY);
    const storedOrder = window.localStorage.getItem(TOOLS_ORDER_KEY);
    const storedSyncCode = window.localStorage.getItem(SYNC_CODE_KEY) ?? "";

    if (storedTools) {
      setCustomTools(JSON.parse(storedTools));
    }

    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    }

    setDrafts((current) => setAllDraftSyncCodes(current, storedSyncCode));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_TOOLS_KEY, JSON.stringify(customTools));
  }, [customTools]);

  useEffect(() => {
    window.localStorage.setItem(TOOLS_ORDER_KEY, JSON.stringify(order));
  }, [order]);

  useEffect(() => {
    const syncCode = draft.syncCode.trim();

    if (!syncCode) {
      window.localStorage.removeItem(SYNC_CODE_KEY);
      return;
    }

    window.localStorage.setItem(SYNC_CODE_KEY, syncCode);
  }, [draft.syncCode]);

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

  function resetDraft(type = draftType) {
    setDrafts((current) => ({
      ...current,
      [type]: getEmptyDraftByType(type, current[type]?.syncCode?.trim() ?? ""),
    }));
  }

  function handleDraftChange(event) {
    const { name, value } = event.target;
    setDrafts((current) => {
      if (name === "syncCode") {
        return setAllDraftSyncCodes(current, value);
      }

      return {
        ...current,
        [draftType]: {
          ...current[draftType],
          [name]: value,
        },
      };
    });
  }

  function handleDraftTypeChange(type) {
    setDraftType(type);
    setEditingToolId(null);
  }

  function openAddModal(type = "tool") {
    setEditingToolId(null);
    setDraftType(type);
    setStatusMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingToolId(null);
    resetDraft(draftType);
  }

  function handleEditTool(tool) {
    setEditingToolId(tool.id);
    setDraftType("tool");
    setDrafts((current) => ({
      ...current,
      tool: {
        ...getEmptyDraftByType("tool", current.tool.syncCode),
        name: tool.name ?? "",
        link: tool.link ?? "",
        cat: tool.cat ?? "Other",
        desc: tool.desc ?? "",
      },
    }));
    setStatusMessage("");
    setIsModalOpen(true);
  }

  function buildLocalDraftItem(type) {
    const timestamp = new Date().toISOString();

    if (type === "tool") {
      return {
        id: editingToolId || `custom_${Date.now()}`,
        name: draft.name.trim(),
        link: normalizeUrl(draft.link),
        desc: draft.desc.trim() || "自定义站点入口",
        cat: draft.cat,
        isCustom: true,
        addedAt: timestamp,
      };
    }

    if (type === "block") {
      return {
        id: `custom-block-${slugify(draft.name)}-${Date.now()}`,
        name: draft.name.trim(),
        category: draft.cat,
        github: normalizeUrl(draft.github),
        website: "",
        summary: draft.desc.trim() || `${draft.name.trim()} 的自定义积木条目`,
        tags: [],
        solves: draft.desc.trim() || `${draft.name.trim()} 的能力说明`,
        composeWith: [],
        outputs: [],
        relatedConcepts: [],
        isCustom: true,
        needsEnrichment: true,
        addedAt: timestamp,
      };
    }

    const cluster =
      conceptUniverse.clusters.find((item) => item.id === draft.clusterId) ??
      conceptUniverse.clusters[0];

    return {
      id: `custom-concept-${slugify(draft.name)}-${Date.now()}`,
      name: draft.name.trim(),
      summary: draft.desc.trim() || `${draft.name.trim()} 的概念摘要`,
      detail: draft.desc.trim() || `${draft.name.trim()} 的概念说明`,
      importance: Number(draft.importance) || 1,
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

  function mergeStoredItems(key, item) {
    const current = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    const next = [item, ...current.filter((entry) => entry.id !== item.id)];
    window.localStorage.setItem(key, JSON.stringify(next));
    return next;
  }

  async function persistToolOrder(nextOrder, nextSyncCode = draft.syncCode.trim(), silent = false) {
    try {
      const response = await fetch("/api/save-tool-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: nextOrder,
          syncCode: nextSyncCode,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "保存排序失败");
      }

      if (!silent) {
        setStatusMessage(payload.mode === "remote" ? "顺序已写入仓库" : "顺序仅保存到当前浏览器");
      }
    } catch (error) {
      if (!silent) {
        window.alert(error.message || "保存排序失败，请稍后重试。");
      }
    }
  }

  function handleDeleteTool(id) {
    setCustomTools((current) => current.filter((tool) => tool.id !== id));
    setOrder((current) => current.filter((item) => item !== id));
    setStatusMessage("已从当前浏览器移除");
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
    setStatusMessage("");

    try {
      const nextSyncCode = draft.syncCode.trim();
      const response = await fetch("/api/submit-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: draftType,
          ...(editingToolId ? { id: editingToolId } : {}),
          ...draft,
          syncCode: nextSyncCode,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "提交失败");
      }

      const item = payload.item ?? buildLocalDraftItem(draftType);

      if (draftType === "tool") {
        const nextOrder = editingToolId
          ? order
          : mergeOrderIds([item.id], order, defaultTools.map((tool) => tool.id), repoCustomTools.map((tool) => tool.id));

        setCustomTools((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
        setOrder(nextOrder);

        if (payload.mode === "remote") {
          await persistToolOrder(nextOrder, nextSyncCode, true);
        }
      } else if (draftType === "block") {
        mergeStoredItems(CUSTOM_BLOCKS_KEY, item);
      } else {
        mergeStoredItems(CUSTOM_CONCEPTS_KEY, item);
      }

      closeModal();
      setStatusMessage(payload.mode === "remote" ? "已写入仓库" : "已保存到当前浏览器");
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
    window.localStorage.removeItem(SYNC_CODE_KEY);
    setCustomTools([]);
    setOrder(getInitialOrder());
    setDrafts(createDraftState());
    setStatusMessage("");
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

    const nextOrder = order.filter((id) => id !== draggedId);
    const targetIndex = nextOrder.indexOf(targetId);
    nextOrder.splice(targetIndex, 0, draggedId);
    setOrder(nextOrder);
    void persistToolOrder(nextOrder);
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
        <p className="hero-copy">常用站点负责效率，概念宇宙负责认知，积木仓库负责沉淀未来可以反复组合的开源能力。</p>

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
            className={`card ${draggedId === tool.id ? "is-dragging" : ""} ${dropTargetId === tool.id ? "is-drop-target" : ""} ${dragArmedId === tool.id ? "is-drag-ready" : ""}`}
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
                    className={`drag-handle ${dragArmedId === tool.id ? "is-armed" : ""}`}
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
        {statusMessage ? <p className="footer-status">{statusMessage}</p> : null}
        <button className="reset-button" type="button" onClick={handleReset}>
          重置布局和自定义数据
        </button>
      </footer>

      {isModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closeModal}>
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
                  <input name="link" type="url" value={draft.link} onChange={handleDraftChange} placeholder="https://..." />
                </label>
              ) : null}

              {draftType === "block" ? (
                <label>
                  Github
                  <input name="github" type="url" value={draft.github} onChange={handleDraftChange} placeholder="https://github.com/..." />
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

              {draftType === "concept" ? (
                <div className="modal-rating-row">
                  <span>熟悉度</span>
                  <div className="modal-rating-dots" role="radiogroup" aria-label="熟悉度">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`modal-rating-dot ${Number(draft.importance) >= level ? "is-active" : ""}`}
                        aria-label={`熟悉度 ${level}`}
                        aria-checked={Number(draft.importance) === level}
                        role="radio"
                        onClick={() =>
                          setDrafts((currentDrafts) => ({
                            ...currentDrafts,
                            [draftType]: {
                              ...currentDrafts[draftType],
                              importance: level,
                            },
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}

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

              <p className="modal-hint">留空时仅保存到当前浏览器；输入正确的入库校验码后，信息会直接写入仓库 JSON。</p>

              <div className="modal-actions">
                <input
                  className="modal-code-input"
                  name="syncCode"
                  type="password"
                  value={draft.syncCode}
                  onChange={handleDraftChange}
                  placeholder="入库校验码"
                />
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

