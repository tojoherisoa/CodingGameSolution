/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
#include <iostream>
#include <iomanip>
#include <cstdint>

using namespace std;

void clmul(uint32_t u, uint32_t v, uint32_t &r0, uint32_t &r1) {
    r0 = 0; r1 = 0;
    for (int i = 0; i < 32; ++i) {
        if ((u >> i) & 1) {
            uint64_t shifted_v = (uint64_t)v << i;
            r0 ^= (uint32_t)shifted_v;
            r1 ^= (uint32_t)(shifted_v >> 32);
        }
    }
}

int main() {
    uint32_t u = 0xb0c152f9;
    uint32_t v = 0xebf2831f;
    uint32_t r0, r1;
    clmul(u, v, r0, r1);
    cout << hex << r0 << " " << r1 << endl;
    return 0;
}
