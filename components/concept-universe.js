"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { conceptUniverse } from "@/data/concept-graph";

const primaryLayout = [
  { x: 20, y: 22, scale: 0.98 },
  { x: 36, y: 14, scale: 0.9 },
  { x: 64, y: 16, scale: 0.92 },
  { x: 80, y: 24, scale: 0.84 },
  { x: 18, y: 58, scale: 0.88 },
  { x: 34, y: 74, scale: 0.84 },
  { x: 66, y: 74, scale: 0.86 },
  { x: 82, y: 58, scale: 0.82 },
  { x: 50, y: 10, scale: 0.8 },
  { x: 50, y: 82, scale: 0.8 },
];

const distantLayout = [
  { x: 10, y: 18, scale: 0.62, opacity: 0.36 },
  { x: 88, y: 14, scale: 0.56, opacity: 0.32 },
  { x: 8, y: 42, scale: 0.54, opacity: 0.28 },
  { x: 92, y: 40, scale: 0.58, opacity: 0.32 },
  { x: 14, y: 84, scale: 0.52, opacity: 0.22 },
  { x: 86, y: 82, scale: 0.56, opacity: 0.24 },
  { x: 28, y: 4, scale: 0.5, opacity: 0.2 },
  { x: 72, y: 6, scale: 0.5, opacity: 0.18 },
  { x: 24, y: 92, scale: 0.5, opacity: 0.18 },
  { x: 74, y: 94, scale: 0.5, opacity: 0.16 },
  { x: 3, y: 66, scale: 0.48, opacity: 0.18 },
  { x: 97, y: 68, scale: 0.48, opacity: 0.18 },
];

