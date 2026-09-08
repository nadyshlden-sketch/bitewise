import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const iconDir = "public/icons";
const svgSource = readFileSync("public/logo-bitewise.svg", "utf8");
const svgWithBackground = svgSource.replace(
  /<svg([^>]*)>/,
  '<svg$1><rect width="1024" height="1024" fill="#ffffff"/>',
);

const icons = [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];

mkdirSync(iconDir, { recursive: true });

for (const [fileName, size] of icons) {
  const renderer = new Resvg(svgWithBackground, {
    fitTo: {
      mode: "width",
      value: size,
    },
    background: "#ffffff",
  });

  writeFileSync(join(iconDir, fileName), renderer.render().asPng());
}
