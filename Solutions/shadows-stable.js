/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
/**
 * Shadows of the Knight - Episode 2
 * https://www.codingame.com/ide/puzzle/shadows-of-the-knight-episode-2
 *
 * Algorithme :
 * 1. Maintien d'un polygone convexe 2D clippé par demi-plans.
 * 2. Midgame : Saut au centroïde + Overshoot (Alpha = 0.40).
 * 3. Endgame : Moyenne exacte des Entiers non-visités Valides.
 * 4. Prévention Boucles : Set(Visited).
 *
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */

const parse = () => readline().split(' ').map(Number);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const [W, H] = parse();
const N = +readline();
let [cx, cy] = parse();

const centroid = (poly) => {
    let A = 0, Cx = 0, Cy = 0;
    const n = poly.length;
    for (let i = 0; i < n; i++) {
        const [x1, y1] = poly[i];
        const [x2, y2] = poly[(i + 1) % n];
        const cross = x1 * y2 - x2 * y1;
        A += cross;
        Cx += (x1 + x2) * cross;
        Cy += (y1 + y2) * cross;
    }
    A /= 2;
    if (Math.abs(A) < 1e-9) {
        let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
        for (const [x, y] of poly) {
            if (x < xMin) xMin = x; if (x > xMax) xMax = x;
            if (y < yMin) yMin = y; if (y > yMax) yMax = y;
        }
        return [(xMin + xMax) / 2, (yMin + yMax) / 2];
    }
    return [Cx / (6 * A), Cy / (6 * A)];
};

const clipPoly = (poly, a, b, c) => {
    const out = [];
    const n = poly.length;
    if (n === 0) return out;
    for (let i = 0; i < n; i++) {
        const [x1, y1] = poly[i];
        const [x2, y2] = poly[(i + 1) % n];
        const d1 = a * x1 + b * y1 - c;
        const d2 = a * x2 + b * y2 - c;
        if (d1 <= 0) out.push([x1, y1]);
        if ((d1 < 0 && d2 > 0) || (d1 > 0 && d2 < 0)) {
            const t = d1 / (d1 - d2);
            out.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]);
        }
    }
    return out;
};

const bbox = (poly) => {
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const [x, y] of poly) {
        if (x < xMin) xMin = x; if (x > xMax) xMax = x;
        if (y < yMin) yMin = y; if (y > yMax) yMax = y;
    }
    return { xMin, xMax, yMin, yMax };
};

let poly = [[0, 0], [W - 1, 0], [W - 1, H - 1], [0, H - 1]];
let prevX = cx, prevY = cy;
const ALPHA = 0.40; // Le sweet spot pour Step 8 (10000x10000) sans briser T07

const visited = new Set();
visited.add(cx + "," + cy);
const cuts = []; // Stockage des demi-plans pour la Discrete Phase

while (true) {
    const feedback = readline();

    if (feedback !== 'UNKNOWN') {
        const dx = prevX - cx, dy = prevY - cy;
        const a = 2 * dx, b = 2 * dy;
        const c0 = prevX * prevX - cx * cx + prevY * prevY - cy * cy;

        if (feedback === 'WARMER') {
            poly = clipPoly(poly, a, b, c0);
            cuts.push((px, py) => a * px + b * py <= c0 + 1e-9);
        } else if (feedback === 'COLDER') {
            poly = clipPoly(poly, -a, -b, -c0);
            cuts.push((px, py) => -a * px - b * py <= -c0 + 1e-9);
        } else { // SAME
            poly = clipPoly(poly, a, b, c0 + 0.5);
            poly = clipPoly(poly, -a, -b, -c0 + 0.5);
            cuts.push((px, py) => a * px + b * py <= c0 + 0.5 + 1e-9);
            cuts.push((px, py) => -a * px - b * py <= -c0 + 0.5 + 1e-9);
        }
    }

    if (poly.length === 0) poly = [[cx, cy]];

    const bb = bbox(poly);
    const area = (bb.xMax - bb.xMin) * (bb.yMax - bb.yMin);
    let nx, ny;

    // Phase 2 : DISCRETE ENDGAME
    // Si la zone est assez petite (< 10000 pixels restants),
    // on calcule la moyenne exacte des points entiers mathématiquement valides ET non-visités
    if (area < 10000) {
        let sumX = 0, sumY = 0, count = 0;
        let lastValidX = -1, lastValidY = -1;
        const xLo = Math.max(0, Math.floor(bb.xMin));
        const xHi = Math.min(W - 1, Math.ceil(bb.xMax));
        const yLo = Math.max(0, Math.floor(bb.yMin));
        const yHi = Math.min(H - 1, Math.ceil(bb.yMax));

        for (let ix = xLo; ix <= xHi; ix++) {
            for (let iy = yLo; iy <= yHi; iy++) {
                if (visited.has(ix + "," + iy)) continue;

                let valid = true;
                for (const cut of cuts) {
                    if (!cut(ix, iy)) { valid = false; break; }
                }
                if (valid) {
                    sumX += ix; sumY += iy; count++;
                    lastValidX = ix; lastValidY = iy;
                }
            }
        }

        if (count > 0) {
            nx = Math.round(sumX / count);
            ny = Math.round(sumY / count);
            // Empêche un arrondi qui tomberait sur une case invalide (très rare)
            if (visited.has(nx + "," + ny) && count === 2) {
                nx = lastValidX; ny = lastValidY;
            }
        } else {
            // Sécurité ultime anti-crash
            const [gx, gy] = centroid(poly);
            nx = clamp(Math.round(gx), 0, W - 1);
            ny = clamp(Math.round(gy), 0, H - 1);
        }
    } else {
        // Phase 1 : CONTINUOUS MIDGAME avec Overshoot
        const [gx, gy] = centroid(poly);
        const ox = gx + ALPHA * (gx - cx);
        const oy = gy + ALPHA * (gy - cy);
        nx = clamp(Math.round(ox), 0, W - 1);
        ny = clamp(Math.round(oy), 0, H - 1);
    }

    // Sécurité globale : S'assurer que le point n'est JAMAIS visité
    if (visited.has(nx + "," + ny)) {
        const [gx, gy] = centroid(poly);
        let bestD = Infinity;
        let found = false;
        let pad = 1;

        while (!found && pad < 50) {
            const xLo = Math.max(0, Math.floor(bb.xMin) - pad);
            const xHi = Math.min(W - 1, Math.ceil(bb.xMax) + pad);
            const yLo = Math.max(0, Math.floor(bb.yMin) - pad);
            const yHi = Math.min(H - 1, Math.ceil(bb.yMax) + pad);

            for (let ix = xLo; ix <= xHi; ix++) {
                for (let iy = yLo; iy <= yHi; iy++) {
                    if (visited.has(ix + "," + iy)) continue;
                    const d = Math.hypot(ix - gx, iy - gy);
                    if (d < bestD) { bestD = d; nx = ix; ny = iy; found = true; }
                }
            }
            pad *= 2;
        }
    }

    prevX = cx; prevY = cy;
    cx = nx; cy = ny;
    visited.add(cx + "," + cy);

    console.log(`${cx} ${cy}`);
}
