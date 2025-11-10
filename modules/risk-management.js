/**
 * RISK MANAGEMENT MODULE
 * Stop-Loss, Take-Profit, Position Sizing, Risk/Reward calculations
 */

// ===== STOP-LOSS CALCULATOR =====
class StopLossCalculator {
    constructor(entryPrice, technicalZones) {
        this.entryPrice = entryPrice;
        this.zones = technicalZones;
    }

    /**
     * Calculate optimal stop-loss based on structure
     * @param {string} direction - 'LONG' or 'SHORT'
     * @returns {Object} Stop-loss details
     */
    calculateOptimalStopLoss(direction = 'LONG') {
        let stopLoss;
        let reason;
        let riskPercent;
        let method;

        if (direction === 'LONG') {
            // Priority 1: Order Block below entry
            const obBelow = this.findBullishOBBelow();
            if (obBelow) {
                stopLoss = obBelow.zone.bottom * 0.995; // -0.5% buffer
                reason = `Sous Order Block haussier ($${obBelow.zone.bottom.toFixed(2)})`;
                method = 'ORDER_BLOCK';
            }

            // Priority 2: Swing low nearby
            if (!stopLoss) {
                const swingLow = this.findSwingLowBelow();
                if (swingLow) {
                    stopLoss = swingLow.price * 0.995;
                    reason = `Sous swing low ($${swingLow.price.toFixed(2)})`;
                    method = 'SWING_LOW';
                }
            }

            // Priority 3: FVG zone below
            if (!stopLoss) {
                const fvgBelow = this.findBullishFVGBelow();
                if (fvgBelow) {
                    stopLoss = fvgBelow.zone.bottom * 0.995;
                    reason = `Sous Fair Value Gap ($${fvgBelow.zone.bottom.toFixed(2)})`;
                    method = 'FVG';
                }
            }

            // Priority 4: Default 2% below entry
            if (!stopLoss) {
                stopLoss = this.entryPrice * 0.98;
                reason = 'Stop-loss par défaut (2% sous entrée)';
                method = 'DEFAULT';
            }

            riskPercent = ((this.entryPrice - stopLoss) / this.entryPrice) * 100;
        }

        else if (direction === 'SHORT') {
            // Similar logic for SHORT positions (inverse)
            const obAbove = this.findBearishOBAbove();
            if (obAbove) {
                stopLoss = obAbove.zone.top * 1.005;
                reason = `Au-dessus Order Block baissier ($${obAbove.zone.top.toFixed(2)})`;
                method = 'ORDER_BLOCK';
            }

            if (!stopLoss) {
                const swingHigh = this.findSwingHighAbove();
                if (swingHigh) {
                    stopLoss = swingHigh.price * 1.005;
                    reason = `Au-dessus swing high ($${swingHigh.price.toFixed(2)})`;
                    method = 'SWING_HIGH';
                }
            }

            if (!stopLoss) {
                stopLoss = this.entryPrice * 1.02;
                reason = 'Stop-loss par défaut (2% au-dessus entrée)';
                method = 'DEFAULT';
            }

            riskPercent = ((stopLoss - this.entryPrice) / this.entryPrice) * 100;
        }

        return {
            stopLoss: stopLoss,
            entryPrice: this.entryPrice,
            riskPercent: riskPercent.toFixed(2),
            riskAmount: this.entryPrice - stopLoss,
            reason: reason,
            method: method,
            description: `SL: $${stopLoss.toFixed(2)} (Risque: ${riskPercent.toFixed(2)}%)`,
            isOptimal: method !== 'DEFAULT'
        };
    }

    // Helper methods to find technical zones
    findBullishOBBelow() {
        if (!this.zones.orderBlocks) return null;
        return this.zones.orderBlocks.find(ob =>
            ob.type === 'BULLISH_OB' &&
            ob.zone.bottom < this.entryPrice &&
            ob.zone.bottom > this.entryPrice * 0.95 // Within 5% below
        );
    }

    findBearishOBAbove() {
        if (!this.zones.orderBlocks) return null;
        return this.zones.orderBlocks.find(ob =>
            ob.type === 'BEARISH_OB' &&
            ob.zone.top > this.entryPrice &&
            ob.zone.top < this.entryPrice * 1.05
        );
    }

