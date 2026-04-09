"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { conceptUniverse } from "@/data/concept-graph";
import repoCustomConcepts from "@/data/custom-concepts.json";
import repoConceptMastery from "@/data/concept-mastery.json";

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
const MASTERY_STORAGE_KEY = "ai123_concept_mastery";
const CUSTOM_CONCEPTS_KEY = "ai123_custom_concepts";
const SYNC_CODE_KEY = "ai123_sync_code";
const ALL_FRESHNESS = "ALL_FRESHNESS";
const RECENT_FRESHNESS = "RECENT_FRESHNESS";
const REMOVED_TEST_CONCEPT_IDS = new Set([
  "custom-concept-姒傚康鍏ュ簱娴嬭瘯-1775478236882",
  "custom-concept-涓€鏉℃蹇垫祴璇?1775469886785",
]);

function mergeUniqueById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dedupe(values) {
  return [...new Set(values)];
}

function sanitizeCustomConcepts(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item?.id && !REMOVED_TEST_CONCEPT_IDS.has(item.id));
}

function sanitizeMasteryMap(rawMap) {
  if (!rawMap || typeof rawMap !== "object") {
    return {};
  }

  return Object.fromEntries(Object.entries(rawMap).filter(([key]) => !REMOVED_TEST_CONCEPT_IDS.has(key)));
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

function isRecentAdded(value) {
  if (!value) {
    return false;
  }

  const addedAt = new Date(value).getTime();
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  return Number.isFinite(addedAt) && addedAt >= ninetyDaysAgo;
}

function createConceptDraft(clusterId = conceptUniverse.clusters[0]?.id ?? "", syncCode = "") {
  return {
    name: "",
    desc: "",
    clusterId,
    importance: 2,
    syncCode,
  };
}

export default function ConceptUniverse({ open, onClose, requestedConcept }) {
  const [customConcepts, setCustomConcepts] = useState([]);
  const mergedNodes = useMemo(
    () => mergeUniqueById([...customConcepts, ...repoCustomConcepts, ...conceptUniverse.nodes]),
    [customConcepts]
  );
  const nodeMap = useMemo(() => buildNodeMap(mergedNodes), [mergedNodes]);
  const clusters = conceptUniverse.clusters;
  const [centerId, setCenterId] = useState(conceptUniverse.entryId);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([conceptUniverse.entryId]);
  const [query, setQuery] = useState("");
  const [rotation, setRotation] = useState({ x: -0.24, y: 0.42 });
  const [warpPhase, setWarpPhase] = useState("idle");
  const [warpTargetId, setWarpTargetId] = useState(null);
  const [warpGhost, setWarpGhost] = useState(null);
  const [warpOrigin, setWarpOrigin] = useState({ x: "50%", y: "50%" });
  const [arrivalOrigin, setArrivalOrigin] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isHudPinned, setIsHudPinned] = useState(false);
  const [masteryMap, setMasteryMap] = useState(repoConceptMastery);
  const [activeClusterId, setActiveClusterId] = useState(conceptUniverse.clusters[0]?.id ?? null);
  const [activeFreshness, setActiveFreshness] = useState(ALL_FRESHNESS);
  const [isClusterMenuOpen, setIsClusterMenuOpen] = useState(false);
  const [isAddConceptOpen, setIsAddConceptOpen] = useState(false);
  const [isAddConceptMounted, setIsAddConceptMounted] = useState(false);
  const [conceptDraft, setConceptDraft] = useState(() => createConceptDraft());
  const [isSubmittingConcept, setIsSubmittingConcept] = useState(false);
  const [conceptComposerMessage, setConceptComposerMessage] = useState("");
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const sceneRef = useRef(null);
  const dragRef = useRef(null);
  const inertiaFrameRef = useRef(0);
  const moveFrameRef = useRef(0);
  const warpTimeoutsRef = useRef([]);
  const composerTimeoutRef = useRef(0);
  const rotationRef = useRef(rotation);
  const suppressClickUntilRef = useRef(0);

  const centerNode = nodeMap.get(centerId) ?? mergedNodes[0];
  const selectedNode = selectedId ? nodeMap.get(selectedId) ?? null : null;
  const themeNode = selectedNode ?? centerNode;
  const activeCluster = clusters.find((cluster) => cluster.id === activeClusterId) ?? null;
  const activeClusterCount = activeCluster ? mergedNodes.filter((node) => node.domain === activeCluster.label).length : 0;
  const filteredNodePool = useMemo(() => {
    return mergedNodes.filter((node) => activeFreshness === ALL_FRESHNESS || isRecentAdded(node.addedAt));
  }, [activeFreshness, mergedNodes]);
  const recentConceptCount = useMemo(() => mergedNodes.filter((node) => isRecentAdded(node.addedAt)).length, [mergedNodes]);
  const activeClusterNodes = useMemo(() => {
    if (activeFreshness === RECENT_FRESHNESS || !activeCluster) {
      return filteredNodePool;
    }

    return filteredNodePool.filter((node) => node.domain === activeCluster.label);
  }, [activeCluster, activeFreshness, filteredNodePool]);
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
      .filter((node) => activeFreshness === ALL_FRESHNESS || isRecentAdded(node.addedAt))
      .sort((left, right) => scoreNode(right) - scoreNode(left))
      .slice(0, MAX_VISIBLE_NODES);
  }, [activeFreshness, centerNode, nodeMap]);

  const quickLinks = useMemo(() => {
    if (!selectedNode) {
      return [];
    }

    return selectedNode.related
      .map((id) => nodeMap.get(id))
      .filter(Boolean)
      .filter((node) => activeFreshness === ALL_FRESHNESS || isRecentAdded(node.addedAt))
      .sort((left, right) => scoreNode(right) - scoreNode(left))
      .slice(0, 8);
  }, [activeFreshness, nodeMap, selectedNode]);
  const selectedMastery = selectedNode ? masteryMap[selectedNode.id] ?? 2 : 2;

  const searchResults = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return [];
    }

    return mergedNodes
      .filter((node) => {
        const corpus = `${node.name} ${node.domain} ${node.summary} ${node.detail} ${node.english} ${node.chinese}`.toLowerCase();
        return corpus.includes(keyword) && (activeFreshness === ALL_FRESHNESS || isRecentAdded(node.addedAt));
      })
      .sort((left, right) => scoreNode(right) - scoreNode(left))
      .slice(0, 12);
  }, [activeFreshness, mergedNodes, query]);

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
        const finalOffsetX = arrivalOrigin.width ? ((projection.left - 50) / 100) * arrivalOrigin.width + hudAvoidance.x : 0;
        const finalOffsetY = arrivalOrigin.height ? ((projection.top - 50) / 100) * arrivalOrigin.height + hudAvoidance.y : 0;
        const entryOffsetX = arrivalOrigin.width ? arrivalOrigin.x - finalOffsetX : 0;
        const entryOffsetY = arrivalOrigin.height ? arrivalOrigin.y - finalOffsetY : 0;
        const entryDepth = -72 + (1 - projection.depth) * -48;

        return {
          ...node,
          ...projection,
          hudShiftX: `${hudAvoidance.x}px`,
          hudShiftY: `${hudAvoidance.y}px`,
          entryOffsetX: `${entryOffsetX}px`,
          entryOffsetY: `${entryOffsetY}px`,
          entryDepth: `${entryDepth}px`,
          arrivalDelay: `${160 + index * 42}ms`,
          driftDelay: `${(index % 6) * 0.8}s`,
          floatX: `${((index % 5) - 2) * 0.8}px`,
          floatY: `${(((index * 2) % 5) - 2) * 0.7}px`,
          floatDuration: `${11 + (index % 5) * 1.8}s`,
        };
      })
      .sort((left, right) => left.z - right.z);
  }, [arrivalOrigin.height, arrivalOrigin.width, arrivalOrigin.x, arrivalOrigin.y, rotation.x, rotation.y, selectedNode, visibleNodes]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedConcepts = window.localStorage.getItem(CUSTOM_CONCEPTS_KEY);
    if (storedConcepts) {
      const parsedConcepts = sanitizeCustomConcepts(JSON.parse(storedConcepts));
      setCustomConcepts(parsedConcepts);
      window.localStorage.setItem(CUSTOM_CONCEPTS_KEY, JSON.stringify(parsedConcepts));
    }

    const storedSyncCode = window.localStorage.getItem(SYNC_CODE_KEY) ?? "";
    setConceptDraft(createConceptDraft(conceptUniverse.clusters[0]?.id ?? "", storedSyncCode));

    try {
      const stored = window.localStorage.getItem(MASTERY_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        const nextMastery = sanitizeMasteryMap(parsed);
        setMasteryMap((current) => ({
          ...current,
          ...nextMastery,
        }));
        window.localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(nextMastery));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const storedConcepts = window.localStorage.getItem(CUSTOM_CONCEPTS_KEY);
    const parsedConcepts = sanitizeCustomConcepts(storedConcepts ? JSON.parse(storedConcepts) : []);
    setCustomConcepts(parsedConcepts);
    window.localStorage.setItem(CUSTOM_CONCEPTS_KEY, JSON.stringify(parsedConcepts));
  }, [open]);

  useEffect(() => {
    if (!activeClusterId) {
      return;
    }

    setConceptDraft((current) => ({
      ...current,
      clusterId: current.clusterId || activeClusterId,
    }));
  }, [activeClusterId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncCode = conceptDraft.syncCode.trim();
    if (!syncCode) {
      window.localStorage.removeItem(SYNC_CODE_KEY);
      return;
    }

    window.localStorage.setItem(SYNC_CODE_KEY, syncCode);
  }, [conceptDraft.syncCode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(masteryMap));
    } catch {}
  }, [masteryMap]);

  useEffect(() => {
    if (!open) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      window.cancelAnimationFrame(moveFrameRef.current);
      warpTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.clearTimeout(composerTimeoutRef.current);
      warpTimeoutsRef.current = [];
      inertiaFrameRef.current = 0;
      moveFrameRef.current = 0;
      setWarpGhost(null);
      setWarpOrigin({ x: "50%", y: "50%" });
      setArrivalOrigin({ x: 0, y: 0, width: 0, height: 0 });
      setIsAddConceptOpen(false);
      setIsAddConceptMounted(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !requestedConcept) {
      return;
    }

    const keyword = requestedConcept.trim().toLowerCase();
    const match = mergedNodes.find((node) => {
      const corpus = `${node.name} ${node.english ?? ""} ${node.chinese ?? ""}`.toLowerCase();
      return corpus.includes(keyword);
    });

    if (!match) {
      return;
    }

    setCenterId(match.id);
    setSelectedId(match.id);
    const matchCluster = clusters.find((cluster) => cluster.label === match.domain);
    setActiveClusterId(matchCluster?.id ?? null);
    setHistory((current) => {
      const next = current.filter((id) => id !== match.id);
      return [...next, match.id].slice(-12);
    });
    setRotation({ x: -0.24, y: 0.42 });
    setIsHudPinned(false);
  }, [clusters, mergedNodes, open, requestedConcept]);

  useEffect(() => {
    if (!open || !activeCluster) {
      return;
    }

    if (centerNode.domain === activeCluster.label) {
      return;
    }

    const nextCenter =
      activeFreshness === RECENT_FRESHNESS
        ? null
        : activeClusterNodes[0] ?? mergedNodes.find((node) => node.domain === activeCluster.label);
    if (!nextCenter) {
      return;
    }

    setCenterId(nextCenter.id);
    setSelectedId(null);
    setHistory([nextCenter.id]);
    setRotation({ x: -0.24, y: 0.42 });
    setIsHudPinned(false);
  }, [activeCluster, activeClusterNodes, activeFreshness, centerNode.domain, mergedNodes, open]);

  useEffect(() => {
    if (!open || activeFreshness !== RECENT_FRESHNESS || !centerNode) {
      return;
    }

    if (isRecentAdded(centerNode.addedAt)) {
      return;
    }

    const nextCenter = activeCluster
      ? activeClusterNodes[0] ?? null
      : filteredNodePool.find((node) => node.domain === centerNode.domain) ?? filteredNodePool[0];
    if (!nextCenter) {
      return;
    }

    setCenterId(nextCenter.id);
    setSelectedId(null);
    setHistory([nextCenter.id]);
  }, [activeCluster, activeClusterNodes, activeFreshness, centerNode, filteredNodePool, open]);

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

    const targetNode = nodeMap.get(targetId);
    const targetCluster = clusters.find((cluster) => cluster.label === targetNode?.domain);
    if (targetCluster && targetCluster.id !== activeClusterId) {
      setActiveClusterId(targetCluster.id);
    }

    warpTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    warpTimeoutsRef.current = [];
    const ghostNode = projectedNodes.find((node) => node.id === targetId);
    if (ghostNode) {
      setWarpGhost(ghostNode);
      setWarpOrigin({
        x: `calc(${ghostNode.left}% + ${ghostNode.hudShiftX})`,
        y: `calc(${ghostNode.top}% + ${ghostNode.hudShiftY})`,
      });
      if (sceneRef.current) {
        const rect = sceneRef.current.getBoundingClientRect();
        setArrivalOrigin({
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
      }, 280)
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
            setWarpOrigin({ x: "50%", y: "50%" });
            setArrivalOrigin({ x: 0, y: 0, width: 0, height: 0 });
            warpTimeoutsRef.current = [];
          }, 520)
        );
      }, 560)
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

  async function persistMastery(nextMasteryMap) {
    try {
      const response = await fetch("/api/save-concept-mastery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mastery: nextMasteryMap,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "保存掌握程度失败");
      }
    } catch (error) {
      window.alert(error.message || "保存掌握程度失败，请稍后重试。");
    }
  }

  function updateMastery(nodeId, value) {
    setMasteryMap((current) => {
      const nextMasteryMap = {
        ...current,
        [nodeId]: current[nodeId] === value ? 0 : value,
      };

      void persistMastery(nextMasteryMap);
      return nextMasteryMap;
    });
  }

  async function copyConceptName(name) {
    if (!name || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(name);
    } catch {}
  }

  function selectTitleText(event) {
    if (typeof window === "undefined") {
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(event.currentTarget);
    selection.removeAllRanges();
    selection.addRange(range);
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
    if (
      event.target.closest(
        ".universe-node, .universe-hud, .universe-controls, .universe-search-panel, .universe-topbar, .universe-filter-row, .universe-category-panel, .universe-bottom-controls, input, textarea, select, button"
      )
    ) {
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

  function updateConceptDraft(field, value) {
    setConceptDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openConceptComposer() {
    window.clearTimeout(composerTimeoutRef.current);
    setIsAddConceptMounted(true);
    window.requestAnimationFrame(() => {
      setIsAddConceptOpen(true);
    });
    setConceptComposerMessage("");
  }

  function closeConceptComposer() {
    setIsAddConceptOpen(false);
    window.clearTimeout(composerTimeoutRef.current);
    composerTimeoutRef.current = window.setTimeout(() => {
      setIsAddConceptMounted(false);
    }, 240);
  }

  async function handleAddConceptSubmit(event) {
    event.preventDefault();

    if (!conceptDraft.name.trim()) {
      return;
    }

    setIsSubmittingConcept(true);
    setConceptComposerMessage("");

    try {
      const response = await fetch("/api/submit-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "concept",
          name: conceptDraft.name,
          desc: conceptDraft.desc,
          clusterId: conceptDraft.clusterId,
          importance: Number(conceptDraft.importance) || 1,
          syncCode: conceptDraft.syncCode.trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "追加概念失败");
      }

      const nextNode = payload.item;
      const nextConcepts = sanitizeCustomConcepts([nextNode, ...customConcepts.filter((item) => item.id !== nextNode.id)]);
      setCustomConcepts(nextConcepts);
      window.localStorage.setItem(CUSTOM_CONCEPTS_KEY, JSON.stringify(nextConcepts));
      setSelectedId(nextNode.id);
      setConceptComposerMessage(payload.mode === "remote" ? "已写入仓库" : "已追加到当前浏览器");
      setConceptDraft((current) =>
        createConceptDraft(current.clusterId || activeClusterId || (conceptUniverse.clusters[0]?.id ?? ""), current.syncCode)
      );
      closeConceptComposer();
    } catch (error) {
      window.alert(error.message || "追加概念失败，请稍后重试。");
    } finally {
      setIsSubmittingConcept(false);
    }
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
            <h2>概念宇宙</h2>
          </div>

          <div className="universe-top-actions">
            <button
              type="button"
              className={`universe-add-trigger ${isAddConceptOpen ? "is-active" : ""}`}
              onClick={() => {
                setIsAddConceptOpen((current) => !current);
                setConceptComposerMessage("");
              }}
            >
              追加概念
            </button>
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

        {isAddConceptMounted ? (
          <form
            className={`universe-composer-panel ${isAddConceptOpen ? "is-open" : ""}`}
            onSubmit={handleAddConceptSubmit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="universe-composer-head">
              <div>
                <span className="universe-composer-kicker">New concept</span>
                <strong>把一个刚想到的概念轻轻放进宇宙里</strong>
              </div>
              <button type="button" className="universe-composer-dismiss" onClick={closeConceptComposer}>
                收起
              </button>
            </div>

            <div className="universe-composer-strip">
              <label>
                <span>名称</span>
                <input
                  type="text"
                  value={conceptDraft.name}
                  onChange={(event) => updateConceptDraft("name", event.target.value)}
                  placeholder="例如 Tool Use"
                />
              </label>
              <label>
                <span>分类</span>
                <select value={conceptDraft.clusterId} onChange={(event) => updateConceptDraft("clusterId", event.target.value)}>
                  {clusters.map((cluster) => (
                    <option key={cluster.id} value={cluster.id}>
                      {cluster.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="universe-composer-wide">
              <span>一句话说明</span>
              <input
                type="text"
                value={conceptDraft.desc}
                onChange={(event) => updateConceptDraft("desc", event.target.value)}
                placeholder="先写下这个概念为何重要，之后再慢慢补关系。"
              />
              </label>

              <div className="universe-composer-foot">
              <label className="universe-composer-importance">
                <span>重要度</span>
                <select
                  className="universe-composer-select"
                  value={conceptDraft.importance}
                  onChange={(event) => updateConceptDraft("importance", event.target.value)}
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="password"
                value={conceptDraft.syncCode}
                onChange={(event) => updateConceptDraft("syncCode", event.target.value)}
                placeholder="同步码可选"
              />
              <button type="submit" className="universe-composer-submit" disabled={isSubmittingConcept}>
                {isSubmittingConcept ? "追加中..." : "收录概念"}
              </button>
              </div>
            </div>

            {conceptComposerMessage ? <p className="universe-composer-status">{conceptComposerMessage}</p> : null}
          </form>
        ) : null}

        {searchResults.length && !isAddConceptOpen ? (
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
            setIsClusterMenuOpen(false);
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
                    "--node-entry-z": node.entryDepth,
                    "--node-scale": node.scale,
                    "--node-arrival-delay": node.arrivalDelay,
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
            <span>总词条：{conceptUniverse.nodes.length}</span>
            <span>当前节点：{centerNode.name}</span>
          </div>

          <div className="universe-bottom-controls" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={`universe-add-trigger ${isAddConceptOpen ? "is-active" : ""}`}
              onClick={() => {
                if (isAddConceptOpen) {
                  closeConceptComposer();
                } else {
                  openConceptComposer();
                }
              }}
            >
              追加概念
            </button>
            <div className="universe-filter-row">
            <button
              type="button"
              className={`universe-filter-chip ${activeFreshness === ALL_FRESHNESS ? "active" : ""}`}
              onClick={() => setActiveFreshness(ALL_FRESHNESS)}
            >
              全部概念
            </button>
            <button
              type="button"
              className={`universe-filter-chip ${activeFreshness === RECENT_FRESHNESS ? "active" : ""}`}
              onClick={() => setActiveFreshness(RECENT_FRESHNESS)}
            >
              最近添加
              <span>{recentConceptCount}</span>
            </button>
          </div>
          </div>

          <div className="universe-category-panel" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={`universe-category-trigger ${isClusterMenuOpen ? "is-open" : ""}`}
              onClick={() => setIsClusterMenuOpen((current) => !current)}
              aria-expanded={isClusterMenuOpen}
            >
              <span>{"\u5f53\u524d\u7c7b\u522b"}</span>
              <strong>{`${activeCluster?.label ?? centerNode.domain} · ${activeClusterCount}`}</strong>
            </button>
            {isClusterMenuOpen ? (
              <div className="universe-category-menu">
                {clusters.map((cluster) => (
                  <button
                    key={cluster.id}
                    type="button"
                    className={cluster.id === activeClusterId ? "is-active" : ""}
                    onClick={() => {
                      setActiveFreshness(ALL_FRESHNESS);
                      setActiveClusterId(cluster.id);
                      setIsClusterMenuOpen(false);
                    }}
                  >
                    {cluster.label}
                  </button>
                ))}
              </div>
            ) : null}
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
                <div className="universe-hud-top-meta">
                  <div className="universe-hud-topline">
                    <span className="universe-hud-label">重要度</span>
                    <div className="universe-importance universe-importance-compact" aria-label={`重要度 ${selectedNode.importance} / 5`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span key={index} className={index < selectedNode.importance ? "filled" : ""}>
                          ●
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="universe-mastery">
                    <span className="universe-hud-label">掌握程度</span>
                    <div className="universe-mastery-dots" aria-label={`掌握程度 ${selectedMastery} / 5`}>
                      {Array.from({ length: 5 }).map((_, index) => {
                        const value = index + 1;
                        return (
                          <button
                            key={value}
                            type="button"
                            className={`universe-mastery-dot ${value <= selectedMastery ? "is-active" : ""}`}
                            aria-label={`掌握程度 ${value} / 5`}
                            title={`掌握程度 ${value} / 5`}
                            onClick={() => updateMastery(selectedNode.id, value)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
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
              <h3 onClick={() => copyConceptName(selectedNode.name)} onDoubleClick={selectTitleText} title={"点击复制，双击选中文字"}>
                {selectedNode.name}
              </h3>
              {getSecondaryLabel(selectedNode) ? <p className="universe-hud-alt">{getSecondaryLabel(selectedNode)}</p> : null}
              <div className="universe-hud-meta">
                <p className="universe-hud-domain">{selectedNode.domain}</p>
                {selectedNode.needsLinking ? <span className="universe-sync-flag">待网络化</span> : null}
              </div>
              <p className="universe-hud-summary">{selectedNode.summary}</p>
              <p className="universe-hud-detail">{selectedNode.detail}</p>
              <div className="universe-mastery universe-mastery-inline">
                <span className="universe-hud-label">{"\u638c\u63e1\u7a0b\u5ea6"}</span>
                <div className="universe-mastery-dots" aria-label={`\u638c\u63e1\u7a0b\u5ea6 ${selectedMastery} / 5`}>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`universe-mastery-dot ${value <= selectedMastery ? "is-active" : ""}`}
                        aria-label={`\u638c\u63e1\u7a0b\u5ea6 ${value} / 5`}
                        title={`\u638c\u63e1\u7a0b\u5ea6 ${value} / 5`}
                        onClick={() => updateMastery(selectedNode.id, value)}
                      />
                    );
                  })}
                </div>
              </div>
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
