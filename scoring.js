// ===== SCORING SYSTEM =====
// Score total sur 100 points réparti en 4 catégories

class CryptoScoring {
    constructor(crypto) {
        this.crypto = crypto;
        this.scores = {
            valuation: 0,      // 35 points max
            growth: 0,         // 30 points max
            fundamental: 0,    // 25 points max
            momentum: 0        // 10 points max
        };
        this.total = 0;
    }

    // ===== CATEGORY 1: VALUATION (35 points) =====
    calculateValuationScore() {
        let score = 0;

        // MVRV Ratio (20 points)
        // MVRV < 0.7: Forte sous-évaluation = 20 points
        // MVRV 0.7-1.0: Sous-évaluation = 15 points
        // MVRV 1.0-1.5: Fair value = 10 points
        // MVRV 1.5-2.5: Surévaluation = 5 points
        // MVRV > 2.5: Forte surévaluation = 0 points
        if (this.crypto.mvrv < 0.7) {
            score += 20;
        } else if (this.crypto.mvrv < 1.0) {
            score += 15;
        } else if (this.crypto.mvrv < 1.5) {
            score += 10;
        } else if (this.crypto.mvrv < 2.5) {
            score += 5;
        }

        // Market Cap / TVL pour les DeFi (15 points)
        if (this.crypto.tvl && this.crypto.tvl > 0) {
            const mcapTvlRatio = this.crypto.marketCap / this.crypto.tvl;
            // Ratio < 0.3: Très sous-évalué = 15 points
            // Ratio 0.3-0.5: Sous-évalué = 12 points
            // Ratio 0.5-1.0: Fair value = 8 points
            // Ratio 1.0-2.0: Légèrement surévalué = 4 points
            // Ratio > 2.0: Surévalué = 0 points
            if (mcapTvlRatio < 0.3) {
                score += 15;
            } else if (mcapTvlRatio < 0.5) {
                score += 12;
            } else if (mcapTvlRatio < 1.0) {
                score += 8;
            } else if (mcapTvlRatio < 2.0) {
                score += 4;
            }
        } else {
            // Pour les non-DeFi, score basé sur market cap relatif
            if (this.crypto.marketCap < 1000000000) {
                score += 12; // Small cap, plus de potentiel
            } else if (this.crypto.marketCap < 10000000000) {
                score += 8;  // Mid cap
            } else {
                score += 4;  // Large cap
            }
        }

        this.scores.valuation = Math.min(score, 35);
        return this.scores.valuation;
    }

    // ===== CATEGORY 2: GROWTH (30 points) =====
    calculateGrowthScore() {
        let score = 0;

        // Croissance des adresses actives (20 points)
        // > 30%: Croissance exceptionnelle = 20 points
        // 20-30%: Forte croissance = 16 points
        // 10-20%: Bonne croissance = 12 points
        // 5-10%: Croissance modérée = 8 points
        // 0-5%: Faible croissance = 4 points
        // < 0%: Décroissance = 0 points
        const addrGrowth = this.crypto.addressGrowth;
        if (addrGrowth > 30) {
            score += 20;
        } else if (addrGrowth > 20) {
            score += 16;
        } else if (addrGrowth > 10) {
            score += 12;
        } else if (addrGrowth > 5) {
            score += 8;
        } else if (addrGrowth > 0) {
            score += 4;
        }

        // Croissance du TVL pour DeFi (10 points)
        if (this.crypto.tvl && this.crypto.tvl > 0) {
            // Simulé: TVL growth basé sur addressGrowth
            const tvlGrowth = addrGrowth * 0.8; // Approximation
            if (tvlGrowth > 20) {
                score += 10;
            } else if (tvlGrowth > 10) {
                score += 7;
            } else if (tvlGrowth > 5) {
                score += 4;
            } else if (tvlGrowth > 0) {
                score += 2;
            }
        } else {
            // Pour non-DeFi, volume growth
            // Basé sur le ratio volume/market cap
            const volumeRatio = this.crypto.volume24h / this.crypto.marketCap;
            if (volumeRatio > 0.15) {
                score += 10;
            } else if (volumeRatio > 0.1) {
                score += 7;
            } else if (volumeRatio > 0.05) {
                score += 4;
            } else if (volumeRatio > 0.02) {
                score += 2;
            }
        }

        this.scores.growth = Math.min(score, 30);
        return this.scores.growth;
    }

