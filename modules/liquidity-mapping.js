/**
 * LIQUIDITY MAPPING MODULE
 * Detects liquidity pools (stop-loss concentrations) and liquidity sweeps
 * Critical for crypto markets where price manipulation is common
 *
 * Key Concepts:
 * - Liquidity Pools: Areas where many stop-losses cluster (equal highs/lows, round numbers)
 * - Liquidity Sweep: Price briefly sweeps through stops then reverses (manipulation)
 * - Magnet Effect: Price is attracted to high liquidity zones
 */

// ===== LIQUIDITY MAPPER =====
class LiquidityMapper {
    constructor(ohlcv, swings) {
        this.ohlcv = ohlcv;
        this.swings = swings;
    }

    /**
     * Detect liquidity pools (concentrations de stops)
     * @returns {Array} Liquidity zones sorted by priority
     */
    detectLiquidityPools() {
        const pools = [];

        // 1. Equal Highs/Lows (double/triple tops/bottoms)
        const equalHighs = this.findEqualHighs();
        const equalLows = this.findEqualLows();

        equalHighs.forEach(eh => {
            pools.push({
                type: 'LIQUIDITY_POOL',
                side: 'SELL',  // Stops au-dessus
                price: eh.price,
                strength: eh.touches,  // Nombre de tests
                reason: `Equal Highs (${eh.touches}x)`,
                stopType: 'SELL_STOPS_ABOVE',
                magnetEffect: 'HIGH',  // Prix sera attiré
                priority: this.calculatePriority(eh),
                lastTouch: eh.lastTouch,
                touches: eh.touches
            });
        });

        equalLows.forEach(el => {
            pools.push({
                type: 'LIQUIDITY_POOL',
                side: 'BUY',  // Stops en-dessous
                price: el.price,
                strength: el.touches,
                reason: `Equal Lows (${el.touches}x)`,
                stopType: 'BUY_STOPS_BELOW',
                magnetEffect: 'HIGH',
                priority: this.calculatePriority(el),
                lastTouch: el.lastTouch,
                touches: el.touches
            });
        });

        // 2. Round Numbers
        const currentPrice = this.ohlcv[this.ohlcv.length - 1].close;
        const roundLevels = this.findRoundNumbers(currentPrice);

        roundLevels.forEach(level => {
            pools.push({
                type: 'ROUND_NUMBER',
                side: level.price > currentPrice ? 'SELL' : 'BUY',
                price: level.price,
                strength: level.magnitude,  // 10k, 100k, etc
                reason: `Psychological level ($${level.price.toLocaleString()})`,
                magnetEffect: 'MEDIUM',
                priority: level.magnitude,
                magnitude: level.magnitude
            });
        });

        // 3. Swing Extremes (stops cluster just beyond swings)
        this.swings.forEach(swing => {
            // Stops are placed just beyond swings
            const buffer = swing.type === 'HIGH' ? 1.005 : 0.995; // 0.5% beyond
            const stopPrice = swing.price * buffer;

            pools.push({
                type: 'SWING_STOPS',
                side: swing.type === 'HIGH' ? 'SELL' : 'BUY',
                price: stopPrice,
                strength: this.calculateSwingStrength(swing),
                reason: `Stops ${swing.type === 'HIGH' ? 'above' : 'below'} ${swing.type.toLowerCase()} ($${swing.price.toFixed(2)})`,
                magnetEffect: 'MEDIUM',
                priority: 3,
                swingType: swing.type,
                swingPrice: swing.price
            });
        });

        return this.rankByPriority(pools);
    }

    /**
     * Detect equal highs (double/triple tops)
     * These are magnets for liquidity - stops cluster above them
     */
    findEqualHighs(tolerance = 0.003) {  // 0.3% tolerance
        const highs = this.swings.filter(s => s.type === 'HIGH');
        const clusters = [];
        const processed = new Set();

        for (let i = 0; i < highs.length; i++) {
            if (processed.has(i)) continue;

            const cluster = [highs[i]];
            processed.add(i);

            // Find all highs within tolerance
            for (let j = i + 1; j < highs.length; j++) {
                if (processed.has(j)) continue;

                const priceDiff = Math.abs(highs[i].price - highs[j].price) / highs[i].price;
                if (priceDiff < tolerance) {
                    cluster.push(highs[j]);
                    processed.add(j);
                }
            }

            if (cluster.length >= 2) {  // At least double top
                const avgPrice = cluster.reduce((sum, h) => sum + h.price, 0) / cluster.length;
                clusters.push({
                    price: avgPrice,
                    touches: cluster.length,
                    swings: cluster,
                    lastTouch: cluster[cluster.length - 1].timestamp
                });
            }
        }

        return clusters;
    }

