/**
 * TECHNICAL ANALYSIS MODULE
 * Advanced technical analysis for entry/exit points
 * Includes: Trend Analysis, Structure Detection (BOS, CHoCH), Order Blocks, Fair Value Gaps
 */

// ===== TREND ANALYZER =====
class TrendAnalyzer {
    constructor(ohlcv) {
        this.ohlcv = ohlcv;
        this.ema20 = null;
        this.ema50 = null;
        this.ema200 = null;
    }

    /**
     * Detect trend using EMAs
     * @returns {Object} Trend data
     */
    detectTrend() {
        if (!this.ohlcv || this.ohlcv.length < 200) {
            return this.getDefaultTrend();
        }

        // Calculate EMAs
        this.ema20 = this.calculateEMA(20);
        this.ema50 = this.calculateEMA(50);
        this.ema200 = this.calculateEMA(200);

        const currentPrice = this.ohlcv[this.ohlcv.length - 1].close;

        // Strong Bullish: Price > EMA20 > EMA50 > EMA200
        if (currentPrice > this.ema20 &&
            this.ema20 > this.ema50 &&
            this.ema50 > this.ema200) {
            return {
                trend: 'STRONG_BULLISH',
                strength: 100,
                bias: 'LONG_ONLY',
                description: 'Tendance haussière forte',
                ema20: this.ema20,
                ema50: this.ema50,
                ema200: this.ema200,
                icon: '🚀',
                color: '#00ff00'
            };
        }

        // Bullish: Price > EMA50 > EMA200
        if (currentPrice > this.ema50 && this.ema50 > this.ema200) {
            return {
                trend: 'BULLISH',
                strength: 75,
                bias: 'LONG_PREFERRED',
                description: 'Tendance haussière',
                ema20: this.ema20,
                ema50: this.ema50,
                ema200: this.ema200,
                icon: '📈',
                color: '#22c55e'
            };
        }

        // Strong Bearish: Price < EMA20 < EMA50 < EMA200
        if (currentPrice < this.ema20 &&
            this.ema20 < this.ema50 &&
            this.ema50 < this.ema200) {
            return {
                trend: 'STRONG_BEARISH',
                strength: 100,
                bias: 'SHORT_ONLY',
                description: 'Tendance baissière forte',
                ema20: this.ema20,
                ema50: this.ema50,
                ema200: this.ema200,
                icon: '📉',
                color: '#ef4444'
            };
        }

        // Bearish: Price < EMA50 < EMA200
        if (currentPrice < this.ema50 && this.ema50 < this.ema200) {
            return {
                trend: 'BEARISH',
                strength: 75,
                bias: 'SHORT_PREFERRED',
                description: 'Tendance baissière',
                ema20: this.ema20,
                ema50: this.ema50,
                ema200: this.ema200,
                icon: '🔻',
                color: '#f87171'
            };
        }

        // Range: Neutral
        return {
            trend: 'RANGE',
            strength: 50,
            bias: 'NEUTRAL',
            description: 'Marché en range',
            ema20: this.ema20,
            ema50: this.ema50,
            ema200: this.ema200,
            icon: '➡️',
            color: '#94a3b8'
        };
    }

    /**
     * Calculate EMA (Exponential Moving Average)
     * @param {number} period - EMA period
     * @returns {number} Current EMA value
     */
    calculateEMA(period) {
        if (!this.ohlcv || this.ohlcv.length < period) return null;

        const multiplier = 2 / (period + 1);
        let ema = 0;

        // Calculate initial SMA for first EMA value
        for (let i = 0; i < period; i++) {
            ema += this.ohlcv[i].close;
        }
        ema = ema / period;

        // Calculate EMA for remaining values
        for (let i = period; i < this.ohlcv.length; i++) {
            ema = (this.ohlcv[i].close - ema) * multiplier + ema;
        }

        return ema;
    }

    /**
     * Get default trend when insufficient data
     */
    getDefaultTrend() {
        return {
            trend: 'UNKNOWN',
            strength: 0,
            bias: 'NEUTRAL',
            description: 'Données insuffisantes',
            ema20: null,
            ema50: null,
            ema200: null,
            icon: '❓',
            color: '#64748b'
        };
    }
}