    // ===== CATEGORY 3: FUNDAMENTAL QUALITY (25 points) =====
    calculateFundamentalScore() {
        let score = 0;

        // Activité GitHub (15 points)
        // > 200 commits (90j): Très actif = 15 points
        // 100-200 commits: Actif = 12 points
        // 50-100 commits: Modéré = 8 points
        // 20-50 commits: Faible = 4 points
        // < 20 commits: Très faible = 0 points
        const commits = this.crypto.githubCommits;
        if (commits > 200) {
            score += 15;
        } else if (commits > 100) {
            score += 12;
        } else if (commits > 50) {
            score += 8;
        } else if (commits > 20) {
            score += 4;
        }

        // Nombre de contributeurs (10 points)
        // > 80: Communauté large = 10 points
        // 50-80: Bonne communauté = 8 points
        // 30-50: Communauté moyenne = 6 points
        // 10-30: Petite communauté = 4 points
        // < 10: Très petite = 2 points
        const contributors = this.crypto.contributors;
        if (contributors > 80) {
            score += 10;
        } else if (contributors > 50) {
            score += 8;
        } else if (contributors > 30) {
            score += 6;
        } else if (contributors > 10) {
            score += 4;
        } else {
            score += 2;
        }

        this.scores.fundamental = Math.min(score, 25);
        return this.scores.fundamental;
    }

    // ===== CATEGORY 4: MOMENTUM (10 points) =====
    calculateMomentumScore() {
        let score = 0;

        // Accumulation par les baleines (6 points)
        // > 5%: Forte accumulation = 6 points
        // 3-5%: Bonne accumulation = 4 points
        // 1-3%: Accumulation modérée = 2 points
        // < 1%: Faible accumulation = 0 points
        const whaleAcc = this.crypto.whaleAccumulation;
        if (whaleAcc > 5) {
            score += 6;
        } else if (whaleAcc > 3) {
            score += 4;
        } else if (whaleAcc > 1) {
            score += 2;
        }

        // Performance prix 24h (4 points)
        // > 10%: Fort momentum = 4 points
        // 5-10%: Bon momentum = 3 points
        // 0-5%: Momentum positif = 2 points
        // -5-0%: Momentum neutre = 1 point
        // < -5%: Momentum négatif = 0 points
        const priceChange = this.crypto.priceChange24h;
        if (priceChange > 10) {
            score += 4;
        } else if (priceChange > 5) {
            score += 3;
        } else if (priceChange > 0) {
            score += 2;
        } else if (priceChange > -5) {
            score += 1;
        }

        this.scores.momentum = Math.min(score, 10);
        return this.scores.momentum;
    }

    // ===== CALCULATE TOTAL SCORE =====
    calculateTotalScore() {
        this.calculateValuationScore();
        this.calculateGrowthScore();
        this.calculateFundamentalScore();
        this.calculateMomentumScore();

        this.total = this.scores.valuation +
                     this.scores.growth +
                     this.scores.fundamental +
                     this.scores.momentum;

        return this.total;
    }

    // ===== GET SCORE BREAKDOWN =====
    getBreakdown() {
        return {
            total: this.total,
            valuation: {
                score: this.scores.valuation,
                max: 35,
                percentage: (this.scores.valuation / 35 * 100).toFixed(1)
            },
            growth: {
                score: this.scores.growth,
                max: 30,
                percentage: (this.scores.growth / 30 * 100).toFixed(1)
            },
            fundamental: {
                score: this.scores.fundamental,
                max: 25,
                percentage: (this.scores.fundamental / 25 * 100).toFixed(1)
            },
            momentum: {
                score: this.scores.momentum,
                max: 10,
                percentage: (this.scores.momentum / 10 * 100).toFixed(1)
            }
        };
    }

