/**
 * FIBONACCI CLUSTERS MODULE
 * Advanced Fibonacci analysis with cluster detection
 * Identifies key support/resistance levels where multiple Fibonacci levels converge
 */

// ===== FIBONACCI RETRACEMENT =====
class FibonacciRetracement {
    constructor(ohlcv) {
        this.ohlcv = ohlcv;
        this.levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
    }

    /**
     * Calculate Fibonacci retracement levels for a swing
     * @param {Object} swingHigh - Swing high point
     * @param {Object} swingLow - Swing low point
     * @param {string} direction - 'BULLISH' or 'BEARISH'
     * @returns {Array} Fibonacci levels
     */
    calculateLevels(swingHigh, swingLow, direction = 'BULLISH') {
        const high = swingHigh.price;
        const low = swingLow.price;
        const range = high - low;

        const fibLevels = [];

        if (direction === 'BULLISH') {
            // For bullish retracement, levels are below swing high
            this.levels.forEach(level => {
                const price = high - (range * level);
                fibLevels.push({
                    level: level,
                    price: price,
                    label: this.getLevelLabel(level),
                    type: 'RETRACEMENT',
                    direction: 'BULLISH',
                    swingHigh: swingHigh,
                    swingLow: swingLow
                });
            });
        } else {
            // For bearish retracement, levels are above swing low
            this.levels.forEach(level => {
                const price = low + (range * level);
                fibLevels.push({
                    level: level,
                    price: price,
                    label: this.getLevelLabel(level),
                    type: 'RETRACEMENT',
                    direction: 'BEARISH',
                    swingHigh: swingHigh,
                    swingLow: swingLow
                });
            });
        }

        return fibLevels;
    }

    /**
     * Get label for Fibonacci level
     */
    getLevelLabel(level) {
        const labels = {
            0: '0.0%',
            0.236: '23.6%',
            0.382: '38.2%',
            0.5: '50.0%',
            0.618: '61.8% (Golden Ratio)',
            0.786: '78.6%',
            1.0: '100.0%'
        };
        return labels[level] || `${(level * 100).toFixed(1)}%`;
    }
}

// ===== FIBONACCI EXTENSION =====
class FibonacciExtension {
    constructor(ohlcv) {
        this.ohlcv = ohlcv;
        this.levels = [1.272, 1.414, 1.618, 2.0, 2.618];
    }

    /**
     * Calculate Fibonacci extension levels (targets)
     * @param {Object} swingHigh
     * @param {Object} swingLow
     * @param {string} direction
     * @returns {Array} Extension levels
     */
    calculateLevels(swingHigh, swingLow, direction = 'BULLISH') {
        const high = swingHigh.price;
        const low = swingLow.price;
        const range = high - low;

        const fibLevels = [];

        if (direction === 'BULLISH') {
            // Extension levels above swing high
            this.levels.forEach(level => {
                const price = high + (range * (level - 1));
                fibLevels.push({
                    level: level,
                    price: price,
                    label: this.getLevelLabel(level),
                    type: 'EXTENSION',
                    direction: 'BULLISH',
                    swingHigh: swingHigh,
                    swingLow: swingLow
                });
            });
        } else {
            // Extension levels below swing low
            this.levels.forEach(level => {
                const price = low - (range * (level - 1));
                fibLevels.push({
                    level: level,
                    price: price,
                    label: this.getLevelLabel(level),
                    type: 'EXTENSION',
                    direction: 'BEARISH',
                    swingHigh: swingHigh,
                    swingLow: swingLow
                });
            });
        }

        return fibLevels;
    }

    /**
     * Get label for extension level
     */
    getLevelLabel(level) {
        const labels = {
            1.272: '127.2%',
            1.414: '141.4%',
            1.618: '161.8% (Golden Extension)',
            2.0: '200.0%',
            2.618: '261.8%'
        };
        return labels[level] || `${(level * 100).toFixed(1)}%`;
    }
}

// ===== FIBONACCI CLUSTER ANALYZER =====
class FibonacciClusterAnalyzer {
    constructor(ohlcv, swings) {
        this.ohlcv = ohlcv;
        this.swings = swings;
        this.clusterTolerance = 0.015; // 1.5% tolerance for cluster
    }

