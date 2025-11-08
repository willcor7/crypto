// ===== GLOBAL STATE =====
let currentPage = 'scanner';
let selectedCrypto = null;
let charts = {};
let filteredCryptos = [];

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initRefresh();
    loadScannerPage();
    updateMarketStatus();

    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (currentPage === 'scanner') {
            updateOpportunitiesTable();
        }
        updateMarketStatus();
    }, 30000);
});

// ===== NAVIGATION =====
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            switchPage(page);
        });
    });
}

function switchPage(page) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page-content').forEach(pageEl => {
        pageEl.classList.remove('active');
    });
    document.getElementById(`page-${page}`).classList.add('active');

    // Update header
    const titles = {
        scanner: { title: 'Scanner d\'Opportunités', subtitle: 'Identification automatique des meilleures opportunités crypto' },
        analysis: { title: 'Analyse Détaillée', subtitle: 'Analyse fondamentale complète' },
        portfolio: { title: 'Mon Portfolio', subtitle: 'Vue d\'ensemble de vos investissements crypto' },
        signals: { title: 'Signaux & Alertes', subtitle: 'Signaux d\'achat/vente et notifications' },
        risk: { title: 'Gestion du Risque', subtitle: 'Outils de risk management et position sizing' }
    };

    document.getElementById('page-title').textContent = titles[page].title;
    document.getElementById('page-subtitle').textContent = titles[page].subtitle;

    currentPage = page;

    // Load page content
    switch(page) {
        case 'scanner':
            loadScannerPage();
            break;
        case 'analysis':
            loadAnalysisPage();
            break;
        case 'portfolio':
            loadPortfolioPage();
            break;
        case 'signals':
            loadSignalsPage();
            break;
        case 'risk':
            loadRiskPage();
            break;
    }
}

// ===== MARKET STATUS =====
function updateMarketStatus() {
    // Simulate live updates
    const btcDom = 54.2 + (Math.random() - 0.5) * 0.5;
    const marketCap = 2.1 + (Math.random() - 0.5) * 0.1;
    const volume = 89.5 + (Math.random() - 0.5) * 5;

    document.querySelectorAll('.status-item .value')[0].textContent = btcDom.toFixed(1) + '%';
    document.querySelectorAll('.status-item .value')[1].textContent = '$' + marketCap.toFixed(2) + 'T';
    document.querySelectorAll('.status-item .value')[2].textContent = '$' + volume.toFixed(1) + 'B';
}

