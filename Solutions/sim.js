/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
const u = 0xb0c152f9 >>> 0;
const v = 0xebf2831f >>> 0;

let r0 = 0 >>> 0;
let r1 = 0 >>> 0;

for (let i = 0; i < 32; i++) {
    if ((u >>> i) & 1) {
        let shift = i;
        // shifted_v = v << i
        let v_low = (v << shift) >>> 0;
        let v_high = (shift === 0) ? 0 : (v >>> (32 - shift));
        
        r0 ^= v_low;
        r1 ^= v_high;
    }
}
r0 = r0 >>> 0;
r1 = r1 >>> 0;

console.log(r0.toString(16), r1.toString(16));
