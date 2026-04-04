"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, categoryLabels, defaultTools } from "@/data/default-tools";
import { conceptEntries } from "@/data/concepts";

const CUSTOM_TOOLS_KEY = "ai123_custom_tools";
const TOOLS_ORDER_KEY = "ai123_tools_order";
const ICON_VERSION = "2";
const conceptThemeMap = {
  violet: {
    accent: "#c4b5fd",
    accentSoft: "rgba(124, 58, 237, 0.18)",
    accentStrong: "rgba(124, 58, 237, 0.34)",
    panelGlow: "rgba(124, 58, 237, 0.24)",
  },
  cyan: {
    accent: "#67e8f9",
    accentSoft: "rgba(8, 145, 178, 0.18)",
    accentStrong: "rgba(8, 145, 178, 0.34)",
    panelGlow: "rgba(34, 211, 238, 0.2)",
  },
  amber: {
    accent: "#fbbf24",
    accentSoft: "rgba(217, 119, 6, 0.18)",
    accentStrong: "rgba(217, 119, 6, 0.34)",
    panelGlow: "rgba(251, 191, 36, 0.2)",
  },
  emerald: {
    accent: "#6ee7b7",
    accentSoft: "rgba(5, 150, 105, 0.18)",
    accentStrong: "rgba(5, 150, 105, 0.34)",
    panelGlow: "rgba(16, 185, 129, 0.2)",
  },
  rose: {
    accent: "#fda4af",
    accentSoft: "rgba(225, 29, 72, 0.18)",
    accentStrong: "rgba(225, 29, 72, 0.34)",
    panelGlow: "rgba(251, 113, 133, 0.2)",
  },
  blue: {
    accent: "#93c5fd",
    accentSoft: "rgba(37, 99, 235, 0.18)",
    accentStrong: "rgba(37, 99, 235, 0.34)",
    panelGlow: "rgba(59, 130, 246, 0.2)",
  },
  orange: {
    accent: "#fdba74",
    accentSoft: "rgba(234, 88, 12, 0.18)",
    accentStrong: "rgba(234, 88, 12, 0.34)",
    panelGlow: "rgba(251, 146, 60, 0.2)",
  },
  pink: {
    accent: "#f9a8d4",
    accentSoft: "rgba(219, 39, 119, 0.18)",
    accentStrong: "rgba(219, 39, 119, 0.34)",
    panelGlow: "rgba(244, 114, 182, 0.2)",
  },
  indigo: {
    accent: "#a5b4fc",
    accentSoft: "rgba(79, 70, 229, 0.18)",
    accentStrong: "rgba(79, 70, 229, 0.34)",
    panelGlow: "rgba(99, 102, 241, 0.2)",
  },
  teal: {
    accent: "#5eead4",
    accentSoft: "rgba(13, 148, 136, 0.18)",
    accentStrong: "rgba(13, 148, 136, 0.34)",
    panelGlow: "rgba(45, 212, 191, 0.2)",
  },
};
const conceptNodeLayout = [
  { x: 16, y: 20, driftX: 10, driftY: -12, duration: 14, delay: 0.2, scale: 1.22 },
  { x: 37, y: 16, driftX: -12, driftY: 10, duration: 17, delay: 0.7, scale: 1.12 },
  { x: 63, y: 22, driftX: 14, driftY: 12, duration: 16, delay: 1.1, scale: 1.06 },
  { x: 82, y: 18, driftX: -10, driftY: -10, duration: 15, delay: 0.5, scale: 0.98 },
  { x: 24, y: 43, driftX: 12, driftY: 14, duration: 18, delay: 1.3, scale: 1.16 },
  { x: 49, y: 40, driftX: -14, driftY: -12, duration: 13, delay: 0.4, scale: 1.24 },
  { x: 74, y: 44, driftX: 10, driftY: -16, duration: 19, delay: 1.5, scale: 1.08 },
  { x: 17, y: 68, driftX: -10, driftY: 14, duration: 16, delay: 0.9, scale: 1.04 },
  { x: 43, y: 72, driftX: 14, driftY: -10, duration: 15, delay: 1.7, scale: 1.1 },
  { x: 72, y: 70, driftX: -12, driftY: 12, duration: 17, delay: 0.6, scale: 1.02 },
];

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
  return [...tools].sort((left, right) => {
    const leftRank = rankMap.has(left.id) ? rankMap.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightRank = rankMap.has(right.id) ? rankMap.get(right.id) : Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  });
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [customTools, setCustomTools] = useState([]);
  const [order, setOrder] = useState(getInitialOrder);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    link: "",
    cat: "Other",
    desc: "",
  });
  const [draggedId, setDraggedId] = useState(null);
  const [dragArmedId, setDragArmedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [isConceptOpen, setIsConceptOpen] = useState(false);
  const [activeConceptId, setActiveConceptId] = useState(conceptEntries[0]?.id ?? null);

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

  const tools = useMemo(() => {
    const mergedTools = sortTools([...defaultTools, ...customTools], order);
    return mergedTools.filter((tool) => {
      const matchCategory = activeCategory === "All" || tool.cat === activeCategory;
      const content = `${tool.name} ${tool.desc}`.toLowerCase();
      return matchCategory && content.includes(search.toLowerCase());
    });
  }, [activeCategory, customTools, order, search]);

  const activeConcept = useMemo(
    () => conceptEntries.find((entry) => entry.id === activeConceptId) ?? conceptEntries[0],
    [activeConceptId]
  );
  const activeConceptTheme = conceptThemeMap[activeConcept?.color] ?? conceptThemeMap.violet;
  const conceptNodes = useMemo(() => {
    return conceptEntries.map((entry, index) => {
      const layout = conceptNodeLayout[index % conceptNodeLayout.length];
      const depth = entry.importance >= 5 ? "near" : entry.importance === 4 ? "mid" : "far";

      return {
        ...entry,
        depth,
        style: {
          "--x": `${layout.x}%`,
          "--y": `${layout.y}%`,
          "--delay": `${layout.delay}s`,
          "--duration": `${layout.duration}s`,
          "--scale": (layout.scale + (entry.importance - 3) * 0.04).toFixed(2),
          "--drift-x": `${layout.driftX}px`,
          "--drift-y": `${layout.driftY}px`,
          "--layer-opacity": depth === "near" ? "0.96" : depth === "mid" ? "0.82" : "0.68",
          "--layer-blur": depth === "near" ? "0px" : depth === "mid" ? "0px" : "1.2px",
        },
      };
    });
  }, []);
  const conceptNameMap = useMemo(() => {
    return new Map(conceptEntries.map((entry) => [entry.name, entry.id]));
  }, []);

  function handleDraftChange(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function handleAddTool(event) {
    event.preventDefault();

    if (!draft.name.trim() || !draft.link.trim()) {
      return;
    }

    const nextLink = draft.link.startsWith("http") ? draft.link : `https://${draft.link}`;
    const nextTool = {
      id: `custom_${Date.now()}`,
      name: draft.name.trim(),
      link: nextLink,
      desc: draft.desc.trim() || "自定义快捷方式",
      cat: draft.cat,
      isCustom: true,
    };

    setCustomTools((current) => [nextTool, ...current]);
    setOrder((current) => [nextTool.id, ...current]);
    setDraft({ name: "", link: "", cat: "Other", desc: "" });
    setIsModalOpen(false);
  }

  function handleDeleteTool(id) {
    setCustomTools((current) => current.filter((tool) => tool.id !== id));
    setOrder((current) => current.filter((item) => item !== id));
  }

  function handleReset() {
    window.localStorage.removeItem(CUSTOM_TOOLS_KEY);
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

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsConceptOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const shouldLock = isModalOpen || isConceptOpen;
    document.body.classList.toggle("overlay-open", shouldLock);

    return () => {
      document.body.classList.remove("overlay-open");
    };
  }, [isConceptOpen, isModalOpen]);

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
          <button className="ghost-button" type="button" onClick={() => setIsConceptOpen(true)}>
            概念舱
          </button>
          <button className="primary-button" type="button" onClick={() => setIsModalOpen(true)}>
            + 添加网站
          </button>
        </div>
      </nav>

      <section className="hero">
        <p className="hero-kicker">Personal Startpage</p>
        <h1>你的专属 AI 导航页</h1>
        <p className="hero-copy">
          完全参考 HotAI.Tools 的极简框架，保留分类、搜索、拖拽排序和本地添加能力，先作为你的个人常用站首页使用。
        </p>

        <div className="search-wrap">
          <input
            id="search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索工具名称，例如 coding、video、chat..."
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
              <button className="delete-button" type="button" onClick={() => handleDeleteTool(tool.id)}>
                删除
              </button>
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
        <p>Ai123 先使用浏览器本地存储保存你的自定义站点；后续如果你确认需要跨设备编辑，再接数据库。</p>
        <button className="reset-button" type="button" onClick={handleReset}>
          重置布局和自定义数据
        </button>
      </footer>

      {isModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>添加自定义网站</h3>
            <form onSubmit={handleAddTool}>
              <label>
                名称
                <input name="name" type="text" value={draft.name} onChange={handleDraftChange} placeholder="例如：飞书后台" />
              </label>
              <label>
                URL
                <input name="link" type="text" value={draft.link} onChange={handleDraftChange} placeholder="https://..." />
              </label>
              <label>
                分类
                <select name="cat" value={draft.cat} onChange={handleDraftChange}>
                  {categories
                    .filter((category) => category !== "All")
                    .map((category) => (
                      <option key={category} value={category}>
                        {categoryLabels[category] ?? category}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                备注
                <input name="desc" type="text" value={draft.desc} onChange={handleDraftChange} placeholder="一句话说明用途" />
              </label>
              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={() => setIsModalOpen(false)}>
                  取消
                </button>
                <button className="primary-button" type="submit">
                  添加到导航页
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isConceptOpen ? (
        <div className="concept-overlay" role="presentation" onClick={() => setIsConceptOpen(false)}>
          <div
            className="concept-shell"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            style={{
              "--concept-accent": activeConceptTheme.accent,
              "--concept-accent-soft": activeConceptTheme.accentSoft,
              "--concept-accent-strong": activeConceptTheme.accentStrong,
              "--concept-panel-glow": activeConceptTheme.panelGlow,
            }}
          >
            <div className="concept-stage">
              <div className="concept-stage-copy">
                <p className="concept-kicker">Concept Cloud</p>
                <h2>概念舱</h2>
                <p>
                  用一个沉浸式视图反复强化那些值得长期记住的新概念。点击任意节点查看解释，按 <kbd>ESC</kbd> 或点击空白处退出。
                </p>
              </div>

              <div className="concept-cloud" aria-label="概念云">
                {conceptNodes.map((entry) => (
                  <button
                    key={entry.id}
                    className={`concept-node concept-${entry.color} concept-${entry.depth} ${activeConcept?.id === entry.id ? "active" : ""}`}
                    type="button"
                    style={entry.style}
                    onClick={() => setActiveConceptId(entry.id)}
                    aria-pressed={activeConcept?.id === entry.id}
                  >
                    <span>{entry.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <aside className="concept-panel">
              <div className="concept-panel-top">
                <div>
                  <p className="concept-panel-label">当前概念</p>
                  <h3>{activeConcept.name}</h3>
                </div>
                <button className="concept-close" type="button" onClick={() => setIsConceptOpen(false)}>
                  关闭
                </button>
              </div>

              <p className="concept-summary">{activeConcept.summary}</p>
              <p className="concept-detail">{activeConcept.detail}</p>

              <div className="concept-section">
                <p className="concept-panel-label">关联词</p>
                <div className="concept-links">
                  {activeConcept.links.map((link) => (
                    <button
                      key={link}
                      type="button"
                      className={`concept-link-pill ${conceptNameMap.has(link) ? "is-linkable" : ""}`}
                      onClick={() => {
                        const nextId = conceptNameMap.get(link);
                        if (nextId) {
                          setActiveConceptId(nextId);
                        }
                      }}
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>

              <div className="concept-section">
                <p className="concept-panel-label">重要度</p>
                <div className="concept-importance" aria-label={`重要度 ${activeConcept.importance} / 5`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className={index < activeConcept.importance ? "filled" : ""}>
                      ●
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </main>
  );
}
