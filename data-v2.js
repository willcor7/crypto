// ===== CRYPTO DATABASE =====
const cryptoDatabase = [
    {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        category: 'layer1',
        price: 3456.78,
        priceChange24h: 5.23,
        marketCap: 415000000000,
        volume24h: 18500000000,
        mvrv: 0.92,
        addressGrowth: 18.5,
        tvl: 45000000000,
        githubCommits: 342,
        contributors: 125,
        whaleAccumulation: 4.2,
        supply: 120000000,
        score: 88
    },
    {
        id: 'arbitrum',
        name: 'Arbitrum',
        symbol: 'ARB',
        category: 'layer2',
        price: 1.48,
        priceChange24h: 12.34,
        marketCap: 5800000000,
        volume24h: 850000000,
        mvrv: 0.78,
        addressGrowth: 32.1,
        tvl: 12500000000,
        githubCommits: 287,
        contributors: 45,
        whaleAccumulation: 5.8,
        supply: 3900000000,
        score: 85
    },
    {
        id: 'optimism',
        name: 'Optimism',
        symbol: 'OP',
        category: 'layer2',
        price: 2.35,
        priceChange24h: 8.91,
        marketCap: 7200000000,
        volume24h: 620000000,
        mvrv: 0.85,
        addressGrowth: 24.7,
        tvl: 8900000000,
        githubCommits: 198,
        contributors: 38,
        whaleAccumulation: 3.9,
        supply: 3000000000,
        score: 82
    },
    {
        id: 'aave',
        name: 'Aave',
        symbol: 'AAVE',
        category: 'defi',
        price: 245.67,
        priceChange24h: 6.42,
        marketCap: 3650000000,
        volume24h: 425000000,
        mvrv: 0.94,
        addressGrowth: 14.2,
        tvl: 8200000000,
        githubCommits: 156,
        contributors: 52,
        whaleAccumulation: 2.8,
        supply: 14800000,
        score: 79
    },
    {
        id: 'chainlink',
        name: 'Chainlink',
        symbol: 'LINK',
        category: 'oracle',
        price: 18.92,
        priceChange24h: 3.75,
        marketCap: 11200000000,
        volume24h: 780000000,
        mvrv: 1.12,
        addressGrowth: 11.5,
        tvl: null,
        githubCommits: 234,
        contributors: 67,
        whaleAccumulation: 1.9,
        supply: 591000000,
        score: 76
    },
    {
        id: 'matic-network',
        name: 'Polygon',
        symbol: 'MATIC',
        category: 'layer2',
        price: 0.89,
        priceChange24h: -2.15,
        marketCap: 8900000000,
        volume24h: 520000000,
        mvrv: 1.34,
        addressGrowth: 8.3,
        tvl: 1200000000,
        githubCommits: 189,
        contributors: 72,
        whaleAccumulation: 1.2,
        supply: 10000000000,
        score: 74
    },
    {
        id: 'uniswap',
        name: 'Uniswap',
        symbol: 'UNI',
        category: 'defi',
        price: 12.45,
        priceChange24h: 4.82,
        marketCap: 7450000000,
        volume24h: 380000000,
        mvrv: 0.88,
        addressGrowth: 16.9,
        tvl: 5600000000,
        githubCommits: 143,
        contributors: 41,
        whaleAccumulation: 3.4,
        supply: 598000000,
        score: 78
    },
    {
        id: 'avalanche-2',
        name: 'Avalanche',
        symbol: 'AVAX',
        category: 'layer1',
        price: 42.35,
        priceChange24h: 7.21,
        marketCap: 16500000000,
        volume24h: 1250000000,
        mvrv: 1.05,
        addressGrowth: 12.8,
        tvl: 1850000000,
        githubCommits: 267,
        contributors: 58,
        whaleAccumulation: 2.5,
        supply: 389000000,
        score: 77
    },
    {
        id: 'curve-dao-token',
        name: 'Curve DAO',
        symbol: 'CRV',
        category: 'defi',
        price: 1.12,
        priceChange24h: 9.34,
        marketCap: 1580000000,
        volume24h: 215000000,
        mvrv: 0.72,
        addressGrowth: 22.4,
        tvl: 4200000000,
        githubCommits: 98,
        contributors: 28,
        whaleAccumulation: 4.7,
        supply: 1410000000,
        score: 81
    },
    {
        id: 'immutable-x',
        name: 'Immutable X',
        symbol: 'IMX',
        category: 'gaming',
        price: 2.87,
        priceChange24h: 15.67,
        marketCap: 4250000000,
        volume24h: 320000000,
        mvrv: 0.68,
        addressGrowth: 38.2,
        tvl: 850000000,
        githubCommits: 176,
        contributors: 34,
        whaleAccumulation: 6.1,
        supply: 1480000000,
        score: 83
    },
    {
        id: 'render-token',
        name: 'Render Token',
        symbol: 'RNDR',
        category: 'ai',
        price: 8.92,
        priceChange24h: 11.23,
        marketCap: 3450000000,
        volume24h: 280000000,
        mvrv: 0.81,
        addressGrowth: 28.6,
        tvl: null,
        githubCommits: 145,
        contributors: 22,
        whaleAccumulation: 5.3,
        supply: 386000000,
        score: 80
    },
    {
        id: 'fetch-ai',
        name: 'Fetch.ai',
        symbol: 'FET',
        category: 'ai',
        price: 1.98,
        priceChange24h: 13.45,
        marketCap: 1980000000,
        volume24h: 195000000,
        mvrv: 0.75,
        addressGrowth: 31.5,
        tvl: null,
        githubCommits: 189,
        contributors: 29,
        whaleAccumulation: 4.9,
        supply: 1000000000,
        score: 82
    },
    {
        id: 'lido-dao',
        name: 'Lido DAO',
        symbol: 'LDO',
        category: 'defi',
        price: 2.45,
        priceChange24h: 5.67,
        marketCap: 2180000000,
        volume24h: 165000000,
        mvrv: 0.96,
        addressGrowth: 19.3,
        tvl: 32000000000,
        githubCommits: 134,
        contributors: 36,
        whaleAccumulation: 3.2,
        supply: 890000000,
        score: 79
    },
    {
        id: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        category: 'layer1',
        price: 145.23,
        priceChange24h: 6.89,
        marketCap: 68000000000,
        volume24h: 3200000000,
        mvrv: 1.18,
        addressGrowth: 15.7,
        tvl: 5800000000,
        githubCommits: 423,
        contributors: 98,
        whaleAccumulation: 2.3,
        supply: 468000000,
        score: 75
    },
    {
        id: 'synthetix-network-token',
        name: 'Synthetix',
        symbol: 'SNX',
        category: 'defi',
        price: 3.67,
        priceChange24h: 8.12,
        marketCap: 1250000000,
        volume24h: 98000000,
        mvrv: 0.84,
        addressGrowth: 20.8,
        tvl: 620000000,
        githubCommits: 167,
        contributors: 31,
        whaleAccumulation: 4.5,
        supply: 340000000,
        score: 77
    }
];

