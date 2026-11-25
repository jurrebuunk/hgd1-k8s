// Deterministic geometry from buunk-auth/html/binary.js (seed 1729).
export function buildBinary() {
    let seed = 1729;
    const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const COLS = 112, ROWS = 64, CW = 14.4, CH = 18;
    const T = 46, ASC = 405, XH = 234, W = 218, G = 55, BASE = 652;
    const R = W / 2, RI = R - T, BR = 117, BRI = BR - T;
    const rect = (px, py, x0, x1, y0, y1) => px >= x0 && px <= x1 && py >= y0 && py <= y1;
    const ring = (px, py, cx, cy, ro, ri) => { const d = Math.hypot(px - cx, py - cy); return d <= ro && d >= ri; };
    const seg = (px, py, ax, ay, bx, by, w) => {
      const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
      return Math.hypot(px - (ax + t * vx), py - (ay + t * vy)) <= w / 2;
    };
    const glyphs = {
      b: (px, py, x) => rect(px, py, x, x + T, BASE - ASC, BASE) || (px >= x && ring(px, py, x + BR - 4, BASE - BR, BR, BRI)),
      u: (px, py, x) => rect(px, py, x, x + T, BASE - XH, BASE - R) || rect(px, py, x + W - T, x + W, BASE - XH, BASE) || (py >= BASE - R && ring(px, py, x + R, BASE - R, R, RI)),
      n: (px, py, x) => rect(px, py, x, x + T, BASE - XH, BASE) || rect(px, py, x + W - T, x + W, BASE - XH + R, BASE) || (py <= BASE - XH + R && ring(px, py, x + R, BASE - XH + R, R, RI)),
      k: (px, py, x) => rect(px, py, x, x + T, BASE - ASC, BASE) || seg(px, py, x + T, BASE - 120, x + 190, BASE - XH, T) || seg(px, py, x + T + 40, BASE - 150, x + 200, BASE, T)
    };
    const word = [['b', 230], ['u', W], ['u', W], ['n', W], ['k', 200]];
    let cursor = 67;
    const placed = word.map(([g, w]) => { const p = { g: glyphs[g], x: cursor }; cursor += w + G; return p; });
    const midY = BASE - ASC / 2;
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      const segs = [];
      let cur = null;
      for (let c = 0; c < COLS; c++) {
        const px = (c + 0.5) * CW, py = (r + 0.5) * CH;
        const on = placed.some((p) => p.g(px, py, p.x));
        const far = Math.abs(py - midY) / 520;
        const x = rand();
        let ch = rand() < 0.5 ? '0' : '1';
        let cls;
        if (on) cls = x < 0.06 ? 'bin-h' : 'bin-a';
        else if (x < Math.min(0.85, far * far * 0.9)) { ch = ' '; cls = 'bin-f'; }
        else if (x > 0.994) cls = 'bin-a';
        else cls = far < 0.6 && x > 0.8 ? 'bin-m' : 'bin-f';
        if (cur && cur.cls === cls) cur.text += ch;
        else { cur = { cls, text: ch }; segs.push(cur); }
      }
      rows.push({ segs });
    }
    return rows;
}
