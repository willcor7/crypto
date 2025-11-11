/**
 * ADVANCED SIGNALS ORCHESTRATOR
 * Integrates technical analysis, entry signals, and risk management
 * Main controller for the advanced signals system
 */

// ===== GLOBAL STATE =====
let advancedSignalsCache = new Map(); // cryptoId -> signal
let technicalDataCache = new Map(); // cryptoId -> technical data
let isGeneratingSignals = false;

// ===== MAIN ORCHESTRATOR =====
class AdvancedSignalsOrchestrator {
    constructor() {
        this.cryptos = [];
        this.signals = [];

        // Use CONFIG if available
        const config = typeof CONFIG !== 'undefined' ? CONFIG : {};
        this.accountSize = config.ACCOUNT_SIZE || 100000;
        this.minScore = config.MINIMUM_FUNDAMENTAL_SCORE || 70;
        this.showModerate = config.SHOW_MODERATE_SIGNALS !== false;
        this.maxSignals = config.MAX_SIGNALS_DISPLAYED || 15;
    }

    /**
     * Generate signals for all qualified cryptos
     * @param {Array} cryptos - Array of crypto objects
     * @returns {Promise<Array>} Array of entry signals
     */
    async generateSignals(cryptos) {
        // Filter: Only cryptos with score >= minScore
        const qualified = cryptos.filter(c => c.score >= this.minScore);

        console.log(`🎯 Generating advanced signals for ${qualified.length} qualified cryptos...`);

        const signals = [];

        for (const crypto of qualified) {
            try {
                console.log(`📊 Processing ${crypto.symbol}...`);

                // Check cache first
                const cached = advancedSignalsCache.get(crypto.id);
                if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5min cache
                    console.log(`  ↳ Using cached signal for ${crypto.symbol}`);
                    signals.push(cached);
                    continue;
                }

                // Generate technical data
                const techData = await this.generateTechnicalData(crypto);
                technicalDataCache.set(crypto.id, techData);

                // Generate entry signal
                const engine = new EntryConfluenceEngine(crypto, techData);
                const signal = engine.evaluateEntry();

                console.log(`  ↳ ${crypto.symbol}: ${signal.signal} (Score: ${signal.scorePercent}%, Conf: ${signal.confirmations}/${signal.maxConfirmations})`);

                // Add technical zones to signal for risk management
                signal.crypto.technicalZones = {
                    orderBlocks: techData.orderBlocks || [],
                    fvgs: techData.fvgs || [],
                    swings: techData.swings || [],
                    fibonacci: techData.fibonacci || { clusters: [], allLevels: [] },
                    volumeProfile: techData.volumeProfile || null,
                    liquidityPools: techData.liquidityPools || []
                };

                // Cache signal with timestamp
                signal.timestamp = Date.now();
                advancedSignalsCache.set(crypto.id, signal);
                signals.push(signal);

            } catch (error) {
                console.error(`❌ Error generating signal for ${crypto.symbol}:`, error);
                console.error(`   Stack:`, error.stack);
                // Continue with next crypto - don't let one failure stop all
            }
        }

        // Sort by score descending
        signals.sort((a, b) => b.score - a.score);

        // Log signal distribution
        const distribution = {
            STRONG_ENTRY: signals.filter(s => s.signal === 'STRONG_ENTRY').length,
            GOOD_ENTRY: signals.filter(s => s.signal === 'GOOD_ENTRY').length,
            MODERATE_ENTRY: signals.filter(s => s.signal === 'MODERATE_ENTRY').length,
            WEAK_ENTRY: signals.filter(s => s.signal === 'WEAK_ENTRY').length,
            NO_ENTRY: signals.filter(s => s.signal === 'NO_ENTRY').length
        };
        console.log(`📈 Signal Distribution:`, distribution);
        console.log(`✅ Top signals (STRONG + GOOD): ${distribution.STRONG_ENTRY + distribution.GOOD_ENTRY}`);