// ===== PORTFOLIO DATA =====
const portfolioData = [
    {
        crypto: 'ethereum',
        quantity: 8.5,
        buyPrice: 2850.00,
        currentPrice: 3456.78
    },
    {
        crypto: 'arbitrum',
        quantity: 12500,
        buyPrice: 1.12,
        currentPrice: 1.48
    },
    {
        crypto: 'chainlink',
        quantity: 850,
        buyPrice: 15.50,
        currentPrice: 18.92
    },
    {
        crypto: 'aave',
        quantity: 45,
        buyPrice: 210.00,
        currentPrice: 245.67
    },
    {
        crypto: 'uniswap',
        quantity: 520,
        buyPrice: 10.80,
        currentPrice: 12.45
    },
    {
        crypto: 'immutable',
        quantity: 3200,
        buyPrice: 2.10,
        currentPrice: 2.87
    },
    {
        crypto: 'render',
        quantity: 780,
        buyPrice: 7.20,
        currentPrice: 8.92
    },
    {
        crypto: 'curve',
        quantity: 8500,
        buyPrice: 0.95,
        currentPrice: 1.12
    }
];

// ===== ACTIVE SIGNALS =====
const activeSignals = [
    {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        crypto: 'arbitrum',
        signal: 'STRONG BUY',
        type: 'Entry',
        price: 1.48,
        score: 85,
        confidence: 88,
        reason: 'MVRV < 1.0, Croissance addr. +32%, Accumulation baleines +5.8%',
        status: 'Actif'
    },
    {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        crypto: 'ethereum',
        signal: 'STRONG BUY',
        type: 'Entry',
        price: 3456.78,
        score: 88,
        confidence: 92,
        reason: 'MVRV 0.92, Score 88, Accumulation institutionnelle forte',
        status: 'Actif'
    },
    {
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        crypto: 'immutable',
        signal: 'STRONG BUY',
        type: 'Entry',
        price: 2.87,
        score: 83,
        confidence: 85,
        reason: 'Croissance exceptionnelle +38%, MVRV 0.68, Secteur Gaming émergent',
        status: 'Actif'
    },
    {
        timestamp: new Date(Date.now() - 21600000).toISOString(),
        crypto: 'fetchai',
        signal: 'STRONG BUY',
        type: 'Entry',
        price: 1.98,
        score: 82,
        confidence: 84,
        reason: 'MVRV 0.75, AI sector momentum, Croissance +31.5%',
        status: 'Actif'
    },
    {
        timestamp: new Date(Date.now() - 28800000).toISOString(),
        crypto: 'curve',
        signal: 'STRONG BUY',
        type: 'Entry',
        price: 1.12,
        score: 81,
        confidence: 82,
        reason: 'MVRV 0.72, TVL solide $4.2B, Croissance +22.4%',
        status: 'Actif'
    },
    {
        timestamp: new Date(Date.now() - 36000000).toISOString(),
        crypto: 'optimism',
        signal: 'BUY',
        type: 'Entry',
        price: 2.35,
        score: 82,
        confidence: 79,
        reason: 'Layer 2 scaling solution, MVRV 0.85, Croissance +24.7%',
        status: 'Actif'
    },
    {
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        crypto: 'render',
        signal: 'BUY',
        type: 'Entry',
        price: 8.92,
        score: 80,
        confidence: 81,
        reason: 'AI rendering sector, Croissance +28.6%, Dev activity strong',
        status: 'Actif'
    },
    {
        timestamp: new Date(Date.now() - 50400000).toISOString(),
        crypto: 'aave',
        signal: 'BUY',
        type: 'Entry',
        price: 245.67,
        score: 79,
        confidence: 77,
        reason: 'DeFi leader, TVL $8.2B, MVRV proche de 1.0',
        status: 'Actif'
    },
    {
        timestamp: new Date(Date.now() - 57600000).toISOString(),
        crypto: 'uniswap',
        signal: 'BUY',
        type: 'Entry',
        price: 12.45,
        score: 78,
        confidence: 76,
        reason: 'DEX leader, MVRV 0.88, Croissance addr. +16.9%',
        status: 'Actif'
    },
    {
        timestamp: new Date(Date.now() - 64800000).toISOString(),
        crypto: 'avalanche',
        signal: 'HOLD',
        type: 'Monitor',
        price: 42.35,
        score: 77,
        confidence: 72,
        reason: 'MVRV légèrement élevé 1.05, attendre correction',
        status: 'Actif'
    }
];