    findSwingLowBelow() {
        if (!this.zones.swings) return null;
        const swingLows = this.zones.swings
            .filter(s => s.type === 'LOW' && s.price < this.entryPrice)
            .sort((a, b) => b.price - a.price); // Closest first
        return swingLows[0] || null;
    }

    findSwingHighAbove() {
        if (!this.zones.swings) return null;
        const swingHighs = this.zones.swings
            .filter(s => s.type === 'HIGH' && s.price > this.entryPrice)
            .sort((a, b) => a.price - b.price);
        return swingHighs[0] || null;
    }

    findBullishFVGBelow() {
        if (!this.zones.fvgs) return null;
        return this.zones.fvgs.find(fvg =>
            fvg.type === 'BULLISH_FVG' &&
            fvg.zone.bottom < this.entryPrice &&
            fvg.zone.bottom > this.entryPrice * 0.95
        );
    }
}

// ===== TAKE-PROFIT CALCULATOR =====
class TakeProfitCalculator {
    constructor(entryPrice, stopLoss, technicalZones) {
        this.entryPrice = entryPrice;
        this.stopLoss = stopLoss;
        this.zones = technicalZones;
        this.risk = Math.abs(entryPrice - stopLoss);
    }

    /**
     * Calculate multiple take-profit targets
     * @param {string} direction - 'LONG' or 'SHORT'
     * @returns {Object} Take-profit targets and strategy
     */
    calculateTakeProfitTargets(direction = 'LONG') {
        const targets = [];

        if (direction === 'LONG') {
            // Target 1: Risk/Reward 1.5:1 (conservative)
            targets.push({
                level: 1,
                price: this.entryPrice + (this.risk * 1.5),
                rr: 1.5,
                rrDisplay: '1.5:1',
                exitPercent: 30,
                reason: 'Premier profit partiel',
                description: 'Sécuriser gains initiaux',
                color: '#22c55e'
            });

            // Target 2: Risk/Reward 2.5:1 (optimal)
            targets.push({
                level: 2,
                price: this.entryPrice + (this.risk * 2.5),
                rr: 2.5,
                rrDisplay: '2.5:1',
                exitPercent: 50,
                reason: 'Profit principal',
                description: 'Objectif optimal',
                color: '#3b82f6'
            });

            // Target 3: Next resistance or R/R 4:1 (extended)
            const nextResistance = this.findNextResistance();
            const rr4Price = this.entryPrice + (this.risk * 4);

            const target3Price = nextResistance && nextResistance < rr4Price * 1.05 ?
                nextResistance : rr4Price;

            const target3RR = (target3Price - this.entryPrice) / this.risk;

            targets.push({
                level: 3,
                price: target3Price,
                rr: target3RR,
                rrDisplay: nextResistance ? 'Résistance' : '4:1',
                exitPercent: 20,
                reason: 'Objectif étendu',
                description: nextResistance ?
                    `Résistance technique ($${nextResistance.toFixed(2)})` :
                    'R/R 4:1',
                color: '#f59e0b'
            });
        }

        else if (direction === 'SHORT') {
            // Similar logic for SHORT (inverse)
            targets.push({
                level: 1,
                price: this.entryPrice - (this.risk * 1.5),
                rr: 1.5,
                rrDisplay: '1.5:1',
                exitPercent: 30,
                reason: 'Premier profit partiel',
                description: 'Sécuriser gains initiaux',
                color: '#22c55e'
            });

            targets.push({
                level: 2,
                price: this.entryPrice - (this.risk * 2.5),
                rr: 2.5,
                rrDisplay: '2.5:1',
                exitPercent: 50,
                reason: 'Profit principal',
                description: 'Objectif optimal',
                color: '#3b82f6'
            });

            const nextSupport = this.findNextSupport();
            const rr4Price = this.entryPrice - (this.risk * 4);
            const target3Price = nextSupport && nextSupport > rr4Price * 0.95 ?
                nextSupport : rr4Price;
            const target3RR = (this.entryPrice - target3Price) / this.risk;

            targets.push({
                level: 3,
                price: target3Price,
                rr: target3RR,
                rrDisplay: nextSupport ? 'Support' : '4:1',
                exitPercent: 20,
                reason: 'Objectif étendu',
                description: nextSupport ?
                    `Support technique ($${nextSupport.toFixed(2)})` :
                    'R/R 4:1',
                color: '#f59e0b'
            });
        }

        return {
            targets: targets,
            strategy: 'Profit partiel progressif',
            trailingStop: {
                activateAt: targets[1].price,
                offset: this.risk * 0.5,
                description: `Trailing stop activé après TP2, offset: $${(this.risk * 0.5).toFixed(2)}`
            },
            averageRR: (targets.reduce((sum, t) => sum + t.rr, 0) / targets.length).toFixed(2)
        };
    }