// ===== FILTERS =====
function initFilters() {
    const filters = ['filter-category', 'filter-mcap', 'filter-score', 'filter-signal'];
    filters.forEach(filterId => {
        document.getElementById(filterId)?.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    const category = document.getElementById('filter-category').value;
    const mcap = document.getElementById('filter-mcap').value;
    const minScore = parseInt(document.getElementById('filter-score').value);
    const signal = document.getElementById('filter-signal').value;

    filteredCryptos = filterCryptos(category, mcap, minScore, signal);
    updateOpportunitiesTable();
}

// ===== REFRESH =====
function initRefresh() {
    document.getElementById('refresh-data')?.addEventListener('click', function() {
        this.style.transform = 'rotate(360deg)';
        setTimeout(() => { this.style.transform = 'rotate(0deg)'; }, 500);

        if (currentPage === 'scanner') {
            loadScannerPage();
        }
    });
}

// ===== PAGE: SCANNER =====
function loadScannerPage() {
    // Update stats
    const opportunities = getOpportunities(70);
    const strongBuy = opportunities.filter(c => c.score >= 80).length;
    const avgScore = opportunities.reduce((sum, c) => sum + c.score, 0) / opportunities.length;

    document.getElementById('active-opportunities').textContent = opportunities.length;
    document.getElementById('strong-buy-signals').textContent = strongBuy;
    document.getElementById('average-score').textContent = avgScore.toFixed(1);
    document.getElementById('new-entries').textContent = newEntrants.length;

    // Apply initial filters
    applyFilters();

    // Load new entrants
    loadNewEntrants();

    // Create heatmap
    setTimeout(() => {
        if (charts.heatmap) charts.heatmap.destroy();
        charts.heatmap = createHeatmap('heatmap-chart', opportunities);
    }, 100);

    // Export button
    document.getElementById('export-opportunities')?.addEventListener('click', exportToCSV);
}

function updateOpportunitiesTable() {
    const tbody = document.getElementById('opportunities-tbody');
    if (!tbody) return;

    const opportunities = filteredCryptos.length > 0 ? filteredCryptos : getOpportunities(70);

    tbody.innerHTML = opportunities.map((crypto, index) => {
        const scoring = new CryptoScoring(crypto);
        scoring.calculateTotalScore();
        const signal = scoring.getSignal();

        const priceChangeClass = crypto.priceChange24h >= 0 ? 'positive' : 'negative';
        const priceChangeSign = crypto.priceChange24h >= 0 ? '+' : '';

        const sparklineId = `sparkline-${crypto.id}`;

        setTimeout(() => {
            const sparklineData = generateSparklineData(30);
            const color = crypto.priceChange24h >= 0 ? chartColors.success : chartColors.danger;
            createSparkline(sparklineId, sparklineData, color);
        }, 50 * index);

        return `
            <tr>
                <td>
                    <div class="crypto-cell">
                        <div class="crypto-icon">${crypto.symbol.charAt(0)}</div>
                        <div class="crypto-info">
                            <div class="crypto-name">${crypto.name}</div>
                            <div class="crypto-symbol">${crypto.symbol}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="price">$${crypto.price.toFixed(2)}</div>
                    <div class="price-change ${priceChangeClass}">${priceChangeSign}${crypto.priceChange24h.toFixed(2)}%</div>
                </td>
                <td>
                    <canvas id="${sparklineId}" class="sparkline-mini" width="80" height="30"></canvas>
                </td>
                <td>
                    <span class="score-badge ${crypto.score >= 80 ? 'excellent' : crypto.score >= 75 ? 'good' : 'moderate'}">
                        ${crypto.score}
                    </span>
                </td>
                <td>
                    <span class="signal-badge ${signal.class}">${signal.signal}</span>
                </td>
                <td>${crypto.mvrv.toFixed(2)}</td>
                <td>
                    <span class="${crypto.addressGrowth > 0 ? 'positive' : 'negative'}">
                        ${priceChangeSign}${crypto.addressGrowth.toFixed(1)}%
                    </span>
                </td>
                <td>${formatNumber(crypto.marketCap)}</td>
                <td>
                    <button class="btn-primary btn-small" onclick="analyzeCrypto('${crypto.id}')">
                        Analyser
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function loadNewEntrants() {
    const container = document.getElementById('new-entrants-grid');
    if (!container) return;

    container.innerHTML = newEntrants.map(entrant => {
        const crypto = getCryptoById(entrant.id);
        const timeDiff = Date.now() - new Date(entrant.entryDate).getTime();
        const hoursAgo = Math.floor(timeDiff / 3600000);

        return `
            <div class="new-entrant-card">
                <div class="entrant-header">
                    <div class="crypto-cell">
                        <div class="crypto-icon">${crypto.symbol.charAt(0)}</div>
                        <div class="crypto-info">
                            <div class="crypto-name">${crypto.name}</div>
                            <div class="crypto-symbol">${crypto.symbol}</div>
                        </div>
                    </div>
                    <span class="score-badge excellent">${entrant.score}</span>
                </div>
                <div class="entrant-reason">${entrant.reason}</div>
                <div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">
                    Il y a ${hoursAgo}h
                </div>
                <button class="btn-secondary btn-small" style="margin-top: 12px; width: 100%;"
                    onclick="analyzeCrypto('${entrant.id}')">
                    Analyser
                </button>
            </div>
        `;
    }).join('');
}

function exportToCSV() {
    const opportunities = filteredCryptos.length > 0 ? filteredCryptos : getOpportunities(70);

    let csv = 'Crypto,Symbol,Prix,Change 24h,Score,Signal,MVRV,Croissance Addr,Market Cap\n';
    opportunities.forEach(crypto => {
        const scoring = new CryptoScoring(crypto);
        scoring.calculateTotalScore();
        const signal = scoring.getSignal();

        csv += `${crypto.name},${crypto.symbol},${crypto.price},${crypto.priceChange24h},${crypto.score},${signal.signal},${crypto.mvrv},${crypto.addressGrowth},${crypto.marketCap}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crypto-opportunities.csv';
    a.click();
}

// ===== PAGE: ANALYSIS =====
function analyzeCrypto(cryptoId) {
    selectedCrypto = getCryptoById(cryptoId);
    if (!selectedCrypto) return;

    switchPage('analysis');
    loadAnalysisPage();
}

function loadAnalysisPage() {
    if (!selectedCrypto) {
        selectedCrypto = getCryptoById('ethereum');
    }

    // Update header
    document.getElementById('analysis-crypto-name').textContent = selectedCrypto.name;
    document.getElementById('analysis-crypto-symbol').textContent = selectedCrypto.symbol;
    document.getElementById('analysis-score-badge').textContent = selectedCrypto.score;
    document.getElementById('analysis-score-badge').className = `score-badge large ${selectedCrypto.score >= 80 ? 'excellent' : selectedCrypto.score >= 75 ? 'good' : 'moderate'}`;

    // Back button
    document.getElementById('back-to-scanner')?.addEventListener('click', () => switchPage('scanner'));

    // Load metrics
    loadValuationMetrics();
    loadGrowthMetrics();
    loadDevMetrics();
    loadOnChainMetrics();

    // Load price chart
    setTimeout(() => {
        if (charts.priceChart) charts.priceChart.destroy();
        charts.priceChart = createPriceChart('price-chart', selectedCrypto);
    }, 100);

    // Load score breakdown
    loadScoreBreakdown();
}

function loadValuationMetrics() {
    const container = document.getElementById('valuation-metrics');
    if (!container) return;

    const mcapTvl = selectedCrypto.tvl ? (selectedCrypto.marketCap / selectedCrypto.tvl).toFixed(2) : 'N/A';

    container.innerHTML = `
        <div class="metric-row">
            <span class="metric-label">MVRV Ratio</span>
            <span class="metric-value ${selectedCrypto.mvrv < 1.0 ? 'positive' : selectedCrypto.mvrv > 2.0 ? 'negative' : 'neutral'}">
                ${selectedCrypto.mvrv.toFixed(2)}
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Market Cap</span>
            <span class="metric-value neutral">${formatNumber(selectedCrypto.marketCap)}</span>
        </div>
        ${selectedCrypto.tvl ? `
        <div class="metric-row">
            <span class="metric-label">TVL</span>
            <span class="metric-value neutral">${formatNumber(selectedCrypto.tvl)}</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Market Cap / TVL</span>
            <span class="metric-value ${mcapTvl < 0.5 ? 'positive' : mcapTvl > 1.5 ? 'negative' : 'neutral'}">
                ${mcapTvl}
            </span>
        </div>
        ` : ''}
        <div class="metric-row">
            <span class="metric-label">Volume 24h</span>
            <span class="metric-value neutral">${formatNumber(selectedCrypto.volume24h)}</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Vol / MCap Ratio</span>
            <span class="metric-value neutral">${((selectedCrypto.volume24h / selectedCrypto.marketCap) * 100).toFixed(2)}%</span>
        </div>
    `;
}

function loadGrowthMetrics() {
    const container = document.getElementById('growth-metrics');
    if (!container) return;

    container.innerHTML = `
        <div class="metric-row">
            <span class="metric-label">Croissance Adresses Actives (30j)</span>
            <span class="metric-value ${selectedCrypto.addressGrowth > 10 ? 'positive' : selectedCrypto.addressGrowth > 0 ? 'neutral' : 'negative'}">
                ${selectedCrypto.addressGrowth > 0 ? '+' : ''}${selectedCrypto.addressGrowth.toFixed(1)}%
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Performance Prix 24h</span>
            <span class="metric-value ${selectedCrypto.priceChange24h > 0 ? 'positive' : 'negative'}">
                ${selectedCrypto.priceChange24h > 0 ? '+' : ''}${selectedCrypto.priceChange24h.toFixed(2)}%
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Performance Prix 7j</span>
            <span class="metric-value positive">
                +${(selectedCrypto.priceChange24h * 1.8).toFixed(2)}%
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Performance Prix 30j</span>
            <span class="metric-value positive">
                +${(selectedCrypto.priceChange24h * 3.5).toFixed(2)}%
            </span>
        </div>
    `;
}

function loadDevMetrics() {
    const container = document.getElementById('dev-metrics');
    if (!container) return;

    container.innerHTML = `
        <div class="metric-row">
            <span class="metric-label">Commits GitHub (90j)</span>
            <span class="metric-value ${selectedCrypto.githubCommits > 100 ? 'positive' : selectedCrypto.githubCommits > 50 ? 'neutral' : 'negative'}">
                ${selectedCrypto.githubCommits}
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Contributeurs Actifs</span>
            <span class="metric-value ${selectedCrypto.contributors > 50 ? 'positive' : selectedCrypto.contributors > 20 ? 'neutral' : 'negative'}">
                ${selectedCrypto.contributors}
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Dernière Mise à Jour</span>
            <span class="metric-value positive">Il y a 2 jours</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Fréquence Commits</span>
            <span class="metric-value neutral">${(selectedCrypto.githubCommits / 90).toFixed(1)}/jour</span>
        </div>
    `;
}

function loadOnChainMetrics() {
    const container = document.getElementById('onchain-metrics');
    if (!container) return;

    container.innerHTML = `
        <div class="metric-row">
            <span class="metric-label">Supply en Circulation</span>
            <span class="metric-value neutral">${formatNumber(selectedCrypto.supply * selectedCrypto.price)}</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Accumulation Baleines (7j)</span>
            <span class="metric-value ${selectedCrypto.whaleAccumulation > 3 ? 'positive' : selectedCrypto.whaleAccumulation > 1 ? 'neutral' : 'negative'}">
                ${selectedCrypto.whaleAccumulation > 0 ? '+' : ''}${selectedCrypto.whaleAccumulation.toFixed(1)}%
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Flux Net Exchange</span>
            <span class="metric-value positive">-$${(selectedCrypto.volume24h * 0.12).toFixed(0)}M (sortie)</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Adresses Actives (24h)</span>
            <span class="metric-value neutral">${Math.floor(50000 + Math.random() * 50000).toLocaleString()}</span>
        </div>
    `;
}

function loadScoreBreakdown() {
    const container = document.getElementById('score-breakdown');
    if (!container) return;

    const scoring = new CryptoScoring(selectedCrypto);
    scoring.calculateTotalScore();
    const breakdown = scoring.getBreakdown();

    container.innerHTML = `
        <div class="score-category">
            <h4>💰 Valorisation</h4>
            <div class="score-bar">
                <div class="score-fill" style="width: ${breakdown.valuation.percentage}%"></div>
            </div>
            <div class="score-text">${breakdown.valuation.score}/${breakdown.valuation.max}</div>
        </div>
        <div class="score-category">
            <h4>📈 Croissance</h4>
            <div class="score-bar">
                <div class="score-fill" style="width: ${breakdown.growth.percentage}%"></div>
            </div>
            <div class="score-text">${breakdown.growth.score}/${breakdown.growth.max}</div>
        </div>
        <div class="score-category">
            <h4>⚙️ Fondamentaux</h4>
            <div class="score-bar">
                <div class="score-fill" style="width: ${breakdown.fundamental.percentage}%"></div>
            </div>
            <div class="score-text">${breakdown.fundamental.score}/${breakdown.fundamental.max}</div>
        </div>
        <div class="score-category">
            <h4>⚡ Momentum</h4>
            <div class="score-bar">
                <div class="score-fill" style="width: ${breakdown.momentum.percentage}%"></div>
            </div>
            <div class="score-text">${breakdown.momentum.score}/${breakdown.momentum.max}</div>
        </div>
    `;
}

// ===== PAGE: PORTFOLIO =====
function loadPortfolioPage() {
    const portfolioScoring = new PortfolioScoring(portfolioData, cryptoDatabase);
    const metrics = portfolioScoring.getMetrics();

    // Update summary
    document.getElementById('portfolio-total').textContent = '$' + metrics.totalValue.toFixed(2);

    const plClass = metrics.totalPLPercent >= 0 ? 'positive' : 'negative';
    const plSign = metrics.totalPLPercent >= 0 ? '+' : '';
    document.getElementById('portfolio-change').textContent = `${plSign}$${metrics.totalPL.toFixed(2)} (${plSign}${metrics.totalPLPercent.toFixed(2)}%) 24h`;
    document.getElementById('portfolio-change').className = `portfolio-change ${plClass}`;

    document.getElementById('portfolio-positions').textContent = metrics.numPositions;
    document.getElementById('portfolio-sectors').textContent = metrics.numSectors;
    document.getElementById('portfolio-avg-score').textContent = metrics.avgScore.toFixed(1);

    // Load holdings table
    loadHoldingsTable(metrics.positions);

    // Load allocation chart
    setTimeout(() => {
        if (charts.allocation) charts.allocation.destroy();
        charts.allocation = createAllocationChart('allocation-chart', portfolioData, cryptoDatabase);
    }, 100);

    // Load correlation heatmap
    setTimeout(() => {
        createCorrelationHeatmap('correlation-heatmap', portfolioData, cryptoDatabase);
    }, 200);

    // Load alerts
    loadPortfolioAlerts();
}

function loadHoldingsTable(positions) {
    const tbody = document.getElementById('portfolio-tbody');
    if (!tbody) return;

    tbody.innerHTML = positions.map(pos => {
        const plClass = pos.plPercent >= 0 ? 'positive' : 'negative';
        const plSign = pos.plPercent >= 0 ? '+' : '';
        const signal = getSignalLabel(pos.crypto.score);
        const signalClass = getSignal(pos.crypto.score);

        return `
            <tr>
                <td>
                    <div class="crypto-cell">
                        <div class="crypto-icon">${pos.crypto.symbol.charAt(0)}</div>
                        <div class="crypto-info">
                            <div class="crypto-name">${pos.crypto.name}</div>
                            <div class="crypto-symbol">${pos.crypto.symbol}</div>
                        </div>
                    </div>
                </td>
                <td>${pos.quantity.toLocaleString()}</td>
                <td>$${pos.buyPrice.toFixed(2)}</td>
                <td>$${pos.crypto.price.toFixed(2)}</td>
                <td>$${pos.value.toFixed(2)}</td>
                <td class="${plClass}">
                    ${plSign}$${pos.pl.toFixed(2)}<br>
                    <span style="font-size: 12px;">(${plSign}${pos.plPercent.toFixed(2)}%)</span>
                </td>
                <td>${pos.weight.toFixed(1)}%</td>
                <td><span class="score-badge ${pos.crypto.score >= 80 ? 'excellent' : 'good'}">${pos.crypto.score}</span></td>
                <td><span class="signal-badge ${signalClass}">${signal}</span></td>
                <td>
                    <button class="btn-secondary btn-small" onclick="analyzeCrypto('${pos.crypto.id}')">Analyser</button>
                    <button class="btn-danger btn-small" style="margin-top: 4px;">Vendre</button>
                </td>
            </tr>
        `;
    }).join('');
}

function loadPortfolioAlerts() {
    const container = document.getElementById('portfolio-alerts');
    if (!container) return;

    container.innerHTML = portfolioAlerts.map(alert => {
        const timeAgo = Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / 3600000);
        return `
            <div class="alert-item ${alert.type}">
                <div>${alert.message}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                    Il y a ${timeAgo}h
                </div>
            </div>
        `;
    }).join('');
}

// ===== PAGE: SIGNALS =====
function loadSignalsPage() {
    // Initialize tabs
    initSignalsTabs();

    // Load active signals
    loadActiveSignals();

    // Load signal history
    loadSignalHistory();

    // Load alert configuration
    loadAlertConfig();
}

function initSignalsTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;

            // Update buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });
}

function loadActiveSignals() {
    const tbody = document.getElementById('signals-tbody');
    if (!tbody) return;

    tbody.innerHTML = activeSignals.map(signal => {
        const timestamp = new Date(signal.timestamp).toLocaleString('fr-FR');

        return `
            <tr>
                <td style="font-size: 12px;">${timestamp}</td>
                <td>${signal.crypto}</td>
                <td><span class="signal-badge ${signal.signal.toLowerCase().replace(' ', '-')}">${signal.signal}</span></td>
                <td>${signal.type}</td>
                <td>$${signal.price.toFixed(2)}</td>
                <td><span class="score-badge excellent">${signal.score}</span></td>
                <td>${signal.confidence}%</td>
                <td style="font-size: 12px; max-width: 300px;">${signal.reason}</td>
                <td><span class="signal-badge buy">${signal.status}</span></td>
            </tr>
        `;
    }).join('');
}

function loadSignalHistory() {
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    tbody.innerHTML = signalHistory.map(signal => {
        const resultClass = signal.success ? 'positive' : 'negative';
        const resultSign = signal.result >= 0 ? '+' : '';

        return `
            <tr>
                <td>${signal.date}</td>
                <td>${signal.crypto}</td>
                <td><span class="signal-badge ${signal.signal.toLowerCase().replace(' ', '-')}">${signal.signal}</span></td>
                <td>$${signal.entryPrice.toFixed(2)}</td>
                <td>$${signal.exitPrice.toFixed(2)}</td>
                <td>${signal.duration}</td>
                <td class="${resultClass}" style="font-weight: 700;">
                    ${resultSign}${signal.result.toFixed(2)}%
                </td>
            </tr>
        `;
    }).join('');
}

function loadAlertConfig() {
    const container = document.getElementById('active-alerts-list');
    if (!container) return;

    container.innerHTML = activeAlerts.map(alert => {
        return `
            <div class="active-alert">
                <div>
                    <strong>${alert.type}</strong><br>
                    <span style="font-size: 12px; color: var(--text-muted);">
                        ${alert.condition} • ${alert.crypto} • ${alert.notifications.join(', ')}
                    </span>
                </div>
                <button class="btn-danger btn-small">Supprimer</button>
            </div>
        `;
    }).join('');

    // Save alert button
    document.getElementById('save-alert')?.addEventListener('click', function() {
        alert('Alerte créée avec succès !');
    });
}

// ===== PAGE: RISK =====
function loadRiskPage() {
    // Position sizing calculator
    initPositionCalculator();

    // Portfolio risk analysis
    loadPortfolioRisk();

    // Stress tests
    loadStressTests();

    // Recommendations
    loadRiskRecommendations();

    // Risk allocation chart
    setTimeout(() => {
        if (charts.riskAllocation) charts.riskAllocation.destroy();
        charts.riskAllocation = createRiskAllocationChart('risk-allocation-chart', portfolioData, cryptoDatabase);
    }, 100);
}

function initPositionCalculator() {
    document.getElementById('calculate-position')?.addEventListener('click', function() {
        const capital = parseFloat(document.getElementById('calc-capital').value);
        const riskPercent = parseFloat(document.getElementById('calc-risk').value);
        const entry = parseFloat(document.getElementById('calc-entry').value);
        const stopLoss = parseFloat(document.getElementById('calc-stoploss').value);

        const riskAmount = capital * (riskPercent / 100);
        const distance = entry - stopLoss;
        const distancePercent = (distance / entry) * 100;
        const positionSize = riskAmount / distance;
        const positionValue = positionSize * entry;

        const resultDiv = document.getElementById('calc-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <h3 style="margin-bottom: 16px;">📊 Résultat du Calcul</h3>
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-label">Taille Position</div>
                    <div class="result-value">${positionSize.toFixed(2)} unités</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Valeur Position</div>
                    <div class="result-value">$${positionValue.toFixed(2)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Risque Maximum</div>
                    <div class="result-value">$${riskAmount.toFixed(2)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Distance Stop-Loss</div>
                    <div class="result-value">${distancePercent.toFixed(2)}%</div>
                </div>
            </div>
            <div style="margin-top: 16px; padding: 12px; background: var(--bg-hover); border-radius: 8px;">
                <strong>Recommandation:</strong> Avec un capital de $${capital.toFixed(2)} et un risque de ${riskPercent}%,
                vous devriez acheter ${positionSize.toFixed(2)} unités à $${entry.toFixed(2)} avec un stop-loss à $${stopLoss.toFixed(2)}.
                Votre risque maximum sera de $${riskAmount.toFixed(2)} (${riskPercent}% du capital).
            </div>
        `;
    });
}

function loadPortfolioRisk() {
    const portfolioScoring = new PortfolioScoring(portfolioData, cryptoDatabase);
    const metrics = portfolioScoring.getMetrics();
    const varData = portfolioScoring.calculateVaR();

    // Concentration
    document.getElementById('concentration-value').textContent = metrics.concentration.toFixed(0) + '%';
    document.getElementById('concentration-fill').style.width = metrics.concentration + '%';

    // Sector diversity
    document.getElementById('sector-diversity').textContent = metrics.sectorDiversity.toFixed(0) + '/100';

    // VaR
    document.getElementById('var-value').textContent = '-$' + varData.value.toFixed(0);

    // Avg score
    document.getElementById('portfolio-avg-score-risk').textContent = metrics.avgScore.toFixed(1);
}

function loadStressTests() {
    const portfolioScoring = new PortfolioScoring(portfolioData, cryptoDatabase);
    const scenarios = portfolioScoring.stressTest();

    const container = document.getElementById('stress-tests');
    if (!container) return;

    container.innerHTML = Object.values(scenarios).map(scenario => {
        const impactClass = scenario.impact >= 0 ? 'positive' : 'negative';
        const impactSign = scenario.impact >= 0 ? '+' : '';

        return `
            <div class="stress-test">
                <h4>${scenario.name}</h4>
                <div class="stress-result">${impactSign}$${scenario.impact.toFixed(0)}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                    Nouvelle valeur: $${scenario.newValue.toFixed(0)}
                </div>
            </div>
        `;
    }).join('');
}

function loadRiskRecommendations() {
    const portfolioScoring = new PortfolioScoring(portfolioData, cryptoDatabase);
    const recommendations = portfolioScoring.getRecommendations();

    const container = document.getElementById('risk-recommendations');
    if (!container) return;

    container.innerHTML = recommendations.map(rec => {
        return `
            <div class="recommendation">
                <div class="recommendation-icon">${rec.icon}</div>
                <div>${rec.message}</div>
            </div>
        `;
    }).join('');
}