// ===== SIGNAL HISTORY =====
const signalHistory = [
    {
        date: '2024-10-15',
        crypto: 'Solana',
        signal: 'BUY',
        entryPrice: 132.50,
        exitPrice: 158.30,
        duration: '12 jours',
        result: 19.47,
        success: true
    },
    {
        date: '2024-10-08',
        crypto: 'Polygon',
        signal: 'BUY',
        entryPrice: 0.78,
        exitPrice: 0.74,
        duration: '8 jours',
        result: -5.13,
        success: false
    },
    {
        date: '2024-09-28',
        crypto: 'Arbitrum',
        signal: 'STRONG BUY',
        entryPrice: 0.92,
        exitPrice: 1.35,
        duration: '18 jours',
        result: 46.74,
        success: true
    },
    {
        date: '2024-09-20',
        crypto: 'Aave',
        signal: 'BUY',
        entryPrice: 198.40,
        exitPrice: 234.50,
        duration: '15 jours',
        result: 18.19,
        success: true
    },
    {
        date: '2024-09-12',
        crypto: 'Chainlink',
        signal: 'HOLD',
        entryPrice: 16.80,
        exitPrice: 17.90,
        duration: '22 jours',
        result: 6.55,
        success: true
    },
    {
        date: '2024-08-30',
        crypto: 'Uniswap',
        signal: 'BUY',
        entryPrice: 8.90,
        exitPrice: 11.20,
        duration: '14 jours',
        result: 25.84,
        success: true
    },
    {
        date: '2024-08-18',
        crypto: 'Render',
        signal: 'STRONG BUY',
        entryPrice: 5.20,
        exitPrice: 9.40,
        duration: '25 jours',
        result: 80.77,
        success: true
    },
    {
        date: '2024-08-05',
        crypto: 'Ethereum',
        signal: 'BUY',
        entryPrice: 2980.00,
        exitPrice: 3120.00,
        duration: '10 jours',
        result: 4.70,
        success: true
    }
];