    /**
     * Find next resistance level above entry
     */
    findNextResistance() {
        // Check bearish Order Blocks above entry
        if (this.zones.orderBlocks) {
            const obAbove = this.zones.orderBlocks.find(ob =>
                ob.type === 'BEARISH_OB' &&
                ob.zone.bottom > this.entryPrice &&
                ob.zone.bottom < this.entryPrice * 1.15 // Within 15% above
            );
            if (obAbove) return obAbove.zone.bottom;
        }

        // Check swing highs above entry
        if (this.zones.swings) {
            const swingHigh = this.zones.swings
                .filter(s => s.type === 'HIGH' && s.price > this.entryPrice)
                .sort((a, b) => a.price - b.price)[0];
            if (swingHigh) return swingHigh.price;
        }

        return null;
    }

    /**
     * Find next support level below entry
     */
    findNextSupport() {
        // Check bullish Order Blocks below entry
        if (this.zones.orderBlocks) {
            const obBelow = this.zones.orderBlocks.find(ob =>
                ob.type === 'BULLISH_OB' &&
                ob.zone.top < this.entryPrice &&
                ob.zone.top > this.entryPrice * 0.85
            );
            if (obBelow) return obBelow.zone.top;
        }

        // Check swing lows below entry
        if (this.zones.swings) {
            const swingLow = this.zones.swings
                .filter(s => s.type === 'LOW' && s.price < this.entryPrice)
                .sort((a, b) => b.price - a.price)[0];
            if (swingLow) return swingLow.price;
        }

        return null;
    }
}

// ===== POSITION SIZER (Kelly Criterion) =====
class PositionSizer {
    constructor(accountSize, confluenceScore, riskRewardRatio) {
        this.accountSize = accountSize;
        this.confluenceScore = confluenceScore; // 0-100
        this.rr = riskRewardRatio;
    }

    /**
     * Calculate optimal position size using Kelly Criterion
     * @returns {Object} Position sizing recommendation
     */
    calculatePositionSize() {
        // Convert confluence score to win probability
        // Score 100 = 75% win rate
        // Score 80 = 65% win rate
        // Score 60 = 55% win rate
        // Score 40 = 45% win rate
        const winProb = 0.40 + (this.confluenceScore / 100) * 0.35;

        // Kelly Criterion: f = (p * R - (1 - p)) / R
        // where p = win probability, R = win/loss ratio
        const kellyPercent = (winProb * this.rr - (1 - winProb)) / this.rr;

        // Use fractional Kelly (25% of full Kelly) for safety
        const fractionalKelly = kellyPercent * 0.25;

        // Cap at max 2% of account per trade
        const maxRisk = 0.02;
        const recommendedRisk = Math.max(0.005, Math.min(fractionalKelly, maxRisk));

        // Calculate position size
        const riskAmount = this.accountSize * recommendedRisk;

        return {
            riskPercent: (recommendedRisk * 100).toFixed(2),
            riskAmount: riskAmount.toFixed(2),
            winProbability: (winProb * 100).toFixed(1),
            kellyPercent: (kellyPercent * 100).toFixed(2),
            fractionalKelly: (fractionalKelly * 100).toFixed(2),
            recommendation: this.getRecommendation(recommendedRisk),
            expectedValue: this.calculateExpectedValue(winProb, recommendedRisk)
        };
    }

    /**
     * Get recommendation text based on risk level
     */
    getRecommendation(risk) {
        if (risk >= 0.015) {
            return 'Position AGRESSIVE - Confluence très forte';
        } else if (risk >= 0.01) {
            return 'Position STANDARD - Confluence bonne';
        } else {
            return 'Position CONSERVATRICE - Confluence modérée';
        }
    }