    /**
     * Analyze all Fibonacci levels and find clusters
     * @returns {Object} Clusters and individual levels
     */
    analyzeClusters() {
        // Get all Fibonacci levels from all swing combinations
        const allLevels = this.calculateAllFibLevels();

        // Detect clusters (multiple levels converging)
        const clusters = this.detectClusters(allLevels);

        // Score clusters by strength
        const scoredClusters = this.scoreClusters(clusters);

        return {
            clusters: scoredClusters,
            allLevels: allLevels,
            totalSwings: this.swings.length
        };
    }

    /**
     * Calculate Fibonacci levels from all swing combinations
     */
    calculateAllFibLevels() {
        const allLevels = [];

        // Get recent swings (last 10)
        const recentSwings = this.swings.slice(-10);

        // Find swing high/low pairs
        for (let i = 0; i < recentSwings.length - 1; i++) {
            for (let j = i + 1; j < recentSwings.length; j++) {
                const swing1 = recentSwings[i];
                const swing2 = recentSwings[j];

                // Check if it's a valid high/low pair
                if (swing1.type === 'HIGH' && swing2.type === 'LOW') {
                    // Bullish retracement
                    const fibRet = new FibonacciRetracement(this.ohlcv);
                    const retLevels = fibRet.calculateLevels(swing1, swing2, 'BULLISH');
                    allLevels.push(...retLevels);

                    // Bullish extension
                    const fibExt = new FibonacciExtension(this.ohlcv);
                    const extLevels = fibExt.calculateLevels(swing1, swing2, 'BULLISH');
                    allLevels.push(...extLevels);

                } else if (swing1.type === 'LOW' && swing2.type === 'HIGH') {
                    // Bearish retracement
                    const fibRet = new FibonacciRetracement(this.ohlcv);
                    const retLevels = fibRet.calculateLevels(swing2, swing1, 'BEARISH');
                    allLevels.push(...retLevels);

                    // Bearish extension
                    const fibExt = new FibonacciExtension(this.ohlcv);
                    const extLevels = fibExt.calculateLevels(swing2, swing1, 'BEARISH');
                    allLevels.push(...extLevels);
                }
            }
        }

        return allLevels;
    }

    /**
     * Detect clusters (zones where multiple Fibonacci levels converge)
     */
    detectClusters(allLevels) {
        if (allLevels.length === 0) return [];

        const clusters = [];
        const processed = new Set();

        allLevels.forEach((level, index) => {
            if (processed.has(index)) return;

            // Find all levels within tolerance
            const clusterLevels = [level];
            processed.add(index);

            for (let j = index + 1; j < allLevels.length; j++) {
                if (processed.has(j)) continue;

                const otherLevel = allLevels[j];
                const priceDiff = Math.abs(level.price - otherLevel.price);
                const priceAvg = (level.price + otherLevel.price) / 2;
                const diffPercent = priceDiff / priceAvg;

                if (diffPercent <= this.clusterTolerance) {
                    clusterLevels.push(otherLevel);
                    processed.add(j);
                }
            }

            // Only consider as cluster if 3+ levels converge
            if (clusterLevels.length >= 3) {
                // Calculate cluster center price
                const avgPrice = clusterLevels.reduce((sum, l) => sum + l.price, 0) / clusterLevels.length;

                clusters.push({
                    price: avgPrice,
                    count: clusterLevels.length,
                    levels: clusterLevels,
                    range: {
                        min: Math.min(...clusterLevels.map(l => l.price)),
                        max: Math.max(...clusterLevels.map(l => l.price))
                    }
                });
            }
        });

        return clusters;
    }

    /**
     * Score clusters by strength and relevance
     */
    scoreClusters(clusters) {
        const currentPrice = this.ohlcv[this.ohlcv.length - 1].close;

        return clusters.map(cluster => {
            // Base score = number of converging levels
            let score = cluster.count * 20; // Max 100 if 5+ levels

            // Bonus: Contains golden ratio (0.618 or 1.618)
            const hasGoldenRatio = cluster.levels.some(l =>
                l.level === 0.618 || l.level === 1.618
            );
            if (hasGoldenRatio) score += 15;

            // Bonus: Mix of retracement and extension
            const hasRetracement = cluster.levels.some(l => l.type === 'RETRACEMENT');
            const hasExtension = cluster.levels.some(l => l.type === 'EXTENSION');
            if (hasRetracement && hasExtension) score += 10;

            // Bonus: Close to current price (within 5%)
            const distanceToPrice = Math.abs(cluster.price - currentPrice) / currentPrice;
            if (distanceToPrice < 0.05) score += 15;
            else if (distanceToPrice < 0.10) score += 10;
            else if (distanceToPrice < 0.15) score += 5;

            // Penalty: Too far from current price (> 20%)
            if (distanceToPrice > 0.20) score -= 20;

            // Determine if support or resistance
            const isSupport = cluster.price < currentPrice;
            const isResistance = cluster.price > currentPrice;

            return {
                ...cluster,
                score: Math.max(0, Math.min(100, score)),
                distanceToPrice: distanceToPrice,
                distancePercent: (distanceToPrice * 100).toFixed(2),
                isSupport: isSupport,
                isResistance: isResistance,
                type: isSupport ? 'SUPPORT' : 'RESISTANCE',
                hasGoldenRatio: hasGoldenRatio,
                description: this.getClusterDescription(cluster, hasGoldenRatio, isSupport)
            };
        }).sort((a, b) => b.score - a.score); // Sort by score descending
    }

