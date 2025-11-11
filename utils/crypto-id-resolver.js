/**
 * CRYPTO ID RESOLVER
 * Central source of truth for crypto ID mappings and aliases
 *
 * Purpose: Resolve various crypto ID formats to CoinGecko canonical IDs
 * Usage: Always use resolveCryptoId() before crypto lookups
 */

// ===== CANONICAL ID MAPPINGS =====
/**
 * Maps common aliases to CoinGecko canonical IDs
 * Add new mappings here as needed
 */
const CRYPTO_ID_ALIASES = {
    // Layer 1 & Major coins
    'polygon': 'matic-network',
    'matic': 'matic-network',

    // DeFi protocols
    'lido': 'lido-dao',
    'curve': 'curve-dao-token',
    'crv': 'curve-dao-token',
    'snx': 'synthetix-network-token',
    'synthetix': 'synthetix-network-token',

    // Layer 2 solutions
    'avalanche': 'avalanche-2',
    'avax': 'avalanche-2',

    // AI & Compute tokens
    'fetchai': 'fetch-ai',
    'fetch': 'fetch-ai',
    'render': 'render-token',
    'rndr': 'render-token',

    // Gaming & NFT
    'immutable': 'immutable-x',
    'imx': 'immutable-x',

    // Add more mappings as needed
    // Format: 'alias': 'canonical-id'
};

// ===== SYMBOL TO ID MAPPING =====
/**
 * Maps ticker symbols to CoinGecko IDs
 * Used when user searches by symbol instead of ID
 */
const SYMBOL_TO_ID = {
    // Major coins
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'BNB': 'binancecoin',

    // Layer 1
    'SOL': 'solana',
    'ADA': 'cardano',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network',
    'ATOM': 'cosmos',
    'NEAR': 'near',
    'ALGO': 'algorand',

    // Layer 2
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'IMX': 'immutable-x',

    // DeFi
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'CRV': 'curve-dao-token',
    'SNX': 'synthetix-network-token',
    'LDO': 'lido-dao',

    // AI & Compute
    'FET': 'fetch-ai',
    'RNDR': 'render-token',
    'INJ': 'injective-protocol',

    // Add more as needed
};

// ===== CORE FUNCTIONS =====

/**
 * Resolve crypto ID to canonical CoinGecko ID
 *
 * @param {string} id - Input ID (can be alias, symbol, or canonical ID)
 * @returns {string} Canonical CoinGecko ID
 *
 * @example
 * resolveCryptoId('polygon')     // Returns: 'matic-network'
 * resolveCryptoId('immutable')   // Returns: 'immutable-x'
 * resolveCryptoId('ethereum')    // Returns: 'ethereum' (unchanged)
 */
function resolveCryptoId(id) {
    if (!id) {
        console.warn('⚠️ resolveCryptoId called with empty ID');
        return id;
    }

    const normalizedId = id.toLowerCase().trim();

    // 1. Check if it's an alias
    if (CRYPTO_ID_ALIASES[normalizedId]) {
        const resolvedId = CRYPTO_ID_ALIASES[normalizedId];
        console.log(`🔄 ID resolved: ${id} → ${resolvedId}`);
        return resolvedId;
    }

    // 2. Return as-is (assume it's already canonical)
    return normalizedId;
}

/**
 * Resolve symbol to crypto ID
 *
 * @param {string} symbol - Ticker symbol (e.g., 'BTC', 'ETH', 'MATIC')
 * @returns {string|null} Canonical CoinGecko ID, or null if not found
 *
 * @example
 * resolveSymbolToId('MATIC')  // Returns: 'matic-network'
 * resolveSymbolToId('IMX')    // Returns: 'immutable-x'
 * resolveSymbolToId('XYZ')    // Returns: null
 */
function resolveSymbolToId(symbol) {
    if (!symbol) {
        console.warn('⚠️ resolveSymbolToId called with empty symbol');
        return null;
    }

    const normalizedSymbol = symbol.toUpperCase().trim();

    if (SYMBOL_TO_ID[normalizedSymbol]) {
        const resolvedId = SYMBOL_TO_ID[normalizedSymbol];
        console.log(`🔄 Symbol resolved: ${symbol} → ${resolvedId}`);
        return resolvedId;
    }

    console.warn(`⚠️ Symbol not found in mapping: ${symbol}`);
    return null;
}

/**
 * Resolve flexible ID (tries both ID and symbol resolution)
 *
 * @param {string} input - Can be ID or symbol
 * @returns {string} Canonical CoinGecko ID
 *
 * @example
 * resolveFlexible('polygon')   // Returns: 'matic-network' (ID alias)
 * resolveFlexible('MATIC')     // Returns: 'matic-network' (symbol)
 * resolveFlexible('ethereum')  // Returns: 'ethereum' (canonical)
 */
function resolveFlexible(input) {
    if (!input) return input;

    // Try ID resolution first
    const resolvedById = resolveCryptoId(input);
    if (resolvedById !== input.toLowerCase()) {
        return resolvedById;
    }

    // Try symbol resolution
    const resolvedBySymbol = resolveSymbolToId(input);
    if (resolvedBySymbol) {
        return resolvedBySymbol;
    }

    // Return as-is
    return input.toLowerCase();
}

/**
 * Get canonical ID for a crypto (alias for resolveCryptoId)
 * More semantic name for external usage
 */
function getCanonicalId(id) {
    return resolveCryptoId(id);
}

/**
 * Check if an ID is an alias
 *
 * @param {string} id - ID to check
 * @returns {boolean} True if ID is an alias
 */
function isAlias(id) {
    if (!id) return false;
    return CRYPTO_ID_ALIASES.hasOwnProperty(id.toLowerCase());
}

/**
 * Get all known aliases for documentation/debugging
 *
 * @returns {Object} Copy of CRYPTO_ID_ALIASES
 */
function getAllAliases() {
    return { ...CRYPTO_ID_ALIASES };
}

/**
 * Get all known symbols for documentation/debugging
 *
 * @returns {Object} Copy of SYMBOL_TO_ID
 */
function getAllSymbols() {
    return { ...SYMBOL_TO_ID };
}

/**
 * Add new alias at runtime (for dynamic mappings)
 *
 * @param {string} alias - Alias to add
 * @param {string} canonicalId - Canonical CoinGecko ID
 */
function addAlias(alias, canonicalId) {
    if (!alias || !canonicalId) {
        console.error('❌ addAlias requires both alias and canonicalId');
        return;
    }

    CRYPTO_ID_ALIASES[alias.toLowerCase()] = canonicalId.toLowerCase();
    console.log(`✅ Alias added: ${alias} → ${canonicalId}`);
}

/**
 * Add new symbol at runtime
 *
 * @param {string} symbol - Symbol to add
 * @param {string} cryptoId - Canonical CoinGecko ID
 */
function addSymbol(symbol, cryptoId) {
    if (!symbol || !cryptoId) {
        console.error('❌ addSymbol requires both symbol and cryptoId');
        return;
    }

    SYMBOL_TO_ID[symbol.toUpperCase()] = cryptoId.toLowerCase();
    console.log(`✅ Symbol added: ${symbol} → ${cryptoId}`);
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        resolveCryptoId,
        resolveSymbolToId,
        resolveFlexible,
        getCanonicalId,
        isAlias,
        getAllAliases,
        getAllSymbols,
        addAlias,
        addSymbol,
        // Export constants for reference
        CRYPTO_ID_ALIASES,
        SYMBOL_TO_ID
    };
}
