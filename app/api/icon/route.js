import { NextResponse } from "next/server";

const COMMON_ICON_PATHS = [
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
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

function extractIconHref(html) {
  const linkMatches = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (linkMatches?.[1]) {
    return linkMatches[1];
  }

  const shortcutMatches = html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/i);
  return shortcutMatches?.[1] || null;
}

async function findOfficialIcon(targetUrl) {
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
