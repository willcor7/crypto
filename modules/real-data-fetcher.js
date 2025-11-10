/**
 * REAL DATA FETCHER MODULE
 * Fetches real historical OHLCV data from CoinGecko API
 * Falls back to simulated data if API fails or rate limited
 */

// ===== REAL DATA FETCHER =====
class RealDataFetcher {
    constructor() {
        this.cache = new Map();

        // Use CONFIG if available, otherwise defaults
        const config = typeof CONFIG !== 'undefined' ? CONFIG : {};
        this.cacheDuration = config.API_CACHE_DURATION_MS || 30 * 60 * 1000;
        this.rateLimitDelay = config.API_RATE_LIMIT_DELAY_MS || 1200;
        this.forceSimulated = config.FORCE_SIMULATED_DATA || false;
        this.useRealAPI = config.USE_REAL_API_DATA !== false; // true by default
        this.showCORSWarning = config.SHOW_CORS_WARNING !== false;

        this.baseUrl = 'https://api.coingecko.com/api/v3';
        this.lastRequestTime = 0;
        this.corsErrorShown = false; // Show CORS warning only once
    }

    /**
     * Fetch OHLCV data for a crypto
     * @param {string} coinId - CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
     * @param {number} days - Number of days of history (default 30)
     * @returns {Promise<Array>} OHLCV array
     */
    async fetchOHLCV(coinId, days = 30) {
        // Force simulated data if configured
        if (this.forceSimulated || !this.useRealAPI) {
            if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG_MODE) {
                console.log(`📊 Using simulated data for ${coinId} (config: FORCE_SIMULATED_DATA=true)`);
            }
            return null; // Will trigger simulated data fallback
        }

        // Check cache first
        const cacheKey = `${coinId}_${days}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            console.log(`📦 Using cached data for ${coinId}`);
            return cached.data;
        }

        // Rate limiting
        await this.respectRateLimit();

        try {
            console.log(`🌐 Fetching real data for ${coinId} (${days} days)...`);

            // Fetch OHLC data from CoinGecko
            const url = `${this.baseUrl}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn('⚠️ Rate limited by CoinGecko API, using simulated data');
                    return null;
                }
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Convert to our OHLCV format
            const ohlcv = data.map(candle => ({
                timestamp: candle[0],
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: 0 // CoinGecko free tier doesn't provide volume in OHLC
            }));

            // Fetch volume data separately
            const volumeData = await this.fetchVolumeData(coinId, days);
            if (volumeData) {
                // Merge volume into OHLCV
                ohlcv.forEach((candle, index) => {
                    if (volumeData[index]) {
                        candle.volume = volumeData[index].volume;
                    }
                });
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: ohlcv,
                timestamp: Date.now()
            });

            console.log(`✅ Fetched ${ohlcv.length} candles for ${coinId}`);
            return ohlcv;

        } catch (error) {
            // Detect CORS error
            const isCORSError = error.message.includes('Failed to fetch') ||
                                error.message.includes('CORS') ||
                                error.message.includes('NetworkError');

            if (isCORSError && this.showCORSWarning && !this.corsErrorShown) {
                this.corsErrorShown = true;
                console.error('🚨 ═══════════════════════════════════════════════════════════════');
                console.error('🚨 ERREUR CORS DÉTECTÉE');
                console.error('🚨 ═══════════════════════════════════════════════════════════════');
                console.error('');
                console.error('❌ Les appels API CoinGecko sont bloqués par CORS.');
                console.error('');
                console.error('📋 SOLUTION : Lancer un serveur HTTP local');
                console.error('');
                console.error('   Windows :');
                console.error('     python -m http.server 8000');
                console.error('     Puis ouvrir http://localhost:8000');
                console.error('');
                console.error('   Linux/Mac :');
                console.error('     python3 -m http.server 8000');
                console.error('     Puis ouvrir http://localhost:8000');
                console.error('');
                console.error('   VS Code :');
                console.error('     Installer l\'extension "Live Server"');
                console.error('     Clic-droit sur index.html → "Open with Live Server"');
                console.error('');
                console.error('📖 Documentation complète : START_HERE.md');
                console.error('');
                console.error('⚙️ Alternative : Désactiver les API');
                console.error('   Dans config.js, mettre : FORCE_SIMULATED_DATA: true');
                console.error('');
                console.error('🚨 ═══════════════════════════════════════════════════════════════');
                console.error(`❌ Error fetching data for ${coinId}:`, error.message);
            } else if (!isCORSError) {
                console.error(`❌ Error fetching data for ${coinId}:`, error.message);
            }

            return null; // Return null to trigger fallback to simulated data
        }
    }

    /**
     * Fetch volume data separately
     */
    async fetchVolumeData(coinId, days) {
        try {
            const url = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
            const response = await fetch(url);

            if (!response.ok) return null;

            const data = await response.json();

            if (data.total_volumes) {
                return data.total_volumes.map(v => ({
                    timestamp: v[0],
                    volume: v[1]
                }));
            }

            return null;

        } catch (error) {
            console.warn(`⚠️ Could not fetch volume data for ${coinId}`);
            return null;
        }
    }

    /**
     * Respect rate limits (50 requests per minute for free tier)
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
            await this.sleep(waitTime);
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Map common crypto symbols to CoinGecko IDs
     */
    getCoinGeckoId(symbol) {
        const mapping = {
            'btc': 'bitcoin',
            'eth': 'ethereum',
            'bnb': 'binancecoin',
            'sol': 'solana',
            'ada': 'cardano',
            'xrp': 'ripple',
            'dot': 'polkadot',
            'doge': 'dogecoin',
            'avax': 'avalanche-2',
            'matic': 'matic-network',
            'link': 'chainlink',
            'uni': 'uniswap',
            'ltc': 'litecoin',
            'atom': 'cosmos',
            'etc': 'ethereum-classic',
            'xlm': 'stellar',
            'near': 'near',
            'algo': 'algorand',
            'vet': 'vechain',
            'icp': 'internet-computer',
            'apt': 'aptos',
            'arb': 'arbitrum',
            'op': 'optimism',
            'imx': 'immutable-x',
            'inj': 'injective-protocol',
            // DeFi tokens
            'crv': 'curve-dao-token',
            'aave': 'aave',
            'snx': 'synthetix-network-token',
            'ldo': 'lido-dao',
            // AI/Render tokens
            'rndr': 'render-token',
            'fet': 'fetch-ai'
        };

        return mapping[symbol.toLowerCase()] || symbol.toLowerCase();
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }
}