// ===== STRUCTURE ANALYZER (BOS, CHoCH, Swings) =====
class StructureAnalyzer {
    constructor(ohlcv) {
        this.ohlcv = ohlcv;
        this.swings = [];
    }

    /**
     * Detect swing highs and lows using zigzag algorithm
     * @param {number} threshold - Minimum percentage change to qualify as swing
     * @returns {Array} Array of swing points
     */
    detectSwings(threshold = 0.02) {
        if (!this.ohlcv || this.ohlcv.length < 5) return [];

        const swings = [];
        let lastSwing = null;

        for (let i = 2; i < this.ohlcv.length - 2; i++) {
            const candle = this.ohlcv[i];

            // Swing High: High[i] > High[i-1,i-2,i+1,i+2]
            const isSwingHigh =
                candle.high > this.ohlcv[i-1].high &&
                candle.high > this.ohlcv[i-2].high &&
                candle.high > this.ohlcv[i+1].high &&
                candle.high > this.ohlcv[i+2].high;

            if (isSwingHigh) {
                // Check threshold vs last swing
                if (!lastSwing || Math.abs(candle.high - lastSwing.price) / lastSwing.price > threshold) {
                    const swing = {
                        type: 'HIGH',
                        price: candle.high,
                        timestamp: candle.timestamp,
                        index: i,
                        candle: candle
                    };
                    swings.push(swing);
                    lastSwing = swing;
                }
            }

            // Swing Low: Low[i] < Low[i-1,i-2,i+1,i+2]
            const isSwingLow =
                candle.low < this.ohlcv[i-1].low &&
                candle.low < this.ohlcv[i-2].low &&
                candle.low < this.ohlcv[i+1].low &&
                candle.low < this.ohlcv[i+2].low;

            if (isSwingLow) {
                if (!lastSwing || Math.abs(candle.low - lastSwing.price) / lastSwing.price > threshold) {
                    const swing = {
                        type: 'LOW',
                        price: candle.low,
                        timestamp: candle.timestamp,
                        index: i,
                        candle: candle
                    };
                    swings.push(swing);
                    lastSwing = swing;
                }
            }
        }

        this.swings = swings;
        return swings;
    }

    /**
     * Detect Break of Structure (BOS)
     * @returns {Array} BOS signals
     */
    detectBOS() {
        if (this.swings.length === 0) {
            this.detectSwings();
        }

        if (!this.ohlcv || this.swings.length < 2) return [];

        const bosSignals = [];
        const currentPrice = this.ohlcv[this.ohlcv.length - 1].close;

        // Find last swing high and low
        const swingsReversed = [...this.swings].reverse();
        const lastSwingHigh = swingsReversed.find(s => s.type === 'HIGH');
        const lastSwingLow = swingsReversed.find(s => s.type === 'LOW');

        if (!lastSwingHigh || !lastSwingLow) return bosSignals;

        // Bullish BOS: Current price breaks above last swing high
        if (currentPrice > lastSwingHigh.price) {
            const strength = ((currentPrice - lastSwingHigh.price) / lastSwingHigh.price) * 100;
            const ageInCandles = this.ohlcv.length - 1 - lastSwingHigh.index;

            bosSignals.push({
                type: 'BULLISH_BOS',
                breakLevel: lastSwingHigh.price,
                currentPrice: currentPrice,
                strength: strength,
                ageInCandles: ageInCandles,
                timestamp: Date.now(),
                description: `Prix casse $${lastSwingHigh.price.toFixed(2)} (swing high)`,
                icon: '🔼',
                color: '#22c55e'
            });
        }

        // Bearish BOS: Current price breaks below last swing low
        if (currentPrice < lastSwingLow.price) {
            const strength = ((lastSwingLow.price - currentPrice) / lastSwingLow.price) * 100;
            const ageInCandles = this.ohlcv.length - 1 - lastSwingLow.index;

            bosSignals.push({
                type: 'BEARISH_BOS',
                breakLevel: lastSwingLow.price,
                currentPrice: currentPrice,
                strength: strength,
                ageInCandles: ageInCandles,
                timestamp: Date.now(),
                description: `Prix casse $${lastSwingLow.price.toFixed(2)} (swing low)`,
                icon: '🔽',
                color: '#ef4444'
            });
        }

        return bosSignals;
    }

