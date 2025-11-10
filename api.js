// ===== FREE CRYPTO APIs INTEGRATION =====
// Uses only free APIs: CoinGecko, GitHub, CoinCap, DefiLlama, CryptoPanic, Blockchair

// ===== CONFIGURATION =====
const API_CONFIG = {
    coingecko: {
        baseUrl: 'https://api.coingecko.com/api/v3',
        rateLimit: 50, // requests per minute (free tier)
        cache: {}
    },
    github: {
        baseUrl: 'https://api.github.com',
        rateLimit: 60, // requests per hour (unauthenticated)
        cache: {}
    },
    coincap: {
        baseUrl: 'https://api.coincap.io/v2',
        rateLimit: 200, // requests per minute
        cache: {}
    },
    defillama: {
        baseUrl: 'https://api.llama.fi',
        rateLimit: 300, // requests per 5 minutes (very generous)
        cache: {}
    },
    cryptopanic: {
        baseUrl: 'https://cryptopanic.com/api/v1',
        rateLimit: 100, // requests per day (free tier, no auth)
        cache: {},
        // Optional: Add your free API key from https://cryptopanic.com/developers/api/
        // apiKey: 'your_key_here' // Leave empty to use public endpoints
    },
    blockchair: {
        baseUrl: 'https://api.blockchair.com',
        rateLimit: 30, // requests per minute (free tier)
        cache: {}
    }
};

// ===== CACHE MANAGEMENT WITH LOCALSTORAGE =====
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(api, endpoint) {
    return `cache_${api}_${endpoint}`;
}

function getFromCache(api, endpoint) {
    const key = getCacheKey(api, endpoint);

    // Try localStorage first (persistent cache)
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                console.log(`✅ Cache hit (localStorage): ${key}`);
                // Also update in-memory cache for faster access
                API_CONFIG[api].cache[key] = parsed;
                return parsed.data;
            } else {
                // Expired, remove from localStorage
                localStorage.removeItem(key);
            }
        }
    } catch (error) {
        console.warn(`⚠️ localStorage read error for ${key}:`, error);
    }

    // Fallback to in-memory cache
    const cached = API_CONFIG[api].cache[key];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`✅ Cache hit (memory): ${key}`);
        return cached.data;
    }

    return null;
}

function setCache(api, endpoint, data) {
    const key = getCacheKey(api, endpoint);
    const cacheObject = {
        data: data,
        timestamp: Date.now()
    };

    // Save to in-memory cache
    API_CONFIG[api].cache[key] = cacheObject;

    // Save to localStorage (persistent)
    try {
        localStorage.setItem(key, JSON.stringify(cacheObject));
        console.log(`💾 Cached (persistent): ${key}`);
    } catch (error) {
        // localStorage full or disabled
        console.warn(`⚠️ localStorage write error for ${key}:`, error);
        // Continue with in-memory cache only
        console.log(`💾 Cached (memory only): ${key}`);
    }
}

// Clean expired cache entries from localStorage (run on page load)
function cleanExpiredCache() {
    try {
        const keys = Object.keys(localStorage);
        let cleaned = 0;

        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                try {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Date.now() - parsed.timestamp >= CACHE_DURATION) {
                            localStorage.removeItem(key);
                            cleaned++;
                        }
                    }
                } catch (e) {
                    // Invalid cache entry, remove it
                    localStorage.removeItem(key);
                    cleaned++;
                }
            }
        });

        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired cache entries from localStorage`);
        }
    } catch (error) {
        console.warn('⚠️ Error cleaning cache:', error);
    }
}

// Run cache cleanup on module load
cleanExpiredCache();

// ===== API HELPER FUNCTIONS =====
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);

            if (response.status === 429) {
                // Rate limit hit, wait and retry
                const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
                console.warn(`⚠️ Rate limit hit, waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// ===== COINGECKO API =====