    /**
     * Calculate expected value of the trade
     */
    calculateExpectedValue(winProb, riskPercent) {
        const ev = (winProb * this.rr * riskPercent) - ((1 - winProb) * riskPercent);
        return (ev * 100).toFixed(2) + '%';
    }
}

// ===== TRADE PLAN GENERATOR =====
class TradePlanGenerator {
    constructor(crypto, entrySignal, accountSize = 100000) {
        this.crypto = crypto;
        this.entrySignal = entrySignal;
        this.accountSize = accountSize;
    }

    /**
     * Generate complete trade plan with entry, SL, TP, sizing
     * @returns {Object} Complete trade plan
     */
    generateTradePlan() {
        const entryPrice = this.crypto.price;
        const direction = 'LONG'; // Default (could be determined by signal)

        // 1. Calculate Stop-Loss
        const slCalculator = new StopLossCalculator(entryPrice, this.entrySignal.crypto.technicalZones || {});
        const stopLoss = slCalculator.calculateOptimalStopLoss(direction);

        // 2. Calculate Take-Profit targets
        const tpCalculator = new TakeProfitCalculator(entryPrice, stopLoss.stopLoss, this.entrySignal.crypto.technicalZones || {});
        const takeProfit = tpCalculator.calculateTakeProfitTargets(direction);

        // 3. Calculate Position Size
        const avgRR = parseFloat(takeProfit.averageRR);
        const sizer = new PositionSizer(this.accountSize, this.entrySignal.score, avgRR);
        const positionSize = sizer.calculatePositionSize();

        // 4. Calculate position quantity
        const riskAmount = parseFloat(positionSize.riskAmount);
        const quantity = riskAmount / stopLoss.riskAmount;

        // 5. Calculate potential P&L
        const potentialLoss = -riskAmount;
        const potentialProfits = takeProfit.targets.map(tp => ({
            target: tp.level,
            profit: quantity * (tp.price - entryPrice) * (tp.exitPercent / 100),
            rr: tp.rrDisplay
        }));

        return {
            crypto: {
                id: this.crypto.id,
                symbol: this.crypto.symbol,
                name: this.crypto.name
            },
            entry: {
                price: entryPrice,
                signal: this.entrySignal.signal,
                quality: this.entrySignal.quality,
                confluenceScore: this.entrySignal.score,
                confirmations: this.entrySignal.confirmations
            },
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            position: {
                size: positionSize,
                quantity: quantity.toFixed(6),
                value: (quantity * entryPrice).toFixed(2)
            },
            riskReward: {
                avgRR: avgRR,
                potentialLoss: potentialLoss.toFixed(2),
                potentialProfits: potentialProfits,
                totalPotentialProfit: potentialProfits.reduce((sum, p) => sum + p.profit, 0).toFixed(2)
            },
            summary: this.generateSummary(
                this.crypto,
                entryPrice,
                stopLoss,
                takeProfit,
                positionSize,
                quantity
            ),
            timestamp: Date.now()
        };
    }

    /**
     * Generate human-readable summary
     */
    generateSummary(crypto, entryPrice, stopLoss, takeProfit, positionSize, quantity) {
        return {
            title: `Plan de Trade: ${crypto.symbol.toUpperCase()}`,
            lines: [
                `📊 Entrée: $${entryPrice.toFixed(2)}`,
                `🛑 Stop-Loss: $${stopLoss.stopLoss.toFixed(2)} (${stopLoss.riskPercent}%)`,
                `🎯 Take-Profit 1: $${takeProfit.targets[0].price.toFixed(2)} (${takeProfit.targets[0].rrDisplay})`,
                `🎯 Take-Profit 2: $${takeProfit.targets[1].price.toFixed(2)} (${takeProfit.targets[1].rrDisplay})`,
                `🎯 Take-Profit 3: $${takeProfit.targets[2].price.toFixed(2)} (${takeProfit.targets[2].rrDisplay})`,
                `💰 Taille Position: ${quantity.toFixed(4)} ${crypto.symbol.toUpperCase()} ($${(quantity * entryPrice).toFixed(2)})`,
                `⚠️ Risque: $${positionSize.riskAmount} (${positionSize.riskPercent}%)`,
                `📈 Expected Value: ${positionSize.expectedValue}`
            ]
        };
    }
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StopLossCalculator,
        TakeProfitCalculator,
        PositionSizer,
        TradePlanGenerator
    };
}
