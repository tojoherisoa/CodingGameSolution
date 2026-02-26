/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
/**
 * Boucle principale du jeu
 **/
while (true) {
    // 1. On lit les 8 lignes et on crée directement un tableau avec les hauteurs
    const heights = Array.from({ length: 8 }, () => parseInt(readline()));

    // 2. On trouve l'index de la valeur maximale dans le tableau
    const targetIndex = heights.indexOf(Math.max(...heights));

    // 3. On tire sur la montagne !
    console.log(targetIndex);
}