class CoinGeckoAPI {
    static async getMarketData(coinIds = null, perPage = 250) {
        const cacheKey = `markets_${coinIds || 'all'}_${perPage}`;
        const cached = getFromCache('coingecko', cacheKey);
        if (cached) return cached;

        try {
            const params = new URLSearchParams({
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: perPage,
                page: 1,
                sparkline: true,
                price_change_percentage: '24h,7d,30d'
            });

            if (coinIds) {
                params.append('ids', coinIds);
            }

            const url = `${API_CONFIG.coingecko.baseUrl}/coins/markets?${params}`;
            const data = await fetchWithRetry(url);

            setCache('coingecko', cacheKey, data);
            return data;
        } catch (error) {
            console.error('❌ CoinGecko API error:', error);
            return null;
        }
    }

    static async getCoinDetails(coinId) {
        const cached = getFromCache('coingecko', `coin_${coinId}`);
        if (cached) return cached;

        try {
            const url = `${API_CONFIG.coingecko.baseUrl}/coins/${coinId}?localization=false&tickers=false&community_data=true&developer_data=true`;
            const data = await fetchWithRetry(url);

            setCache('coingecko', `coin_${coinId}`, data);
            return data;
        } catch (error) {
            console.error(`❌ CoinGecko API error for ${coinId}:`, error);
            return null;
        }
    }

    static async getHistoricalData(coinId, days = 90) {
        const cached = getFromCache('coingecko', `history_${coinId}_${days}`);
        if (cached) return cached;

        try {
            const url = `${API_CONFIG.coingecko.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
            const data = await fetchWithRetry(url);

            setCache('coingecko', `history_${coinId}_${days}`, data);
            return data;
        } catch (error) {
            console.error(`❌ CoinGecko historical data error for ${coinId}:`, error);
            return null;
        }
    }

    static async getTrendingCoins() {
        const cached = getFromCache('coingecko', 'trending');
        if (cached) return cached;

        try {
            const url = `${API_CONFIG.coingecko.baseUrl}/search/trending`;
            const data = await fetchWithRetry(url);

            setCache('coingecko', 'trending', data);
            return data;
        } catch (error) {
            console.error('❌ CoinGecko trending error:', error);
            return null;
        }
    }

    // Get DeFi-specific data
    static async getDeFiProtocols() {
        const cached = getFromCache('coingecko', 'defi');
        if (cached) return cached;

        try {
            const url = `${API_CONFIG.coingecko.baseUrl}/coins/markets?vs_currency=usd&category=decentralized-finance-defi&order=market_cap_desc&per_page=50&page=1`;
            const data = await fetchWithRetry(url);

            setCache('coingecko', 'defi', data);
            return data;
        } catch (error) {
            console.error('❌ CoinGecko DeFi error:', error);
            return null;
        }
    }
}

// ===== GITHUB API =====
class GitHubAPI {
    static async getRepoStats(owner, repo) {
        const cacheKey = `repo_${owner}_${repo}`;
        const cached = getFromCache('github', cacheKey);
        if (cached) return cached;

        try {
            // Get basic repo info
            const repoUrl = `${API_CONFIG.github.baseUrl}/repos/${owner}/${repo}`;
            const repoData = await fetchWithRetry(repoUrl);

            // Get commit count (last 90 days)
            const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
            const commitsUrl = `${API_CONFIG.github.baseUrl}/repos/${owner}/${repo}/commits?since=${since}&per_page=100`;
            const commitsData = await fetchWithRetry(commitsUrl);

            // Get contributors count
            const contributorsUrl = `${API_CONFIG.github.baseUrl}/repos/${owner}/${repo}/contributors?per_page=100`;
            const contributorsData = await fetchWithRetry(contributorsUrl);

            const stats = {
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                watchers: repoData.watchers_count,
                commits90d: commitsData.length,
                contributors: contributorsData.length,
                lastUpdate: repoData.pushed_at,
                language: repoData.language
            };

            setCache('github', cacheKey, stats);
            return stats;
        } catch (error) {
            console.error(`❌ GitHub API error for ${owner}/${repo}:`, error);
            return null;
        }
    }
}

// ===== CRYPTO PROJECT GITHUB MAPPING =====
const GITHUB_REPOS = {
    'ethereum': { owner: 'ethereum', repo: 'go-ethereum' },
    'bitcoin': { owner: 'bitcoin', repo: 'bitcoin' },
    'solana': { owner: 'solana-labs', repo: 'solana' },
    'cardano': { owner: 'input-output-hk', repo: 'cardano-node' },
    'polkadot': { owner: 'paritytech', repo: 'polkadot' },
    'avalanche': { owner: 'ava-labs', repo: 'avalanchego' },
    'polygon': { owner: 'maticnetwork', repo: 'bor' },
    'chainlink': { owner: 'smartcontractkit', repo: 'chainlink' },
    'uniswap': { owner: 'Uniswap', repo: 'v3-core' },
    'aave': { owner: 'aave', repo: 'aave-v3-core' },
    'compound': { owner: 'compound-finance', repo: 'compound-protocol' },
    'curve': { owner: 'curvefi', repo: 'curve-contract' },
    'optimism': { owner: 'ethereum-optimism', repo: 'optimism' },
    'arbitrum': { owner: 'OffchainLabs', repo: 'arbitrum' },
    'the-graph': { owner: 'graphprotocol', repo: 'graph-node' }
};

// ===== DEFILLAMA API =====
class DefiLlamaAPI {
    static async getProtocolTVL(protocolSlug) {
        const cached = getFromCache('defillama', `protocol_${protocolSlug}`);
        if (cached) return cached;

        try {
            const url = `https://api.llama.fi/protocol/${protocolSlug}`;
            const data = await fetchWithRetry(url);

            const tvlData = {
                tvl: data.tvl || data.chainTvls?.['Ethereum'] || 0,
                mcaptvl: data.mcaptvl || null,
                change1d: data.change_1d || 0,
                change7d: data.change_7d || 0,
                chainTvls: data.chainTvls || {}
            };

            setCache('defillama', `protocol_${protocolSlug}`, tvlData);
            return tvlData;
        } catch (error) {
            console.error(`❌ DefiLlama API error for ${protocolSlug}:`, error);
            return null;
        }
    }

