/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
/**
 * Table de conversion de l'alphabet en Morse
 */
const MORSE_ALPHABET = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..'
};

// 1. Lecture des entrées
const morseSeq = readline();
const N = parseInt(readline());

// Initialisation de la racine de notre Trie
const trie = {};

// 2. Traduction et stockage des mots dans le Trie
for (let i = 0; i < N; i++) {
    const word = readline();

    // Traduction du mot en Morse
    let morseWord = '';
    for (const char of word) {
        morseWord += MORSE_ALPHABET[char];
    }

    // Insertion du mot en Morse dans le Trie
    let node = trie;
    for (const char of morseWord) {
        if (!node[char]) node[char] = {};
        node = node[char];
    }
    // On incrémente le compteur (plusieurs mots peuvent avoir la même traduction Morse !)
    node.count = (node.count || 0) + 1;
}

const L = morseSeq.length;

// 3. Programmation Dynamique avec BigInt64Array
// L'utilisation d'un TypedArray permet une allocation mémoire continue ultra-rapide.
const dp = new BigInt64Array(L + 1);
dp[L] = 1n; // Condition de base : 1 façon de lire la fin du message

// On parcourt la séquence de la fin vers le début
for (let i = L - 1; i >= 0; i--) {
    let node = trie;
    let sum = 0n;

    // On explore les chemins possibles depuis la position i
    for (let j = i; j < L; j++) {
        node = node[morseSeq[j]];

        // Si la séquence ne mène à rien dans le Trie, on arrête cette branche
        if (!node) break;

        // Si un ou plusieurs mots se terminent ici, on ajoute leurs combinaisons
        if (node.count) {
            sum += BigInt(node.count) * dp[j + 1];
        }
    }

    dp[i] = sum;
}

// 4. Affichage du résultat final (on convertit le BigInt en String)
console.log(dp[0].toString());