    /**
     * Get description for cluster
     */
    getClusterDescription(cluster, hasGoldenRatio, isSupport) {
        const type = isSupport ? 'Support' : 'Résistance';
        const golden = hasGoldenRatio ? ' (Golden Ratio)' : '';
        return `${type} Fibonacci cluster: ${cluster.count} niveaux${golden}`;
    }

    /**
     * Check if current price is near a cluster
     */
    isPriceNearCluster(currentPrice, tolerance = 0.02) {
        const analysis = this.analyzeClusters();

        return analysis.clusters.filter(cluster => {
            const distance = Math.abs(cluster.price - currentPrice) / currentPrice;
            return distance <= tolerance;
        });
    }
}

// ===== ADVANCED VOLUME PROFILE =====
class AdvancedVolumeProfile {
    constructor(ohlcv, priceStep) {
        this.ohlcv = ohlcv;
        this.priceStep = priceStep || this.calculateOptimalPriceStep();
    }

    /**
     * Calculate optimal price step based on price range
     */
    calculateOptimalPriceStep() {
        const prices = this.ohlcv.map(c => c.close);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const range = maxPrice - minPrice;

        // Aim for ~50-100 price bins
        return range / 75;
    }

    /**
     * Build comprehensive volume profile
     * @returns {Object} Complete volume profile with POC, VAH, VAL, HVN, LVN
     */
    buildProfile() {
        // Build volume by price bins
        const volumeByPrice = {};

        this.ohlcv.forEach(candle => {
            const priceBin = Math.floor(candle.close / this.priceStep) * this.priceStep;

            if (!volumeByPrice[priceBin]) {
                volumeByPrice[priceBin] = 0;
            }
            volumeByPrice[priceBin] += candle.volume;
        });

        // Convert to sorted array
        const profile = Object.entries(volumeByPrice)
            .map(([price, volume]) => ({
                price: parseFloat(price),
                volume: volume
            }))
            .sort((a, b) => b.volume - a.volume);

        // Calculate POC (Point of Control)
        const poc = profile[0];

        // Calculate total volume
        const totalVolume = profile.reduce((sum, p) => sum + p.volume, 0);

        // Calculate Value Area (70% of volume)
        const valueArea = this.calculateValueArea(profile, totalVolume, poc);

        // Identify High Volume Nodes (HVN) and Low Volume Nodes (LVN)
        const hvnLvn = this.identifyHVN_LVN(profile, totalVolume);

        return {
            poc: poc.price,
            vah: valueArea.vah,
            val: valueArea.val,
            hvn: hvnLvn.hvn,
            lvn: hvnLvn.lvn,
            profile: profile,
            totalVolume: totalVolume,
            description: `POC: $${poc.price.toFixed(2)} | VA: $${valueArea.val.toFixed(2)} - $${valueArea.vah.toFixed(2)}`
        };
    }

    /**
     * Calculate Value Area (70% of volume around POC)
     */
    calculateValueArea(profile, totalVolume, poc) {
        const valueAreaTarget = totalVolume * 0.70;
        const sortedByPrice = [...profile].sort((a, b) => a.price - b.price);

        let valueAreaVolume = poc.volume;
        const valueArea = [poc];

        const pocIndex = sortedByPrice.findIndex(p => p.price === poc.price);
        let upperIndex = pocIndex + 1;
        let lowerIndex = pocIndex - 1;

        while (valueAreaVolume < valueAreaTarget &&
               (upperIndex < sortedByPrice.length || lowerIndex >= 0)) {

            const upperVol = upperIndex < sortedByPrice.length ? sortedByPrice[upperIndex].volume : 0;
            const lowerVol = lowerIndex >= 0 ? sortedByPrice[lowerIndex].volume : 0;

            if (upperVol > lowerVol && upperIndex < sortedByPrice.length) {
                valueArea.push(sortedByPrice[upperIndex]);
                valueAreaVolume += upperVol;
                upperIndex++;
            } else if (lowerIndex >= 0) {
                valueArea.push(sortedByPrice[lowerIndex]);
                valueAreaVolume += lowerVol;
                lowerIndex--;
            } else {
                break;
            }
        }

        const vah = Math.max(...valueArea.map(p => p.price));
        const val = Math.min(...valueArea.map(p => p.price));

        return { vah, val, valueArea };
    }