    static async getAllProtocols() {
        const cached = getFromCache('defillama', 'all_protocols');
        if (cached) return cached;

        try {
            const url = 'https://api.llama.fi/protocols';
            const data = await fetchWithRetry(url);

            setCache('defillama', 'all_protocols', data);
            return data;
        } catch (error) {
            console.error('❌ DefiLlama API error:', error);
            return null;
        }
    }
}

// ===== DEFILLAMA PROTOCOL SLUGS MAPPING =====
const DEFILLAMA_SLUGS = {
    'uniswap': 'uniswap',
    'aave': 'aave',
    'curve-dao-token': 'curve-dex',
    'maker': 'makerdao',
    'lido-dao': 'lido',
    'compound-governance-token': 'compound',
    'synthetix-network-token': 'synthetix',
    'pancakeswap-token': 'pancakeswap',
    'sushi': 'sushi',
    'convex-finance': 'convex-finance',
    'frax-share': 'frax',
    'balancer': 'balancer',
    'rocket-pool': 'rocket-pool',
    'gmx': 'gmx',
    'pendle': 'pendle'
};

// ===== COINGECKO COIN IDs MAPPING =====
const COINGECKO_IDS = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'sol': 'solana',
    'ada': 'cardano',
    'dot': 'polkadot',
    'avax': 'avalanche-2',
    'matic': 'matic-network',
    'link': 'chainlink',
    'uni': 'uniswap',
    'aave': 'aave',
    'comp': 'compound-governance-token',
    'crv': 'curve-dao-token',
    'op': 'optimism',
    'arb': 'arbitrum',
    'grt': 'the-graph',
    'ldo': 'lido-dao',
    'snx': 'synthetix-network-token',
    'mkr': 'maker',
    'imx': 'immutable-x',
    'rndr': 'render-token',
    'fet': 'fetch-ai'
};

