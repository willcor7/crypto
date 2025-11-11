/**
 * ENTRY SIGNALS MODULE
 * Confluence-based entry signal generation
 * Combines fundamental score + technical analysis for optimal entry points
 */

// ===== ENTRY CONFLUENCE ENGINE =====
class EntryConfluenceEngine {
    constructor(crypto, technicalData) {
        this.crypto = crypto;
        this.tech = technicalData;
        this.score = 0;
        this.confirmations = [];
        this.maxScore = 155; // Updated: 100 + 20 (Fib) + 15 (VP) + 20 (Liquidity)
    }

    /**
     * Evaluate entry opportunity with confluence scoring
     * @returns {Object} Entry signal with score and confirmations
     */
    evaluateEntry() {
        // Reset
        this.score = 0;
        this.confirmations = [];

        // 1. Structure HTF (30 points)
        const structureScore = this.evaluateStructure();
        this.score += structureScore.points;
        if (structureScore.confirmed) {
            this.confirmations.push(structureScore);
        }

        // 2. Zone Technique (25 points)
        const zoneScore = this.evaluateZone();
        this.score += zoneScore.points;
        if (zoneScore.confirmed) {
            this.confirmations.push(zoneScore);
        }

        // 3. Volume/Momentum (20 points)
        const volumeScore = this.evaluateVolume();
        this.score += volumeScore.points;
        if (volumeScore.confirmed) {
            this.confirmations.push(volumeScore);
        }

        // 4. Fundamental Score Bonus (15 points)
        const fundamentalScore = this.evaluateFundamental();
        this.score += fundamentalScore.points;
        if (fundamentalScore.confirmed) {
            this.confirmations.push(fundamentalScore);
        }

        // 5. RSI/Oscillators (10 points)
        const rsiScore = this.evaluateRSI();
        this.score += rsiScore.points;
        if (rsiScore.confirmed) {
            this.confirmations.push(rsiScore);
        }

        // 6. Fibonacci Clusters (20 points)
        const fibScore = this.evaluateFibonacciClusters();
        this.score += fibScore.points;
        if (fibScore.confirmed) {
            this.confirmations.push(fibScore);
        }

        // 7. Volume Profile (15 points)
        const vpScore = this.evaluateVolumeProfile();
        this.score += vpScore.points;
        if (vpScore.confirmed) {
            this.confirmations.push(vpScore);
        }

        // 8. Liquidity Analysis (20 points) - NEW
        const liquidityScore = this.evaluateLiquidity();
        this.score += liquidityScore.points;
        if (liquidityScore.confirmed) {
            this.confirmations.push(liquidityScore);
        }

        return this.getEntrySignal();
    }

    /**
     * Evaluate Structure (HTF Trend + BOS/CHoCH)
     * Max: 30 points
     */
    evaluateStructure() {
        let points = 0;
        let confirmed = false;
        let reason = '';
        let icon = '❌';

        const trend = this.tech.trend;
        const bos = this.tech.bos && this.tech.bos.length > 0 ? this.tech.bos[0] : null;
        const choch = this.tech.choch && this.tech.choch.length > 0 ? this.tech.choch[0] : null;

        // Strong bullish trend + Bullish BOS = 30 points
        if (trend.trend === 'STRONG_BULLISH' && bos && bos.type === 'BULLISH_BOS') {
            points = 30;
            confirmed = true;
            reason = 'Tendance haussière forte + BOS bullish récent';
            icon = '✅';
        }
        // Bullish trend + No bearish structure = 20 points
        else if ((trend.trend === 'BULLISH' || trend.trend === 'STRONG_BULLISH') &&
                 (!bos || bos.type !== 'BEARISH_BOS')) {
            points = 20;
            confirmed = true;
            reason = 'Tendance haussière confirmée';
            icon = '✅';
        }
        // Bullish CHoCH (potential reversal) = 25 points
        else if (choch && choch.type === 'BULLISH_CHOCH') {
            points = 25;
            confirmed = true;
            reason = 'Changement de caractère haussier détecté';
            icon = '✅';
        }
        // Range with neutral structure = 10 points
        else if (trend.trend === 'RANGE' && (!bos || bos.ageInCandles > 20)) {
            points = 10;
            reason = 'Marché en range - Structure neutre';
            icon = '⚠️';
        }
        // Weak or bearish trend = 0 points
        else {
            reason = 'Structure HTF défavorable pour long';
            icon = '❌';
        }

        return {
            category: 'Structure HTF',
            points: points,
            confirmed: confirmed,
            reason: reason,
            icon: icon,
            weight: 30
        };
    }