// ===== HYBRID DATA BUILDER =====
/**
 * Combines real API data with fallback to simulated data
 */
class HybridDataBuilder {
    constructor(crypto) {
        this.crypto = crypto;
        this.fetcher = new RealDataFetcher();
    }

    /**
     * Build technical data using real API data when available
     */
    async build() {
        const coinGeckoId = this.fetcher.getCoinGeckoId(this.crypto.symbol);

        // Try to fetch real data first
        let ohlcv1h = await this.fetcher.fetchOHLCV(coinGeckoId, 30);
        let ohlcv4h = null;

        // If real data fetching failed or returned null, use simulated data
        if (!ohlcv1h || ohlcv1h.length === 0) {
            console.log(`📊 Using simulated data for ${this.crypto.symbol}`);
            const generator = new OHLCVGenerator(this.crypto);
            ohlcv1h = generator.generate(200, '1h');
            ohlcv4h = generator.generate(100, '4h');
        } else {
            // Real data fetched successfully
            console.log(`✅ Using real data for ${this.crypto.symbol}`);

            // Convert daily data to hourly-like (resample)
            ohlcv1h = this.resampleToHourly(ohlcv1h);

            // Create 4h data by aggregating 1h
            ohlcv4h = this.aggregateTo4H(ohlcv1h);
        }

        // Run technical analysis
        const trend = this.analyzeTrend(ohlcv4h || ohlcv1h);
        const structure = this.analyzeStructure(ohlcv1h);
        const rsi = this.calculateRSI(ohlcv1h);
        const fibonacci = this.analyzeFibonacci(ohlcv1h, structure.swings);
        const volumeProfile = this.analyzeVolumeProfile(ohlcv1h);

        return {
            ohlcv: {
                '1h': ohlcv1h,
                '4h': ohlcv4h
            },
            trend: trend,
            bos: structure.bos,
            choch: structure.choch,
            swings: structure.swings,
            orderBlocks: structure.orderBlocks,
            fvgs: structure.fvgs,
            rsi: rsi,
            fibonacci: fibonacci,
            volumeProfile: volumeProfile,
            dataSource: ohlcv1h.length > 30 ? 'REAL' : 'SIMULATED',
            generated: Date.now()
        };
    }

