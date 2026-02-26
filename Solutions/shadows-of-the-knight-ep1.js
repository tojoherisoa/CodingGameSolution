/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
/**
 * Shadows of the Knight - Episode 1
 * Recherche dichotomique 2D : on réduit l'espace de recherche
 * de moitié à chaque saut en fonction de la direction indiquée.
 *  https://www.codingame.com/ide/puzzle/shadows-of-the-knight-episode-1
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */

const [W, H] = readline().split(' ').map(Number);
const N = +readline();
let [x, y] = readline().split(' ').map(Number);

// Bornes de l'espace de recherche (persistantes entre les tours)
let [xMin, xMax, yMin, yMax] = [0, W - 1, 0, H - 1];

while (true) {
    const dir = readline();

    // Réduire l'espace vertical
    if (dir.includes('U')) yMax = y - 1;
    if (dir.includes('D')) yMin = y + 1;

    // Réduire l'espace horizontal
    if (dir.includes('L')) xMax = x - 1;
    if (dir.includes('R')) xMin = x + 1;

    // Sauter au centre de l'espace restant
    x = (xMin + xMax) >> 1;
    y = (yMin + yMax) >> 1;

    console.log(`${x} ${y}`);
}
