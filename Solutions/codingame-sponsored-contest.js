/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
/**
 * CodinGame Sponsored Contest - Pac-Man
 * link to it
 * https://www.codingame.com/ide/puzzle/codingame-sponsored-contest
 * Le jeu est un Pac-Man : on se déplace sur une grille, on visite des cases
 * et on évite les monstres (fantômes).
 * 
 * Entrées d'initialisation :
 *   - nCol : nombre de colonnes
 *   - nRow : nombre de lignes
 *   - nEntities : nombre d'entités (monstres + joueur)
 * 
 * Entrées par tour :
 *   - 4 caractères : gauche, bas, droite, haut ('_' = libre, '#' = mur)
 *   - nEntities - 1 paires : positions des monstres (row, col)
 *   - 1 dernière paire : position du joueur (row, col)
 * 
 * Actions : A=bas, B=rester, C=gauche, D=droite, E=haut
 * Score = cases visitées × 2
 * 
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */

const nCol = parseInt(readline());
const nRow = parseInt(readline());
const nEntities = parseInt(readline());
const nMonsters = nEntities - 1;

// Carte : -2 = inconnu, -1 = mur, 0 = libre
const map = [];
const visited = [];
for (let r = 0; r < nRow; r++) {
    map[r] = [];
    visited[r] = [];
    for (let c = 0; c < nCol; c++) {
        map[r][c] = -2;
        visited[r][c] = false;
    }
}

// Obtenir les voisins avec wrapping (le labyrinthe "wrappe" sur les bords)
function getNeighbours(row, col) {
    return {
        left: { r: row, c: col > 0 ? col - 1 : nCol - 1 },
        down: { r: row < nRow - 1 ? row + 1 : 0, c: col },
        right: { r: row, c: col < nCol - 1 ? col + 1 : 0 },
        up: { r: row > 0 ? row - 1 : nRow - 1, c: col }
    };
}

// BFS pour trouver la distance entre deux positions sur la carte
function bfs(startR, startC, map, monsterPositions) {
    const dist = [];
    for (let r = 0; r < nRow; r++) {
        dist[r] = [];
        for (let c = 0; c < nCol; c++) {
            dist[r][c] = -1;
        }
    }

    dist[startR][startC] = 0;
    const queue = [{ r: startR, c: startC }];
    let qi = 0;

    while (qi < queue.length) {
        const cur = queue[qi++];
        const nb = getNeighbours(cur.r, cur.c);
        const dirs = [nb.left, nb.down, nb.right, nb.up];

        for (const next of dirs) {
            if (map[next.r][next.c] === 0 && dist[next.r][next.c] === -1) {
                // Vérifier si un monstre bloque (on ne traverse pas les monstres)
                let blocked = false;
                for (const m of monsterPositions) {
                    if (m.r === next.r && m.c === next.c) {
                        blocked = true;
                        break;
                    }
                }
                if (!blocked) {
                    dist[next.r][next.c] = dist[cur.r][cur.c] + 1;
                    queue.push(next);
                }
            }
        }
    }

    return dist;
}

// Distance de Manhattan minimale vers un monstre
function minMonsterDist(r, c, monsterPositions) {
    let minD = Infinity;
    for (const m of monsterPositions) {
        // Distances avec wrapping
        const dr = Math.min(Math.abs(r - m.r), nRow - Math.abs(r - m.r));
        const dc = Math.min(Math.abs(c - m.c), nCol - Math.abs(c - m.c));
        const d = dr + dc;
        if (d < minD) minD = d;
    }
    return minD;
}

