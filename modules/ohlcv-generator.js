/**
 * OHLCV GENERATOR
 * Generates simulated OHLCV data for technical analysis
 * Used for testing and demo purposes
 */

class OHLCVGenerator {
    constructor(crypto) {
        this.crypto = crypto;
        this.currentPrice = crypto.price;
        this.priceChange24h = crypto.priceChange24h || 0;
    }

    /**
     * Generate realistic OHLCV data based on current price and trends
     * @param {number} candles - Number of candles to generate
     * @param {string} timeframe - '1h', '4h', '1d'
     * @returns {Array} Array of OHLCV candlesdata
     */
    generate(candles = 200, timeframe = '1h') {
        const ohlcv = [];
        const now = Date.now();
        const intervalMs = this.getIntervalMs(timeframe);

        // Determine trend based on price change and fundamental score
        let trendBias = this.determineTrendBias();

        // Start from historical price
        let price = this.currentPrice * (1 - (this.priceChange24h / 100) * 0.5);

        for (let i = 0; i < candles; i++) {
            const timestamp = now - (candles - i) * intervalMs;

            // Add some randomness and trend
            const volatility = this.calculateVolatility();
            const trendComponent = trendBias * volatility * 0.3;
            const randomComponent = (Math.random() - 0.5) * volatility * 2;

            const change = trendComponent + randomComponent;
            const nextPrice = price * (1 + change);

            // Generate OHLC
            const open = price;
            const close = nextPrice;

            // High and Low with wick simulation
            const wickMultiplier = Math.random() * 0.5 + 0.5;
            const high = Math.max(open, close) * (1 + volatility * wickMultiplier * 0.5);
            const low = Math.min(open, close) * (1 - volatility * wickMultiplier * 0.5);

            // Volume simulation (higher on volatile moves)
            const volumeBase = this.crypto.volume24h / 24; // Hourly avg
            const volumeMultiplier = 1 + Math.abs(change) * 10 + Math.random() * 0.5;
            const volume = volumeBase * volumeMultiplier;

            ohlcv.push({
                timestamp: timestamp,
                open: open,
                high: high,
                low: low,
                close: close,
                volume: volume
            });

            // Update price for next candle
            price = nextPrice;

            // Occasionally shift trend bias (simulate market structure changes)
            if (Math.random() < 0.05) {
                trendBias += (Math.random() - 0.5) * 0.5;
                trendBias = Math.max(-1, Math.min(1, trendBias));
            }
        }

        // Ensure last candle close matches current price
        if (ohlcv.length > 0) {
            const lastCandle = ohlcv[ohlcv.length - 1];
            const adjustment = this.currentPrice / lastCandle.close;

            // Scale all prices to match current
            ohlcv.forEach(candle => {
                candle.open *= adjustment;
                candle.high *= adjustment;
                candle.low *= adjustment;
                candle.close *= adjustment;
            });
        }

        return ohlcv;
    }

    /**
     * Determine trend bias based on crypto data
     */
    determineTrendBias() {
        let bias = 0;

        // Price change influences trend
        if (this.priceChange24h > 5) {
            bias += 0.6;
        } else if (this.priceChange24h > 0) {
            bias += 0.3;
        } else if (this.priceChange24h < -5) {
            bias -= 0.6;
        } else {
            bias -= 0.3;
        }

        // Fundamental score influences trend
        if (this.crypto.score > 80) {
            bias += 0.3;
        } else if (this.crypto.score > 70) {
            bias += 0.1;
        } else if (this.crypto.score < 60) {
            bias -= 0.2;
        }

        // MVRV influences (undervalued = bullish)
        if (this.crypto.mvrv && this.crypto.mvrv < 1.0) {
            bias += 0.2;
        } else if (this.crypto.mvrv && this.crypto.mvrv > 2.0) {
            bias -= 0.2;
        }

        return Math.max(-1, Math.min(1, bias));
    }

    /**
     * Calculate volatility based on crypto characteristics
     */
    calculateVolatility() {
        let baseVolatility = 0.02; // 2% base

        // Market cap influences volatility (smaller = more volatile)
        if (this.crypto.marketCap < 1000000000) {
            baseVolatility *= 2;
        } else if (this.crypto.marketCap < 10000000000) {
            baseVolatility *= 1.5;
        }

        // Recent price change indicates volatility
        const absChange = Math.abs(this.priceChange24h);
        if (absChange > 10) {
            baseVolatility *= 1.5;
        } else if (absChange > 5) {
            baseVolatility *= 1.2;
        }

        return baseVolatility;
    }

    /**
     * Get interval in milliseconds
     */
    getIntervalMs(timeframe) {
        const intervals = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '4h': 4 * 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000
        };

        return intervals[timeframe] || intervals['1h'];
    }

    /**
     * Generate multiple timeframes
     */
    generateMultiTimeframe() {
        return {
            '1h': this.generate(200, '1h'),
            '4h': this.generate(100, '4h'),
            '1d': this.generate(50, '1d')
        };
    }
}

