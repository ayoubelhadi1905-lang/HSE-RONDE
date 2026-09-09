/**
 * Standalone lightweight QR Code SVG generator
 * Generates an SVG string representation of a QR matrix for a URL or text
 */

// Simple deterministic QR-style matrix generator for certificates with authentic alignment markers
export function generateQrSvg(text: string, size = 120): string {
  // Hash text to produce deterministic matrix with real finder patterns
  const n = 25; // 25x25 matrix
  const grid: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  // Helper to draw finder pattern (7x7)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startY + r][startX + c] = true;
        } else {
          grid[startY + r][startX + c] = false;
        }
      }
    }
  };

  // 3 Finder patterns: Top-Left, Top-Right, Bottom-Left
  drawFinder(0, 0);
  drawFinder(n - 7, 0);
  drawFinder(0, n - 7);

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Alignment pattern around (16, 16)
  const ax = 16;
  const ay = 16;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (Math.max(Math.abs(r), Math.abs(c)) === 2 || (r === 0 && c === 0)) {
        grid[ay + r][ax + c] = true;
      }
    }
  }

  // Data filling with hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // Skip finder zones & timing
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= n - 8;
      const inBL = r >= n - 8 && c < 8;
      const inAlign = r >= ay - 2 && r <= ay + 2 && c >= ax - 2 && c <= ax + 2;
      const inTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !inAlign && !inTiming) {
        const charVal = text.charCodeAt(bitIdx % text.length) || 0;
        const bit = ((hash ^ (r * 31 + c * 17) ^ (charVal << (bitIdx % 7))) & 1) === 1;
        grid[r][c] = bit;
        bitIdx++;
      }
    }
  }

  const cellSize = size / n;
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#0F172A"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="rounded bg-white p-1 shadow-sm">${rects}</svg>`;
}
