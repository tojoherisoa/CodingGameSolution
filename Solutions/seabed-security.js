/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
/**
 * Seabed Security — Ligue Bronze (Monstres & 2 Drones)
 * https://www.codingame.com/ide/puzzle/seabed-security
 *
 * Stratégie :
 * - Évitement des monstres (collision anticipée)
 * - Gestion du mode urgence
 * - 2 drones coordonnés (Partage de zone)
 * - Lumière tactique pour ne pas énerver les monstres
 *
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */

const parse = () => readline().split(' ').map(Number);
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Zones d'habitat par type de poisson
const HABITAT_Y = { 0: [2500, 5000], 1: [5000, 7500], 2: [7500, 10000] };

// --- Initialisation ---
const creatureCount = +readline();
const creatures = {};
for (let i = 0; i < creatureCount; i++) {
    const [id, color, type] = parse();
    creatures[id] = { color, type };
}

// --- Boucle de jeu ---
while (true) {
    const myScore = +readline();
    const foeScore = +readline();

    // Scans sauvegardés
    const mySaved = new Set();
    let n = +readline();
    while (n--) mySaved.add(+readline());

    const foeSaved = new Set();
    n = +readline();
    while (n--) foeSaved.add(+readline());

    // Mes drones
    const myDrones = [];
    n = +readline();
    for (let i = 0; i < n; i++) {
        const [id, x, y, emergency, battery] = parse();
        myDrones.push({ id, x, y, emergency, battery, index: i });
    }

    // Drones adverses
    const foeDrones = [];
    n = +readline();
    for (let i = 0; i < n; i++) {
        const [id, x, y, emergency, battery] = parse();
        foeDrones.push({ id, x, y, emergency, battery });
    }

    // Scans embarqués
    const droneScans = {};
    n = +readline();
    while (n--) {
        const [dId, cId] = parse();
        if (!droneScans[dId]) droneScans[dId] = new Set();
        droneScans[dId].add(cId);
    }

    // Créatures visibles (Poissons & Monstres)
    const visible = {};
    const monsters = [];
    n = +readline();
    while (n--) {
        const [id, x, y, vx, vy] = parse();
        const type = creatures[id]?.type ?? -1;
        if (type === -1) {
            monsters.push({ id, x, y, vx, vy });
        } else {
            visible[id] = { x, y, vx, vy };
        }
    }

    // Radar
    const radar = {};
    n = +readline();
    while (n--) {
        const [dId, cId, dir] = readline().split(' ');
        if (!radar[dId]) radar[dId] = {};
        radar[dId][+cId] = dir;
    }

    // --- Coordination & Décision ---
    const taken = new Set();

    for (const drone of myDrones) {
        if (drone.emergency) {
            console.log(`WAIT 0`); // Mode urgence : le drone remonte seul
            continue;
        }

        const dScans = droneScans[drone.id] || new Set();
        const dRadar = radar[drone.id] || {};

        // --- ÉVITEMENT DES MONSTRES ---
        // Chercher le monstre le plus dangereux (projection à t+1)
        let threat = null;
        let minThreatDist = Infinity;
        for (const m of monsters) {
            const nextDist = dist(drone.x, drone.y, m.x + m.vx, m.y + m.vy);
            if (nextDist < 800) { // Zone de danger critique
                if (nextDist < minThreatDist) {
                    minThreatDist = nextDist;
                    threat = m;
                }
            }
        }

        if (threat) {
            // Fuite : direction opposée au monstre
            const dx = drone.x - (threat.x + threat.vx);
            const dy = drone.y - (threat.y + threat.vy);
            const angle = Math.atan2(dy, dx);
            const tx = clamp(drone.x + Math.cos(angle) * 600, 0, 9999);
            const ty = clamp(drone.y + Math.sin(angle) * 600, 0, 9999);
            console.log(`MOVE ${Math.round(tx)} ${Math.round(ty)} 0`); // Pas de lumière en fuite
            continue;
        }

        // --- CIBLAGE POISSONS ---
        const needed = Object.keys(creatures).map(Number)
            .filter(id => creatures[id].type !== -1 && !mySaved.has(id) && !dScans.has(id));

        const totalToSave = dScans.size;
        // Remonter si nécessaire
        if (totalToSave > 0 && (needed.length === 0 || totalToSave >= 4 || drone.y < 2000)) {
            console.log(`MOVE ${drone.x} 400 ${drone.battery > 5 ? 0 : 0}`);
            continue;
        }

        let bestId = -1, bestScore = -Infinity, tx = 5000, ty = drone.y + 600;

        for (const id of needed) {
            if (taken.has(id)) continue;

            const { type } = creatures[id];
            const [yMin, yMax] = HABITAT_Y[type];
            let px, py;

            if (visible[id]) {
                px = visible[id].x + visible[id].vx;
                py = visible[id].y + visible[id].vy;
            } else {
                const dir = dRadar[id];
                if (!dir) continue;
                px = dir.includes('R') ? Math.min(9999, drone.x + 2000) : Math.max(0, drone.x - 2000);
                py = dir.includes('B') ? Math.min(yMax, drone.y + 2000) : Math.max(yMin, drone.y - 2000);
            }

            // Heuristique : Type + First Scan + Zone + Proximité
            let score = (type + 1) * 100;
            if (!foeSaved.has(id)) score += 500;
            if (drone.index === 0 && px < 5000) score += 1000;
            if (drone.index === 1 && px >= 5000) score += 1000;
            score -= dist(drone.x, drone.y, px, py) / 10;

            if (score > bestScore) {
                bestScore = score;
                bestId = id;
                tx = px;
                ty = py;
            }
        }

        if (bestId !== -1) {
            taken.add(bestId);
            // Lumière si pas de monstre proche
            let light = 0;
            const nearMonster = monsters.some(m => dist(drone.x, drone.y, m.x, m.y) < 2000);
            if (!nearMonster && drone.battery >= 5 && (dist(drone.x, drone.y, tx, ty) < 2200)) {
                light = 1;
            }
            console.log(`MOVE ${Math.round(clamp(tx, 0, 9999))} ${Math.round(clamp(ty, 0, 9999))} ${light}`);
        } else {
            const targetX = drone.index === 0 ? 2000 : 8000;
            console.log(`MOVE ${targetX} ${clamp(drone.y + 600, 0, 9500)} 0`);
        }
    }
}
