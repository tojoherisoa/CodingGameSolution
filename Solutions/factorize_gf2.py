# Auteur : TOJOHERISOA Frederic Alias : FredCr7
import random

def deg(p):
    return p.bit_length() - 1 if p > 0 else -1

def poly_add(a, b): return a ^ b

def poly_mul(a, b):
    res = 0
    while b > 0:
        if b & 1: res ^= a
        a <<= 1
        b >>= 1
    return res

def poly_divmod(a, b):
    da = deg(a)
    db = deg(b)
    if db < 0: raise ZeroDivisionError
    q = 0
    while da >= db:
        shift = da - db
        q ^= (1 << shift)
        a ^= (b << shift)
        da = deg(a)
    return q, a

def poly_gcd(a, b):
    while b > 0:
        _, a = poly_divmod(a, b)
        a, b = b, a
    return a

def poly_deriv(a):
    res = 0
    i = 0
    while a > 0:
        if a & 2: res |= (1 << i)
        a >>= 2
        i += 2
    return res

def poly_sqrt(a):
    res = 0
    i = 0
    while a > 0:
        if a & 1: res |= (1 << i)
        a >>= 2
        i += 1
    return res

def poly_square_mod(a, m):
    if m <= 0: raise ZeroDivisionError
    sq = poly_mul(a, a)
    _, r = poly_divmod(sq, m)
    return r

def factor(P):
    if P <= 1: return []
    if deg(P) == 1: return [P]
    
    D = poly_deriv(P)
    if D == 0:
        Q = poly_sqrt(P)
        res = factor(Q)
        return res + res
    
    g = poly_gcd(P, D)
    if g > 1:
        f1 = factor(g)
        q, _ = poly_divmod(P, g)
        f2 = factor(q)
        return f1 + f2
    
    factors = []
    current_P = P
    X_k = 2 # x
    
    k = 1
    while k <= deg(current_P) // 2:
        X_k = poly_square_mod(X_k, current_P)
        diff = X_k ^ 2
        g = poly_gcd(diff, current_P)
        
        if g > 1:
            k_factors = factor_distinct_degree(g, k)
            factors.extend(k_factors)
            current_P, _ = poly_divmod(current_P, g)
            if current_P > 1:
                _, X_k = poly_divmod(X_k, current_P)
        k += 1
        
    if current_P > 1:
        factors.append(current_P)
    return factors

def random_poly(d):
    if d <= 0: return 0
    return random.getrandbits(d)

def factor_distinct_degree(g, k):
    if deg(g) == k: return [g]
    while True:
        T = random_poly(deg(g))
        S = T
        T_cur = T
        for _ in range(1, k):
            T_cur = poly_square_mod(T_cur, g)
            S ^= T_cur
        d = poly_gcd(S, g)
        if 0 < deg(d) < deg(g):
            f1 = factor_distinct_degree(d, k)
            q, _ = poly_divmod(g, d)
            f2 = factor_distinct_degree(q, k)
            return f1 + f2

B = 0x6677e20146508fb7
print("B:", hex(B))
f = factor(B)
print("factors:", [hex(i) for i in f])

# Check product
p = 1
for x in f:
    p = poly_mul(p, x)
print("Product == B?", p == B)

S = 32
def find_subsets(factors, index, current_deg, current_poly):
    if index == len(factors):
        other_deg = deg(B) - current_deg
        if current_deg < S and other_deg < S:
            _, other = poly_divmod(B, current_poly)
            yield current_poly, other
        return
        
    yield from find_subsets(factors, index+1, current_deg, current_poly)
    yield from find_subsets(factors, index+1, current_deg + deg(factors[index]), poly_mul(current_poly, factors[index]))

valid = list(find_subsets(f, 0, 0, 1))

answers = set()
for u, v in valid:
    ans1 = "{:08x} {:08x}".format(u, v)
    ans2 = "{:08x} {:08x}".format(v, u)
    answers.add(ans1)
    answers.add(ans2)

for ans in sorted(list(answers)):
    print(ans)