// Boucle de jeu
while (true) {
    const leftTile = readline();   // '_' ou '#'
    const downTile = readline();
    const rightTile = readline();
    const upTile = readline();

    const monsterPositions = [];
    for (let i = 0; i < nMonsters; i++) {
        const inputs = readline().split(' ');
        const mRow = parseInt(inputs[0]);
        const mCol = parseInt(inputs[1]);
        monsterPositions.push({ r: mRow, c: mCol });
        // Les monstres occupent des cases libres
        map[mRow][mCol] = 0;
    }

    // Dernière ligne = position du joueur
    const myInputs = readline().split(' ');
    const meRow = parseInt(myInputs[0]);
    const meCol = parseInt(myInputs[1]);

    // Mettre à jour la carte autour du joueur
    map[meRow][meCol] = 0;
    visited[meRow][meCol] = true;

    const nb = getNeighbours(meRow, meCol);
    map[nb.left.r][nb.left.c] = (leftTile === '_') ? 0 : -1;
    map[nb.down.r][nb.down.c] = (downTile === '_') ? 0 : -1;
    map[nb.right.r][nb.right.c] = (rightTile === '_') ? 0 : -1;
    map[nb.up.r][nb.up.c] = (upTile === '_') ? 0 : -1;

    // BFS depuis ma position pour trouver les distances
    const dist = bfs(meRow, meCol, map, monsterPositions);

    // BFS depuis chaque monstre pour connaître le danger
    const monsterDists = monsterPositions.map(m => bfs(m.r, m.c, map, []));

    // Évaluer les 4 directions + rester
    const directions = [
        { name: 'C', pos: nb.left },   // C = gauche
        { name: 'A', pos: nb.down },    // A = bas
        { name: 'D', pos: nb.right },   // D = droite
        { name: 'E', pos: nb.up },      // E = haut
    ];

    let bestAction = 'B';
    let bestScore = -Infinity;

    for (const dir of directions) {
        const { r, c } = dir.pos;

        // Vérifier si on peut y aller (case libre, pas un mur)
        if (map[r][c] !== 0) continue;

        // Vérifier si un monstre est sur cette case
        let isMonster = false;
        for (const m of monsterPositions) {
            if (m.r === r && m.c === c) {
                isMonster = true;
                break;
            }
        }
        if (isMonster) continue;

        // Distance minimale d'un monstre à cette case (via BFS)
        let minMDist = Infinity;
        for (const md of monsterDists) {
            if (md[r][c] >= 0 && md[r][c] < minMDist) {
                minMDist = md[r][c];
            }
        }

        // Si un monstre est trop proche (distance <= 1), on évite cette direction
        if (minMDist <= 1) continue;

        // Score : on préfère les cases non visitées et on s'éloigne des monstres
        let score = 0;

        // Bonus pour case non visitée
        if (!visited[r][c]) {
            score += 1000;
        }

        // Bonus pour éloignement des monstres
        score += minMDist * 10;

        // Bonus pour les cases non visitées accessibles depuis cette position
        // (exploration locale)
        const nbNext = getNeighbours(r, c);
        const nextDirs = [nbNext.left, nbNext.down, nbNext.right, nbNext.up];
        let unvisitedNearby = 0;
        for (const nd of nextDirs) {
            if (map[nd.r][nd.c] === 0 && !visited[nd.r][nd.c]) {
                unvisitedNearby++;
            }
            // Cases inconnues sont potentiellement non visitées
            if (map[nd.r][nd.c] === -2) {
                unvisitedNearby += 2;
            }
        }
        score += unvisitedNearby * 50;

        if (score > bestScore) {
            bestScore = score;
            bestAction = dir.name;
        }
    }

    // Si aucune direction sûre, essayer de rester ou fuir
    if (bestScore === -Infinity) {
        // Mode survie : aller vers la direction la plus sûre même si déjà visitée
        let safestDist = -1;
        for (const dir of directions) {
            const { r, c } = dir.pos;
            if (map[r][c] !== 0) continue;

            let isMonster = false;
            for (const m of monsterPositions) {
                if (m.r === r && m.c === c) {
                    isMonster = true;
                    break;
                }
            }
            if (isMonster) continue;

            let minMDist = Infinity;
            for (const md of monsterDists) {
                if (md[r][c] >= 0 && md[r][c] < minMDist) {
                    minMDist = md[r][c];
                }
            }

            if (minMDist > safestDist) {
                safestDist = minMDist;
                bestAction = dir.name;
            }
        }
    }

    console.log(bestAction);
}
