type Theme = Record<string, string>;

const darkTheme: Theme = {
  primary: "#5B9BD5",
  secondary: "#8E8E93",
  danger: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",
  surface: "#1C1C1E",
  text: "#FFFFFF",
  border: "#3A3A3C",
  muted: "#8E8E93",
  accent: "#AF52DE",
};

const lightTheme: Theme = {
  primary: "#007AFF",
  secondary: "#8E8E93",
  danger: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",
  surface: "#F2F2F7",
  text: "#000000",
  border: "#C6C6C8",
  muted: "#8E8E93",
  accent: "#AF52DE",
};

function resolveThemeColor(color: string | undefined, theme: Theme | null): string | undefined {
  if (!color) return undefined;
  if (!theme) return color;
  // If the color is a theme token, resolve it
  return theme[color] ?? color;
}

export type { Theme };
export { darkTheme, lightTheme, resolveThemeColor };
