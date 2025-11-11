/**
 * ORDER FLOW ANALYSIS MODULE
 *
 * Advanced order flow analysis for institutional detection
 * Includes: CVD, Delta Analysis, Bid/Ask Imbalance, Footprint
 *
 * Impact: 10/10 - Critical for detecting institutional manipulation
 */

// ===== CUMULATIVE VOLUME DELTA (CVD) =====
/**
 * Calculates Cumulative Volume Delta
 * CVD = Cumulative sum of (Buy Volume - Sell Volume)
 *
 * Used to detect:
 * - Institutional accumulation/distribution
 * - Price-volume divergences
 * - Hidden strength/weakness
 */
class CVDCalculator {
    constructor(ohlcv) {
        this.ohlcv = ohlcv;
        this.cvd = [];
    }

    /**
     * Calculate CVD from OHLCV data
     *
     * Algorithm:
     * - Bullish candle (close > open) = Buy volume dominance
     * - Bearish candle (close < open) = Sell volume dominance
     * - Delta = Volume * (Close - Open) / (High - Low)
     * - CVD = Cumulative sum of Delta
     *
     * @returns {Array} CVD data with timestamps
     */
    calculate() {
        if (!this.ohlcv || this.ohlcv.length === 0) {
            return [];
        }

        let cumulativeDelta = 0;
        const cvdData = [];

        this.ohlcv.forEach((candle, index) => {
            // Calculate candle delta
            const delta = this.calculateCandleDelta(candle);

            // Add to cumulative
            cumulativeDelta += delta;

            cvdData.push({
                timestamp: candle.timestamp,
                delta: delta,
                cvd: cumulativeDelta,
                price: candle.close,
                volume: candle.volume,
                index: index
            });
        });

        this.cvd = cvdData;
        return cvdData;
    }

    /**
     * Calculate delta for single candle
     *
     * Logic:
     * - Green candle: Buyers in control → Positive delta
     * - Red candle: Sellers in control → Negative delta
     * - Weight by candle body relative to range
     *
     * @param {Object} candle - OHLCV candle
     * @returns {number} Delta volume
     */
    calculateCandleDelta(candle) {
        const range = candle.high - candle.low;

        // Avoid division by zero
        if (range === 0) {
            return 0;
        }

        const body = candle.close - candle.open;
        const bodyPercent = body / range; // -1 to 1

        // Delta = Volume weighted by body%
        // Positive = Buy volume, Negative = Sell volume
        return candle.volume * bodyPercent;
    }

    /**
     * Detect CVD divergences with price
     *
     * Bullish Divergence: Price makes lower low, CVD makes higher low
     * Bearish Divergence: Price makes higher high, CVD makes lower high
     *
     * @returns {Array} Detected divergences
     */
    detectDivergences() {
        if (this.cvd.length < 20) {
            return [];
        }

        const divergences = [];
        const lookback = 20; // Candles to look back

        for (let i = lookback; i < this.cvd.length; i++) {
            const current = this.cvd[i];
            const previous = this.findPreviousPivot(i, lookback);

            if (!previous) continue;

            // Bullish Divergence
            if (current.price < previous.price && current.cvd > previous.cvd) {
                divergences.push({
                    type: 'BULLISH_DIVERGENCE',
                    timestamp: current.timestamp,
                    currentPrice: current.price,
                    previousPrice: previous.price,
                    currentCVD: current.cvd,
                    previousCVD: previous.cvd,
                    strength: this.calculateDivergenceStrength(current, previous),
                    description: 'Prix baisse mais CVD monte - Accumulation cachée',
                    signal: 'BULLISH',
                    confidence: 'HIGH',
                    icon: '🔼',
                    color: '#22c55e'
                });
            }

            // Bearish Divergence
            if (current.price > previous.price && current.cvd < previous.cvd) {
                divergences.push({
                    type: 'BEARISH_DIVERGENCE',
                    timestamp: current.timestamp,
                    currentPrice: current.price,
                    previousPrice: previous.price,
                    currentCVD: current.cvd,
                    previousCVD: previous.cvd,
                    strength: this.calculateDivergenceStrength(current, previous),
                    description: 'Prix monte mais CVD baisse - Distribution cachée',
                    signal: 'BEARISH',
                    confidence: 'HIGH',
                    icon: '🔽',
                    color: '#ef4444'
                });
            }
        }

        return divergences;
    }