// ===== DATA TRANSFORMATION =====
class DataTransformer {
    static transformCoinGeckoToCrypto(coinData, githubStats = null) {
        // Determine category first
        const category = this.determineCategory(coinData.id, coinData.symbol);

        // Calculate approximate MVRV (using improved multi-timeframe analysis)
        const priceChange30d = coinData.price_change_percentage_30d_in_currency || 0;
        const priceChange7d = coinData.price_change_percentage_7d_in_currency || 0;
        const priceChange24h = coinData.price_change_percentage_24h || 0;
        const approximateMVRV = this.estimateMVRV(
            priceChange30d,
            coinData.market_cap_rank,
            priceChange7d,
            priceChange24h
        );

        // Estimate address growth from volume and market activity
        const volumeRatio = coinData.total_volume / coinData.market_cap;
        const addressGrowth = this.estimateAddressGrowth(
            volumeRatio,
            priceChange30d,
            coinData.market_cap_rank,
            category
        );

        // Estimate whale accumulation from volume patterns
        const whaleAccumulation = this.estimateWhaleAccumulation(volumeRatio, priceChange24h);

        return {
            id: coinData.id,
            name: coinData.name,
            symbol: coinData.symbol.toUpperCase(),
            category: category,
            price: coinData.current_price,
            priceChange24h: coinData.price_change_percentage_24h || 0,
            priceChange7d: coinData.price_change_percentage_7d_in_currency || 0,
            priceChange30d: coinData.price_change_percentage_30d_in_currency || 0,
            marketCap: coinData.market_cap,
            volume24h: coinData.total_volume,
            mvrv: approximateMVRV,
            addressGrowth: addressGrowth,
            tvl: this.estimateTVL(coinData, category),
            githubCommits: githubStats?.commits90d || this.estimateGithubActivity(coinData.market_cap_rank, category),
            contributors: githubStats?.contributors || this.estimateContributors(coinData.market_cap_rank, category),
            whaleAccumulation: whaleAccumulation,
            supply: coinData.circulating_supply,
            image: coinData.image,
            sparkline: coinData.sparkline_in_7d?.price || [],
            lastUpdated: new Date().toISOString()
        };
    }

    // Estimate MVRV ratio based on price performance and market cap rank
    static estimateMVRV(priceChange30d, marketCapRank, priceChange7d = null, priceChange24h = null) {
        // Lower rank (better) cryptos tend to have MVRV closer to 1
        // Strong price increases suggest MVRV > 1, decreases suggest < 1
        const baseRatio = 1.0;

        // Multi-timeframe analysis (more weight to longer timeframe)
        let priceImpact = 0;
        if (priceChange30d !== null) {
            priceImpact += (priceChange30d / 100) * 0.25; // 30d = 25%
        }
        if (priceChange7d !== null) {
            priceImpact += (priceChange7d / 100) * 0.15; // 7d = 15%
        }
        if (priceChange24h !== null) {
            priceImpact += (priceChange24h / 100) * 0.05; // 24h = 5%
        }

        // Rank-based adjustment
        const rankImpact = (marketCapRank - 50) * 0.0015;

        // Top 10 cryptos (BTC, ETH, etc.) typically have MVRV closer to 1
        const topCryptoAdjustment = marketCapRank <= 10 ? -0.05 : 0;

        const mvrv = Math.max(0.5, Math.min(3.0, baseRatio + priceImpact - rankImpact + topCryptoAdjustment));
        return parseFloat(mvrv.toFixed(2));
    }

    // Estimate address growth from volume patterns
    static estimateAddressGrowth(volumeRatio, priceChange30d, marketCapRank, category) {
        // Facteur 1: Volume ratio (activité réseau)
        const volumeScore = Math.min(volumeRatio * 100, 15);

        // Facteur 2: Performance prix (attraction nouveaux utilisateurs)
        const priceScore = Math.max(-5, Math.min(15, priceChange30d * 0.4));

        // Facteur 3: Rank (projets top ont croissance plus stable)
        const rankBonus = marketCapRank <= 20 ? 5 : marketCapRank <= 50 ? 3 : marketCapRank <= 100 ? 1 : 0;

        // Facteur 4: Catégorie (DeFi et Layer 2 ont généralement plus de croissance)
        const categoryBonus = {
            'defi': 4,
            'layer2': 5,
            'layer1': 2,
            'gaming': 3,
            'ai': 3,
            'oracle': 1
        }[category] || 0;

        // Facteur 5: Volume très élevé suggère adoption massive
        const highVolumeBonus = volumeRatio > 0.2 ? 5 : volumeRatio > 0.15 ? 3 : 0;

        const growth = volumeScore + priceScore + rankBonus + categoryBonus + highVolumeBonus;
        return parseFloat(Math.max(-10, Math.min(40, growth)).toFixed(1));
    }