        this.signals = signals;
        return signals;
    }

    /**
     * Generate technical data for a crypto
     * Uses HybridDataBuilder for real API data with simulated fallback
     */
    async generateTechnicalData(crypto) {
        const builder = new HybridDataBuilder(crypto);
        return await builder.build();
    }

    /**
     * Get top signals (STRONG_ENTRY and GOOD_ENTRY only)
     */
    getTopSignals() {
        return this.signals.filter(s =>
            s.signal === 'STRONG_ENTRY' || s.signal === 'GOOD_ENTRY'
        );
    }

    /**
     * Generate complete trade plan for a crypto
     */
    async generateTradePlan(crypto) {
        let signal = advancedSignalsCache.get(crypto.id);

        // If signal not in cache or expired, regenerate it
        if (!signal || (signal.timestamp && Date.now() - signal.timestamp > 5 * 60 * 1000)) {
            console.warn(`⚠️ Signal not in cache for ${crypto.symbol}, regenerating...`);

            try {
                // Generate technical data
                const techData = await this.generateTechnicalData(crypto);
                technicalDataCache.set(crypto.id, techData);

                // Generate entry signal
                const engine = new EntryConfluenceEngine(crypto, techData);
                signal = engine.evaluateEntry();

                // Add technical zones to signal for risk management
                signal.crypto.technicalZones = {
                    orderBlocks: techData.orderBlocks || [],
                    fvgs: techData.fvgs || [],
                    swings: techData.swings || [],
                    fibonacci: techData.fibonacci || { clusters: [], allLevels: [] },
                    volumeProfile: techData.volumeProfile || null,
                    liquidityPools: techData.liquidityPools || []
                };

                // Cache signal
                signal.timestamp = Date.now();
                advancedSignalsCache.set(crypto.id, signal);

                console.log(`✅ Signal regenerated for ${crypto.symbol}`);
            } catch (error) {
                console.error(`❌ Error regenerating signal for ${crypto.symbol}:`, error);
                throw new Error(`Impossible de générer le signal pour ${crypto.symbol}: ${error.message}`);
            }
        }

        const planGenerator = new TradePlanGenerator(crypto, signal, this.accountSize);
        return planGenerator.generateTradePlan();
    }

    /**
     * Get statistics about generated signals
     */
    getStatistics() {
        if (this.signals.length === 0) return null;

        return {
            total: this.signals.length,
            strongEntry: this.signals.filter(s => s.signal === 'STRONG_ENTRY').length,
            goodEntry: this.signals.filter(s => s.signal === 'GOOD_ENTRY').length,
            moderateEntry: this.signals.filter(s => s.signal === 'MODERATE_ENTRY').length,
            weakEntry: this.signals.filter(s => s.signal === 'WEAK_ENTRY').length,
            noEntry: this.signals.filter(s => s.signal === 'NO_ENTRY').length,
            avgScore: (this.signals.reduce((sum, s) => sum + s.score, 0) / this.signals.length).toFixed(1),
            avgConfirmations: (this.signals.reduce((sum, s) => sum + s.confirmations, 0) / this.signals.length).toFixed(1)
        };
    }
}

// ===== GLOBAL INSTANCE =====
const advancedSignalsOrchestrator = new AdvancedSignalsOrchestrator();

// ===== DEBUG UTILITIES =====
/**
 * Debug function to check cache status
 * Call from console: debugSignalsCache()
 */
function debugSignalsCache() {
    console.log('═══════════════════════════════════════');
    console.log('🔍 SIGNALS CACHE DEBUG');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log(`📦 Cache size: ${advancedSignalsCache.size}`);
    console.log(`📊 Signals generated: ${advancedSignalsOrchestrator.signals.length}`);
    console.log('');
    console.log('🗂️ Cached signals:');

    if (advancedSignalsCache.size === 0) {
        console.log('   (empty)');
    } else {
        advancedSignalsCache.forEach((signal, id) => {
            const age = Date.now() - (signal.timestamp || 0);
            const ageMin = Math.floor(age / 60000);
            const expired = age > 5 * 60 * 1000;
            console.log(`   ${expired ? '❌' : '✅'} ${id}: ${signal.crypto.symbol} - ${signal.signal} (${ageMin} min ago)`);
        });
    }

    console.log('');
    console.log('📋 Available cryptos in database:');
    const db = getCurrentDatabase();
    db.slice(0, 10).forEach(c => {
        const inCache = advancedSignalsCache.has(c.id);
        console.log(`   ${inCache ? '✅' : '❌'} ${c.id}: ${c.symbol}`);
    });
    if (db.length > 10) {
        console.log(`   ... and ${db.length - 10} more`);
    }

    console.log('');
    console.log('═══════════════════════════════════════');
}

// Make it globally accessible for console debugging
if (typeof window !== 'undefined') {
    window.debugSignalsCache = debugSignalsCache;
    window.advancedSignalsCache = advancedSignalsCache;
    window.advancedSignalsOrchestrator = advancedSignalsOrchestrator;
}