    // ===== GET SIGNAL RECOMMENDATION =====
    getSignal() {
        if (this.total >= 80) {
            return {
                signal: 'STRONG BUY',
                class: 'strong-buy',
                confidence: 85 + (this.total - 80) * 0.5,
                reasons: this.getSignalReasons()
            };
        } else if (this.total >= 75) {
            return {
                signal: 'BUY',
                class: 'buy',
                confidence: 70 + (this.total - 75),
                reasons: this.getSignalReasons()
            };
        } else if (this.total >= 70) {
            return {
                signal: 'HOLD',
                class: 'hold',
                confidence: 60 + (this.total - 70),
                reasons: this.getSignalReasons()
            };
        } else if (this.total >= 60) {
            return {
                signal: 'WATCH',
                class: 'watch',
                confidence: 50 + (this.total - 60),
                reasons: []
            };
        } else {
            return {
                signal: 'SELL',
                class: 'sell',
                confidence: 40,
                reasons: []
            };
        }
    }

    // ===== GET SIGNAL REASONS =====
    getSignalReasons() {
        const reasons = [];

        if (this.crypto.mvrv < 1.0) {
            reasons.push(`MVRV ${this.crypto.mvrv.toFixed(2)} (sous-évaluation)`);
        }

        if (this.crypto.addressGrowth > 20) {
            reasons.push(`Croissance adresses +${this.crypto.addressGrowth.toFixed(1)}%`);
        }

        if (this.crypto.whaleAccumulation > 3) {
            reasons.push(`Accumulation baleines +${this.crypto.whaleAccumulation.toFixed(1)}%`);
        }

        if (this.crypto.githubCommits > 100) {
            reasons.push(`Développement actif (${this.crypto.githubCommits} commits)`);
        }

        if (this.crypto.tvl && this.crypto.marketCap / this.crypto.tvl < 0.5) {
            reasons.push(`MCap/TVL ${(this.crypto.marketCap / this.crypto.tvl).toFixed(2)} (sous-évalué)`);
        }

        return reasons;
    }
}

// ===== PORTFOLIO SCORING =====
class PortfolioScoring {
    constructor(holdings, cryptoDatabase) {
        this.holdings = holdings;
        this.cryptoDatabase = cryptoDatabase;
    }

    // Calculate portfolio metrics
    getMetrics() {
        let totalValue = 0;
        let totalPL = 0;
        const positions = [];
        const sectorAllocation = {};
        const scores = [];

        this.holdings.forEach(holding => {
            const crypto = this.cryptoDatabase.find(c => c.id === holding.crypto);
            if (!crypto) return;

            const value = holding.quantity * crypto.price;
            const cost = holding.quantity * holding.buyPrice;
            const pl = value - cost;
            const plPercent = (pl / cost) * 100;

            totalValue += value;
            totalPL += pl;

            positions.push({
                ...holding,
                crypto: crypto,
                value: value,
                cost: cost,
                pl: pl,
                plPercent: plPercent
            });

            scores.push(crypto.score);

            // Sector allocation
            if (!sectorAllocation[crypto.category]) {
                sectorAllocation[crypto.category] = 0;
            }
            sectorAllocation[crypto.category] += value;
        });

        // Calculate weights
        positions.forEach(pos => {
            pos.weight = (pos.value / totalValue) * 100;
        });

        // Calculate average score
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Calculate concentration
        const sortedPositions = [...positions].sort((a, b) => b.value - a.value);
        const top3Value = sortedPositions.slice(0, 3).reduce((sum, pos) => sum + pos.value, 0);
        const concentration = (top3Value / totalValue) * 100;

        // Calculate sector diversity (Shannon entropy)
        const sectorDiversity = this.calculateDiversity(sectorAllocation, totalValue);

        return {
            totalValue,
            totalPL,
            totalPLPercent: (totalPL / (totalValue - totalPL)) * 100,
            positions,
            sectorAllocation,
            avgScore,
            concentration,
            sectorDiversity,
            numPositions: positions.length,
            numSectors: Object.keys(sectorAllocation).length
        };
    }

    // Calculate diversity score using Shannon entropy
    calculateDiversity(allocation, totalValue) {
        let entropy = 0;
        Object.values(allocation).forEach(value => {
            const p = value / totalValue;
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        });

        // Normalize to 0-100 scale (max entropy for 5 sectors = 2.32)
        return Math.min(100, (entropy / 2.32) * 100);
    }

