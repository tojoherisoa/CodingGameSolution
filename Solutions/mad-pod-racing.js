/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
/**
 * Mad Pod Racing — Silver League
 * https://www.codingame.com/ide/puzzle/mad-pod-racing
 *
 * Stratégie avancée : compensation d'inertie, drift-through checkpoints,
 * boost optimal sur la plus longue ligne droite, thrust progressif.
 *
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */

// --- Constantes physiques du jeu ---
const FRICTION = 0.85;
const CP_RADIUS = 600;    // Rayon des checkpoints
const POD_RADIUS = 400;   // Rayon du pod (collision)
const MAX_TURN = 18;      // Rotation max par tour en degrés

// --- État persistant ---
let boostUsed = false;
let prevX = -1, prevY = -1;           // Position précédente pour calculer la vitesse
let vx = 0, vy = 0;                   // Vecteur de vitesse estimé
let turn = 0;
let checkpoints = [];                  // Stockage des checkpoints découverts
let cpIndex = -1;                      // Index du checkpoint courant dans notre liste
let lapDetected = false;               // Détection du premier tour complet (on connaît tous les CPs)
let bestBoostDist = 0;                 // Plus longue distance entre 2 CPs consécutifs
let bestBoostCpIdx = -1;              // Index du CP après lequel on boost

// --- Utilitaires ---
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// --- Boucle de jeu ---
while (true) {
    const [x, y, nextX, nextY, nextDist, nextAngle] = readline().split(' ').map(Number);
    const [opX, opY] = readline().split(' ').map(Number);

    // --- Estimation de la vitesse (inertie) ---
    if (prevX !== -1) {
        vx = x - prevX;
        vy = y - prevY;
    }
    prevX = x;
    prevY = y;

    // --- Apprentissage des checkpoints pour le boost optimal ---
    // On détecte un nouveau checkpoint quand la cible change
    if (checkpoints.length === 0 || (checkpoints[cpIndex][0] !== nextX || checkpoints[cpIndex][1] !== nextY)) {
        // Vérifier si c'est un CP déjà connu (= retour au début = lap complet)
        const knownIdx = checkpoints.findIndex(cp => cp[0] === nextX && cp[1] === nextY);
        if (knownIdx !== -1) {
            lapDetected = true;
            cpIndex = knownIdx;
        } else {
            checkpoints.push([nextX, nextY]);
            cpIndex = checkpoints.length - 1;
        }
    }

    // Calculer la meilleure section pour le boost (une seule fois après le 1er tour)
    if (lapDetected && bestBoostCpIdx === -1 && checkpoints.length >= 2) {
        for (let i = 0; i < checkpoints.length; i++) {
            const j = (i + 1) % checkpoints.length;
            const d = dist(checkpoints[i][0], checkpoints[i][1], checkpoints[j][0], checkpoints[j][1]);
            if (d > bestBoostDist) {
                bestBoostDist = d;
                bestBoostCpIdx = j; // On boost VERS ce checkpoint
            }
        }
    }

    const absAngle = Math.abs(nextAngle);

    // --- COMPENSATION D'INERTIE (Drift Correction) ---
    // Au lieu de viser directement le checkpoint, on compense la dérive
    // en visant un point qui "annule" le vecteur de vitesse résiduel
    // Cela crée une trajectoire beaucoup plus droite
    let targetX = nextX;
    let targetY = nextY;

    // Facteur de compensation : plus la distance est grande, moins on corrige
    // (on a plus de marge pour corriger naturellement)
    const compensationFactor = clamp(1 - nextDist / 8000, 0.3, 1.5);

    // On soustrait une fraction de la vitesse actuelle pour contrer l'inertie
    targetX -= vx * compensationFactor * 3;
    targetY -= vy * compensationFactor * 3;

    // --- GESTION DU THRUST ---
    let thrust;

    // 1. FREINAGE D'URGENCE : Pod complètement dans la mauvaise direction
    if (absAngle > 90) {
        thrust = 0;
    }
    // 2. BOOST OPTIMAL : aligné + bonne section + boost disponible
    else if (!boostUsed && absAngle <= 5 && nextDist > 4000) {
        // Si on a détecté le meilleur segment, n'utiliser le boost que pour celui-ci
        if (bestBoostCpIdx === -1 || cpIndex === bestBoostCpIdx) {
            thrust = 'BOOST';
            boostUsed = true;
        } else {
            thrust = 100;
        }
    }
    // 3. THRUST PROGRESSIF : plus l'angle est grand, plus on réduit
    else {
        // Formule progressive : thrust diminue proportionnellement à l'angle
        // À 0° → 100, à 90° → ~30
        thrust = Math.round(100 * (1 - absAngle / 130));
        thrust = clamp(thrust, 20, 100);

        // Ralentir à l'approche du checkpoint pour ne pas le dépasser
        // Surtout quand on est proche et qu'il y a un virage serré après
        if (nextDist < 1500 && absAngle > 30) {
            thrust = Math.min(thrust, 40);
        } else if (nextDist < 2000) {
            // Réduction douce à l'approche
            const approachFactor = clamp(nextDist / 2000, 0.4, 1);
            thrust = Math.round(thrust * approachFactor);
            thrust = clamp(thrust, 30, 100);
        }
    }

    // --- ANTI-COLLISION OFFENSIVE ---
    // Si l'adversaire est très proche et devant nous, on le pousse
    const distToOp = dist(x, y, opX, opY);
    if (distToOp < 900 && absAngle < 30) {
        // L'adversaire est sur notre route → plein gaz pour l'éjecter
        targetX = opX;
        targetY = opY;
        thrust = (thrust === 'BOOST') ? thrust : 100;
    }

    console.log(`${Math.round(targetX)} ${Math.round(targetY)} ${thrust}`);
    turn++;
}
