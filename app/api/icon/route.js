import { NextResponse } from "next/server";

const COMMON_ICON_PATHS = [
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/favicon.ico",
];

const REQUEST_HEADERS = {
  "user-agent": "Mozilla/5.0 (compatible; Ai123Bot/1.0; +https://iliudar.com)",
  accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8,text/html;q=0.7",
};

function isUsableImage(response) {
  if (!response.ok) {
    return false;
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.startsWith("image/");
}

async function fetchIconBinary(iconUrl) {
  const response = await fetch(iconUrl, {
    headers: REQUEST_HEADERS,
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!isUsableImage(response)) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "image/x-icon";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType };
}

function scoreIconCandidate(href, rel, sizes) {
  let score = 0;
  const normalizedHref = href.toLowerCase();
  const normalizedRel = rel.toLowerCase();
  const normalizedSizes = (sizes || "").toLowerCase();

  if (normalizedRel.includes("apple-touch-icon")) {
    score += 400;
  } else if (normalizedRel.includes("icon")) {
    score += 200;
  }

  if (normalizedHref.endsWith(".svg")) {
    score += 300;
  } else if (normalizedHref.endsWith(".png")) {
    score += 220;
  } else if (normalizedHref.endsWith(".ico")) {
    score += 60;
  }

  const sizeMatches = normalizedSizes.match(/(\d+)x(\d+)/);
  if (sizeMatches) {
    score += Math.min(Number(sizeMatches[1]), 512);
  }

  if (normalizedHref.includes("mask-icon")) {
    score -= 100;
  }

  return score;
}

function extractIconHref(html) {
  const matches = [...html.matchAll(/<link\b[^>]*>/gi)];
  const candidates = [];

  for (const match of matches) {
    const tag = match[0];
    const relMatch = tag.match(/\brel=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);

    if (!relMatch?.[1] || !hrefMatch?.[1]) {
      continue;
    }

    const rel = relMatch[1];
    if (!rel.toLowerCase().includes("icon")) {
      continue;
    }

    const sizesMatch = tag.match(/\bsizes=["']([^"']+)["']/i);
    candidates.push({
      href: hrefMatch[1],
      rel,
      sizes: sizesMatch?.[1] || "",
      score: scoreIconCandidate(hrefMatch[1], rel, sizesMatch?.[1] || ""),
    });
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0]?.href || null;
}

async function findOfficialIcon(targetUrl) {
  const directIcon = await fetchIconBinary(targetUrl.toString());
  if (directIcon) {
    return directIcon;
  }

  for (const path of COMMON_ICON_PATHS) {
    const icon = await fetchIconBinary(`${targetUrl.origin}${path}`);
    if (icon) {
      return icon;
    }
  }

  const pageResponse = await fetch(targetUrl.origin, {
    headers: REQUEST_HEADERS,
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!pageResponse.ok) {
    return null;
  }

  const html = await pageResponse.text();
  const href = extractIconHref(html);

  if (!href) {
    return null;
  }

  const resolvedUrl = new URL(href, targetUrl.origin).toString();
  return fetchIconBinary(resolvedUrl);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sourceUrl = searchParams.get("url");

  if (!sourceUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
  }

  try {
    const icon = await findOfficialIcon(targetUrl);

    if (!icon) {
      return NextResponse.json({ error: "Icon not found" }, { status: 404 });
    }

    return new NextResponse(icon.buffer, {
      status: 200,
      headers: {
        "content-type": icon.contentType,
        "cache-control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to fetch icon" }, { status: 502 });
  }
}