// ===== NEW ENTRANTS =====
const newEntrants = [
    {
        id: 'immutable-x',
        name: 'Immutable X',
        symbol: 'IMX',
        score: 83,
        entryDate: new Date(Date.now() - 86400000).toISOString(),
        reason: 'Croissance adresses actives exceptionnelle +38.2%',
        highlight: true
    },
    {
        id: 'fetch-ai',
        name: 'Fetch.ai',
        symbol: 'FET',
        score: 82,
        entryDate: new Date(Date.now() - 129600000).toISOString(),
        reason: 'Score atteint 82, secteur AI en forte croissance',
        highlight: true
    },
    {
        id: 'curve-dao-token',
        name: 'Curve DAO',
        symbol: 'CRV',
        score: 81,
        entryDate: new Date(Date.now() - 172800000).toISOString(),
        reason: 'MVRV 0.72 (sous-évaluation), TVL solide $4.2B',
        highlight: true
    }
];

// ===== ACTIVE ALERTS CONFIGURATION =====
const activeAlerts = [
    {
        id: 1,
        type: 'Nouvelle opportunité',
        condition: 'Score ≥ 70',
        crypto: 'Toutes',
        notifications: ['Dashboard', 'Email'],
        status: 'Actif'
    },
    {
        id: 2,
        type: 'Score atteint un seuil',
        condition: 'Score ≥ 85',
        crypto: 'Ethereum',
        notifications: ['Dashboard', 'Email', 'Push'],
        status: 'Actif'
    },
    {
        id: 3,
        type: 'MVRV franchit une zone',
        condition: 'MVRV < 0.7',
        crypto: 'Toutes',
        notifications: ['Dashboard', 'Email'],
        status: 'Actif'
    },
    {
        id: 4,
        type: 'Dégradation de score',
        condition: 'Baisse > 15 points',
        crypto: 'Portfolio',
        notifications: ['Dashboard', 'Email', 'Telegram'],
        status: 'Actif'
    }
];

