import stringWidthFn from "string-width";

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

function stringWidth(text: string): number {
  return stringWidthFn(text);
}

function graphemeSplit(text: string): string[] {
  return [...segmenter.segment(text)].map((s) => s.segment);
}

function graphemeSliceByWidth(text: string, maxWidth: number): string {
  const graphemes = graphemeSplit(text);
  let width = 0;
  let result = "";
  for (const g of graphemes) {
    const w = stringWidth(g);
    if (width + w > maxWidth) break;
    result += g;
    width += w;
  }
  return result;
}

export { stringWidth, graphemeSplit, graphemeSliceByWidth };