// ===== TECHNICAL DATA BUILDER =====
/**
 * Build complete technical analysis data for a crypto
 * Combines OHLCV generation with technical analysis
 */
class TechnicalDataBuilder {
    constructor(crypto) {
        this.crypto = crypto;
    }

    /**
     * Build complete technical analysis
     * @returns {Object} Technical data with all indicators
     */
    async build() {
        // Generate OHLCV data
        const generator = new OHLCVGenerator(this.crypto);
        const ohlcv1h = generator.generate(200, '1h');
        const ohlcv4h = generator.generate(100, '4h');

        // Run technical analysis
        const trend = this.analyzeTrend(ohlcv4h);
        const structure = this.analyzeStructure(ohlcv1h);
        const rsi = this.calculateRSI(ohlcv1h);

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
            generated: Date.now()
        };
    }

    /**
     * Analyze trend using TrendAnalyzer
     */
    analyzeTrend(ohlcv) {
        // Check if TrendAnalyzer is available
        if (typeof TrendAnalyzer === 'undefined') {
            return this.getSimulatedTrend();
        }

        const analyzer = new TrendAnalyzer(ohlcv);
        return analyzer.detectTrend();
    }

    /**
     * Analyze structure using StructureAnalyzer
     */
    analyzeStructure(ohlcv) {
        // Check if StructureAnalyzer is available
        if (typeof StructureAnalyzer === 'undefined') {
            return this.getSimulatedStructure();
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
            return this.getSimulatedRSI();
        }

        const rsiCalc = new RSICalculator(ohlcv, 14);
        return rsiCalc.interpret();
    }

    /**
     * Simulated trend (fallback)
     */
    getSimulatedTrend() {
        const bias = new OHLCVGenerator(this.crypto).determineTrendBias();

        if (bias > 0.5) {
            return {
                trend: 'STRONG_BULLISH',
                strength: 100,
                bias: 'LONG_ONLY',
                description: 'Tendance haussière forte',
                icon: '🚀',
                color: '#00ff00'
            };
        } else if (bias > 0.2) {
            return {
                trend: 'BULLISH',
                strength: 75,
                bias: 'LONG_PREFERRED',
                description: 'Tendance haussière',
                icon: '📈',
                color: '#22c55e'
            };
        } else if (bias < -0.5) {
            return {
                trend: 'STRONG_BEARISH',
                strength: 100,
                bias: 'SHORT_ONLY',
                description: 'Tendance baissière forte',
                icon: '📉',
                color: '#ef4444'
            };
        } else if (bias < -0.2) {
            return {
                trend: 'BEARISH',
                strength: 75,
                bias: 'SHORT_PREFERRED',
                description: 'Tendance baissière',
                icon: '🔻',
                color: '#f87171'
            };
        } else {
            return {
                trend: 'RANGE',
                strength: 50,
                bias: 'NEUTRAL',
                description: 'Marché en range',
                icon: '➡️',
                color: '#94a3b8'
            };
        }
    }

    /**
     * Simulated structure (fallback)
     */
    getSimulatedStructure() {
        return {
            swings: [],
            bos: [],
            choch: [],
            orderBlocks: [],
            fvgs: []
        };
    }

    /**
     * Simulated RSI (fallback)
     */
    getSimulatedRSI() {
        // Base RSI on price change
        let rsiValue = 50;

        if (this.crypto.priceChange24h > 10) {
            rsiValue = 70 + Math.random() * 10;
        } else if (this.crypto.priceChange24h > 5) {
            rsiValue = 60 + Math.random() * 10;
        } else if (this.crypto.priceChange24h < -10) {
            rsiValue = 20 + Math.random() * 10;
        } else if (this.crypto.priceChange24h < -5) {
            rsiValue = 30 + Math.random() * 10;
        } else {
            rsiValue = 45 + Math.random() * 10;
        }

        if (rsiValue < 30) {
            return {
                value: rsiValue,
                signal: 'OVERSOLD',
                description: 'Survendu',
                icon: '🟢',
                color: '#22c55e'
            };
        } else if (rsiValue < 50) {
            return {
                value: rsiValue,
                signal: 'HEALTHY',
                description: 'Zone saine',
                icon: '✅',
                color: '#3b82f6'
            };
        } else if (rsiValue < 70) {
            return {
                value: rsiValue,
                signal: 'NEUTRAL',
                description: 'Zone neutre',
                icon: '➡️',
                color: '#94a3b8'
            };
        } else {
            return {
                value: rsiValue,
                signal: 'OVERBOUGHT',
                description: 'Suracheté',
                icon: '🔴',
                color: '#ef4444'
            };
        }
    }
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OHLCVGenerator,
        TechnicalDataBuilder
    };
}