// ===== PORTFOLIO ALERTS =====
const portfolioAlerts = [
    {
        type: 'warning',
        message: 'Ethereum: Prix approche zone de surévaluation (MVRV proche de 1.0)',
        timestamp: new Date(Date.now() - 7200000).toISOString()
    },
    {
        type: 'success',
        message: 'Arbitrum: Score augmente de 82 → 85, signal STRONG BUY confirmé',
        timestamp: new Date(Date.now() - 14400000).toISOString()
    },
    {
        type: 'info',
        message: 'Portfolio: Diversification sectorielle bonne (4 secteurs)',
        timestamp: new Date(Date.now() - 21600000).toISOString()
    },
    {
        type: 'warning',
        message: 'Chainlink: Volume 24h en baisse de 18%, surveiller',
        timestamp: new Date(Date.now() - 28800000).toISOString()
    }
];

// ===== HELPER FUNCTIONS =====
function getCryptoById(id) {
    return cryptoDatabase.find(crypto => crypto.id === id);
}

function getOpportunities(minScore = 70) {
    return cryptoDatabase.filter(crypto => crypto.score >= minScore)
        .sort((a, b) => b.score - a.score);
}

function filterCryptos(category = 'all', mcap = 'all', minScore = 70, signal = 'all') {
    let filtered = cryptoDatabase.filter(crypto => crypto.score >= minScore);

    if (category !== 'all') {
        filtered = filtered.filter(crypto => crypto.category === category);
    }

    if (mcap !== 'all') {
        const ranges = {
            small: [50000000, 500000000],
            medium: [500000000, 5000000000],
            large: [5000000000, 50000000000],
            mega: [50000000000, Infinity]
        };
        const [min, max] = ranges[mcap];
        filtered = filtered.filter(crypto => crypto.marketCap >= min && crypto.marketCap < max);
    }

    if (signal !== 'all') {
        filtered = filtered.filter(crypto => getSignal(crypto.score) === signal);
    }

    return filtered.sort((a, b) => b.score - a.score);
}

function getSignal(score) {
    if (score >= 80) return 'strong-buy';
    if (score >= 75) return 'buy';
    if (score >= 70) return 'hold';
    if (score >= 60) return 'watch';
    return 'sell';
}

function getSignalLabel(score) {
    const signal = getSignal(score);
    const labels = {
        'strong-buy': 'STRONG BUY',
        'buy': 'BUY',
        'hold': 'HOLD',
        'watch': 'WATCH',
        'sell': 'SELL'
    };
    return labels[signal];
}

function formatNumber(num, decimals = 2) {
    if (num >= 1000000000) {
        return '$' + (num / 1000000000).toFixed(decimals) + 'B';
    }
    if (num >= 1000000) {
        return '$' + (num / 1000000).toFixed(decimals) + 'M';
    }
    if (num >= 1000) {
        return '$' + (num / 1000).toFixed(decimals) + 'K';
    }
    return '$' + num.toFixed(decimals);
}

function formatPercent(num) {
    const sign = num >= 0 ? '+' : '';
    return sign + num.toFixed(2) + '%';
}

function generateSparklineData(days = 30) {
    const data = [];
    let value = 100;
    for (let i = 0; i < days; i++) {
        value += (Math.random() - 0.45) * 10;
        data.push(Math.max(50, Math.min(150, value)));
    }
    return data;
}

function generatePriceHistory(basePrice, days = 90) {
    const data = [];
    let price = basePrice * 0.85;
    for (let i = 0; i < days; i++) {
        price += (Math.random() - 0.4) * (basePrice * 0.02);
        data.push({
            date: new Date(Date.now() - (days - i) * 86400000),
            price: Math.max(price * 0.5, price)
        });
    }
    return data;
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cryptoDatabase,
        portfolioData,
        activeSignals,
        signalHistory,
        newEntrants,
        activeAlerts,
        portfolioAlerts,
        getCryptoById,
        getOpportunities,
        filterCryptos,
        getSignal,
        getSignalLabel,
        formatNumber,
        formatPercent,
        generateSparklineData,
        generatePriceHistory
    };
}