    /**
     * Evaluate Zone (OB, FVG, Support/Resistance)
     * Max: 25 points
     */
    evaluateZone() {
        let points = 0;
        let confirmed = false;
        let reason = '';
        let icon = '❌';

        const orderBlocks = this.tech.orderBlocks || [];
        const fvgs = this.tech.fvgs || [];
        const currentPrice = this.crypto.price;

        // Check if price is near untested bullish OB
        const bullishOB = orderBlocks.find(ob =>
            ob.type === 'BULLISH_OB' &&
            !ob.tested &&
            currentPrice >= ob.zone.bottom * 0.98 &&
            currentPrice <= ob.zone.top * 1.02
        );

        if (bullishOB && bullishOB.strength > 70) {
            points = 25;
            confirmed = true;
            reason = `Prix dans Order Block haussier fort ($${bullishOB.zone.midpoint.toFixed(2)})`;
            icon = '✅';
        } else if (bullishOB) {
            points = 18;
            confirmed = true;
            reason = `Prix proche Order Block haussier ($${bullishOB.zone.midpoint.toFixed(2)})`;
            icon = '✅';
        }

        // Check if price is near unfilled bullish FVG
        if (points === 0) {
            const bullishFVG = fvgs.find(fvg =>
                fvg.type === 'BULLISH_FVG' &&
                !fvg.filled &&
                currentPrice >= fvg.zone.bottom * 0.98 &&
                currentPrice <= fvg.zone.top * 1.02
            );

            if (bullishFVG) {
                points = 20;
                confirmed = true;
                reason = `Prix dans Fair Value Gap haussier ($${bullishFVG.zone.midpoint.toFixed(2)})`;
                icon = '✅';
            }
        }

        // Check if price is near bearish zones (negative signal)
        if (points === 0) {
            const bearishOB = orderBlocks.find(ob =>
                ob.type === 'BEARISH_OB' &&
                !ob.tested &&
                currentPrice >= ob.zone.bottom * 0.98 &&
                currentPrice <= ob.zone.top * 1.02
            );

            if (bearishOB) {
                points = 0;
                reason = 'Prix dans zone de résistance (Order Block baissier)';
                icon = '⚠️';
            }
        }

        if (points === 0 && !reason) {
            reason = 'Prix hors zones techniques optimales';
            icon = '❌';
        }

        return {
            category: 'Zone Technique',
            points: points,
            confirmed: confirmed,
            reason: reason,
            icon: icon,
            weight: 25
        };
    }

    /**
     * Evaluate Volume/Momentum
     * Max: 20 points
     */
    evaluateVolume() {
        let points = 0;
        let confirmed = false;
        let reason = '';
        let icon = '❌';

        const volumeRatio = this.crypto.volume24h / this.crypto.marketCap;
        const priceChange = this.crypto.priceChange24h;

        // High volume + positive momentum
        if (volumeRatio > 0.15 && priceChange > 5) {
            points = 20;
            confirmed = true;
            reason = 'Volume élevé + momentum positif fort';
            icon = '✅';
        }
        // High volume + small negative move (capitulation possible)
        else if (volumeRatio > 0.15 && priceChange > -5 && priceChange < 0) {
            points = 18;
            confirmed = true;
            reason = 'Volume élevé sur baisse - Possible capitulation';
            icon = '✅';
        }
        // Moderate volume + positive price action
        else if (volumeRatio > 0.08 && priceChange > 0) {
            points = 12;
            confirmed = true;
            reason = 'Volume modéré + prix positif';
            icon = '✅';
        }
        // Moderate volume
        else if (volumeRatio > 0.05) {
            points = 8;
            reason = 'Volume modéré';
            icon = '⚠️';
        }
        // Low volume
        else {
            reason = 'Volume faible - Manque de conviction';
            icon = '❌';
        }

        return {
            category: 'Volume/Momentum',
            points: points,
            confirmed: confirmed,
            reason: reason,
            icon: icon,
            weight: 20
        };
    }

