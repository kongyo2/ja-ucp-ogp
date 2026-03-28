#!/usr/bin/env node
import React from "react";
import { render as inkRender } from "ink";
import { Command } from "commander";
import { renderFilled } from "oh-my-logo";
import { generateOGP } from "./generator.js";
import { sanitize, WIKI_BASE_URL } from "./utils.js";
import App from "./app.js";

const program = new Command();

program
  .name("ja-ucp-ogp")
  .description("アンサイクロペディア OGP画像ジェネレーター")
  .version("1.0.0")
  .option("-t, --title <title>", "記事タイトル")
  .option("-d, --description <desc>", "概要文")
  .option("-i, --image <path>", "画像パス（省略可）")
  .option("-o, --output <path>", "出力先パス")
  .option("-f, --font <path>", "カスタムフォントファイルパス")
  .action(async (opts) => {
    const { title, description, image, output, font } = opts as {
      title?: string;
      description?: string;
      image?: string;
      output?: string;
      font?: string;
    };

    if (title && description) {
      const outputPath = output || `output/${sanitize(title)}.png`;
      try {
        const path = await generateOGP({
          title,
          description,
          imagePath: image,
          outputPath,
          fontPath: font,
        });
        console.log(`✅ 生成完了: ${path}`);
        console.log(`   URL表示: ${WIKI_BASE_URL}${title}`);
      } catch (err) {
        console.error(`❌ エラー: ${(err as Error).message}`);
        process.exit(1);
      }
      return;
    }

    await renderFilled("JA-UCP-OGP", {
      palette: ["#8b6914", "#a08530", "#c9a84c", "#d4b886", "#c9a84c", "#a08530", "#8b6914"],
    });
    console.log("  アンサイクロペディア OGP画像ジェネレーター\n");

    const instance = inkRender(React.createElement(App, { fontPath: font }));
    await instance.waitUntilExit();
  });

program.parse();
