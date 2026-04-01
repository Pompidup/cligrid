/**
 * Demo 4: Castle on a Hill — ASCII Art Animation
 *
 * Showcases: full-screen createComponent, setInterval animation,
 * reactive state store, dynamic color changes (lightning effect).
 *
 * Run: pnpm demo:castle
 * Recommended terminal size: 80x24 minimum
 */

import { App, createComponent } from "../src/index.js";

const app = new App({ alternateScreen: true });

// ── Animation state ───────────────────────────────────────────────────
// phase: "night" | "flash1" | "flash2" | "afterglow"
app.setState({ phase: "night", tick: 0 });

// ── ASCII art frames ──────────────────────────────────────────────────

const skyNight = [
  "                          .        *              .        .              ",
  "      *           .                    .                         *       ",
  "            .              *                  .          *               ",
  "   .                              .                            .        ",
  "               *        .                  *        .                   ",
  "        .                     .                          .       *      ",
  "                    *                           .                       ",
];

const skyFlash1 = [
  "                          .    \\   *    /         .        .             ",
  "      *           .             \\ | /                          *        ",
  "            .              *   --===--         .          *              ",
  "   .                            / | \\                           .       ",
  "               *        .      /  *  \\     *        .                   ",
  "        .                     .       |         .            .    *     ",
  "                    *                 |    .                            ",
];

const skyFlash2 = [
  "                          .   \\\\   *   //        .        .             ",
  "      *           .            \\\\|  |//                        *        ",
  "            .              *  ===#==#===       .          *              ",
  "   .                           //|  |\\\\                         .       ",
  "               *        .     // *  * \\\\   *        .                   ",
  "        .                    /   |  |   \\        .            .    *    ",
  "                    *           /    \\         .                        ",
];

const skyAfterglow = [
  "                          .        *              .        .             ",
  "      *           .                     .                        *      ",
  "            .              *                  .          *               ",
  "   .                              |                            .        ",
  "               *        .         |        *        .                   ",
  "        .                     .   |  .                   .       *      ",
  "                    *             |              .                      ",
];

const landscape = [
  "                                 /\\",
  "                                /  \\",
  "                    ___        /    \\        ___",
  "                   |   |  __  / \\  / \\  __  |   |",
  "                   |   | |  || |  | | ||  | |   |",
  "                   |   | |  || |__| | ||  | |   |",
  "              _____|___|_|__||______|_||__|_|___|_____",
  "           __/                                        \\__",
  "        __/       .    .         .         .    .        \\__",
  "     __/    .          .    .        .          .    .      \\__",
  "  __/          .    .         .          .   .         .       \\__",
  " /   .    .          .    .       .           .    .        .    \\",
  "/________________________________________________________________________\\",
];

// ── Color schemes per phase ───────────────────────────────────────────
const colors: Record<string, { sky: string; land: string; castle: string; bg?: string }> = {
  night:     { sky: "blue",        land: "green",       castle: "white" },
  flash1:    { sky: "brightWhite", land: "brightGreen", castle: "brightWhite", bg: "blue" },
  flash2:    { sky: "brightWhite", land: "brightWhite", castle: "brightWhite", bg: "cyan" },
  afterglow: { sky: "cyan",        land: "green",       castle: "brightWhite" },
};

// ── Scene component ──────────────────────────────────────────────────
const scene = createComponent({
  id: "scene",
  position: { x: 0, y: 0 },
  width: "100%",
  height: 22,
  margin: 0,
  style: { padding: { left: 1 } },
  props: { phase: "night" as string },
  render: (props: { phase: string }) => {
    const phase = props.phase;
    const scheme = colors[phase] ?? colors["night"]!;

    let sky: string[];
    switch (phase) {
      case "flash1":    sky = skyFlash1; break;
      case "flash2":    sky = skyFlash2; break;
      case "afterglow": sky = skyAfterglow; break;
      default:          sky = skyNight;
    }

    const lines: { text: string; style?: any }[] = [];

    // Sky lines
    for (const line of sky) {
      lines.push({
        text: line,
        style: { fg: scheme.sky, bg: scheme.bg, bold: phase !== "night" },
      });
    }

    // Castle + hill lines
    for (const line of landscape) {
      lines.push({
        text: line,
        style: { fg: scheme.land, bold: phase === "flash2" },
      });
    }

    // Empty line + title
    lines.push({ text: "" });
    lines.push({
      text: phase === "night"
        ? "     A quiet night on the hill..."
        : "     *** CRACK! ***",
      style: {
        fg: phase === "night" ? "blue" : "brightYellow",
        bold: phase !== "night",
        dim: phase === "night",
      },
    });

    return lines;
  },
});

app.add(scene);
app.connect(scene, (state) => ({ phase: state.phase }));

// ── Footer ───────────────────────────────────────────────────────────
const footer = createComponent({
  id: "footer",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "scene" },
  },
  width: "100%",
  height: 1,
  margin: 0,
  props: {},
  render: () => ({
    text: "  Ctrl+C: quit  |  Watch the storm...",
    style: { dim: true },
  }),
});

app.add(footer);

// ── Animation loop ───────────────────────────────────────────────────
// Cycle: night (3-6s) -> flash1 (100ms) -> flash2 (80ms) -> afterglow (300ms) -> night
let nextLightning = randomDelay();
let phaseTimer: ReturnType<typeof setTimeout> | null = null;

function randomDelay(): number {
  return 3000 + Math.floor(Math.random() * 3000);
}

function triggerLightning() {
  // flash1
  app.setState({ phase: "flash1" });

  phaseTimer = setTimeout(() => {
    // flash2
    app.setState({ phase: "flash2" });

    phaseTimer = setTimeout(() => {
      // afterglow
      app.setState({ phase: "afterglow" });

      phaseTimer = setTimeout(() => {
        // back to night
        app.setState({ phase: "night" });

        // Schedule next lightning
        nextLightning = randomDelay();
        phaseTimer = setTimeout(triggerLightning, nextLightning);
      }, 300);
    }, 80);
  }, 100);
}

// Start first lightning after initial delay
phaseTimer = setTimeout(triggerLightning, nextLightning);

// ── Cleanup ──────────────────────────────────────────────────────────
app.onKey("ctrl+c", () => {
  if (phaseTimer) clearTimeout(phaseTimer);
  app.stop();
  process.exit(0);
});

app.start();