    /**
     * Evaluate Fundamental (from existing scoring system)
     * Max: 15 points
     */
    evaluateFundamental() {
        let points = 0;
        let confirmed = false;
        let reason = '';
        let icon = '❌';

        const score = this.crypto.score || 0;

        // Excellent fundamental score
        if (score >= 85) {
            points = 15;
            confirmed = true;
            reason = `Score fondamental excellent (${score})`;
            icon = '✅';
        }
        // Very good score
        else if (score >= 80) {
            points = 12;
            confirmed = true;
            reason = `Score fondamental très bon (${score})`;
            icon = '✅';
        }
        // Good score
        else if (score >= 75) {
            points = 10;
            confirmed = true;
            reason = `Score fondamental bon (${score})`;
            icon = '✅';
        }
        // Moderate score
        else if (score >= 70) {
            points = 5;
            reason = `Score fondamental modéré (${score})`;
            icon = '⚠️';
        }
        // Weak score
        else {
            reason = `Score fondamental faible (${score}) - Non recommandé`;
            icon = '❌';
        }

        // Bonus for specific fundamental factors
        if (this.crypto.mvrv && this.crypto.mvrv < 1.0) {
            points += 2;
            reason += ' + MVRV sous-évalué';
        }

        if (this.crypto.whaleAccumulation && this.crypto.whaleAccumulation > 4) {
            points += 2;
            reason += ' + Accumulation baleines';
        }

        points = Math.min(15, points);

        return {
            category: 'Fondamental',
            points: points,
            confirmed: confirmed,
            reason: reason,
            icon: icon,
            weight: 15
        };
    }

    /**
     * Evaluate RSI and Oscillators
     * Max: 10 points
     */
    evaluateRSI() {
        let points = 0;
        let confirmed = false;
        let reason = '';
        let icon = '❌';

        const rsi = this.tech.rsi;

        if (!rsi || rsi.value === null) {
            return {
                category: 'RSI/Oscillators',
                points: 0,
                confirmed: false,
                reason: 'RSI non disponible',
                icon: '⚠️',
                weight: 10
            };
        }

        // RSI oversold (< 30) = excellent entry
        if (rsi.value < 30) {
            points = 10;
            confirmed = true;
            reason = `RSI survendu (${rsi.value.toFixed(1)}) - Zone d\'accumulation`;
            icon = '✅';
        }
        // RSI healthy range (30-50)
        else if (rsi.value >= 30 && rsi.value < 50) {
            points = 7;
            confirmed = true;
            reason = `RSI sain (${rsi.value.toFixed(1)})`;
            icon = '✅';
        }
        // RSI neutral (50-60)
        else if (rsi.value >= 50 && rsi.value < 60) {
            points = 5;
            reason = `RSI neutre (${rsi.value.toFixed(1)})`;
            icon = '⚠️';
        }
        // RSI high but not overbought (60-70)
        else if (rsi.value >= 60 && rsi.value < 70) {
            points = 3;
            reason = `RSI élevé (${rsi.value.toFixed(1)}) - Prudence`;
            icon = '⚠️';
        }
        // RSI overbought (> 70)
        else {
            reason = `RSI suracheté (${rsi.value.toFixed(1)}) - Attendre pullback`;
            icon = '❌';
        }

        return {
            category: 'RSI/Oscillators',
            points: points,
            confirmed: confirmed,
            reason: reason,
            icon: icon,
            weight: 10
        };
    }

