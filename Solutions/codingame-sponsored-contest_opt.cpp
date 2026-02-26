/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <set>
#include <iomanip>
#include <ctime>
#include <sstream>
#include <emmintrin.h> // SSE2
#include <wmmintrin.h> // CLMUL

using namespace std;

// S is at most 256. Multiplication of two degree 255 polynomials gives degree 510.
// So 512 bits (16 uint32_t) is enough.
const int MAX_WORDS = 16; 

struct Poly {
    uint32_t data[MAX_WORDS] = {0};
    int deg = -1;

    Poly() {}
    Poly(uint32_t val) {
        data[0] = val;
        update_deg();
    }

    void update_deg() {
        deg = -1;
        for (int i = MAX_WORDS - 1; i >= 0; --i) {
            if (data[i] != 0) {
                deg = i * 32 + 31 - __builtin_clz(data[i]);
                break;
            }
        }
    }

    bool is_zero() const { return deg == -1; }
    
    Poly operator^(const Poly& o) const {
        Poly res;
        for (int i = 0; i < MAX_WORDS; ++i) res.data[i] = data[i] ^ o.data[i];
        res.update_deg();
        return res;
    }

    Poly shift_left(int shift) const {
        if (is_zero() || shift == 0) return *this;
        Poly res;
        int word_shift = shift / 32;
        int bit_shift = shift % 32;
        if (bit_shift == 0) {
            for (int i = 0; i < MAX_WORDS - word_shift; ++i) {
                res.data[i + word_shift] = data[i];
            }
        } else {
            uint32_t carry = 0;
            for (int i = 0; i < MAX_WORDS - word_shift; ++i) {
                res.data[i + word_shift] = (data[i] << bit_shift) | carry;
                carry = data[i] >> (32 - bit_shift);
            }
        }
        res.update_deg();
        return res;
    }
};

Poly mul(const Poly& a, const Poly& b) {
    Poly res;
    if (a.is_zero() || b.is_zero()) return res;
    
    // Use clmul instruction for 64x64 -> 128 bit multiplication
    // Treat data as array of uint64_t
    uint64_t* a64 = (uint64_t*)a.data;
    uint64_t* b64 = (uint64_t*)b.data;
    uint64_t* r64 = (uint64_t*)res.data;
    
    int a_words64 = a.deg / 64 + 1;
    int b_words64 = b.deg / 64 + 1;
    
    for (int i = 0; i < a_words64; ++i) {
        if (a64[i] == 0) continue;
        __m128i va = _mm_set_epi64x(0, a64[i]);
        for (int j = 0; j < b_words64; ++j) {
            if (b64[j] == 0) continue;
            __m128i vb = _mm_set_epi64x(0, b64[j]);
            __m128i p = _mm_clmulepi64_si128(va, vb, 0);
            
            uint64_t p_lo = _mm_extract_epi64(p, 0);
            uint64_t p_hi = _mm_extract_epi64(p, 1);
            
            r64[i + j] ^= p_lo;
            if (i + j + 1 < MAX_WORDS / 2) {
                r64[i + j + 1] ^= p_hi;
            }
        }
    }
    
    res.update_deg();
    return res;
}

void divmod(const Poly& a, const Poly& b, Poly& q, Poly& r) {
    q = Poly();
    r = a;
    if (b.is_zero()) return;
    int d_b = b.deg;
    while (r.deg >= d_b) {
        int shift = r.deg - d_b;
        int qw = shift / 32;
        int qb = shift % 32;
        q.data[qw] |= (1U << qb);
        r = r ^ b.shift_left(shift);
    }
    q.update_deg();
}

Poly mod(Poly a, const Poly& b) {
    if (b.is_zero()) return a;
    int d_b = b.deg;
    while (a.deg >= d_b) {
        int shift = a.deg - d_b;
        a = a ^ b.shift_left(shift);
    }
    return a;
}

Poly gcd(Poly a, Poly b) {
    while (!b.is_zero()) {
        Poly r = mod(a, b);
        a = b;
        b = r;
    }
    return a;
}

Poly deriv(const Poly& a) {
    Poly res;
    for (int i = 1; i <= a.deg; i += 2) {
        if ((a.data[i / 32] >> (i % 32)) & 1) {
            int new_deg = i - 1;
            res.data[new_deg / 32] |= (1U << (new_deg % 32));
        }
    }
    res.update_deg();
    return res;
}

