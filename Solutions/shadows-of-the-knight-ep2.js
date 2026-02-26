/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
/**
 * Shadows of the Knight - Episode 2
 * https://www.codingame.com/ide/puzzle/shadows-of-the-knight-episode-2
 *
 * Algorithme : Dichotomie 1D axiale (Y puis X)
 * - Phase 1 : Bisection sur Y (X fixe) → log2(H) coups
 * - Phase 2 : Bisection sur X (Y fixe) → log2(W) coups
 * - Reflexion 1D : target = 2*center - position (bissectrice au milieu du range)
 * - Convergence garantie : log2(W) + log2(H) coups
 *
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
var inputs = readline().split(' ');
const W = parseInt(inputs[0]); // width of the building.
const H = parseInt(inputs[1]); // height of the building.
const N = parseInt(readline()); // maximum number of turns before game over.
var inputs = readline().split(' ');
var X1 = parseInt(inputs[0]);
var Y1 = parseInt(inputs[1]);
var bombDir;
var minX = 0, minY = 0, maxX = W - 1, maxY = H - 1, X0, Y0, X, Y;
var center;

readline(); // UNKNOWN
// game loop
while (true) {
    if (yJumpUseful()) jumpY();
    else if (xJumpUseful()) jumpX();
    else resetBatman();
}

function xJumpUseful() {
    if (minX === maxX) return false;
    center = (minX + maxX) / 2;
    X = center + center - X1;
    Y = Y1;
    return 0 <= X && X < W && X1 !== X;
}

function jumpX() {
    jumpTo(X, Y);
    if (maxX - minX === 1) {
        if ((bombDir == 'WARMER' && X0 < X1) || (bombDir == 'COLDER' && X1 < X0)) minX = maxX;
        if ((bombDir == 'WARMER' && X1 < X0) || (bombDir == 'COLDER' && X0 < X1)) maxX = minX;
    } else if (maxX - minX === 2) {
        if ((bombDir == 'WARMER' && X0 < X1) || (bombDir == 'COLDER' && X1 < X0)) minX = maxX;
        if ((bombDir == 'WARMER' && X1 < X0) || (bombDir == 'COLDER' && X0 < X1)) maxX = minX;
        if (bombDir == 'SAME') minX = maxX = center;
    } else {
        if ((bombDir == 'WARMER' && X0 < X1) || (bombDir == 'COLDER' && X1 < X0)) minX = Math.floor(center + 1);
        if ((bombDir == 'WARMER' && X1 < X0) || (bombDir == 'COLDER' && X0 < X1)) maxX = Math.ceil(center - 1);
        if (bombDir == 'SAME') minX = maxX = center;
    }
}

function yJumpUseful() {
    if (minY === maxY) return false;
    center = (minY + maxY) / 2;
    X = X1;
    Y = center + center - Y1;
    return 0 <= Y && Y < H && Y1 !== Y;
}

function jumpY() {
    jumpTo(X, Y);
    if (maxY - minY === 1) {
        if ((bombDir == 'WARMER' && Y0 < Y1) || (bombDir == 'COLDER' && Y1 < Y0)) minY = maxY;
        if ((bombDir == 'WARMER' && Y1 < Y0) || (bombDir == 'COLDER' && Y0 < Y1)) maxY = minY;
    } else if (maxY - minY === 2) {
        if ((bombDir == 'WARMER' && Y0 < Y1) || (bombDir == 'COLDER' && Y1 < Y0)) minY = maxY;
        if ((bombDir == 'WARMER' && Y1 < Y0) || (bombDir == 'COLDER' && Y0 < Y1)) maxY = minY;
        if (bombDir == 'SAME') minY = maxY = center;
    } else {
        if ((bombDir == 'WARMER' && Y0 < Y1) || (bombDir == 'COLDER' && Y1 < Y0)) minY = Math.floor(center + 1);
        if ((bombDir == 'WARMER' && Y1 < Y0) || (bombDir == 'COLDER' && Y0 < Y1)) maxY = Math.ceil(center - 1);
        if (bombDir == 'SAME') minY = maxY = center;
    }
}

function jumpTo(x, y) {
    X0 = X1;
    Y0 = Y1;
    X1 = x;
    Y1 = y;
    console.log(x + ' ' + y);
    bombDir = readline();
}

function resetBatman() {
    jumpTo(maxX, maxY);
}