    /**
     * Detect equal lows (double/triple bottoms)
     * Stops cluster below these levels
     */
    findEqualLows(tolerance = 0.003) {
        const lows = this.swings.filter(s => s.type === 'LOW');
        const clusters = [];
        const processed = new Set();

        for (let i = 0; i < lows.length; i++) {
            if (processed.has(i)) continue;

            const cluster = [lows[i]];
            processed.add(i);

            for (let j = i + 1; j < lows.length; j++) {
                if (processed.has(j)) continue;

                const priceDiff = Math.abs(lows[i].price - lows[j].price) / lows[i].price;
                if (priceDiff < tolerance) {
                    cluster.push(lows[j]);
                    processed.add(j);
                }
            }

            if (cluster.length >= 2) {
                const avgPrice = cluster.reduce((sum, l) => sum + l.price, 0) / cluster.length;
                clusters.push({
                    price: avgPrice,
                    touches: cluster.length,
                    swings: cluster,
                    lastTouch: cluster[cluster.length - 1].timestamp
                });
            }
        }

        return clusters;
    }

    /**
     * Find nearby round numbers (psychological levels)
     * Example: 50000, 100000 are magnets for BTC
     */
    findRoundNumbers(currentPrice) {
        const levels = [];

        // Define magnitudes based on price range
        let magnitudes;
        if (currentPrice >= 50000) {
            magnitudes = [
                { step: 100000, magnitude: 5 },   // 100k, 200k
                { step: 50000, magnitude: 4 },    // 50k, 150k
                { step: 10000, magnitude: 3 },    // 10k, 20k
                { step: 5000, magnitude: 2 }      // 5k, 15k
            ];
        } else if (currentPrice >= 10000) {
            magnitudes = [
                { step: 10000, magnitude: 5 },
                { step: 5000, magnitude: 4 },
                { step: 1000, magnitude: 3 },
                { step: 500, magnitude: 2 }
            ];
        } else if (currentPrice >= 1000) {
            magnitudes = [
                { step: 1000, magnitude: 5 },
                { step: 500, magnitude: 4 },
                { step: 100, magnitude: 3 },
                { step: 50, magnitude: 2 }
            ];
        } else {
            magnitudes = [
                { step: 100, magnitude: 5 },
                { step: 50, magnitude: 4 },
                { step: 10, magnitude: 3 },
                { step: 5, magnitude: 2 }
            ];
        }

        magnitudes.forEach(mag => {
            // Find nearest round numbers above and below
            const below = Math.floor(currentPrice / mag.step) * mag.step;
            const above = Math.ceil(currentPrice / mag.step) * mag.step;

            // Only include if within 5% of current price
            if (below > 0 && Math.abs(below - currentPrice) / currentPrice < 0.05) {
                levels.push({ price: below, magnitude: mag.magnitude });
            }
            if (above !== below && Math.abs(above - currentPrice) / currentPrice < 0.05) {
                levels.push({ price: above, magnitude: mag.magnitude });
            }
        });

        // Remove duplicates
        const uniqueLevels = [];
        const seen = new Set();
        levels.forEach(level => {
            if (!seen.has(level.price)) {
                seen.add(level.price);
                uniqueLevels.push(level);
            }
        });

        return uniqueLevels;
    }

    /**
     * Calculate swing strength based on multiple factors
     */
    calculateSwingStrength(swing) {
        let strength = 1;

        // Factor 1: Age (recent swings are stronger)
        const ageInCandles = this.ohlcv.length - swing.index;
        if (ageInCandles < 20) strength += 2;
        else if (ageInCandles < 50) strength += 1;

        // Factor 2: Volume at swing
        if (swing.candle && swing.candle.volume) {
            const avgVolume = this.calculateAverageVolume(50);
            if (swing.candle.volume > avgVolume * 1.5) strength += 2;
            else if (swing.candle.volume > avgVolume * 1.2) strength += 1;
        }

        // Factor 3: Number of tests
        const tests = this.countTests(swing);
        strength += Math.min(tests, 3);  // Cap at 3 bonus points

        return Math.min(10, strength);
    }

    /**
     * Calculate average volume over period
     */
    calculateAverageVolume(period) {
        const start = Math.max(0, this.ohlcv.length - period);
        const volumes = this.ohlcv.slice(start).map(c => c.volume);
        return volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    }

    /**
     * Count how many times a swing level was tested
     */
    countTests(swing) {
        let tests = 0;
        const tolerance = 0.005;  // 0.5%

        for (let i = swing.index + 1; i < this.ohlcv.length; i++) {
            const candle = this.ohlcv[i];
            const testPrice = swing.type === 'HIGH' ? candle.high : candle.low;
            const priceDiff = Math.abs(testPrice - swing.price) / swing.price;

            if (priceDiff < tolerance) {
                tests++;
            }
        }

        return tests;
    }