Poly sqrt_poly(const Poly& a) {
    Poly res;
    for (int i = 0; i <= a.deg; i += 2) {
        if ((a.data[i / 32] >> (i % 32)) & 1) {
            int new_deg = i / 2;
            res.data[new_deg / 32] |= (1U << (new_deg % 32));
        }
    }
    res.update_deg();
    return res;
}

Poly square_mod(const Poly& a, const Poly& m) {
    return mod(mul(a, a), m);
}

Poly random_poly(int deg_limit) {
    Poly res;
    if (deg_limit <= 0) return res;
    for (int i = 0; i < deg_limit; ++i) {
        if (rand() % 2) {
            res.data[i / 32] |= (1U << (i % 32));
        }
    }
    res.update_deg();
    return res;
}

void factor_distinct_degree(const Poly& g, int k, vector<Poly>& out) {
    if (g.deg == k) {
        out.push_back(g);
        return;
    }
    while (true) {
        Poly T = random_poly(g.deg);
        Poly S = T;
        Poly T_cur = T;
        for (int i = 1; i < k; ++i) {
            T_cur = square_mod(T_cur, g);
            S = S ^ T_cur;
        }
        Poly d = gcd(S, g);
        if (d.deg > 0 && d.deg < g.deg) {
            factor_distinct_degree(d, k, out);
            Poly q, r;
            divmod(g, d, q, r);
            factor_distinct_degree(q, k, out);
            return;
        }
    }
}

void factor(const Poly& P, vector<Poly>& out) {
    if (P.deg <= 0) return;
    if (P.deg == 1) {
        out.push_back(P);
        return;
    }
    
    Poly D = deriv(P);
    if (D.is_zero()) {
        Poly Q = sqrt_poly(P);
        vector<Poly> f;
        factor(Q, f);
        out.insert(out.end(), f.begin(), f.end());
        out.insert(out.end(), f.begin(), f.end());
        return;
    }
    
    Poly g = gcd(P, D);
    if (g.deg > 0) {
        factor(g, out);
        Poly q, r;
        divmod(P, g, q, r);
        factor(q, out);
        return;
    }
    
    Poly current_P = P;
    Poly X_k = Poly(2); // x
    
    int k = 1;
    while (k <= current_P.deg / 2) {
        X_k = square_mod(X_k, current_P);
        Poly diff = X_k ^ Poly(2); // X_k - x
        Poly g_k = gcd(diff, current_P);
        if (g_k.deg > 0) {
            factor_distinct_degree(g_k, k, out);
            Poly q, r;
            divmod(current_P, g_k, q, r);
            current_P = q;
            if (current_P.deg > 0) {
                divmod(X_k, current_P, q, r); 
                X_k = r;
            }
        }
        k++;
    }
    if (current_P.deg > 0) {
        out.push_back(current_P);
    }
}

string to_hex_str(uint32_t val) {
    ostringstream oss;
    oss << setfill('0') << setw(8) << hex << val;
    return oss.str();
}

string polyToHex(const Poly& u, const Poly& v, int S) {
    int K = S / 32;
    string res = "";
    for (int i = 0; i < K; ++i) {
        if (i > 0) res += " ";
        res += to_hex_str(u.data[i]);
    }
    for (int i = 0; i < K; ++i) {
        if (K > 0 || i > 0) res += " ";
        res += to_hex_str(v.data[i]);
    }
    return res;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    srand(1337);
    int S;
    if (!(cin >> S)) return 0;
    
    int N1 = S / 16;
    Poly B;
    for (int i = 0; i < N1; ++i) {
        string s;
        cin >> s;
        B.data[i] = stoul(s, nullptr, 16);
    }
    B.update_deg();
    
    vector<Poly> factors;
    factor(B, factors);
    set<string> answers;
    
    auto find_subsets = [&](auto& self, int idx, Poly cur_poly) -> void {
        if (idx == (int)factors.size()) {
            if (cur_poly.deg < S) {
                Poly other, r;
                divmod(B, cur_poly, other, r);
                if (other.deg < S) {
                    answers.insert(polyToHex(cur_poly, other, S));
                    answers.insert(polyToHex(other, cur_poly, S));
                }
            }
            return;
        }
        self(self, idx + 1, cur_poly);
        self(self, idx + 1, mul(cur_poly, factors[idx]));
    };
    
    find_subsets(find_subsets, 0, Poly(1));
    
    for (auto const& ans : answers) {
        cout << ans << "\n";
    }
    
    return 0;
}