    /**
     * Identify High Volume Nodes and Low Volume Nodes
     */
    identifyHVN_LVN(profile, totalVolume) {
        const avgVolume = totalVolume / profile.length;
        const threshold = avgVolume * 1.5; // 150% of average

        // High Volume Nodes (above threshold)
        const hvn = profile
            .filter(p => p.volume > threshold)
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5) // Top 5
            .map(p => ({
                price: p.price,
                volume: p.volume,
                volumePercent: ((p.volume / totalVolume) * 100).toFixed(2),
                description: `HVN @ $${p.price.toFixed(2)} (${((p.volume / totalVolume) * 100).toFixed(1)}% volume)`
            }));

        // Low Volume Nodes (below 50% of average)
        const lvnThreshold = avgVolume * 0.5;
        const lvn = profile
            .filter(p => p.volume < lvnThreshold)
            .sort((a, b) => a.volume - b.volume)
            .slice(0, 5) // Bottom 5
            .map(p => ({
                price: p.price,
                volume: p.volume,
                volumePercent: ((p.volume / totalVolume) * 100).toFixed(2),
                description: `LVN @ $${p.price.toFixed(2)} (faible résistance)`
            }));

        return { hvn, lvn };
    }

    /**
     * Evaluate price position relative to volume profile
     */
    evaluateCurrentPrice(currentPrice) {
        const profile = this.buildProfile();

        // Check if price is at POC
        const atPOC = Math.abs(currentPrice - profile.poc) / currentPrice < 0.01; // Within 1%

        // Check if price is in Value Area
        const inValueArea = currentPrice >= profile.val && currentPrice <= profile.vah;

        // Check if price is near HVN
        const nearHVN = profile.hvn.find(hvn =>
            Math.abs(currentPrice - hvn.price) / currentPrice < 0.02
        );

        // Check if price is in LVN (low resistance zone)
        const inLVN = profile.lvn.find(lvn =>
            Math.abs(currentPrice - lvn.price) / currentPrice < 0.02
        );

        let quality, reason;

        if (atPOC) {
            quality = 'NEUTRAL';
            reason = 'Prix au POC - Zone de forte activité';
        } else if (nearHVN) {
            if (currentPrice < profile.poc) {
                quality = 'EXCELLENT';
                reason = `Prix à HVN sous POC - Support fort @ $${nearHVN.price.toFixed(2)}`;
            } else {
                quality = 'POOR';
                reason = `Prix à HVN au-dessus POC - Résistance forte @ $${nearHVN.price.toFixed(2)}`;
            }
        } else if (inLVN) {
            quality = 'GOOD';
            reason = `Prix en LVN - Zone de faible résistance @ $${inLVN.price.toFixed(2)}`;
        } else if (inValueArea) {
            if (currentPrice < profile.poc) {
                quality = 'GOOD';
                reason = 'Prix dans Value Area sous POC - Zone d\'achat';
            } else {
                quality = 'MODERATE';
                reason = 'Prix dans Value Area au-dessus POC';
            }
        } else if (currentPrice < profile.val) {
            quality = 'EXCELLENT';
            reason = `Prix sous Value Area @ $${profile.val.toFixed(2)} - Zone d'accumulation`;
        } else {
            quality = 'POOR';
            reason = `Prix au-dessus Value Area @ $${profile.vah.toFixed(2)} - Zone de distribution`;
        }

        return {
            quality: quality,
            reason: reason,
            profile: profile,
            atPOC: atPOC,
            inValueArea: inValueArea,
            nearHVN: nearHVN,
            inLVN: inLVN
        };
    }
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FibonacciRetracement,
        FibonacciExtension,
        FibonacciClusterAnalyzer,
        AdvancedVolumeProfile
    };
}