    // Calculate Value at Risk (VaR)
    calculateVaR(confidence = 0.95) {
        const metrics = this.getMetrics();

        // Simplified VaR using historical volatility assumption
        // Average crypto volatility ~ 5-10% daily
        const avgVolatility = 0.07; // 7% daily volatility

        // Z-score for 95% confidence = 1.645
        const zScore = confidence === 0.95 ? 1.645 : 2.326;

        const var95 = metrics.totalValue * avgVolatility * zScore;

        return {
            value: var95,
            percentage: (var95 / metrics.totalValue) * 100,
            confidence: confidence * 100
        };
    }

    // Stress test scenarios
    stressTest() {
        const metrics = this.getMetrics();

        const scenarios = {
            marketDown20: {
                name: 'Correction Marché -20%',
                impact: metrics.totalValue * -0.20,
                newValue: metrics.totalValue * 0.80
            },
            marketCrash50: {
                name: 'Crash Marché -50%',
                impact: metrics.totalValue * -0.50,
                newValue: metrics.totalValue * 0.50
            },
            defiCollapse: {
                name: 'Crise DeFi -30%',
                impact: this.calculateSectorImpact('defi', -0.30, metrics),
                newValue: metrics.totalValue + this.calculateSectorImpact('defi', -0.30, metrics)
            },
            layer2Boom: {
                name: 'L2 Boom +40%',
                impact: this.calculateSectorImpact('layer2', 0.40, metrics),
                newValue: metrics.totalValue + this.calculateSectorImpact('layer2', 0.40, metrics)
            }
        };

        return scenarios;
    }

    calculateSectorImpact(sector, changePercent, metrics) {
        const sectorValue = metrics.sectorAllocation[sector] || 0;
        return sectorValue * changePercent;
    }

    // Get recommendations
    getRecommendations() {
        const metrics = this.getMetrics();
        const recommendations = [];

        // Concentration check
        if (metrics.concentration > 60) {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                message: `Sur-concentration Top 3 (${metrics.concentration.toFixed(1)}%). Recommandé: < 60%`
            });
        } else if (metrics.concentration < 40) {
            recommendations.push({
                type: 'success',
                icon: '✅',
                message: `Bonne diversification des positions (${metrics.concentration.toFixed(1)}%)`
            });
        }

        // Sector diversity check
        if (metrics.sectorDiversity > 70) {
            recommendations.push({
                type: 'success',
                icon: '✅',
                message: `Excellente diversification sectorielle (${metrics.numSectors} secteurs)`
            });
        } else if (metrics.sectorDiversity < 50) {
            recommendations.push({
                type: 'warning',
                icon: '💡',
                message: 'Diversification sectorielle faible, considérez ajouter d\'autres secteurs'
            });
        }

        // Score quality check
        if (metrics.avgScore > 75) {
            recommendations.push({
                type: 'success',
                icon: '✅',
                message: `Qualité fondamentale forte (score moyen: ${metrics.avgScore.toFixed(1)})`
            });
        } else if (metrics.avgScore < 65) {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                message: `Score moyen faible (${metrics.avgScore.toFixed(1)}), revoir positions`
            });
        }

        // Sector-specific recommendations
        const sectorAllocationPercent = {};
        Object.entries(metrics.sectorAllocation).forEach(([sector, value]) => {
            sectorAllocationPercent[sector] = (value / metrics.totalValue) * 100;
        });

        if (sectorAllocationPercent.defi > 40) {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                message: `Sur-exposition DeFi (${sectorAllocationPercent.defi.toFixed(1)}%). Recommandé: < 35%`
            });
        }

        if (!sectorAllocationPercent.layer1 || sectorAllocationPercent.layer1 < 20) {
            recommendations.push({
                type: 'info',
                icon: '💡',
                message: 'Considérez augmenter exposition Layer 1 (BTC, ETH, SOL) pour stabilité'
            });
        }

        return recommendations;
    }
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CryptoScoring, PortfolioScoring };
}
