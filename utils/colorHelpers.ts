/** Parse #RGB / #RRGGBB to rgba() — for dynamic accent tints in inline styles. */
export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace(/^#/, '').trim();
  let r: number;
  let g: number;
  let b: number;

  if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  } else {
    return `rgba(255, 79, 49, ${alpha})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