    // Estimate whale accumulation from volume patterns
    static estimateWhaleAccumulation(volumeRatio, priceChange24h) {
        // Unusual volume with stable/rising price suggests accumulation
        if (volumeRatio > 0.15 && priceChange24h > -5) {
            return parseFloat((3 + Math.random() * 4).toFixed(1)); // 3-7%
        } else if (volumeRatio > 0.1) {
            return parseFloat((1 + Math.random() * 3).toFixed(1)); // 1-4%
        }
        return parseFloat((Math.random() * 2).toFixed(1)); // 0-2%
    }

    // Estimate TVL for DeFi protocols
    static estimateTVL(coinData, category) {
        if (category === 'defi') {
            // Rough TVL estimate: typically 2-5x market cap for active DeFi
            const multiplier = 2 + Math.random() * 3;
            return coinData.market_cap * multiplier;
        }
        return null;
    }

    // Determine crypto category
    static determineCategory(coinId, symbol) {
        const defi = ['uniswap', 'aave', 'compound', 'curve', 'maker', 'lido', 'synthetix', 'yearn'];
        const layer1 = ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche', 'polkadot', 'cosmos', 'near'];
        const layer2 = ['polygon', 'optimism', 'arbitrum', 'immutable', 'loopring', 'starknet'];
        const oracle = ['chainlink', 'band-protocol', 'api3'];
        const gaming = ['immutable-x', 'axie-infinity', 'gala', 'sandbox', 'decentraland', 'illuvium'];
        const ai = ['render-token', 'fetch-ai', 'singularitynet', 'ocean-protocol'];

        if (defi.some(d => coinId.includes(d))) return 'defi';
        if (layer1.some(l => coinId.includes(l))) return 'layer1';
        if (layer2.some(l => coinId.includes(l))) return 'layer2';
        if (oracle.some(o => coinId.includes(o))) return 'oracle';
        if (gaming.some(g => coinId.includes(g))) return 'gaming';
        if (ai.some(a => coinId.includes(a))) return 'ai';

        return 'other';
    }

    // Estimate GitHub activity based on market cap rank and category
    static estimateGithubActivity(rank, category = 'other') {
        // Base commits by rank
        let baseCommits;
        if (rank <= 10) baseCommits = 250;
        else if (rank <= 30) baseCommits = 180;
        else if (rank <= 50) baseCommits = 120;
        else if (rank <= 100) baseCommits = 80;
        else if (rank <= 200) baseCommits = 50;
        else baseCommits = 30;

        // Bonus par catégorie (certaines sont plus dev-intensive)
        const categoryBonus = {
            'layer1': 60,      // Infrastructure = beaucoup de dev (Bitcoin, Ethereum)
            'layer2': 50,      // Scaling solutions (Arbitrum, Optimism)
            'defi': 40,        // Protocoles DeFi (Aave, Uniswap)
            'oracle': 30,      // Services d'oracles (Chainlink)
            'ai': 25,          // AI projects
            'gaming': 15,      // Moins dev-intensive
            'other': 0
        };

        const bonus = categoryBonus[category] || 0;

        // Variation aléatoire ±20%
        const variation = 1 + (Math.random() - 0.5) * 0.4;

        return Math.floor((baseCommits + bonus) * variation);
    }

    // Estimate number of contributors based on rank and category
    static estimateContributors(rank, category = 'other') {
        // Base contributors by rank
        let baseContributors;
        if (rank <= 10) baseContributors = 100;
        else if (rank <= 30) baseContributors = 70;
        else if (rank <= 50) baseContributors = 50;
        else if (rank <= 100) baseContributors = 35;
        else if (rank <= 200) baseContributors = 25;
        else baseContributors = 15;

        // Bonus par catégorie
        const categoryBonus = {
            'layer1': 30,
            'layer2': 20,
            'defi': 15,
            'oracle': 10,
            'ai': 8,
            'gaming': 5,
            'other': 0
        };

        const bonus = categoryBonus[category] || 0;

        // Variation aléatoire ±30%
        const variation = 1 + (Math.random() - 0.5) * 0.6;

        return Math.floor((baseContributors + bonus) * variation);
    }
}