    /**
     * Find previous pivot point (local high/low)
     */
    findPreviousPivot(currentIndex, lookback) {
        const start = Math.max(0, currentIndex - lookback);
        const range = this.cvd.slice(start, currentIndex);

        if (range.length === 0) return null;

        // Find local extrema
        let pivot = range[0];
        for (let i = 1; i < range.length; i++) {
            // For simplicity, just find max/min in range
            if (Math.abs(range[i].price - this.cvd[currentIndex].price) >
                Math.abs(pivot.price - this.cvd[currentIndex].price)) {
                pivot = range[i];
            }
        }

        return pivot;
    }

    /**
     * Calculate divergence strength (0-100)
     */
    calculateDivergenceStrength(current, previous) {
        const priceDiff = Math.abs(current.price - previous.price) / previous.price;
        const cvdDiff = Math.abs(current.cvd - previous.cvd) / Math.abs(previous.cvd);

        // Stronger divergence = larger difference
        const strength = Math.min(100, (priceDiff + cvdDiff) * 100);
        return Math.round(strength);
    }

    /**
     * Get recent CVD trend
     *
     * @param {number} period - Number of candles to analyze
     * @returns {Object} Trend analysis
     */
    getCVDTrend(period = 10) {
        if (this.cvd.length < period) {
            return {
                trend: 'UNKNOWN',
                strength: 0,
                description: 'Données insuffisantes'
            };
        }

        const recent = this.cvd.slice(-period);
        const firstCVD = recent[0].cvd;
        const lastCVD = recent[recent.length - 1].cvd;
        const change = lastCVD - firstCVD;
        const changePercent = (change / Math.abs(firstCVD)) * 100;

        // Determine trend
        let trend, description;
        if (changePercent > 5) {
            trend = 'STRONG_BULLISH';
            description = 'Accumulation institutionnelle forte';
        } else if (changePercent > 1) {
            trend = 'BULLISH';
            description = 'Accumulation progressive';
        } else if (changePercent < -5) {
            trend = 'STRONG_BEARISH';
            description = 'Distribution institutionnelle forte';
        } else if (changePercent < -1) {
            trend = 'BEARISH';
            description = 'Distribution progressive';
        } else {
            trend = 'NEUTRAL';
            description = 'Equilibre acheteurs/vendeurs';
        }

        return {
            trend: trend,
            strength: Math.abs(changePercent),
            change: change,
            changePercent: changePercent,
            description: description,
            firstCVD: firstCVD,
            lastCVD: lastCVD
        };
    }
}

// ===== DELTA ANALYZER =====
/**
 * Analyzes price-delta relationship
 * Detects institutional activity through volume analysis
 */
class DeltaAnalyzer {
    constructor(ohlcv) {
        this.ohlcv = ohlcv;
        this.cvdCalc = new CVDCalculator(ohlcv);
        this.cvdData = this.cvdCalc.calculate();
    }

    /**
     * Analyze overall delta profile
     *
     * @returns {Object} Complete delta analysis
     */
    analyze() {
        const trend = this.cvdCalc.getCVDTrend(10);
        const divergences = this.cvdCalc.detectDivergences();
        const imbalance = this.detectImbalance();
        const signal = this.generateSignal(trend, divergences, imbalance);

        return {
            cvd: this.cvdData,
            trend: trend,
            divergences: divergences,
            imbalance: imbalance,
            signal: signal,
            summary: this.generateSummary(trend, divergences, imbalance)
        };
    }