    /**
     * Calculate priority (1-10) for targeting
     * Higher priority = more likely to be targeted by smart money
     */
    calculatePriority(cluster) {
        let priority = 5;  // Base priority

        // More touches = higher priority
        if (cluster.touches >= 3) priority += 3;
        else if (cluster.touches === 2) priority += 2;

        // Recent clusters are more relevant
        const currentTime = Date.now();
        const age = (currentTime - cluster.lastTouch) / (1000 * 60 * 60 * 24);  // days
        if (age < 7) priority += 2;      // Very recent
        else if (age < 30) priority += 1; // Recent
        // Older than 30 days = no bonus

        return Math.min(10, priority);
    }

    /**
     * Rank pools by priority and proximity to current price
     * Nearest + highest priority = most likely target
     */
    rankByPriority(pools) {
        const currentPrice = this.ohlcv[this.ohlcv.length - 1].close;

        return pools
            .map(pool => ({
                ...pool,
                distancePercent: Math.abs(pool.price - currentPrice) / currentPrice * 100,
                proximityScore: 1 / Math.max(0.001, Math.abs(pool.price - currentPrice) / currentPrice)
            }))
            .sort((a, b) => {
                // Sort by: priority * proximity (closer + higher priority = first)
                const scoreA = a.priority * a.proximityScore;
                const scoreB = b.priority * b.proximityScore;
                return scoreB - scoreA;
            });
    }

    /**
     * Detect if price is "sweeping" liquidity
     * A sweep = wick through stops, close back inside = manipulation
     * This is a CRITICAL reversal signal
     */
    detectLiquiditySweep(pool, currentCandle) {
        const tolerance = 0.002;  // 0.2% wick beyond level

        if (pool.side === 'SELL') {
            // Sell-side sweep: High sweeps above stops, close below level
            const sweptAbove = currentCandle.high > pool.price * (1 + tolerance);
            const closedBelow = currentCandle.close < pool.price;

            return {
                swept: sweptAbove && closedBelow,
                type: 'SELL_SIDE_SWEEP',
                signal: 'BEARISH_REVERSAL',  // Swept buy stops, now reverse down
                confidence: sweptAbove && closedBelow ? 'HIGH' : 'LOW',
                wickSize: sweptAbove ? ((currentCandle.high - pool.price) / pool.price * 100).toFixed(2) : 0,
                rejection: sweptAbove && closedBelow
            };
        } else {
            // Buy-side sweep: Low sweeps below stops, close above level
            const sweptBelow = currentCandle.low < pool.price * (1 - tolerance);
            const closedAbove = currentCandle.close > pool.price;

            return {
                swept: sweptBelow && closedAbove,
                type: 'BUY_SIDE_SWEEP',
                signal: 'BULLISH_REVERSAL',  // Swept sell stops, now reverse up
                confidence: sweptBelow && closedAbove ? 'HIGH' : 'LOW',
                wickSize: sweptBelow ? ((pool.price - currentCandle.low) / pool.price * 100).toFixed(2) : 0,
                rejection: sweptBelow && closedAbove
            };
        }
    }

    /**
     * Get analysis summary for display
     */
    getAnalysisSummary() {
        const pools = this.detectLiquidityPools();
        const currentPrice = this.ohlcv[this.ohlcv.length - 1].close;
        const lastCandle = this.ohlcv[this.ohlcv.length - 1];

        // Find nearest pools above and below
        const poolsAbove = pools.filter(p => p.price > currentPrice).slice(0, 3);
        const poolsBelow = pools.filter(p => p.price < currentPrice).slice(0, 3);

        // Check for recent sweeps
        const recentSweeps = [];
        pools.forEach(pool => {
            if (pool.distancePercent < 2) {  // Only check nearby pools
                const sweep = this.detectLiquiditySweep(pool, lastCandle);
                if (sweep.swept) {
                    recentSweeps.push({
                        pool: pool,
                        sweep: sweep
                    });
                }
            }
        });

        return {
            totalPools: pools.length,
            poolsAbove: poolsAbove,
            poolsBelow: poolsBelow,
            nearestPool: pools[0],
            recentSweeps: recentSweeps,
            currentPrice: currentPrice,
            summary: this.generateSummaryText(pools, recentSweeps)
        };
    }

    /**
     * Generate human-readable summary
     */
    generateSummaryText(pools, recentSweeps) {
        if (recentSweeps.length > 0) {
            const sweep = recentSweeps[0];
            return `🔥 LIQUIDITY SWEEP DETECTED: ${sweep.sweep.signal} at $${sweep.pool.price.toFixed(2)}`;
        }

        if (pools.length === 0) {
            return 'No significant liquidity pools detected nearby';
        }

        const nearest = pools[0];
        if (nearest.distancePercent < 2) {
            return `⚠️ Price approaching ${nearest.reason} at $${nearest.price.toFixed(2)} (${nearest.distancePercent.toFixed(1)}% away)`;
        }

        return `Nearest liquidity: ${nearest.reason} at $${nearest.price.toFixed(2)}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LiquidityMapper };
}