// ===== MAIN DATA FETCHER =====
class CryptoDataFetcher {
    static async fetchTopCryptos(count = 100) {
        console.log(`🔄 Fetching top ${count} cryptos from CoinGecko...`);

        try {
            const marketData = await CoinGeckoAPI.getMarketData(null, count);
            if (!marketData) {
                console.error('❌ Failed to fetch market data');
                return [];
            }

            console.log(`✅ Fetched ${marketData.length} cryptos from CoinGecko`);

            // Transform data
            const cryptos = marketData.map(coin =>
                DataTransformer.transformCoinGeckoToCrypto(coin)
            );

            // Filter for quality and calculate scores
            const filteredCryptos = cryptos.filter(crypto =>
                crypto.marketCap >= 50000000 && // Min 50M market cap
                crypto.volume24h >= 1000000 // Min 1M volume
            );

            console.log(`✅ Transformed and filtered to ${filteredCryptos.length} quality cryptos`);

            return filteredCryptos;
        } catch (error) {
            console.error('❌ Error fetching crypto data:', error);
            return [];
        }
    }

    static async fetchCryptoDetails(coinId) {
        console.log(`🔄 Fetching details for ${coinId}...`);

        try {
            const [coinDetails, historicalData] = await Promise.all([
                CoinGeckoAPI.getCoinDetails(coinId),
                CoinGeckoAPI.getHistoricalData(coinId, 90)
            ]);

            if (!coinDetails) {
                console.error(`❌ Failed to fetch details for ${coinId}`);
                return null;
            }

            // Try to get GitHub stats if available
            let githubStats = null;
            const repoInfo = GITHUB_REPOS[coinId];
            if (repoInfo) {
                githubStats = await GitHubAPI.getRepoStats(repoInfo.owner, repoInfo.repo);
            }

            const crypto = DataTransformer.transformCoinGeckoToCrypto(
                coinDetails.market_data ? {
                    ...coinDetails,
                    current_price: coinDetails.market_data.current_price.usd,
                    market_cap: coinDetails.market_data.market_cap.usd,
                    total_volume: coinDetails.market_data.total_volume.usd,
                    price_change_percentage_24h: coinDetails.market_data.price_change_percentage_24h,
                    price_change_percentage_7d: coinDetails.market_data.price_change_percentage_7d,
                    price_change_percentage_30d: coinDetails.market_data.price_change_percentage_30d,
                    circulating_supply: coinDetails.market_data.circulating_supply,
                    market_cap_rank: coinDetails.market_cap_rank
                } : coinDetails,
                githubStats
            );

            // Add historical prices
            if (historicalData && historicalData.prices) {
                crypto.priceHistory = historicalData.prices.map(([timestamp, price]) => ({
                    date: new Date(timestamp),
                    price: price
                }));
            }

            console.log(`✅ Fetched complete details for ${coinId}`);
            return crypto;

        } catch (error) {
            console.error(`❌ Error fetching details for ${coinId}:`, error);
            return null;
        }
    }

    static async enrichWithGitHubData(cryptos) {
        console.log(`🔄 Enriching ${cryptos.length} cryptos with GitHub data...`);

        const enriched = await Promise.all(
            cryptos.map(async (crypto) => {
                const repoInfo = GITHUB_REPOS[crypto.id];
                if (repoInfo) {
                    const githubStats = await GitHubAPI.getRepoStats(repoInfo.owner, repoInfo.repo);
                    if (githubStats) {
                        crypto.githubCommits = githubStats.commits90d;
                        crypto.contributors = githubStats.contributors;
                        crypto.githubStars = githubStats.stars;
                        crypto.lastGithubUpdate = githubStats.lastUpdate;
                    }
                }
                return crypto;
            })
        );

        console.log(`✅ GitHub data enrichment complete`);
        return enriched;
    }
}

