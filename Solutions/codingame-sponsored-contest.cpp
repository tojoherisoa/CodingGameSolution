/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <set>
#include <iomanip>
#include <sstream>

using namespace std;

const int MAX_WORDS = 64; 

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

// 8-bit multiplication table for GF(2)
uint16_t mul8[256][256];

void precompute() {
    for (int i = 0; i < 256; ++i) {
        for (int j = 0; j < 256; ++j) {
            uint16_t res = 0;
            for (int k = 0; k < 8; ++k) {
                if ((i >> k) & 1) res ^= (j << k);
            }
            mul8[i][j] = res;
        }
    }
}

Poly mul(const Poly& a, const Poly& b) {
    Poly res;
    if (a.is_zero() || b.is_zero()) return res;
    
    uint8_t* pa = (uint8_t*)a.data;
    uint8_t* pb = (uint8_t*)b.data;
    
    int bytes_a = (a.deg) / 8 + 1;
    int bytes_b = (b.deg) / 8 + 1;
    
    for (int i = 0; i < bytes_a; ++i) {
        if (!pa[i]) continue;
        for (int j = 0; j < bytes_b; ++j) {
            if (!pb[j]) continue;
            uint16_t p = mul8[pa[i]][pb[j]];
            int offset = i + j;
            uint8_t* pr8 = (uint8_t*)res.data;
            pr8[offset] ^= (p & 0xFF);
            pr8[offset + 1] ^= (p >> 8);
        }
    }
    res.update_deg();
    return res;
}

void divmod(const Poly& a, const Poly& b, Poly& q, Poly& r) {
    q = Poly();
    r = a;
    if (b.is_zero()) return;
    int db = b.deg;
    
    while (r.deg >= db) {
        int shift = r.deg - db;
        q.data[shift / 32] ^= (1U << (shift % 32));
        
        int word_shift = shift / 32;
        int bit_shift = shift % 32;
        if (bit_shift == 0) {
            for (int i = 0; i <= db / 32; ++i) {
                r.data[i + word_shift] ^= b.data[i];
            }
        } else {
            uint32_t carry = 0;
            for (int i = 0; i <= db / 32; ++i) {
                uint32_t val = (b.data[i] << bit_shift) | carry;
                carry = b.data[i] >> (32 - bit_shift);
                r.data[i + word_shift] ^= val;
            }
            if (carry) r.data[db / 32 + 1 + word_shift] ^= carry;
        }
        r.update_deg();
    }
    q.update_deg();
}

Poly mod(Poly a, const Poly& b) {
    if (b.is_zero()) return a;
    int db = b.deg;
    
    while (a.deg >= db) {
        int shift = a.deg - db;
        int word_shift = shift / 32;
        int bit_shift = shift % 32;
        if (bit_shift == 0) {
            for (int i = 0; i <= db / 32; ++i) {
                a.data[i + word_shift] ^= b.data[i];
            }
        } else {
            uint32_t carry = 0;
            for (int i = 0; i <= db / 32; ++i) {
                uint32_t val = (b.data[i] << bit_shift) | carry;
                carry = b.data[i] >> (32 - bit_shift);
                a.data[i + word_shift] ^= val;
            }
            if (carry) a.data[db / 32 + 1 + word_shift] ^= carry;
        }
        a.update_deg();
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
    Poly sq;
    for (int i = 0; i <= a.deg / 32; ++i) {
        uint32_t v = a.data[i];
        uint32_t lo = 0, hi = 0;
        for (int j = 0; j < 16; ++j) {
            lo |= ((v >> j) & 1) << (2 * j);
            hi |= ((v >> (j + 16)) & 1) << (2 * j);
        }
        sq.data[i * 2] = lo;
        sq.data[i * 2 + 1] = hi;
    }
    sq.update_deg();
    return mod(sq, m);
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

void factor_distinct_degree(Poly g, int k, vector<Poly>& out) {
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

void factor(Poly P, vector<Poly>& out) {
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
    precompute();
    srand(1337);
    int S;
    if (!(cin >> S)) return 0;
    
    int N1 = S / 16;
    Poly B;
    for (int i = 0; i < N1; ++i) {
        string s;
        if (!(cin >> s)) break;
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