const themeMap = {
  violet: ["#c4b5fd", "rgba(124, 58, 237, 0.18)", "rgba(124, 58, 237, 0.32)"],
  indigo: ["#a5b4fc", "rgba(79, 70, 229, 0.18)", "rgba(79, 70, 229, 0.32)"],
  emerald: ["#6ee7b7", "rgba(5, 150, 105, 0.18)", "rgba(5, 150, 105, 0.32)"],
  rose: ["#fda4af", "rgba(225, 29, 72, 0.18)", "rgba(225, 29, 72, 0.32)"],
  amber: ["#fbbf24", "rgba(217, 119, 6, 0.18)", "rgba(217, 119, 6, 0.32)"],
  teal: ["#5eead4", "rgba(13, 148, 136, 0.18)", "rgba(13, 148, 136, 0.32)"],
  cyan: ["#67e8f9", "rgba(8, 145, 178, 0.18)", "rgba(8, 145, 178, 0.32)"],
  blue: ["#93c5fd", "rgba(37, 99, 235, 0.18)", "rgba(37, 99, 235, 0.32)"],
  pink: ["#f9a8d4", "rgba(219, 39, 119, 0.18)", "rgba(219, 39, 119, 0.32)"],
  orange: ["#fdba74", "rgba(234, 88, 12, 0.18)", "rgba(234, 88, 12, 0.32)"],
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dedupe(values) {
  return [...new Set(values)];
}

function buildNodeMap(nodes) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function scoreNode(node) {
  return node.importance * 10 + node.related.length;
}

function getSecondaryLabel(node) {
  if (!node) {
    return "";
  }

  if (node.english && node.english !== node.name) {
    return node.english;
  }

  if (node.chinese && node.chinese !== node.name) {
    return node.chinese;
  }

  return "";
}

export default function ConceptUniverse({ open, onClose }) {
  const nodeMap = useMemo(() => buildNodeMap(conceptUniverse.nodes), []);
  const [centerId, setCenterId] = useState(conceptUniverse.entryId);
  const [selectedId, setSelectedId] = useState(conceptUniverse.entryId);
  const [history, setHistory] = useState([conceptUniverse.entryId]);
  const [query, setQuery] = useState("");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [warpPhase, setWarpPhase] = useState("idle");
  const sceneRef = useRef(null);
  const dragRef = useRef(null);

  const centerNode = nodeMap.get(centerId) ?? conceptUniverse.nodes[0];
  const selectedNode = nodeMap.get(selectedId) ?? centerNode;
  const [accent, accentSoft, accentStrong] = themeMap[selectedNode.theme] ?? themeMap.violet;

  const scene = useMemo(() => {
    const primary = dedupe(centerNode.related)
      .map((id) => nodeMap.get(id))
      .filter(Boolean)
      .sort((left, right) => scoreNode(right) - scoreNode(left))
      .slice(0, primaryLayout.length);

    const primaryIds = new Set([centerNode.id, ...primary.map((node) => node.id)]);
    const background = dedupe([
      ...centerNode.related,
      ...primary.flatMap((node) => node.related),
    ])
      .filter((id) => !primaryIds.has(id))
      .map((id) => nodeMap.get(id))
      .filter(Boolean)
      .sort((left, right) => scoreNode(right) - scoreNode(left))
      .slice(0, distantLayout.length);

    return { primary, background };
  }, [centerNode, nodeMap]);

  const quickLinks = useMemo(() => {
    return selectedNode.related
      .map((id) => nodeMap.get(id))
      .filter(Boolean)
      .sort((left, right) => scoreNode(right) - scoreNode(left))
      .slice(0, 8);
  }, [nodeMap, selectedNode]);

  const searchResults = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return [];
    }

    return conceptUniverse.nodes
      .filter((node) => {
        const corpus = `${node.name} ${node.domain} ${node.summary} ${node.detail} ${node.english} ${node.chinese}`.toLowerCase();
        return corpus.includes(keyword);
      })
      .sort((left, right) => scoreNode(right) - scoreNode(left))
      .slice(0, 12);
  }, [query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPan({ x: 0, y: 0 });
    setQuery("");
  }, [centerId, open]);

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
    if (!open) {
      return;
    }

    document.body.classList.add("overlay-open");
    return () => {
      document.body.classList.remove("overlay-open");
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function enterNode(targetId) {
    if (!nodeMap.has(targetId) || targetId === centerId) {
      setSelectedId(targetId);
      return;
    }

    setSelectedId(targetId);
    setWarpPhase("warp-out");
    window.setTimeout(() => {
      setCenterId(targetId);
      setHistory((current) => [...current, targetId].slice(-10));
      setPan({ x: 0, y: 0 });
      setWarpPhase("warp-in");
      window.setTimeout(() => {
        setWarpPhase("idle");
      }, 380);
    }, 280);
  }

  function handleBack() {
    if (history.length <= 1) {
      setCenterId(conceptUniverse.entryId);
      setSelectedId(conceptUniverse.entryId);
      setHistory([conceptUniverse.entryId]);
      setPan({ x: 0, y: 0 });
      return;
    }

    const nextHistory = history.slice(0, -1);
    const previousId = nextHistory[nextHistory.length - 1];
    setHistory(nextHistory);
    setCenterId(previousId);
    setSelectedId(previousId);
    setPan({ x: 0, y: 0 });
  }

  function handlePointerDown(event) {
    if (event.target.closest("button, input")) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    sceneRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragRef.current) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    setPan({
      x: clamp(dragRef.current.originX + deltaX, -180, 180),
      y: clamp(dragRef.current.originY + deltaY, -120, 120),
    });
  }

  function handlePointerUp(event) {
    if (!dragRef.current) {
      return;
    }

    sceneRef.current?.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  }

  return (
    <div
      className={`universe-overlay ${warpPhase}`}
      role="presentation"
      onClick={onClose}
      style={{
        "--universe-accent": accent,
        "--universe-accent-soft": accentSoft,
        "--universe-accent-strong": accentStrong,
      }}
    >
      <div className="universe-shell" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="universe-topbar">
          <div className="universe-brand">
            <p className="universe-kicker">Concept Universe</p>
            <h2>概念宇宙</h2>
            <p>双击任意术语，穿越到它连接出的下一层概念空间。</p>
          </div>

          <div className="universe-top-actions">
            <label className="universe-search">
              <span>搜索概念</span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="检索任意 AI 概念"
              />
            </label>
            <button className="universe-close" type="button" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>

        {searchResults.length ? (
          <div className="universe-search-panel">
            {searchResults.map((node) => (
              <button
                key={node.id}
                type="button"
                className="universe-search-result"
                onClick={() => {
                  setQuery("");
                  enterNode(node.id);
                }}
              >
                <strong>{node.name}</strong>
                <span>{getSecondaryLabel(node) || node.domain}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div
          ref={sceneRef}
          className="universe-scene"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="universe-backdrop" />
          <div
            className="universe-field"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
            }}
          >
            {scene.background.map((node, index) => {
              const layout = distantLayout[index % distantLayout.length];
              return (
                <button
                  key={node.id}
                  type="button"
                  className="universe-distant-node"
                  style={{
                    left: `${layout.x}%`,
                    top: `${layout.y}%`,
                    opacity: layout.opacity,
                    transform: `translate(-50%, -50%) scale(${layout.scale})`,
                  }}
                  onClick={() => setSelectedId(node.id)}
                  onDoubleClick={() => enterNode(node.id)}
                >
                  {node.name}
                </button>
              );
            })}

            <button
              type="button"
              className="universe-center-node"
              onClick={() => setSelectedId(centerNode.id)}
            >
              <span>{centerNode.name}</span>
              <small>{getSecondaryLabel(centerNode) || centerNode.domain}</small>
            </button>

            {scene.primary.map((node, index) => {
              const layout = primaryLayout[index % primaryLayout.length];
              const isActive = selectedNode.id === node.id;

              return (
                <button
                  key={node.id}
                  type="button"
                  className={`universe-node ${isActive ? "active" : ""}`}
                  style={{
                    left: `${layout.x}%`,
                    top: `${layout.y}%`,
                    transform: `translate(-50%, -50%) scale(${layout.scale + node.importance * 0.04})`,
                  }}
                  onClick={() => setSelectedId(node.id)}
                  onDoubleClick={() => enterNode(node.id)}
                >
                  <span>{node.name}</span>
                  <small>{getSecondaryLabel(node) || node.domain}</small>
                </button>
              );
            })}
          </div>

          <div className="universe-breadcrumb">
            {history.map((id, index) => {
              const node = nodeMap.get(id);
              if (!node) {
                return null;
              }

              return (
                <span key={`${id}-${index}`}>
                  {node.name}
                </span>
              );
            })}
          </div>

          <div className="universe-instructions">
            <span>拖动画布浏览</span>
            <span>单击预览</span>
            <span>双击穿越</span>
          </div>

          <div className="universe-stats">
            <span>概念节点 {conceptUniverse.nodes.length}</span>
            <span>当前邻域 {scene.primary.length + scene.background.length + 1}</span>
          </div>

          <div className="universe-controls">
            <button type="button" onClick={handleBack}>
              返回上一级
            </button>
            <button
              type="button"
              onClick={() => {
                setCenterId(conceptUniverse.entryId);
                setSelectedId(conceptUniverse.entryId);
                setHistory([conceptUniverse.entryId]);
                setPan({ x: 0, y: 0 });
              }}
            >
              返回核心
            </button>
          </div>

          <aside className="universe-hud">
            <p className="universe-hud-label">当前术语</p>
            <h3>{selectedNode.name}</h3>
            {getSecondaryLabel(selectedNode) ? <p className="universe-hud-alt">{getSecondaryLabel(selectedNode)}</p> : null}
            <p className="universe-hud-domain">{selectedNode.domain}</p>
            <p className="universe-hud-summary">{selectedNode.summary}</p>
            <p className="universe-hud-detail">{selectedNode.detail}</p>
            <div className="universe-importance" aria-label={`重要度 ${selectedNode.importance} / 5`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index} className={index < selectedNode.importance ? "filled" : ""}>
                  ●
                </span>
              ))}
            </div>
            <div className="universe-quick-links">
              {quickLinks.map((node) => (
                <button key={node.id} type="button" onClick={() => setSelectedId(node.id)} onDoubleClick={() => enterNode(node.id)}>
                  {node.name}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