    /**
     * Evaluate Fibonacci Clusters
     * Max: 20 points
     */
    evaluateFibonacciClusters() {
        let points = 0;
        let confirmed = false;
        let reason = '';
        let icon = '❌';

        const fibonacci = this.tech.fibonacci;
        const currentPrice = this.crypto.price;

        if (!fibonacci || !fibonacci.clusters || fibonacci.clusters.length === 0) {
            return {
                category: 'Fibonacci Clusters',
                points: 0,
                confirmed: false,
                reason: 'Pas de clusters Fibonacci détectés',
                icon: '⚠️',
                weight: 20
            };
        }

        // Find clusters near current price (within 3%)
        const nearbyClusters = fibonacci.clusters.filter(cluster => {
            const distance = Math.abs(cluster.price - currentPrice) / currentPrice;
            return distance < 0.03; // Within 3%
        });

        if (nearbyClusters.length === 0) {
            return {
                category: 'Fibonacci Clusters',
                points: 0,
                confirmed: false,
                reason: 'Prix loin des clusters Fibonacci',
                icon: '⚠️',
                weight: 20
            };
        }

        // Evaluate strongest cluster
        const strongestCluster = nearbyClusters.sort((a, b) => b.score - a.score)[0];
        const clusterScore = strongestCluster.score;
        const hasGoldenRatio = strongestCluster.hasGoldenRatio;

        // Strong cluster with Golden Ratio (0.618 or 1.618)
        if (clusterScore >= 80 && hasGoldenRatio) {
            points = 20;
            confirmed = true;
            reason = `Cluster Fibonacci FORT (${clusterScore}/100) + Golden Ratio à $${strongestCluster.price.toFixed(2)}`;
            icon = '✅';
        }
        // Strong cluster without Golden Ratio
        else if (clusterScore >= 80) {
            points = 17;
            confirmed = true;
            reason = `Cluster Fibonacci fort (${clusterScore}/100) à $${strongestCluster.price.toFixed(2)}`;
            icon = '✅';
        }
        // Moderate cluster with Golden Ratio
        else if (clusterScore >= 60 && hasGoldenRatio) {
            points = 15;
            confirmed = true;
            reason = `Cluster modéré (${clusterScore}/100) + Golden Ratio à $${strongestCluster.price.toFixed(2)}`;
            icon = '✅';
        }
        // Moderate cluster
        else if (clusterScore >= 60) {
            points = 12;
            confirmed = true;
            reason = `Cluster modéré (${clusterScore}/100) à $${strongestCluster.price.toFixed(2)}`;
            icon = '✅';
        }
        // Weak cluster
        else if (clusterScore >= 40) {
            points = 7;
            reason = `Cluster faible (${clusterScore}/100)`;
            icon = '⚠️';
        }
        else {
            reason = `Cluster très faible (${clusterScore}/100) - Non significatif`;
            icon = '❌';
        }

        return {
            category: 'Fibonacci Clusters',
            points: points,
            confirmed: confirmed,
            reason: reason,
            icon: icon,
            weight: 20
        };
    }