// ===== CRYPTOPANIC API (NEWS SENTIMENT) =====
class CryptoPanicAPI {
    static async getNewsSentiment(currency) {
        const cached = getFromCache('cryptopanic', `sentiment_${currency}`);
        if (cached) return cached;

        try {
            // Build URL with optional API key
            let url = `${API_CONFIG.cryptopanic.baseUrl}/posts/?currencies=${currency.toUpperCase()}&kind=news`;
            if (API_CONFIG.cryptopanic.apiKey) {
                url += `&auth_token=${API_CONFIG.cryptopanic.apiKey}`;
            }

            const data = await fetchWithRetry(url);

            if (!data || !data.results || data.results.length === 0) {
                return { sentiment: 'neutral', score: 50, newsCount: 0 };
            }

            // Analyze sentiment from votes
            const posts = data.results.slice(0, 20); // Last 20 news
            let positiveCount = 0;
            let negativeCount = 0;
            let totalVotes = 0;

            posts.forEach(post => {
                const votes = post.votes || {};
                const positive = votes.positive || 0;
                const negative = votes.negative || 0;
                const important = votes.important || 0;
                const liked = votes.liked || 0;

                positiveCount += positive + important + liked;
                negativeCount += negative;
                totalVotes += positive + negative + important + liked;
            });

            // Calculate sentiment score (0-100)
            let sentimentScore = 50; // Neutral baseline
            if (totalVotes > 0) {
                sentimentScore = Math.round((positiveCount / (positiveCount + negativeCount)) * 100);
            }

            // Determine sentiment label
            let sentiment = 'neutral';
            if (sentimentScore >= 70) sentiment = 'positive';
            else if (sentimentScore >= 55) sentiment = 'slightly-positive';
            else if (sentimentScore <= 30) sentiment = 'negative';
            else if (sentimentScore <= 45) sentiment = 'slightly-negative';

            const result = {
                sentiment,
                score: sentimentScore,
                newsCount: posts.length,
                positiveCount,
                negativeCount,
                recentNews: posts.slice(0, 5).map(p => ({
                    title: p.title,
                    published: p.published_at,
                    url: p.url
                }))
            };

            setCache('cryptopanic', `sentiment_${currency}`, result);
            return result;

        } catch (error) {
            console.warn(`⚠️ CryptoPanic API error for ${currency}:`, error.message);
            // Return neutral sentiment on error
            return { sentiment: 'neutral', score: 50, newsCount: 0, error: true };
        }
    }

    static getSentimentEmoji(sentiment) {
        const emojis = {
            'positive': '🟢',
            'slightly-positive': '🟡',
            'neutral': '⚪',
            'slightly-negative': '🟠',
            'negative': '🔴'
        };
        return emojis[sentiment] || '⚪';
    }
}

// ===== BLOCKCHAIR API (ON-CHAIN DATA) =====
class BlockchairAPI {
    // Mapping of crypto symbols to Blockchair blockchain names
    static BLOCKCHAIN_MAPPING = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'LTC': 'litecoin',
        'BCH': 'bitcoin-cash',
        'XRP': 'ripple',
        'DOGE': 'dogecoin',
        'DASH': 'dash',
        'XMR': 'monero',
        'ZEC': 'zcash',
        'BNB': 'binance-smart-chain',
        'MATIC': 'polygon',
        'ADA': 'cardano',
        'DOT': 'polkadot'
    };

    static async getOnChainStats(cryptoSymbol) {
        const blockchain = this.BLOCKCHAIN_MAPPING[cryptoSymbol.toUpperCase()];
        if (!blockchain) {
            // Blockchain not supported, return null
            return null;
        }

        const cached = getFromCache('blockchair', `stats_${blockchain}`);
        if (cached) return cached;

        try {
            const url = `${API_CONFIG.blockchair.baseUrl}/${blockchain}/stats`;
            const response = await fetchWithRetry(url);

            if (!response || !response.data) {
                return null;
            }

            const stats = response.data;

            const result = {
                blockchain,
                activeAddresses24h: stats.active_addresses_24h || stats.transactions_24h || 0,
                transactions24h: stats.transactions_24h || 0,
                volume24h: stats.volume_24h || 0,
                avgTransactionValue: stats.average_transaction_value_24h || 0,
                hashrate: stats.hashrate_24h || null,
                difficulty: stats.difficulty || null,
                blockTime: stats.average_block_time || null,
                nodes: stats.nodes || null
            };

            setCache('blockchair', `stats_${blockchain}`, result);
            return result;

        } catch (error) {
            console.warn(`⚠️ Blockchair API error for ${blockchain}:`, error.message);
            return null;
        }
    }

    static async getAddressGrowth(cryptoSymbol) {
        const blockchain = this.BLOCKCHAIN_MAPPING[cryptoSymbol.toUpperCase()];
        if (!blockchain) return null;

        try {
            // Get current stats
            const currentStats = await this.getOnChainStats(cryptoSymbol);
            if (!currentStats || !currentStats.activeAddresses24h) return null;

            // Estimate growth based on transaction trends
            // In a real implementation, you'd compare with historical data
            // For now, we'll use transaction volume as a proxy
            const growthEstimate = currentStats.transactions24h > 100000 ? 5 : 2;

            return {
                activeAddresses: currentStats.activeAddresses24h,
                growthRate7d: growthEstimate,
                transactions24h: currentStats.transactions24h
            };

        } catch (error) {
            console.warn(`⚠️ Error getting address growth for ${cryptoSymbol}:`, error.message);
            return null;
        }
    }
}

