import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { WIKI_BASE_URL } from "./utils.js";

const W = 1200;
const H = 630;

const palette = {
  bg: "#08080a",
  accent: "#c9a84c",
  accentLine: "rgba(201, 168, 76, 0.35)",
  title: "#f0f2f5",
  desc: "#8b95a5",
  url: "#a0aab8",
  panelFill: "rgba(255, 255, 255, 0.035)",
  panelBorder: "rgba(255, 255, 255, 0.12)",
  panelBorderSoft: "rgba(255, 255, 255, 0.04)",
  shadow: "rgba(0, 0, 0, 0.6)",
  pillBg: "rgba(0, 0, 0, 0.5)",
  pillBorder: "rgba(255, 255, 255, 0.1)",
  imgBorder: "rgba(255, 255, 255, 0.15)",
} as const;

interface OGPOptions {
  title: string;
  description: string;
  imagePath?: string;
  outputPath: string;
  fontPath?: string;
}

type Ctx = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

function setupFonts(customFontPath?: string): string {
  if (customFontPath && existsSync(customFontPath)) {
    GlobalFonts.registerFromPath(resolve(customFontPath), "CustomFont");
    return "CustomFont";
  }

  const candidates: { path: string; bold?: string; name: string }[] = [
    {
      path: "C:\\Windows\\Fonts\\meiryo.ttc",
      bold: "C:\\Windows\\Fonts\\meiryob.ttc",
      name: "Meiryo",
    },
    {
      path: "C:\\Windows\\Fonts\\YuGothM.ttc",
      bold: "C:\\Windows\\Fonts\\YuGothB.ttc",
      name: "Yu Gothic",
    },
    {
      path: "C:\\Windows\\Fonts\\msgothic.ttc",
      name: "MS Gothic",
    },
  ];

  for (const { path, bold, name } of candidates) {
    if (existsSync(path)) {
      GlobalFonts.registerFromPath(resolve(path), name);
      if (bold && existsSync(bold)) {
        GlobalFonts.registerFromPath(resolve(bold), name);
      }
      return name;
    }
  }

  return "sans-serif";
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number,
  maxLines: number,
): number {
  let line = "";
  let count = 0;
  let cy = y;

  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line !== "") {
      if (count + 1 >= maxLines) {
        ctx.fillText(line + "\u2026", x, cy);
        return cy;
      }
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lh;
      count++;
    } else {
      line = test;
    }
  }

  ctx.fillText(line, x, cy);
  return cy;
}

function drawBackground(ctx: Ctx) {
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  const orb = (cx: number, cy: number, r: number, c: string) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, c);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  };

  orb(W * 0.15, H * 0.15, 480, "rgba(180, 145, 60, 0.15)");
  orb(W * 0.85, H * 0.85, 550, "rgba(60, 80, 110, 0.13)");
  orb(W * 0.55, H * 0.45, 350, "rgba(255, 255, 255, 0.02)");

  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "rgba(201, 168, 76, 0)");
  g.addColorStop(0.25, "rgba(201, 168, 76, 0.7)");
  g.addColorStop(0.75, "rgba(201, 168, 76, 0.7)");
  g.addColorStop(1, "rgba(201, 168, 76, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 3);
}

function drawPanel(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const r = 28;

  ctx.save();
  ctx.shadowColor = palette.shadow;
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = palette.panelFill;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = palette.panelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = palette.panelBorderSoft;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  const barG = ctx.createLinearGradient(x, y + 40, x, y + h - 40);
  barG.addColorStop(0, "rgba(201, 168, 76, 0)");
  barG.addColorStop(0.2, "rgba(201, 168, 76, 0.55)");
  barG.addColorStop(0.8, "rgba(201, 168, 76, 0.55)");
  barG.addColorStop(1, "rgba(201, 168, 76, 0)");
  ctx.fillStyle = barG;
  ctx.fillRect(x + 1, y + 40, 3, h - 80);
  ctx.restore();
}

function drawSiteHeader(ctx: Ctx, x: number, y: number, font: string) {
  const label = "\u30A2\u30F3\u30B5\u30A4\u30AF\u30ED\u30DA\u30C7\u30A3\u30A2";
  ctx.font = `bold 21px "${font}"`;
  ctx.fillStyle = palette.accent;
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);

  const lw = ctx.measureText(label).width;
  ctx.strokeStyle = palette.accentLine;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 12);
  ctx.lineTo(x + lw, y + 12);
  ctx.stroke();
}

