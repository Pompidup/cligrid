type EasingFn = (t: number) => number;

const linear: EasingFn = (t) => t;

const easeIn: EasingFn = (t) => t * t;

const easeOut: EasingFn = (t) => t * (2 - t);

const easeInOut: EasingFn = (t) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

const bounce: EasingFn = (t) => {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    const t2 = t - 1.5 / 2.75;
    return 7.5625 * t2 * t2 + 0.75;
  } else if (t < 2.5 / 2.75) {
    const t2 = t - 2.25 / 2.75;
    return 7.5625 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  }
};

const elastic: EasingFn = (t) => {
  if (t === 0 || t === 1) return t;
  return -(2 ** (10 * (t - 1))) * Math.sin((t - 1.1) * 5 * Math.PI);
};

export type { EasingFn };
export { linear, easeIn, easeOut, easeInOut, bounce, elastic };