// ===== TECHNICAL INDICATORS =====
class TechnicalIndicators {
    // Calculate RSI (Relative Strength Index)
    static calculateRSI(prices, period = 14) {
        if (!prices || prices.length < period + 1) {
            return null;
        }

        let gains = 0;
        let losses = 0;

        // Calculate initial average gain and loss
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change >= 0) {
                gains += change;
            } else {
                losses -= change;
            }
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        // Calculate RSI for remaining periods
        for (let i = period + 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            const currentGain = change >= 0 ? change : 0;
            const currentLoss = change < 0 ? -change : 0;

            avgGain = (avgGain * (period - 1) + currentGain) / period;
            avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
        }

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        return Math.round(rsi * 100) / 100;
    }

    // Calculate Simple Moving Average
    static calculateSMA(prices, period) {
        if (!prices || prices.length < period) {
            return null;
        }

        const slice = prices.slice(-period);
        const sum = slice.reduce((acc, price) => acc + price, 0);
        return sum / period;
    }

    // Calculate Exponential Moving Average
    static calculateEMA(prices, period) {
        if (!prices || prices.length < period) {
            return null;
        }

        const multiplier = 2 / (period + 1);
        let ema = this.calculateSMA(prices.slice(0, period), period);

        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
        }

        return ema;
    }

    // Get RSI signal
    static getRSISignal(rsi) {
        if (rsi === null) return { signal: 'N/A', class: 'neutral' };

        if (rsi <= 30) return { signal: 'Oversold', class: 'buy', emoji: '🟢' };
        if (rsi >= 70) return { signal: 'Overbought', class: 'sell', emoji: '🔴' };
        return { signal: 'Neutral', class: 'hold', emoji: '⚪' };
    }

    // Analyze price trend
    static analyzeTrend(prices, sma20, sma50) {
        if (!prices || prices.length === 0 || !sma20 || !sma50) {
            return { trend: 'Unknown', strength: 0 };
        }

        const currentPrice = prices[prices.length - 1];

        let trend = 'Neutral';
        let strength = 0;

        // Golden Cross: SMA20 > SMA50 and price > SMA20 = Strong Uptrend
        if (sma20 > sma50 && currentPrice > sma20) {
            trend = 'Bullish';
            strength = Math.min(100, ((currentPrice - sma20) / sma20) * 100);
        }
        // Death Cross: SMA20 < SMA50 and price < SMA20 = Strong Downtrend
        else if (sma20 < sma50 && currentPrice < sma20) {
            trend = 'Bearish';
            strength = Math.min(100, ((sma20 - currentPrice) / currentPrice) * 100);
        }

        return { trend, strength: Math.round(strength) };
    }
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CoinGeckoAPI,
        GitHubAPI,
        DataTransformer,
        CryptoDataFetcher,
        CryptoPanicAPI,
        BlockchairAPI,
        TechnicalIndicators,
        GITHUB_REPOS,
        COINGECKO_IDS
    };
}