    /**
     * Detect current buy/sell imbalance
     *
     * @returns {Object} Imbalance data
     */
    detectImbalance() {
        if (this.cvdData.length < 5) {
            return {
                type: 'UNKNOWN',
                ratio: 0,
                description: 'Données insuffisantes'
            };
        }

        // Analyze last 5 candles
        const recent = this.cvdData.slice(-5);
        const totalBuyVolume = recent
            .filter(c => c.delta > 0)
            .reduce((sum, c) => sum + c.delta, 0);
        const totalSellVolume = Math.abs(recent
            .filter(c => c.delta < 0)
            .reduce((sum, c) => sum + c.delta, 0));

        const totalVolume = totalBuyVolume + totalSellVolume;
        if (totalVolume === 0) {
            return {
                type: 'NEUTRAL',
                ratio: 0,
                buyVolume: 0,
                sellVolume: 0,
                description: 'Pas de volume significatif'
            };
        }

        const buyPercent = (totalBuyVolume / totalVolume) * 100;
        const sellPercent = (totalSellVolume / totalVolume) * 100;

        // Classify imbalance
        let type, description;
        if (buyPercent > 70) {
            type = 'STRONG_BUY';
            description = `Pression acheteuse forte (${buyPercent.toFixed(1)}% buy)`;
        } else if (buyPercent > 55) {
            type = 'BUY';
            description = `Pression acheteuse (${buyPercent.toFixed(1)}% buy)`;
        } else if (sellPercent > 70) {
            type = 'STRONG_SELL';
            description = `Pression vendeuse forte (${sellPercent.toFixed(1)}% sell)`;
        } else if (sellPercent > 55) {
            type = 'SELL';
            description = `Pression vendeuse (${sellPercent.toFixed(1)}% sell)`;
        } else {
            type = 'NEUTRAL';
            description = `Equilibré (${buyPercent.toFixed(1)}% buy / ${sellPercent.toFixed(1)}% sell)`;
        }

        return {
            type: type,
            buyPercent: buyPercent,
            sellPercent: sellPercent,
            buyVolume: totalBuyVolume,
            sellVolume: totalSellVolume,
            ratio: buyPercent / sellPercent,
            description: description
        };
    }

    /**
     * Generate trading signal from Order Flow
     *
     * @returns {Object} Trading signal
     */
    generateSignal(trend, divergences, imbalance) {
        let signal = 'NEUTRAL';
        let confidence = 50;
        let reasons = [];

        // Factor 1: CVD Trend
        if (trend.trend === 'STRONG_BULLISH') {
            confidence += 25;
            reasons.push('CVD trend haussier fort');
        } else if (trend.trend === 'STRONG_BEARISH') {
            confidence -= 25;
            reasons.push('CVD trend baissier fort');
        }

        // Factor 2: Divergences
        const recentDivergences = divergences.filter(d => {
            const age = this.cvdData.length - d.timestamp;
            return age < 10; // Last 10 candles
        });

        if (recentDivergences.length > 0) {
            const lastDiv = recentDivergences[recentDivergences.length - 1];
            if (lastDiv.type === 'BULLISH_DIVERGENCE') {
                confidence += 20;
                reasons.push('Divergence haussière détectée');
            } else {
                confidence -= 20;
                reasons.push('Divergence baissière détectée');
            }
        }

        // Factor 3: Imbalance
        if (imbalance.type === 'STRONG_BUY') {
            confidence += 15;
            reasons.push(imbalance.description);
        } else if (imbalance.type === 'STRONG_SELL') {
            confidence -= 15;
            reasons.push(imbalance.description);
        }

        // Generate signal
        if (confidence >= 75) {
            signal = 'STRONG_BUY';
        } else if (confidence >= 60) {
            signal = 'BUY';
        } else if (confidence <= 25) {
            signal = 'STRONG_SELL';
        } else if (confidence <= 40) {
            signal = 'SELL';
        } else {
            signal = 'NEUTRAL';
        }

        return {
            signal: signal,
            confidence: confidence,
            reasons: reasons,
            description: reasons.join(', ')
        };
    }

    /**
     * Generate human-readable summary
     */
    generateSummary(trend, divergences, imbalance) {
        const parts = [];

        // CVD Trend
        parts.push(`📊 CVD: ${trend.description}`);

        // Divergences
        if (divergences.length > 0) {
            const recent = divergences[divergences.length - 1];
            parts.push(`⚠️ ${recent.description}`);
        }

        // Imbalance
        parts.push(`⚖️ ${imbalance.description}`);

        return parts.join(' | ');
    }
}

// ===== FOOTPRINT ANALYZER =====
/**
 * Footprint chart analysis
 * Shows volume traded at each price level
 */
class FootprintAnalyzer {
    constructor(ohlcv) {
        this.ohlcv = ohlcv;
    }

    /**
     * Build footprint data for visualization
     *
     * @param {number} priceLevels - Number of price levels per candle
     * @returns {Array} Footprint data
     */
    buildFootprint(priceLevels = 5) {
        if (!this.ohlcv || this.ohlcv.length === 0) {
            return [];
        }

        const footprint = [];

        this.ohlcv.forEach((candle, index) => {
            const levels = this.distributeCandleVolume(candle, priceLevels);

            footprint.push({
                timestamp: candle.timestamp,
                index: index,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume,
                levels: levels,
                dominance: this.calculateDominance(levels)
            });
        });

        return footprint;
    }