    /**
     * Evaluate Volume Profile
     * Max: 15 points
     */
    evaluateVolumeProfile() {
        let points = 0;
        let confirmed = false;
        let reason = '';
        let icon = '❌';

        const volumeProfile = this.tech.volumeProfile;
        const currentPrice = this.crypto.price;

        if (!volumeProfile || !volumeProfile.poc) {
            return {
                category: 'Volume Profile',
                points: 0,
                confirmed: false,
                reason: 'Volume Profile non disponible',
                icon: '⚠️',
                weight: 15
            };
        }

        const poc = volumeProfile.poc;
        const vah = volumeProfile.vah;
        const val = volumeProfile.val;
        const hvnNodes = volumeProfile.hvn || [];
        const lvnNodes = volumeProfile.lvn || [];

        // Calculate distance to POC
        const distanceToPOC = Math.abs(currentPrice - poc.price) / currentPrice;

        // Check if price is in Value Area
        const inValueArea = currentPrice >= val.price && currentPrice <= vah.price;

        // Check if near HVN (High Volume Node)
        const nearHVN = hvnNodes.some(hvn => {
            const distance = Math.abs(currentPrice - hvn.price) / currentPrice;
            return distance < 0.02; // Within 2%
        });

        // Check if near LVN (Low Volume Node) - potential breakout zone
        const nearLVN = lvnNodes.some(lvn => {
            const distance = Math.abs(currentPrice - lvn.price) / currentPrice;
            return distance < 0.02;
        });

        // Price at POC (highest volume) = excellent entry
        if (distanceToPOC < 0.01) {
            points = 15;
            confirmed = true;
            reason = `Prix au POC ($${poc.price.toFixed(2)}) - Zone de valeur maximale`;
            icon = '✅';
        }
        // Price near POC and in Value Area
        else if (distanceToPOC < 0.03 && inValueArea) {
            points = 13;
            confirmed = true;
            reason = `Prix près du POC ($${poc.price.toFixed(2)}) dans Value Area`;
            icon = '✅';
        }
        // Price at HVN (high volume support/resistance)
        else if (nearHVN) {
            points = 12;
            confirmed = true;
            reason = 'Prix à un HVN (zone de volume élevé)';
            icon = '✅';
        }
        // Price in Value Area
        else if (inValueArea) {
            points = 10;
            confirmed = true;
            reason = `Prix dans Value Area ($${val.price.toFixed(2)} - $${vah.price.toFixed(2)})`;
            icon = '✅';
        }
        // Price near LVN (potential breakout)
        else if (nearLVN) {
            points = 8;
            reason = 'Prix près d\'un LVN - Zone de breakout potentiel';
            icon = '⚠️';
        }
        // Price below Value Area (potential support)
        else if (currentPrice < val.price) {
            points = 6;
            reason = `Prix sous Value Area ($${val.price.toFixed(2)}) - Zone d\'accumulation`;
            icon = '⚠️';
        }
        // Price above Value Area (potential distribution)
        else if (currentPrice > vah.price) {
            points = 3;
            reason = `Prix au-dessus Value Area ($${vah.price.toFixed(2)}) - Surextension`;
            icon = '⚠️';
        }
        else {
            reason = 'Prix loin des zones de volume significatives';
            icon = '❌';
        }

        return {
            category: 'Volume Profile',
            points: points,
            confirmed: confirmed,
            reason: reason,
            icon: icon,
            weight: 15
        };
    }

