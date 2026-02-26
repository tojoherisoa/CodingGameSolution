/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
/**
 * Décodeur Morse - Musée de la Résistance nationale
 * https://www.codingame.com/training/[morse-decoder]
 *
 * Algorithme : DP + Trie sur les mots du dictionnaire encodés en Morse.
 * dp[i] = nombre de façons de décoder la séquence Morse de 0 à i.
 * On parcourt le Trie en parallèle pour chaque position, ce qui évite
 * de comparer chaque mot individuellement (O(N*M) → O(L * profondeur Trie)).
 *
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */

// --- Table Morse (A-Z) ---
const MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..',
    E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..',
    M: '--', N: '-.', O: '---', P: '.--.',
    Q: '--.-', R: '.-.', S: '...', T: '-',
    U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..'
};

// --- Conversion d'un mot en Morse (concaténé, sans séparateur) ---
const toMorse = word => {
    let m = '';
    for (let i = 0; i < word.length; i++) m += MORSE[word[i]];
    return m;
};

// --- Trie optimisé avec tableau indexé (. = 0, - = 1) ---
// Chaque noeud : [enfant_point, enfant_tiret, endCount]
// endCount = nombre de mots du dictionnaire qui terminent à ce noeud
// (plusieurs mots peuvent avoir la même représentation Morse)
const DOT = 0, DASH = 1, END = 2;
const trieNodes = [[null, null, 0]]; // Noeud racine

const trieInsert = morseWord => {
    let nodeIdx = 0;
    for (let i = 0; i < morseWord.length; i++) {
        const c = morseWord[i] === '.' ? DOT : DASH;
        if (trieNodes[nodeIdx][c] === null) {
            trieNodes[nodeIdx][c] = trieNodes.length;
            trieNodes.push([null, null, 0]);
        }
        nodeIdx = trieNodes[nodeIdx][c];
    }
    // Incrémenter le compteur (plusieurs mots peuvent partager le même Morse)
    trieNodes[nodeIdx][END]++;
};

// --- Parsing des entrées ---
const sequence = readline();
const N = +readline();

// Construire le Trie avec les mots du dictionnaire encodés en Morse
for (let i = 0; i < N; i++) {
    trieInsert(toMorse(readline()));
}

// --- DP : dp[i] = nombre de messages valides pour sequence[0..i-1] ---
// Utilisation de BigInt car R peut atteindre 2^63
const len = sequence.length;
const dp = new BigInt64Array(len + 1);
dp[0] = 1n; // Cas de base : chaîne vide = 1 façon

for (let i = 0; i < len; i++) {
    // Si aucune façon d'arriver à la position i, on saute
    if (dp[i] === 0n) continue;

    // Parcourir le Trie à partir de la position i dans la séquence
    let nodeIdx = 0;
    for (let j = i; j < len; j++) {
        const c = sequence[j] === '.' ? DOT : DASH;
        const next = trieNodes[nodeIdx][c];

        // Pas de branche dans le Trie → aucun mot ne commence par ce préfixe
        if (next === null) break;

        nodeIdx = next;

        // Si ce noeud marque la fin d'un ou plusieurs mots, multiplier par le nombre
        const cnt = trieNodes[nodeIdx][END];
        if (cnt > 0) {
            dp[j + 1] += dp[i] * BigInt(cnt);
        }
    }
}

console.log(dp[len].toString());