    /**
     * Detect Change of Character (CHoCH)
     * @returns {Array} CHoCH signals
     */
    detectCHoCH() {
        if (this.swings.length < 5) {
            if (this.swings.length === 0) this.detectSwings();
            if (this.swings.length < 5) return [];
        }

        const chochSignals = [];
        const recent = this.swings.slice(-5);

        // Bullish CHoCH: Série de lower lows → break d'un higher low
        const lows = recent.filter(s => s.type === 'LOW');
        if (lows.length >= 3) {
            const lastLow = lows[lows.length - 1];
            const previousLow = lows[lows.length - 2];

            // Check if we had lower lows followed by a higher low
            if (previousLow.price < lows[lows.length - 3].price &&
                lastLow.price > previousLow.price) {
                chochSignals.push({
                    type: 'BULLISH_CHOCH',
                    level: lastLow.price,
                    description: 'Changement de caractère haussier',
                    confidence: 75,
                    icon: '🔄',
                    color: '#22c55e'
                });
            }
        }

        // Bearish CHoCH: Série de higher highs → break d'un lower high
        const highs = recent.filter(s => s.type === 'HIGH');
        if (highs.length >= 3) {
            const lastHigh = highs[highs.length - 1];
            const previousHigh = highs[highs.length - 2];

            // Check if we had higher highs followed by a lower high
            if (previousHigh.price > highs[highs.length - 3].price &&
                lastHigh.price < previousHigh.price) {
                chochSignals.push({
                    type: 'BEARISH_CHOCH',
                    level: lastHigh.price,
                    description: 'Changement de caractère baissier',
                    confidence: 75,
                    icon: '🔄',
                    color: '#ef4444'
                });
            }
        }

        return chochSignals;
    }

    /**
     * Get all structure signals
     */
    analyzeStructure() {
        const swings = this.detectSwings();
        const bos = this.detectBOS();
        const choch = this.detectCHoCH();

        return {
            swings: swings,
            bos: bos,
            choch: choch,
            hasStructure: bos.length > 0 || choch.length > 0
        };
    }
}

// ===== ORDER BLOCK DETECTOR =====
class OrderBlockDetector {
    constructor(ohlcv, bosSignals) {
        this.ohlcv = ohlcv;
        this.bosSignals = bosSignals || [];
    }

    /**
     * Identify Order Blocks (last opposite candle before BOS)
     * @returns {Array} Order blocks
     */
    identifyOrderBlocks() {
        if (!this.bosSignals || this.bosSignals.length === 0) return [];

        const orderBlocks = [];

        this.bosSignals.forEach(bos => {
            if (bos.type === 'BULLISH_BOS') {
                // Bullish OB = last red candle before BOS
                const bosIndex = this.ohlcv.length - 1 - bos.ageInCandles;
                const lastRedCandle = this.findLastOppositeCandleBefore(bosIndex, 'red');

                if (lastRedCandle) {
                    orderBlocks.push({
                        type: 'BULLISH_OB',
                        zone: {
                            top: lastRedCandle.high,
                            bottom: lastRedCandle.low,
                            midpoint: (lastRedCandle.high + lastRedCandle.low) / 2
                        },
                        timestamp: lastRedCandle.timestamp,
                        tested: false,
                        strength: this.calculateOBStrength(lastRedCandle, bos),
                        description: 'Zone d\'achat institutionnel',
                        icon: '🟢',
                        color: '#22c55e'
                    });
                }
            }

            if (bos.type === 'BEARISH_BOS') {
                // Bearish OB = last green candle before BOS
                const bosIndex = this.ohlcv.length - 1 - bos.ageInCandles;
                const lastGreenCandle = this.findLastOppositeCandleBefore(bosIndex, 'green');

                if (lastGreenCandle) {
                    orderBlocks.push({
                        type: 'BEARISH_OB',
                        zone: {
                            top: lastGreenCandle.high,
                            bottom: lastGreenCandle.low,
                            midpoint: (lastGreenCandle.high + lastGreenCandle.low) / 2
                        },
                        timestamp: lastGreenCandle.timestamp,
                        tested: false,
                        strength: this.calculateOBStrength(lastGreenCandle, bos),
                        description: 'Zone de vente institutionnelle',
                        icon: '🔴',
                        color: '#ef4444'
                    });
                }
            }
        });

        return orderBlocks;
    }