    /**
     * Evaluate Liquidity (Stop-loss clustering & Liquidity sweeps)
     * Max: 20 points
     * This is CRITICAL for crypto markets where manipulation is common
     */
    evaluateLiquidity() {
        let points = 0;
        let confirmed = false;
        let reason = '';
        let icon = '❌';

        // Check if liquidity mapping is available
        if (!this.tech.liquidityPools || !this.tech.ohlcv || !this.tech.swings) {
            return {
                category: 'Liquidity',
                points: 0,
                confirmed: false,
                reason: 'Analyse de liquidité non disponible',
                icon: '⚠️',
                weight: 20
            };
        }

        const currentPrice = this.crypto.price;
        const pools = this.tech.liquidityPools;
        const lastCandle = this.tech.ohlcv[this.tech.ohlcv.length - 1];

        // Find nearest liquidity pool
        const nearestPool = pools.find(p => p.distancePercent !== undefined);

        if (!nearestPool) {
            return {
                category: 'Liquidity',
                points: 5,
                confirmed: false,
                reason: 'Pas de liquidity pool significatif à proximité',
                icon: '⚠️',
                weight: 20
            };
        }

        const distancePercent = nearestPool.distancePercent;

        // Load LiquidityMapper for sweep detection
        const mapper = new LiquidityMapper(this.tech.ohlcv, this.tech.swings);
        const sweep = mapper.detectLiquiditySweep(nearestPool, lastCandle);

        // SCENARIO 1: Liquidity Sweep JUST happened (HIGHEST PRIORITY)
        // This is a reversal setup - institutional manipulation detected
        if (sweep.swept && sweep.confidence === 'HIGH') {
            if (sweep.signal === 'BULLISH_REVERSAL') {
                points = 20;
                confirmed = true;
                reason = `🔥 LIQUIDITY SWEEP! Prix balayé à $${nearestPool.price.toFixed(2)} puis rejeté - Reversal haussier probable`;
                icon = '✅';
            } else if (sweep.signal === 'BEARISH_REVERSAL') {
                // For LONG signals, bearish reversal is negative
                points = 0;
                reason = `⚠️ Liquidity sweep baissier détecté à $${nearestPool.price.toFixed(2)} - Éviter long`;
                icon = '❌';
            }
        }
        // SCENARIO 2: Price approaching MAJOR liquidity (Magnet Effect)
        // Smart money will likely target this liquidity
        else if (distancePercent < 2 && nearestPool.priority >= 7) {
            points = 15;
            confirmed = true;
            reason = `Prix attiré vers liquidity pool ($${nearestPool.price.toFixed(2)}, ${nearestPool.reason}) - ${distancePercent.toFixed(1)}% away`;
            icon = '✅';
        }
        // SCENARIO 3: Price AT liquidity pool (Danger/Opportunity Zone)
        // Could sweep and reverse, or break through
        else if (distancePercent < 1) {
            points = 10;
            confirmed = true;
            reason = `Prix SUR liquidity pool ($${nearestPool.price.toFixed(2)}) - Watch for sweep or breakout`;
            icon = '⚠️';
        }
        // SCENARIO 4: Price near moderate liquidity
        else if (distancePercent < 3 && nearestPool.priority >= 5) {
            points = 8;
            reason = `Liquidity pool à proximité ($${nearestPool.price.toFixed(2)}, ${nearestPool.reason})`;
            icon = '⚠️';
        }
        // SCENARIO 5: Price between pools (Neutral Zone)
        // No immediate liquidity concern
        else if (distancePercent > 5) {
            points = 5;
            reason = `Prix loin des liquidity pools (${distancePercent.toFixed(1)}%)`;
            icon = '⚠️';
        }
        // SCENARIO 6: Default case
        else {
            points = 3;
            reason = `Nearest liquidity: ${nearestPool.reason} at $${nearestPool.price.toFixed(2)}`;
            icon = '⚠️';
        }

        return {
            category: 'Liquidity',
            points: points,
            confirmed: confirmed,
            reason: reason,
            icon: icon,
            weight: 20,
            liquidityData: {
                nearestPool: nearestPool,
                sweep: sweep,
                allPools: pools.slice(0, 5)  // Top 5 for reference
            }
        };
    }

    /**
     * Get final entry signal based on confluence score
     */
    getEntrySignal() {
        const scorePercent = (this.score / this.maxScore) * 100;
        const confirmationCount = this.confirmations.length;

        let signal, quality, action, color, confidence;

        // STRONG ENTRY: Score > 75 AND >= 4 confirmations
        if (scorePercent >= 75 && confirmationCount >= 4) {
            signal = 'STRONG_ENTRY';
            quality = 'EXCELLENT';
            action = 'ENTRER MAINTENANT';
            color = '#22c55e';
            confidence = 90 + (scorePercent - 75) * 0.4;
        }
        // GOOD ENTRY: Score > 60 AND >= 3 confirmations
        else if (scorePercent >= 60 && confirmationCount >= 3) {
            signal = 'GOOD_ENTRY';
            quality = 'GOOD';
            action = 'ENTRER';
            color = '#3b82f6';
            confidence = 75 + (scorePercent - 60) * 0.5;
        }
        // MODERATE ENTRY: Score > 45 OR 2 confirmations
        else if (scorePercent >= 45 || confirmationCount >= 2) {
            signal = 'MODERATE_ENTRY';
            quality = 'MODERATE';
            action = 'ENTRÉE POSSIBLE';
            color = '#f59e0b';
            confidence = 60;
        }
        // WEAK ENTRY: Score > 30
        else if (scorePercent >= 30) {
            signal = 'WEAK_ENTRY';
            quality = 'WEAK';
            action = 'ATTENDRE';
            color = '#ef4444';
            confidence = 45;
        }
        // NO ENTRY: Insufficient confluence
        else {
            signal = 'NO_ENTRY';
            quality = 'POOR';
            action = 'NE PAS ENTRER';
            color = '#dc2626';
            confidence = 30;
        }

        return {
            signal: signal,
            quality: quality,
            score: this.score,
            maxScore: this.maxScore,
            scorePercent: scorePercent.toFixed(1),
            confirmations: confirmationCount,
            maxConfirmations: 8, // Updated: 5 base + 3 new (Fib + VP + Liquidity)
            confidence: confidence.toFixed(0),
            action: action,
            color: color,
            details: this.confirmations,
            allScores: this.getAllScores(),
            timestamp: Date.now(),
            crypto: {
                id: this.crypto.id,
                symbol: this.crypto.symbol,
                name: this.crypto.name,
                price: this.crypto.price
            }
        };
    }

