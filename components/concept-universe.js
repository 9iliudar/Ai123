"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { conceptUniverse } from "@/data/concept-graph";

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

const MAX_VISIBLE_NODES = 18;
const PERSPECTIVE = 940;
const CLOUD_RADIUS = 280;

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

function fibonacciSphere(count) {
  return Array.from({ length: count }, (_, index) => {
    const offset = 2 / count;
    const y = index * offset - 1 + offset / 2;
    const radius = Math.sqrt(1 - y * y);
    const phi = index * Math.PI * (3 - Math.sqrt(5));

    return {
      x: Math.cos(phi) * radius,
      y,
      z: Math.sin(phi) * radius,
    };
  });
}

function rotatePoint(point, rotationX, rotationY) {
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);

  const y1 = point.y * cosX - point.z * sinX;
  const z1 = point.y * sinX + point.z * cosX;
  const x2 = point.x * cosY + z1 * sinY;
  const z2 = -point.x * sinY + z1 * cosY;

  return { x: x2, y: y1, z: z2 };
}

function projectPoint(point) {
  const depth = (point.z + CLOUD_RADIUS) / (CLOUD_RADIUS * 2);
  const scale = PERSPECTIVE / (PERSPECTIVE - point.z);

  return {
    left: 50 + (point.x / CLOUD_RADIUS) * 28,
    top: 50 + (point.y / CLOUD_RADIUS) * 24,
    scale,
    depth,
    z: point.z,
    opacity: clamp(0.18 + depth * 0.92, 0.16, 1),
  };
}

export default function ConceptUniverse({ open, onClose }) {
  const nodeMap = useMemo(() => buildNodeMap(conceptUniverse.nodes), []);
  const [centerId, setCenterId] = useState(conceptUniverse.entryId);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([conceptUniverse.entryId]);
  const [query, setQuery] = useState("");
  const [rotation, setRotation] = useState({ x: -0.24, y: 0.42 });
  const [tick, setTick] = useState(0);
  const [warpPhase, setWarpPhase] = useState("idle");
  const sceneRef = useRef(null);
  const dragRef = useRef(null);

  const centerNode = nodeMap.get(centerId) ?? conceptUniverse.nodes[0];
  const selectedNode = selectedId ? nodeMap.get(selectedId) ?? null : null;
  const themeNode = selectedNode ?? centerNode;
  const [accent, accentSoft, accentStrong] = themeMap[themeNode.theme] ?? themeMap.violet;

  const visibleNodes = useMemo(() => {
    const firstRing = centerNode.related.map((id) => nodeMap.get(id)).filter(Boolean);
    const firstRingIds = new Set(firstRing.map((node) => node.id));
    const secondRing = firstRing
      .flatMap((node) => node.related)
      .filter((id) => id !== centerNode.id && !firstRingIds.has(id))
      .map((id) => nodeMap.get(id))
      .filter(Boolean);

    return dedupe([...firstRing, ...secondRing].map((node) => node.id))
      .map((id) => nodeMap.get(id))
      .filter(Boolean)
      .sort((left, right) => scoreNode(right) - scoreNode(left))
      .slice(0, MAX_VISIBLE_NODES);
  }, [centerNode, nodeMap]);

  const quickLinks = useMemo(() => {
    if (!selectedNode) {
      return [];
    }

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

  const projectedNodes = useMemo(() => {
    const spherePoints = fibonacciSphere(Math.max(visibleNodes.length, 1));

    return visibleNodes
      .map((node, index) => {
        const base = spherePoints[index];
        const pulse = tick * 0.0012 + index * 0.42;
        const radius = CLOUD_RADIUS + (node.importance - 3) * 16 + Math.sin(pulse) * 18;
        const dynamicPoint = {
          x: base.x * radius + Math.cos(pulse * 1.3) * 12,
          y: base.y * radius + Math.sin(pulse) * 14,
          z: base.z * radius + Math.cos(pulse * 0.8) * 22,
        };
        const rotated = rotatePoint(dynamicPoint, rotation.x, rotation.y);
        const projection = projectPoint(rotated);

        return {
          ...node,
          ...projection,
        };
      })
      .sort((left, right) => left.z - right.z);
  }, [rotation.x, rotation.y, tick, visibleNodes]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let frameId = 0;

    const loop = (time) => {
      setTick(time);
      if (!dragRef.current) {
        setRotation((current) => ({
          x: clamp(current.x + Math.sin(time * 0.00018) * 0.00045, -0.72, 0.72),
          y: current.y + 0.0022,
        }));
      }
      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

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

  if (!open) {
    return null;
  }

  function enterNode(targetId) {
    if (!nodeMap.has(targetId) || targetId === centerId) {
      setSelectedId(targetId);
      return;
    }

    setWarpPhase("warp-out");
    window.setTimeout(() => {
      setCenterId(targetId);
      setSelectedId(null);
      setHistory((current) => [...current, targetId].slice(-12));
      setRotation({
        x: -0.24 + Math.sin(performance.now() * 0.001) * 0.06,
        y: 0.42,
      });
      setWarpPhase("warp-in");
      window.setTimeout(() => {
        setWarpPhase("idle");
      }, 420);
    }, 260);
  }

  function handleBack() {
    if (history.length <= 1) {
      setCenterId(conceptUniverse.entryId);
      setSelectedId(null);
      setHistory([conceptUniverse.entryId]);
      return;
    }

    const nextHistory = history.slice(0, -1);
    const previousId = nextHistory[nextHistory.length - 1];
    setHistory(nextHistory);
    setCenterId(previousId);
    setSelectedId(null);
    setRotation({ x: -0.24, y: 0.42 });
  }

  function handlePointerDown(event) {
    if (event.target.closest("button, input")) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rotation.x,
      originY: rotation.y,
    };
    sceneRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragRef.current) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    setRotation({
      x: clamp(dragRef.current.originX + deltaY * 0.0044, -1.04, 1.04),
      y: dragRef.current.originY + deltaX * 0.0052,
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
          onClick={(event) => {
            if (event.target === event.currentTarget || event.target.classList.contains("universe-backdrop")) {
              setSelectedId(null);
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="universe-backdrop" />
          <div className="universe-core" aria-hidden="true" />

          <div className="universe-field">
            {projectedNodes.map((node) => {
              const isActive = selectedId === node.id;

              return (
                <button
                  key={node.id}
                  type="button"
                  className={`universe-node ${isActive ? "active" : ""} ${node.z < -30 ? "is-distant" : ""}`}
                  style={{
                    left: `${node.left}%`,
                    top: `${node.top}%`,
                    transform: `translate(-50%, -50%) scale(${node.scale})`,
                    opacity: node.opacity,
                    zIndex: Math.round(node.depth * 100) + 10,
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

          <div className="universe-stats">
            <span>概念节点 {conceptUniverse.nodes.length}</span>
            <span>当前中心 {centerNode.name}</span>
          </div>

          <div className="universe-controls">
            <button type="button" onClick={handleBack}>
              返回上一级
            </button>
            <button
              type="button"
              onClick={() => {
                setCenterId(conceptUniverse.entryId);
                setSelectedId(null);
                setHistory([conceptUniverse.entryId]);
                setRotation({ x: -0.24, y: 0.42 });
              }}
            >
              返回核心
            </button>
          </div>

          {selectedNode ? (
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
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    onDoubleClick={() => enterNode(node.id)}
                  >
                    {node.name}
                  </button>
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
