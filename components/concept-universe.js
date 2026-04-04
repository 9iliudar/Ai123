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

function getHudAvoidance(projection, depth, hasHud) {
  if (!hasHud) {
    return { x: 0, y: 0 };
  }

  const threshold = 54;
  const pressure = clamp((projection.left - threshold) / 22, 0, 1);

  if (pressure === 0) {
    return { x: 0, y: 0 };
  }

  const depthWeight = 0.34 + depth * 0.76;
  const horizontalShift = -(18 + pressure * 64) * depthWeight;
  const verticalShift = (50 - projection.top) * 0.18 * pressure;

  return {
    x: horizontalShift,
    y: verticalShift,
  };
}

export default function ConceptUniverse({ open, onClose }) {
  const nodeMap = useMemo(() => buildNodeMap(conceptUniverse.nodes), []);
  const [centerId, setCenterId] = useState(conceptUniverse.entryId);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([conceptUniverse.entryId]);
  const [query, setQuery] = useState("");
  const [rotation, setRotation] = useState({ x: -0.24, y: 0.42 });
  const [warpPhase, setWarpPhase] = useState("idle");
  const [warpTargetId, setWarpTargetId] = useState(null);
  const [warpGhost, setWarpGhost] = useState(null);
  const [arrivalMetrics, setArrivalMetrics] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isHudPinned, setIsHudPinned] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const sceneRef = useRef(null);
  const dragRef = useRef(null);
  const inertiaFrameRef = useRef(0);
  const moveFrameRef = useRef(0);
  const warpTimeoutsRef = useRef([]);
  const rotationRef = useRef(rotation);
  const suppressClickUntilRef = useRef(0);

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
    const hasHud = Boolean(selectedNode);

    return visibleNodes
      .map((node, index) => {
        const base = spherePoints[index];
        const radius = CLOUD_RADIUS + (node.importance - 3) * 14;
        const rotated = rotatePoint(
          {
            x: base.x * radius,
            y: base.y * radius,
            z: base.z * radius,
          },
          rotation.x,
          rotation.y
        );
        const projection = projectPoint(rotated);
        const hudAvoidance = getHudAvoidance(projection, projection.depth, hasHud);
        const finalOffsetX = arrivalMetrics.width ? ((projection.left - 50) / 100) * arrivalMetrics.width + hudAvoidance.x : 0;
        const finalOffsetY = arrivalMetrics.height ? ((projection.top - 50) / 100) * arrivalMetrics.height + hudAvoidance.y : 0;

        return {
          ...node,
          ...projection,
          hudShiftX: `${hudAvoidance.x}px`,
          hudShiftY: `${hudAvoidance.y}px`,
          entryOffsetX: `${arrivalMetrics.x - finalOffsetX}px`,
          entryOffsetY: `${arrivalMetrics.y - finalOffsetY}px`,
          driftDelay: `${(index % 6) * 0.8}s`,
          floatX: `${((index % 5) - 2) * 0.8}px`,
          floatY: `${(((index * 2) % 5) - 2) * 0.7}px`,
          floatDuration: `${11 + (index % 5) * 1.8}s`,
        };
      })
      .sort((left, right) => left.z - right.z);
  }, [arrivalMetrics.height, arrivalMetrics.width, arrivalMetrics.x, arrivalMetrics.y, rotation.x, rotation.y, selectedNode, visibleNodes]);

  const warpOrigin = useMemo(() => {
    const targetNode = projectedNodes.find((node) => node.id === warpTargetId);
    if (!targetNode) {
      return { x: "50%", y: "50%" };
    }

    return {
      x: `calc(${targetNode.left}% + ${targetNode.hudShiftX})`,
      y: `calc(${targetNode.top}% + ${targetNode.hudShiftY})`,
    };
  }, [projectedNodes, warpTargetId]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (!open) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      window.cancelAnimationFrame(moveFrameRef.current);
      warpTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      warpTimeoutsRef.current = [];
      inertiaFrameRef.current = 0;
      moveFrameRef.current = 0;
      setWarpGhost(null);
      setArrivalMetrics({ x: 0, y: 0, width: 0, height: 0 });
    }
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

  function stopInertia() {
    window.cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = 0;
    setIsSettling(false);
  }

  function startInertia(initialVelocity) {
    stopInertia();
    setIsSettling(true);
    let velocity = initialVelocity;

    const step = () => {
      velocity = {
        x: Math.abs(velocity.x) < 0.00004 ? 0 : velocity.x * 0.93,
        y: Math.abs(velocity.y) < 0.00004 ? 0 : velocity.y * 0.93,
      };

      setRotation((current) => {
        const next = {
          x: clamp(current.x + velocity.x, -1.04, 1.04),
          y: current.y + velocity.y,
        };
        rotationRef.current = next;
        return next;
      });

      if (velocity.x === 0 && velocity.y === 0) {
        inertiaFrameRef.current = 0;
        setIsSettling(false);
        return;
      }

      inertiaFrameRef.current = window.requestAnimationFrame(step);
    };

    inertiaFrameRef.current = window.requestAnimationFrame(step);
  }

  function enterNode(targetId) {
    if (!nodeMap.has(targetId) || targetId === centerId) {
      setSelectedId(targetId);
      return;
    }

    warpTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    warpTimeoutsRef.current = [];
    const ghostNode = projectedNodes.find((node) => node.id === targetId);
    if (ghostNode) {
      setWarpGhost(ghostNode);
      if (sceneRef.current) {
        const rect = sceneRef.current.getBoundingClientRect();
        setArrivalMetrics({
          x: ((ghostNode.left - 50) / 100) * rect.width + Number.parseFloat(ghostNode.hudShiftX),
          y: ((ghostNode.top - 50) / 100) * rect.height + Number.parseFloat(ghostNode.hudShiftY),
          width: rect.width,
          height: rect.height,
        });
      }
    }
    setWarpTargetId(targetId);
    setSelectedId(targetId);
    setWarpPhase("warp-lock");
    stopInertia();
    warpTimeoutsRef.current.push(
      window.setTimeout(() => {
        setWarpPhase("warp-out");
      }, 160)
    );
    warpTimeoutsRef.current.push(
      window.setTimeout(() => {
      setCenterId(targetId);
      setSelectedId(targetId);
      setHistory((current) => [...current, targetId].slice(-12));
      setRotation({
        x: -0.24 + Math.sin(performance.now() * 0.001) * 0.06,
        y: 0.42,
      });
      setWarpPhase("warp-in");
      warpTimeoutsRef.current.push(
        window.setTimeout(() => {
        setWarpPhase("idle");
        setWarpTargetId(null);
        setWarpGhost(null);
        setArrivalMetrics({ x: 0, y: 0, width: 0, height: 0 });
        warpTimeoutsRef.current = [];
      }, 520)
      );
    }, 420)
    );
  }

  function handleBack() {
    if (history.length <= 1) {
      setCenterId(conceptUniverse.entryId);
      setSelectedId(null);
      setIsHudPinned(false);
      setHistory([conceptUniverse.entryId]);
      stopInertia();
      return;
    }

    const nextHistory = history.slice(0, -1);
    const previousId = nextHistory[nextHistory.length - 1];
    setHistory(nextHistory);
    setCenterId(previousId);
    setSelectedId(null);
    setIsHudPinned(false);
    setRotation({ x: -0.24, y: 0.42 });
    stopInertia();
  }

  function scheduleDragRotation() {
    if (!dragRef.current || moveFrameRef.current) {
      return;
    }

    moveFrameRef.current = window.requestAnimationFrame(() => {
      moveFrameRef.current = 0;
      if (!dragRef.current) {
        return;
      }

      const deltaX = dragRef.current.currentX - dragRef.current.startX;
      const deltaY = dragRef.current.currentY - dragRef.current.startY;

      const next = {
        x: clamp(dragRef.current.originX + deltaY * 0.0041, -1.04, 1.04),
        y: dragRef.current.originY + deltaX * 0.0049,
      };

      rotationRef.current = next;
      setRotation(next);
    });
  }

  function handlePointerDown(event) {
    if (event.target.closest(".universe-node, .universe-hud, .universe-controls, .universe-search-panel, .universe-topbar, input")) {
      return;
    }

    stopInertia();
    setIsPointerDown(true);
    setIsDragging(false);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      originX: rotationRef.current.x,
      originY: rotationRef.current.y,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocityX: 0,
      velocityY: 0,
      moved: false,
    };
    sceneRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragRef.current) {
      return;
    }

    dragRef.current.currentX = event.clientX;
    dragRef.current.currentY = event.clientY;
    const now = performance.now();
    const elapsed = Math.max(now - dragRef.current.lastTime, 16);
    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    const movedEnough = Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4;

    if (movedEnough) {
      dragRef.current.moved = true;
      setIsDragging(true);
    }

    dragRef.current.velocityX = ((event.clientY - dragRef.current.lastY) * 0.0041) / elapsed;
    dragRef.current.velocityY = ((event.clientX - dragRef.current.lastX) * 0.0049) / elapsed;
    dragRef.current.lastX = event.clientX;
    dragRef.current.lastY = event.clientY;
    dragRef.current.lastTime = now;

    scheduleDragRotation();
  }

  function handlePointerUp(event) {
    if (!dragRef.current) {
      return;
    }

    window.cancelAnimationFrame(moveFrameRef.current);
    moveFrameRef.current = 0;
    sceneRef.current?.releasePointerCapture(event.pointerId);
    setIsPointerDown(false);

    const shouldSuppressClick = dragRef.current.moved;
    if (shouldSuppressClick) {
      suppressClickUntilRef.current = performance.now() + 220;
      startInertia({
        x: clamp(dragRef.current.velocityX * 10, -0.008, 0.008),
        y: clamp(dragRef.current.velocityY * 10, -0.01, 0.01),
      });
    } else {
      setIsSettling(false);
    }

    setIsDragging(false);
    dragRef.current = null;
  }

  function handleNodeClick(nodeId) {
    if (performance.now() < suppressClickUntilRef.current) {
      return;
    }

    setSelectedId(nodeId);
  }

  const sceneStateClass = [
    "universe-scene",
    isPointerDown ? "is-pointer-down" : "",
    isDragging ? "is-dragging" : "",
    !isDragging && !isSettling && warpPhase === "idle" ? "is-idle" : "",
  ]
    .filter(Boolean)
    .join(" ");

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
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="检索任意 AI 概念"
              />
            </label>
            <button type="button" className="universe-close" aria-label="关闭概念宇宙" title="关闭概念宇宙" onClick={onClose}>
              ✕
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
          className={sceneStateClass}
          style={{
            "--warp-origin-x": warpOrigin.x,
            "--warp-origin-y": warpOrigin.y,
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget || event.target.classList.contains("universe-backdrop")) {
              if (!isHudPinned) {
                setSelectedId(null);
              }
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onLostPointerCapture={handlePointerUp}
        >
          <div className="universe-backdrop" />
          <div className="universe-warp-veil" aria-hidden="true" />
          <div className="universe-warp-lines" aria-hidden="true" />
          {warpGhost ? (
            <div
              className="universe-warp-ghost"
              aria-hidden="true"
              style={{
                left: `${warpGhost.left}%`,
                top: `${warpGhost.top}%`,
                "--ghost-shift-x": warpGhost.hudShiftX,
                "--ghost-shift-y": warpGhost.hudShiftY,
                "--ghost-scale": warpGhost.scale,
              }}
            >
              <span>{warpGhost.name}</span>
              <small>{getSecondaryLabel(warpGhost) || warpGhost.domain}</small>
            </div>
          ) : null}
          <div className="universe-core" aria-hidden="true" />

          <div className="universe-field">
            {projectedNodes.map((node) => {
              const isActive = selectedId === node.id;
              const isWarpTarget = warpTargetId === node.id;

              return (
                <button
                  key={node.id}
                  type="button"
                  className={`universe-node ${isActive ? "active" : ""} ${isWarpTarget ? "is-warp-target" : ""} ${node.z < -30 ? "is-distant" : ""}`}
                  style={{
                    left: `${node.left}%`,
                    top: `${node.top}%`,
                    transform: `translate(-50%, -50%) translate3d(var(--node-shift-x), var(--node-shift-y), 0) scale(var(--node-scale))`,
                    opacity: node.opacity,
                    zIndex: Math.round(node.depth * 100) + 10,
                    "--node-shift-x": node.hudShiftX,
                    "--node-shift-y": node.hudShiftY,
                    "--node-entry-x": node.entryOffsetX,
                    "--node-entry-y": node.entryOffsetY,
                    "--node-scale": node.scale,
                    "--node-drift-delay": node.driftDelay,
                    "--node-float-x": node.floatX,
                    "--node-float-y": node.floatY,
                    "--node-float-duration": node.floatDuration,
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleNodeClick(node.id);
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    enterNode(node.id);
                  }}
                >
                  <span className="universe-node-content">
                    <span>{node.name}</span>
                    <small>{getSecondaryLabel(node) || node.domain}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="universe-stats">
            <span>总词条 {conceptUniverse.nodes.length}</span>
            <span>
              当前中心 <strong>{centerNode.name}</strong>
            </span>
          </div>

          <div className="universe-controls">
            <button type="button" aria-label="返回上一级" title="返回上一级" onClick={handleBack}>
              ↶
            </button>
            <button
              type="button"
              aria-label="返回核心"
              title="返回核心"
              onClick={() => {
                setCenterId(conceptUniverse.entryId);
                setSelectedId(null);
                setIsHudPinned(false);
                setHistory([conceptUniverse.entryId]);
                setRotation({ x: -0.24, y: 0.42 });
                stopInertia();
              }}
            >
              ◎
            </button>
          </div>

          {selectedNode ? (
            <aside className="universe-hud">
              <div className="universe-hud-top">
                <p className="universe-hud-label">当前术语</p>
                <button
                  type="button"
                  className={`universe-hud-pin ${isHudPinned ? "is-active" : ""}`}
                  aria-label={isHudPinned ? "取消固定浮窗" : "固定浮窗"}
                  title={isHudPinned ? "取消固定浮窗" : "固定浮窗"}
                  onClick={() => setIsHudPinned((current) => !current)}
                >
                  📌
                </button>
              </div>
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
                  <button key={node.id} type="button" onClick={() => enterNode(node.id)}>
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