    /**
     * Get all category scores (for detailed view)
     */
    getAllScores() {
        const structure = this.evaluateStructure();
        const zone = this.evaluateZone();
        const volume = this.evaluateVolume();
        const fundamental = this.evaluateFundamental();
        const rsi = this.evaluateRSI();
        const fib = this.evaluateFibonacciClusters();
        const vp = this.evaluateVolumeProfile();
        const liquidity = this.evaluateLiquidity();

        return [structure, zone, volume, fundamental, rsi, fib, vp, liquidity];
    }
}

// ===== BATCH SIGNAL ANALYZER =====
class BatchSignalAnalyzer {
    constructor(cryptos, technicalDataMap) {
        this.cryptos = cryptos;
        this.technicalDataMap = technicalDataMap; // Map: cryptoId -> technicalData
    }

    /**
     * Analyze all cryptos and return sorted by entry signal quality
     * @returns {Array} Sorted array of entry signals
     */
    analyzeAll() {
        const signals = [];

        this.cryptos.forEach(crypto => {
            // Skip if fundamental score too low
            if (crypto.score < 70) return;

            const techData = this.technicalDataMap.get(crypto.id);
            if (!techData) return;

            const engine = new EntryConfluenceEngine(crypto, techData);
            const signal = engine.evaluateEntry();

            signals.push(signal);
        });

        // Sort by score descending
        signals.sort((a, b) => b.score - a.score);

        return signals;
    }

    /**
     * Get only strong and good entry signals
     */
    getQualitySignals() {
        const allSignals = this.analyzeAll();

        return allSignals.filter(signal =>
            signal.signal === 'STRONG_ENTRY' || signal.signal === 'GOOD_ENTRY'
        );
    }

    /**
     * Get statistics about signals
     */
    getStatistics() {
        const allSignals = this.analyzeAll();

        const stats = {
            total: allSignals.length,
            strongEntry: allSignals.filter(s => s.signal === 'STRONG_ENTRY').length,
            goodEntry: allSignals.filter(s => s.signal === 'GOOD_ENTRY').length,
            moderateEntry: allSignals.filter(s => s.signal === 'MODERATE_ENTRY').length,
            weakEntry: allSignals.filter(s => s.signal === 'WEAK_ENTRY').length,
            noEntry: allSignals.filter(s => s.signal === 'NO_ENTRY').length,
            avgScore: allSignals.length > 0 ?
                (allSignals.reduce((sum, s) => sum + s.score, 0) / allSignals.length).toFixed(1) : 0,
            avgConfirmations: allSignals.length > 0 ?
                (allSignals.reduce((sum, s) => sum + s.confirmations, 0) / allSignals.length).toFixed(1) : 0
        };

        return stats;
    }
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EntryConfluenceEngine,
        BatchSignalAnalyzer
    };
}