// ===== UI RENDERING FUNCTIONS =====

/**
 * Render advanced signals section in scanner page
 */
function renderAdvancedSignalsSection(signals) {
    const container = document.getElementById('advanced-signals-container');
    if (!container) return;

    // Get top signals based on config
    const orchestrator = advancedSignalsOrchestrator;
    const showModerate = orchestrator.showModerate !== false;
    const maxSignals = orchestrator.maxSignals || 15;

    let filteredSignals;
    if (showModerate) {
        // STRONG, GOOD, and MODERATE
        filteredSignals = signals.filter(s =>
            s.signal === 'STRONG_ENTRY' || s.signal === 'GOOD_ENTRY' || s.signal === 'MODERATE_ENTRY'
        );
    } else {
        // STRONG and GOOD only
        filteredSignals = signals.filter(s =>
            s.signal === 'STRONG_ENTRY' || s.signal === 'GOOD_ENTRY'
        );
    }

    const topSignals = filteredSignals.slice(0, maxSignals);

    if (topSignals.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>🎯 Signaux d'Entrée Optimaux</h3>
                </div>
                <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                    <p>Aucun signal d'entrée optimal détecté actuellement.</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">Les signaux apparaissent lorsque 3+ confirmations techniques sont alignées.</p>
                </div>
            </div>
        `;
        return;
    }

    const stats = advancedSignalsOrchestrator.getStatistics();

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>🎯 Signaux d'Entrée Optimaux</h3>
                <div class="header-stats">
                    <span class="stat-badge success">${stats.strongEntry} STRONG</span>
                    <span class="stat-badge info">${stats.goodEntry} GOOD</span>
                    <span class="stat-badge warning">${stats.moderateEntry} MODERATE</span>
                    <span class="stat-badge">Avg: ${stats.avgScore}%</span>
                </div>
            </div>
            <div class="signals-grid">
                ${topSignals.map(signal => renderSignalCard(signal)).join('')}
            </div>
        </div>
    `;
}

/**
 * Render individual signal card
 */
function renderSignalCard(signal) {
    const crypto = signal.crypto;

    return `
        <div class="signal-card" onclick="showTradePlan('${crypto.id}')" style="cursor: pointer; border: 2px solid ${signal.color};">
            <div class="signal-header">
                <div class="signal-crypto">
                    <strong>${crypto.symbol.toUpperCase()}</strong>
                    <span class="crypto-name">${crypto.name}</span>
                </div>
                <div class="signal-badge" style="background: ${signal.color};">
                    ${signal.signal.replace('_', ' ')}
                </div>
            </div>

            <div class="signal-price">
                <span class="label">Prix actuel</span>
                <span class="value">$${crypto.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>

            <div class="signal-score">
                <div class="score-bar-container">
                    <div class="score-bar" style="width: ${signal.scorePercent}%; background: ${signal.color};"></div>
                </div>
                <div class="score-label">
                    <span>Confluence: ${signal.scorePercent}%</span>
                    <span>Confirmations: ${signal.confirmations}/${signal.maxConfirmations}</span>
                </div>
            </div>

            <div class="signal-details">
                ${signal.details.slice(0, 3).map(d => `
                    <div class="confirmation-item">
                        <span class="icon">${d.icon}</span>
                        <span class="text">${d.reason}</span>
                    </div>
                `).join('')}
            </div>

            <div class="signal-action">
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showTradePlan('${crypto.id}')">
                    📋 Voir Plan de Trade
                </button>
            </div>
        </div>
    `;
}

/**
 * Show trade plan modal
 */
async function showTradePlan(cryptoId) {
    console.log(`🔍 Opening trade plan for crypto ID: ${cryptoId}`);

    // ID mapping for common mismatches (old IDs -> correct IDs)
    const idMapping = {
        'polygon': 'matic-network',
        'lido': 'lido-dao',
        'fetchai': 'fetch-ai',
        'synthetix': 'synthetix-network-token',
        'avalanche': 'avalanche-2',
        'render': 'render-token',
        'curve': 'curve-dao-token',
        'immutable': 'immutable-x'
    };

    // Try mapped ID first
    let searchId = idMapping[cryptoId.toLowerCase()] || cryptoId;

    // Try to find by ID first
    let crypto = getCurrentDatabase().find(c => c.id === searchId);

    // Fallback 1: Try original ID if mapping was used
    if (!crypto && searchId !== cryptoId) {
        console.log(`⚠️ Mapped ID not found, trying original ID...`);
        crypto = getCurrentDatabase().find(c => c.id === cryptoId);
    }

    // Fallback 2: Try to find by partial ID match
    if (!crypto) {
        console.log(`⚠️ Exact ID not found, trying partial match...`);
        crypto = getCurrentDatabase().find(c =>
            c.id.toLowerCase().includes(cryptoId.toLowerCase()) ||
            cryptoId.toLowerCase().includes(c.id.toLowerCase())
        );
    }

    // Fallback 3: Try to find by symbol from known mapping
    if (!crypto) {
        console.log(`⚠️ Partial ID not found, trying symbol mapping...`);
        const symbolMapping = {
            'polygon': 'MATIC',
            'lido': 'LDO',
            'fetchai': 'FET',
            'synthetix': 'SNX',
            'avalanche': 'AVAX',
            'render': 'RNDR',
            'curve': 'CRV',
            'immutable': 'IMX',
            'optimism': 'OP'
        };

        const symbol = symbolMapping[cryptoId.toLowerCase()];
        if (symbol) {
            crypto = getCurrentDatabase().find(c => c.symbol.toUpperCase() === symbol);
            if (crypto) console.log(`   ✅ Found by symbol mapping: ${symbol} -> ${crypto.id}`);
        }
    }

    // Fallback 4: Try to find by symbol from cached signal
    if (!crypto) {
        console.log(`⚠️ Symbol mapping not found, trying cache...`);
        const cachedSignal = advancedSignalsCache.get(searchId) || advancedSignalsCache.get(cryptoId);
        if (cachedSignal && cachedSignal.crypto) {
            const symbol = cachedSignal.crypto.symbol;
            crypto = getCurrentDatabase().find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
            if (crypto) {
                console.log(`   ✅ Found by cached symbol: ${symbol} -> ${crypto.id}`);
            } else {
                console.log(`   ⚠️ Symbol ${symbol} not found in current database`);
            }
        }
    }

    // Fallback 5: Search all cached signals by any ID variation
    if (!crypto) {
        console.log(`⚠️ Cache lookup failed, searching all cached signals...`);
        // Try to find a cached signal that matches any of the ID variations
        for (const [cachedId, signal] of advancedSignalsCache.entries()) {
            if (cachedId.toLowerCase().includes(cryptoId.toLowerCase()) ||
                cryptoId.toLowerCase().includes(cachedId.toLowerCase()) ||
                cachedId === searchId) {
                const symbol = signal.crypto.symbol;
                crypto = getCurrentDatabase().find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
                if (crypto) {
                    console.log(`   ✅ Found via cached signal: ${cachedId} -> ${symbol} -> ${crypto.id}`);
                    break;
                }
            }
        }
    }

    // Fallback 6: If live data is enabled but crypto not found, try static database
    if (!crypto && typeof liveDataEnabled !== 'undefined' && liveDataEnabled && typeof cryptoDatabase !== 'undefined') {
        console.log(`⚠️ Not found in live data, trying static database as fallback...`);

        // Try exact ID match in static DB
        crypto = cryptoDatabase.find(c => c.id === searchId || c.id === cryptoId);

        // Try symbol match in static DB
        if (!crypto) {
            const cachedSignal = advancedSignalsCache.get(searchId) || advancedSignalsCache.get(cryptoId);
            if (cachedSignal && cachedSignal.crypto) {
                const symbol = cachedSignal.crypto.symbol;
                crypto = cryptoDatabase.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
                if (crypto) console.log(`   ✅ Found in static DB by symbol: ${symbol} -> ${crypto.id}`);
            }
        } else {
            console.log(`   ✅ Found in static DB: ${crypto.symbol} (${crypto.name})`);
        }

        if (crypto) {
            console.log(`   ℹ️ Using static data for ${crypto.symbol} (not in live top 100)`);
        }
    }

    if (!crypto) {
        console.error(`❌ Crypto not found in database: ${cryptoId}`);
        console.error(`   Searched ID: ${searchId}`);
        console.error(`   Available IDs (first 10):`, getCurrentDatabase().slice(0, 10).map(c => c.id));
        console.error(`   Available symbols (first 10):`, getCurrentDatabase().slice(0, 10).map(c => c.symbol));
        alert(`Erreur: Crypto avec ID "${cryptoId}" non trouvée dans la base de données.`);
        return;
    }

    console.log(`✅ Found crypto: ${crypto.symbol} (${crypto.name})`);

    try {
        // Show loading indicator
        showNotification(`⏳ Génération du plan de trade pour ${crypto.symbol}...`, 'info');

        // Generate trade plan (will regenerate signal if needed)
        const tradePlan = await advancedSignalsOrchestrator.generateTradePlan(crypto);
        console.log(`✅ Trade plan generated for ${crypto.symbol}`);

        // Create modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="trade-plan-modal" onclick="closeTradePlan(event)">
                <div class="modal-content trade-plan-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>📋 ${tradePlan.summary.title}</h2>
                        <button class="modal-close" onclick="closeTradePlan()">×</button>
                    </div>

                    <div class="modal-body">
                        <!-- Entry Signal -->
                        <div class="trade-plan-section">
                            <h3>📊 Signal d'Entrée</h3>
                            <div class="plan-grid">
                                <div class="plan-item">
                                    <span class="label">Signal</span>
                                    <span class="value" style="color: ${tradePlan.entry.signal.includes('STRONG') ? '#22c55e' : '#3b82f6'};">
                                        ${tradePlan.entry.signal.replace('_', ' ')}
                                    </span>
                                </div>
                                <div class="plan-item">
                                    <span class="label">Qualité</span>
                                    <span class="value">${tradePlan.entry.quality}</span>
                                </div>
                                <div class="plan-item">
                                    <span class="label">Confluence</span>
                                    <span class="value">${tradePlan.entry.confluenceScore}/100</span>
                                </div>
                                <div class="plan-item">
                                    <span class="label">Confirmations</span>
                                    <span class="value">${tradePlan.entry.confirmations}/5</span>
                                </div>
                            </div>
                        </div>

                        <!-- Trade Parameters -->
                        <div class="trade-plan-section">
                            <h3>🎯 Paramètres du Trade</h3>
                            <div class="trade-params">
                                <div class="param-row">
                                    <span class="icon">📍</span>
                                    <span class="label">Entrée:</span>
                                    <span class="value">$${tradePlan.entry.price.toFixed(2)}</span>
                                </div>
                                <div class="param-row stop-loss">
                                    <span class="icon">🛑</span>
                                    <span class="label">Stop-Loss:</span>
                                    <span class="value">$${tradePlan.stopLoss.stopLoss.toFixed(2)} (${tradePlan.stopLoss.riskPercent}%)</span>
                                </div>
                                ${tradePlan.takeProfit.targets.map(tp => `
                                    <div class="param-row take-profit">
                                        <span class="icon">🎯</span>
                                        <span class="label">TP${tp.level}:</span>
                                        <span class="value">$${tp.price.toFixed(2)} (${tp.rrDisplay}) - ${tp.exitPercent}%</span>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="risk-reason">
                                <small>${tradePlan.stopLoss.reason}</small>
                            </div>
                        </div>

                        <!-- Position Sizing -->
                        <div class="trade-plan-section">
                            <h3>💰 Position Sizing</h3>
                            <div class="plan-grid">
                                <div class="plan-item">
                                    <span class="label">Taille Position</span>
                                    <span class="value">${tradePlan.position.quantity} ${crypto.symbol.toUpperCase()}</span>
                                </div>
                                <div class="plan-item">
                                    <span class="label">Valeur Position</span>
                                    <span class="value">$${tradePlan.position.value}</span>
                                </div>
                                <div class="plan-item">
                                    <span class="label">Risque</span>
                                    <span class="value" style="color: #ef4444;">$${tradePlan.position.size.riskAmount} (${tradePlan.position.size.riskPercent}%)</span>
                                </div>
                                <div class="plan-item">
                                    <span class="label">Expected Value</span>
                                    <span class="value" style="color: #22c55e;">${tradePlan.position.size.expectedValue}</span>
                                </div>
                            </div>
                            <div class="sizing-recommendation">
                                <p>${tradePlan.position.size.recommendation}</p>
                            </div>
                        </div>

                        <!-- Risk/Reward -->
                        <div class="trade-plan-section">
                            <h3>📈 Risk/Reward</h3>
                            <div class="rr-summary">
                                <div class="rr-item loss">
                                    <span class="label">Perte Potentielle</span>
                                    <span class="value">$${tradePlan.riskReward.potentialLoss}</span>
                                </div>
                                <div class="rr-item profit">
                                    <span class="label">Profit Potentiel Total</span>
                                    <span class="value">$${tradePlan.riskReward.totalPotentialProfit}</span>
                                </div>
                                <div class="rr-item ratio">
                                    <span class="label">R/R Moyen</span>
                                    <span class="value">${tradePlan.riskReward.avgRR}:1</span>
                                </div>
                            </div>
                        </div>

                        <!-- Summary -->
                        <div class="trade-plan-section summary">
                            <h3>📝 Résumé</h3>
                            <div class="summary-lines">
                                ${tradePlan.summary.lines.map(line => `<p>${line}</p>`).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeTradePlan()">Fermer</button>
                        <button class="btn btn-primary" onclick="copyTradePlan('${cryptoId}')">📋 Copier le Plan</button>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch (error) {
        console.error(`❌ Error generating trade plan for ${crypto.symbol}:`, error);

        // Show user-friendly error message
        const errorMsg = error.message || 'Erreur inconnue';
        if (typeof showNotification === 'function') {
            showNotification(`❌ Erreur: ${errorMsg}`, 'error');
        } else {
            alert(`❌ Erreur lors de la génération du plan de trade:\n\n${errorMsg}`);
        }
    }
}

/**
 * Close trade plan modal
 */
function closeTradePlan(event) {
    if (event && event.target.classList.contains('modal-content')) return;
    const modal = document.getElementById('trade-plan-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Copy trade plan to clipboard
 */
function copyTradePlan(cryptoId) {
    const crypto = getCurrentDatabase().find(c => c.id === cryptoId);
    const tradePlan = advancedSignalsOrchestrator.generateTradePlan(crypto);

    const text = `
${tradePlan.summary.title}
${'='.repeat(tradePlan.summary.title.length)}

${tradePlan.summary.lines.join('\n')}

Généré le ${new Date().toLocaleString('fr-FR')}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
        showNotification('✅ Plan de trade copié dans le presse-papiers', 'success');
    }).catch(err => {
        console.error('Error copying:', err);
        showNotification('❌ Erreur lors de la copie', 'error');
    });
}

// ===== INITIALIZATION =====

/**
 * Initialize advanced signals system
 */
async function initAdvancedSignals() {
    console.log('🚀 Initializing Advanced Signals System...');

    // Check if all required classes are loaded
    const requiredClasses = [
        'TrendAnalyzer',
        'StructureAnalyzer',
        'EntryConfluenceEngine',
        'StopLossCalculator',
        'TakeProfitCalculator',
        'PositionSizer',
        'TradePlanGenerator',
        'OHLCVGenerator',
        'TechnicalDataBuilder'
    ];

    const missing = requiredClasses.filter(className => typeof window[className] === 'undefined');

    if (missing.length > 0) {
        console.warn('⚠️ Missing classes:', missing);
        console.log('Advanced signals will work with limited functionality');
    }

    // Add advanced signals section to scanner page
    const scannerPage = document.getElementById('page-scanner');
    if (scannerPage && !document.getElementById('advanced-signals-container')) {
        // Find insertion point (after stats and before opportunities table)
        const statsGrid = scannerPage.querySelector('.stats-grid');
        if (statsGrid) {
            const container = document.createElement('div');
            container.id = 'advanced-signals-container';
            container.style.marginTop = '30px';
            statsGrid.parentNode.insertBefore(container, statsGrid.nextSibling);
        }
    }

    console.log('✅ Advanced Signals System initialized');
}

/**
 * Generate and display signals for current cryptos
 */
async function updateAdvancedSignals() {
    if (isGeneratingSignals) return;

    isGeneratingSignals = true;

    try {
        const cryptos = getCurrentDatabase();
        const signals = await advancedSignalsOrchestrator.generateSignals(cryptos);

        console.log(`✅ Generated ${signals.length} signals`);

        // Render signals section
        renderAdvancedSignalsSection(signals);

    } catch (error) {
        console.error('Error updating advanced signals:', error);
    } finally {
        isGeneratingSignals = false;
    }
}

// ===== AUTO-INITIALIZATION =====
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async function() {
        // Wait a bit for other scripts to load
        setTimeout(async () => {
            await initAdvancedSignals();

            // Generate signals on page load
            if (currentPage === 'scanner') {
                await updateAdvancedSignals();
            }
        }, 1000);
    });
}