    /**
     * Find last opposite candle before given index
     */
    findLastOppositeCandleBefore(index, color) {
        for (let i = index - 1; i >= 0 && i >= index - 20; i--) { // Look back max 20 candles
            const candle = this.ohlcv[i];
            const isRed = candle.close < candle.open;
            const isGreen = candle.close > candle.open;

            if ((color === 'red' && isRed) || (color === 'green' && isGreen)) {
                return candle;
            }
        }
        return null;
    }

    /**
     * Calculate Order Block strength
     */
    calculateOBStrength(candle, bos) {
        let strength = 50; // Base

        // Large candle = +20
        const candleSize = Math.abs(candle.close - candle.open);
        if (candleSize / candle.close > 0.03) strength += 20;

        // Strong BOS = +15
        if (bos.strength > 2) strength += 15;

        // Recent = +15
        if (bos.ageInCandles < 10) strength += 15;

        return Math.min(100, strength);
    }

    /**
     * Check if price is near an Order Block
     */
    checkPriceNearOB(currentPrice, tolerance = 0.02) {
        const orderBlocks = this.identifyOrderBlocks();

        const nearbyOBs = orderBlocks.filter(ob => {
            const distanceToTop = Math.abs(currentPrice - ob.zone.top) / currentPrice;
            const distanceToBottom = Math.abs(currentPrice - ob.zone.bottom) / currentPrice;
            const distanceToMid = Math.abs(currentPrice - ob.zone.midpoint) / currentPrice;

            return distanceToTop < tolerance ||
                   distanceToBottom < tolerance ||
                   distanceToMid < tolerance ||
                   (currentPrice >= ob.zone.bottom && currentPrice <= ob.zone.top);
        });

        return nearbyOBs;
    }
}

// ===== FAIR VALUE GAP DETECTOR =====
class FVGDetector {
    constructor(ohlcv) {
        this.ohlcv = ohlcv;
    }

    /**
     * Detect Fair Value Gaps (price inefficiencies)
     * @returns {Array} FVG zones
     */
    detectFVG() {
        if (!this.ohlcv || this.ohlcv.length < 3) return [];

        const fvgs = [];

        for (let i = 2; i < this.ohlcv.length; i++) {
            const candle1 = this.ohlcv[i-2];
            const candle2 = this.ohlcv[i-1];
            const candle3 = this.ohlcv[i];

            // Bullish FVG: candle3.low > candle1.high (gap between 3 candles)
            if (candle3.low > candle1.high) {
                const size = candle3.low - candle1.high;
                const sizePercent = (size / candle1.high) * 100;

                // Only significant gaps (> 0.5%)
                if (sizePercent > 0.5) {
                    fvgs.push({
                        type: 'BULLISH_FVG',
                        zone: {
                            top: candle3.low,
                            bottom: candle1.high,
                            midpoint: (candle3.low + candle1.high) / 2
                        },
                        timestamp: candle3.timestamp,
                        filled: false,
                        size: size,
                        sizePercent: sizePercent,
                        description: 'Zone d\'inefficience haussière',
                        icon: '⬆️',
                        color: '#22c55e'
                    });
                }
            }

            // Bearish FVG: candle3.high < candle1.low
            if (candle3.high < candle1.low) {
                const size = candle1.low - candle3.high;
                const sizePercent = (size / candle1.low) * 100;

                if (sizePercent > 0.5) {
                    fvgs.push({
                        type: 'BEARISH_FVG',
                        zone: {
                            top: candle1.low,
                            bottom: candle3.high,
                            midpoint: (candle1.low + candle3.high) / 2
                        },
                        timestamp: candle3.timestamp,
                        filled: false,
                        size: size,
                        sizePercent: sizePercent,
                        description: 'Zone d\'inefficience baissière',
                        icon: '⬇️',
                        color: '#ef4444'
                    });
                }
            }
        }

        // Keep only recent FVGs (last 50 candles)
        const recentFVGs = fvgs.slice(-50);

        return recentFVGs;
    }