function drawUrlPill(
  ctx: Ctx,
  articleTitle: string,
  anchorX: number,
  y: number,
  maxW: number,
  font: string,
  align: "left" | "right",
) {
  ctx.font = `bold 15px "${font}"`;

  let display = WIKI_BASE_URL + articleTitle;
  const pad = 32;

  if (ctx.measureText(display).width > maxW - pad) {
    while (
      display.length > WIKI_BASE_URL.length + 1 &&
      ctx.measureText(display + "\u2026").width > maxW - pad
    ) {
      display = display.slice(0, -1);
    }
    display += "\u2026";
  }

  const tw = ctx.measureText(display).width;
  const pw = tw + pad;
  const ph = 32;
  const px = align === "right" ? anchorX - pw : anchorX;

  roundRect(ctx, px, y, pw, ph, 16);
  ctx.fillStyle = palette.pillBg;
  ctx.fill();
  ctx.strokeStyle = palette.pillBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = palette.url;
  ctx.textAlign = "center";
  ctx.fillText(display, px + pw / 2, y + 21);
}

async function drawWithImage(ctx: Ctx, opts: OGPOptions, font: string) {
  drawBackground(ctx);

  const m = 40;
  const pw = W - m * 2;
  const ph = H - m * 2;
  const px = m;
  const py = m;

  drawPanel(ctx, px, py, pw, ph);

  const imgPad = 28;
  const imgSize = ph - imgPad * 2;
  const imgX = px + pw - imgSize - imgPad;
  const imgY = py + imgPad;

  const image = await loadImage(resolve(opts.imagePath!));

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  roundRect(ctx, imgX, imgY, imgSize, imgSize, 20);
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, imgX, imgY, imgSize, imgSize, 20);
  ctx.clip();
  const aspect = image.width / image.height;
  let sx = 0,
    sy = 0,
    sw = image.width,
    sh = image.height;
  if (aspect > 1) {
    sw = sh;
    sx = (image.width - sw) / 2;
  } else {
    sh = sw;
    sy = (image.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, imgX, imgY, imgSize, imgSize);
  ctx.restore();

  ctx.save();
  roundRect(ctx, imgX, imgY, imgSize, imgSize, 20);
  ctx.strokeStyle = palette.imgBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const tx = px + 48;
  const tw = imgX - tx - 36;

  drawSiteHeader(ctx, tx, py + 66, font);

  ctx.font = `bold 44px "${font}"`;
  ctx.fillStyle = palette.title;
  ctx.textAlign = "left";
  const titleEnd = wrapText(ctx, opts.title, tx, py + 148, tw, 60, 3);

  ctx.font = `26px "${font}"`;
  ctx.fillStyle = palette.desc;
  wrapText(ctx, opts.description, tx, titleEnd + 36, tw, 38, 4);

  drawUrlPill(ctx, opts.title, tx, py + ph - 58, tw, font, "left");
}

function drawWithoutImage(ctx: Ctx, opts: OGPOptions, font: string) {
  drawBackground(ctx);

  const m = 52;
  const pw = W - m * 2;
  const ph = H - m * 2;
  const px = m;
  const py = m;

  drawPanel(ctx, px, py, pw, ph);

  drawSiteHeader(ctx, px + 56, py + 66, font);

  ctx.font = `bold 52px "${font}"`;
  ctx.fillStyle = palette.title;
  ctx.textAlign = "left";
  const titleEnd = wrapText(ctx, opts.title, px + 56, py + 170, pw - 112, 70, 3);

  ctx.font = `28px "${font}"`;
  ctx.fillStyle = palette.desc;
  wrapText(ctx, opts.description, px + 56, Math.max(titleEnd + 52, py + 290), pw - 112, 44, 3);

  drawUrlPill(ctx, opts.title, px + pw - 40, py + ph - 58, pw * 0.55, font, "right");
}

export async function generateOGP(options: OGPOptions): Promise<string> {
  const font = setupFonts(options.fontPath);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  if (options.imagePath) {
    await drawWithImage(ctx, options, font);
  } else {
    drawWithoutImage(ctx, options, font);
  }

  const outPath = resolve(options.outputPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, canvas.toBuffer("image/png"));

  return outPath;
}