    /**
     * Distribute candle volume across price levels
     *
     * Simulates order book activity within candle range
     */
    distributeCandleVolume(candle, numLevels) {
        const range = candle.high - candle.low;
        if (range === 0) {
            return [{
                price: candle.close,
                buyVolume: candle.volume / 2,
                sellVolume: candle.volume / 2
            }];
        }

        const levels = [];
        const priceStep = range / numLevels;

        // Determine if bullish or bearish candle
        const isBullish = candle.close > candle.open;

        for (let i = 0; i < numLevels; i++) {
            const price = candle.low + (priceStep * (i + 0.5));

            // Volume distribution logic
            // More volume near close for trending candles
            // More volume near middle for ranging candles
            const distanceFromClose = Math.abs(price - candle.close);
            const distancePercent = distanceFromClose / range;

            // Weight: more volume near close
            const weight = 1 - (distancePercent * 0.7);
            const levelVolume = (candle.volume / numLevels) * weight;

            // Buy/Sell split based on candle direction
            let buyVolume, sellVolume;
            if (isBullish) {
                // Bullish: more buy volume, especially near close
                const buyRatio = 0.5 + (1 - distancePercent) * 0.3;
                buyVolume = levelVolume * buyRatio;
                sellVolume = levelVolume * (1 - buyRatio);
            } else {
                // Bearish: more sell volume
                const sellRatio = 0.5 + (1 - distancePercent) * 0.3;
                sellVolume = levelVolume * sellRatio;
                buyVolume = levelVolume * (1 - sellRatio);
            }

            levels.push({
                price: price,
                buyVolume: buyVolume,
                sellVolume: sellVolume,
                delta: buyVolume - sellVolume,
                totalVolume: levelVolume
            });
        }

        return levels;
    }

    /**
     * Calculate buyer/seller dominance at each level
     */
    calculateDominance(levels) {
        const totalBuy = levels.reduce((sum, l) => sum + l.buyVolume, 0);
        const totalSell = levels.reduce((sum, l) => sum + l.sellVolume, 0);
        const total = totalBuy + totalSell;

        if (total === 0) return 'NEUTRAL';

        const buyPercent = (totalBuy / total) * 100;

        if (buyPercent > 65) return 'STRONG_BUY';
        if (buyPercent > 55) return 'BUY';
        if (buyPercent < 35) return 'STRONG_SELL';
        if (buyPercent < 45) return 'SELL';
        return 'NEUTRAL';
    }
}

// ===== ORDER FLOW ORCHESTRATOR =====
/**
 * Main class that orchestrates all Order Flow analysis
 */
class OrderFlowAnalyzer {
    constructor(ohlcv) {
        this.ohlcv = ohlcv;
        this.cvdCalc = new CVDCalculator(ohlcv);
        this.deltaAnalyzer = new DeltaAnalyzer(ohlcv);
        this.footprintAnalyzer = new FootprintAnalyzer(ohlcv);
    }

    /**
     * Run complete Order Flow analysis
     *
     * @returns {Object} Complete analysis
     */
    analyze() {
        // Run all analyzers
        const deltaAnalysis = this.deltaAnalyzer.analyze();
        const footprint = this.footprintAnalyzer.buildFootprint(5);

        // Compile results
        return {
            cvd: deltaAnalysis.cvd,
            trend: deltaAnalysis.trend,
            divergences: deltaAnalysis.divergences,
            imbalance: deltaAnalysis.imbalance,
            signal: deltaAnalysis.signal,
            footprint: footprint,
            summary: deltaAnalysis.summary,
            timestamp: Date.now()
        };
    }

    /**
     * Get simplified metrics for signal integration
     *
     * @returns {Object} Simplified metrics
     */
    getMetrics() {
        const analysis = this.analyze();

        return {
            cvdTrend: analysis.trend.trend,
            cvdStrength: analysis.trend.strength,
            hasDivergence: analysis.divergences.length > 0,
            divergenceType: analysis.divergences.length > 0 ?
                analysis.divergences[analysis.divergences.length - 1].type : null,
            imbalanceType: analysis.imbalance.type,
            imbalanceRatio: analysis.imbalance.buyPercent || 50,
            signal: analysis.signal.signal,
            confidence: analysis.signal.confidence
        };
    }
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CVDCalculator,
        DeltaAnalyzer,
        FootprintAnalyzer,
        OrderFlowAnalyzer
    };
}