    /**
     * Resample daily data to approximate hourly
     */
    resampleToHourly(dailyOHLCV) {
        const hourlyOHLCV = [];

        dailyOHLCV.forEach(day => {
            // Create 24 hourly candles from daily
            for (let hour = 0; hour < 24; hour++) {
                const hourTimestamp = day.timestamp + (hour * 60 * 60 * 1000);

                // Interpolate price movement throughout the day
                const progress = hour / 24;
                const priceRange = day.close - day.open;
                const currentPrice = day.open + (priceRange * progress);

                hourlyOHLCV.push({
                    timestamp: hourTimestamp,
                    open: hour === 0 ? day.open : hourlyOHLCV[hourlyOHLCV.length - 1].close,
                    high: day.high * (0.98 + Math.random() * 0.04),
                    low: day.low * (0.96 + Math.random() * 0.04),
                    close: currentPrice,
                    volume: day.volume / 24
                });
            }
        });

        return hourlyOHLCV.slice(-200); // Keep last 200 hours
    }

    /**
     * Aggregate hourly to 4H
     */
    aggregateTo4H(hourlyOHLCV) {
        const ohlcv4h = [];

        for (let i = 0; i < hourlyOHLCV.length; i += 4) {
            const chunk = hourlyOHLCV.slice(i, i + 4);

            if (chunk.length < 4) continue;

            ohlcv4h.push({
                timestamp: chunk[0].timestamp,
                open: chunk[0].open,
                high: Math.max(...chunk.map(c => c.high)),
                low: Math.min(...chunk.map(c => c.low)),
                close: chunk[chunk.length - 1].close,
                volume: chunk.reduce((sum, c) => sum + c.volume, 0)
            });
        }

        return ohlcv4h;
    }

    /**
     * Analyze trend (reuse existing analyzer)
     */
    analyzeTrend(ohlcv) {
        if (typeof TrendAnalyzer === 'undefined') {
            return { trend: 'UNKNOWN', strength: 0, bias: 'NEUTRAL' };
        }

        const analyzer = new TrendAnalyzer(ohlcv);
        return analyzer.detectTrend();
    }

    /**
     * Analyze structure (reuse existing analyzer)
     */
    analyzeStructure(ohlcv) {
        if (typeof StructureAnalyzer === 'undefined') {
            return { swings: [], bos: [], choch: [], orderBlocks: [], fvgs: [] };
        }

        const structureAnalyzer = new StructureAnalyzer(ohlcv);
        const structure = structureAnalyzer.analyzeStructure();

        // Detect Order Blocks
        const obDetector = new OrderBlockDetector(ohlcv, structure.bos);
        const orderBlocks = obDetector.identifyOrderBlocks();

        // Detect FVGs
        const fvgDetector = new FVGDetector(ohlcv);
        const fvgs = fvgDetector.detectFVG();

        return {
            swings: structure.swings,
            bos: structure.bos,
            choch: structure.choch,
            orderBlocks: orderBlocks,
            fvgs: fvgs
        };
    }

    /**
     * Calculate RSI
     */
    calculateRSI(ohlcv) {
        if (typeof RSICalculator === 'undefined') {
            return { value: 50, signal: 'NEUTRAL' };
        }

        const rsiCalc = new RSICalculator(ohlcv, 14);
        return rsiCalc.interpret();
    }

    /**
     * Analyze Fibonacci clusters
     */
    analyzeFibonacci(ohlcv, swings) {
        if (typeof FibonacciClusterAnalyzer === 'undefined' || !swings || swings.length < 3) {
            return { clusters: [], allLevels: [] };
        }

        const fibAnalyzer = new FibonacciClusterAnalyzer(ohlcv, swings);
        return fibAnalyzer.analyzeClusters();
    }

    /**
     * Analyze Volume Profile
     */
    analyzeVolumeProfile(ohlcv) {
        if (typeof AdvancedVolumeProfile === 'undefined') {
            return null;
        }

        const vpAnalyzer = new AdvancedVolumeProfile(ohlcv);
        return vpAnalyzer.buildProfile();
    }
}

// ===== GLOBAL INSTANCE =====
let realDataFetcherInstance = null;

function getRealDataFetcher() {
    if (!realDataFetcherInstance) {
        realDataFetcherInstance = new RealDataFetcher();
    }
    return realDataFetcherInstance;
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RealDataFetcher,
        HybridDataBuilder,
        getRealDataFetcher
    };
}
