const puppeteer = require("puppeteer");
const path = require("path");

const pages = [
  { file: "small_promo.html", out: "small_promo.jpg", width: 440, height: 280, type: "jpeg" },
  { file: "marquee_promo.html", out: "marquee_promo.jpg", width: 1400, height: 560, type: "jpeg" },
  { file: "screenshot1.html", out: "screenshot1.jpg", width: 1280, height: 800, type: "jpeg" },
  { file: "screenshot2.html", out: "screenshot2.jpg", width: 1280, height: 800, type: "jpeg" },
  { file: "screenshot3.html", out: "screenshot3.jpg", width: 1280, height: 800, type: "jpeg" },
  { file: "icon128.html", out: "icon128.png", width: 256, height: 256, type: "png" },
];

(async () => {
  const browser = await puppeteer.launch();
  for (const p of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: p.width, height: p.height });
    await page.goto("file:///" + path.resolve(__dirname, p.file).replace(/\\/g, "/"));
    const opts = { path: path.join(__dirname, p.out), type: p.type || "jpeg" };
    if (opts.type === "jpeg") opts.quality = 95;
    await page.screenshot(opts);
    console.log("Created", p.out);
    await page.close();
  }
  await browser.close();
})();
