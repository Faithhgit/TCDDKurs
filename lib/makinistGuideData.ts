import fs from "node:fs";
import path from "node:path";

export type MakinistGuideSection = {
  title: string;
  items: string[];
  warning?: string[];
};

export type MakinistGuideEntry = {
  slug: string;
  category: "lokomotif" | "yardimci";
  title: string;
  subtitle: string;
  summary: string;
  image: string;
  sections: MakinistGuideSection[];
};

type SourceDefinition = {
  slug: string;
  category: "lokomotif" | "yardimci";
  title: string;
  file: string;
  image: string;
};

const SOURCE_DEFINITIONS: SourceDefinition[] = [
  { slug: "jen", category: "yardimci", title: "Jeneratör Vagonları", file: "jen.html", image: "/makinist/jen.png" },
  { slug: "kaza", category: "yardimci", title: "Kazalar ve Olaylar", file: "kaza.html", image: "/makinist/kaza.png" },
  { slug: "dh7000", category: "lokomotif", title: "DH 7000", file: "dh7000.html", image: "/makinist/dh7000.png" },
  { slug: "dh9500", category: "lokomotif", title: "DH 9500", file: "dh9500.html", image: "/makinist/dh9500.png" },
  { slug: "de11000", category: "lokomotif", title: "DE 11000", file: "de11000.html", image: "/makinist/de11000.png" },
  { slug: "de13400", category: "lokomotif", title: "DE 13400", file: "de13400.html", image: "/makinist/de13400.png" },
  { slug: "de22000", category: "lokomotif", title: "DE 22000", file: "de22000.html", image: "/makinist/de22000.png" },
  { slug: "de24000", category: "lokomotif", title: "DE 24000", file: "de24000.html", image: "/makinist/de24000.png" },
  { slug: "de33000", category: "lokomotif", title: "DE 33000", file: "de33000.html", image: "/makinist/de33000.png" },
  { slug: "de36000", category: "lokomotif", title: "DE 36000", file: "de36000.html", image: "/makinist/de36000.png" },
  { slug: "e43000", category: "lokomotif", title: "E 43000", file: "e43000.html", image: "/makinist/e43000.png" },
  { slug: "e68000", category: "lokomotif", title: "E 68000", file: "e68000.html", image: "/makinist/e68000.png" },
  { slug: "e23000", category: "lokomotif", title: "E 23000", file: "e23000.html", image: "/makinist/e23000.png" },
  {
    slug: "e32000-e64000",
    category: "lokomotif",
    title: "E 32000 / E 64000",
    file: "marmaray.html",
    image: "/makinist/e32000.png",
  },
];

const assetsDir = path.join(process.cwd(), "Makinist V01", "assets");

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value: string) {
  return decodeEntities(
    value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/\u00a0/g, " ")
  );
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanLine(value: string) {
  return value
    .replace(/^[•✦\-\s]+/, "")
    .replace(/^\d+[.)-]?\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLines(value: string) {
  return stripTags(value)
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)
    .filter((line) => line.toLowerCase() !== "xxx" && line.toLowerCase() !== "x");
}

function parseHtmlEntry(source: SourceDefinition): MakinistGuideEntry {
  const html = fs.readFileSync(path.join(assetsDir, source.file), "utf8");

  const pageTitle =
    cleanText((html.match(/<h2 class="pageTitle">([\s\S]*?)<\/h2>/i)?.[1] ?? "").replace(/<[^>]+>/g, " ")) ||
    source.title;

  const summaryMatch = html.slice(html.indexOf("</h2>")).match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const summary = cleanText(stripTags(summaryMatch?.[1] ?? "")) || `${source.title} için içerik başlıkları.`;

  const sections: MakinistGuideSection[] = [];
  const blockMatches = html.matchAll(
    /accordionItemWrapper[\s\S]*?accordionButtonTitle">([\s\S]*?)<\/span>[\s\S]*?<div class="accordionContent">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi
  );

  for (const match of blockMatches) {
    const rawTitle = cleanText(stripTags(match[1] ?? ""));
    const rawContent = match[2] ?? "";
    const warningMatches = [...rawContent.matchAll(/color:\s*red[^>]*>([\s\S]*?)<\/span>/gi)];
    const warning = warningMatches.flatMap((warningMatch) => splitLines(warningMatch[1] ?? ""));
    const contentWithoutWarnings = rawContent
      .replace(/<i>[\s\S]*?color:\s*red[\s\S]*?<\/i>/gi, " ")
      .replace(/<span[^>]*color:\s*red[^>]*>[\s\S]*?<\/span>/gi, " ");
    const items = splitLines(contentWithoutWarnings);

    if (!rawTitle || items.length === 0) {
      continue;
    }

    sections.push({
      title: rawTitle.replace(/;$/, ""),
      items,
      warning: warning.length ? warning : undefined,
    });
  }

  return {
    slug: source.slug,
    category: source.category,
    title: source.title,
    subtitle: pageTitle,
    summary,
    image: source.image,
    sections,
  };
}

export function getMakinistGuideEntries() {
  return SOURCE_DEFINITIONS.map(parseHtmlEntry);
}