    /**
     * Check if price is near a FVG
     */
    checkPriceNearFVG(currentPrice, tolerance = 0.02) {
        const fvgs = this.detectFVG();

        const nearbyFVGs = fvgs.filter(fvg => {
            if (fvg.filled) return false;

            const distanceToTop = Math.abs(currentPrice - fvg.zone.top) / currentPrice;
            const distanceToBottom = Math.abs(currentPrice - fvg.zone.bottom) / currentPrice;
            const distanceToMid = Math.abs(currentPrice - fvg.zone.midpoint) / currentPrice;

            return distanceToTop < tolerance ||
                   distanceToBottom < tolerance ||
                   distanceToMid < tolerance ||
                   (currentPrice >= fvg.zone.bottom && currentPrice <= fvg.zone.top);
        });

        return nearbyFVGs;
    }
}

// ===== RSI CALCULATOR =====
class RSICalculator {
    constructor(ohlcv, period = 14) {
        this.ohlcv = ohlcv;
        this.period = period;
    }

    /**
     * Calculate RSI (Relative Strength Index)
     * @returns {number} RSI value (0-100)
     */
    calculate() {
        if (!this.ohlcv || this.ohlcv.length < this.period + 1) return null;

        let gains = 0;
        let losses = 0;

        // Calculate initial average gain and loss
        for (let i = 1; i <= this.period; i++) {
            const change = this.ohlcv[i].close - this.ohlcv[i-1].close;
            if (change >= 0) {
                gains += change;
            } else {
                losses -= change;
            }
        }

        let avgGain = gains / this.period;
        let avgLoss = losses / this.period;

        // Calculate RSI for remaining values using Wilder's smoothing
        for (let i = this.period + 1; i < this.ohlcv.length; i++) {
            const change = this.ohlcv[i].close - this.ohlcv[i-1].close;

            if (change >= 0) {
                avgGain = ((avgGain * (this.period - 1)) + change) / this.period;
                avgLoss = (avgLoss * (this.period - 1)) / this.period;
            } else {
                avgGain = (avgGain * (this.period - 1)) / this.period;
                avgLoss = ((avgLoss * (this.period - 1)) - change) / this.period;
            }
        }

        // Calculate RS and RSI
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        return rsi;
    }

    /**
     * Get RSI interpretation
     */
    interpret() {
        const rsi = this.calculate();

        if (rsi === null) {
            return {
                value: null,
                signal: 'UNKNOWN',
                description: 'Données insuffisantes',
                icon: '❓',
                color: '#64748b'
            };
        }

        if (rsi < 30) {
            return {
                value: rsi,
                signal: 'OVERSOLD',
                description: 'Survendu - Opportunité d\'achat',
                icon: '🟢',
                color: '#22c55e'
            };
        } else if (rsi < 50) {
            return {
                value: rsi,
                signal: 'HEALTHY',
                description: 'Zone saine',
                icon: '✅',
                color: '#3b82f6'
            };
        } else if (rsi < 70) {
            return {
                value: rsi,
                signal: 'NEUTRAL',
                description: 'Zone neutre',
                icon: '➡️',
                color: '#94a3b8'
            };
        } else {
            return {
                value: rsi,
                signal: 'OVERBOUGHT',
                description: 'Suracheté - Attendre pullback',
                icon: '🔴',
                color: '#ef4444'
            };
        }
    }
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TrendAnalyzer,
        StructureAnalyzer,
        OrderBlockDetector,
        FVGDetector,
        RSICalculator
    };
}
