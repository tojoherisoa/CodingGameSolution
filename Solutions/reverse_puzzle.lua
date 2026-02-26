/**
 * Auteur : TOJOHERISOA Frederic Alias : FredCr7
 */
wordsA = tonumber(io.read())
wordsB = tonumber(io.read())

next_tokenA = string.gmatch(io.read(), "[^%s]+")
next_tokenB = string.gmatch(io.read(), "[^%s]+")

local result = {}
local max_words = math.max(wordsA, wordsB)

for i = 1, max_words do
    local a = next_tokenA()
    if a then table.insert(result, a) end
    
    local b = next_tokenB()
    if b then table.insert(result, b) end
end

print(table.concat(result, " "))
