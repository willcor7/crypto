// ===== GLOBAL STATE =====
let currentPage = 'scanner';
let selectedCrypto = null;
let charts = {};
let filteredCryptos = [];

// ===== WATCHLIST / FAVORITES =====
function getFavorites() {
    try {
        const favorites = localStorage.getItem('crypto_favorites');
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        console.warn('Error reading favorites:', error);
        return [];
    }
}

function saveFavorites(favorites) {
    try {
        localStorage.setItem('crypto_favorites', JSON.stringify(favorites));
        return true;
    } catch (error) {
        console.warn('Error saving favorites:', error);
        return false;
    }
}

function isFavorite(cryptoId) {
    return getFavorites().includes(cryptoId);
}

function addToFavorites(cryptoId) {
    const favorites = getFavorites();
    if (!favorites.includes(cryptoId)) {
        favorites.push(cryptoId);
        saveFavorites(favorites);
        updateWatchlistDisplay();
        return true;
    }
    return false;
}

function removeFromFavorites(cryptoId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(cryptoId);
    if (index > -1) {
        favorites.splice(index, 1);
        saveFavorites(favorites);
        updateWatchlistDisplay();
        return true;
    }
    return false;
}

function toggleFavorite(cryptoId) {
    if (isFavorite(cryptoId)) {
        removeFromFavorites(cryptoId);
        showNotification(`Retiré de la watchlist`, 'info');
    } else {
        addToFavorites(cryptoId);
        showNotification(`⭐ Ajouté à la watchlist`, 'success');
    }
    // Refresh the table to update star icons
    updateOpportunitiesTable();
}

function updateWatchlistDisplay() {
    const watchlistContainer = document.getElementById('watchlist-items');
    if (!watchlistContainer) return;

    const favorites = getFavorites();
    const db = getCurrentDatabase();

    if (favorites.length === 0) {
        watchlistContainer.innerHTML = `
            <div class="watchlist-empty">
                <p style="color: var(--text-secondary); font-size: 13px; text-align: center; padding: 20px 10px;">
                    Aucune crypto en watchlist<br>
                    <span style="font-size: 11px;">Cliquez sur ⭐ pour ajouter</span>
                </p>
            </div>
        `;
        return;
    }

    watchlistContainer.innerHTML = favorites.map(cryptoId => {
        const crypto = db.find(c => c.id === cryptoId);
        if (!crypto) return '';

        const priceChange = crypto.priceChange24h || 0;
        const changeClass = priceChange >= 0 ? 'positive' : 'negative';
        const changeIcon = priceChange >= 0 ? '📈' : '📉';

        return `
            <div class="watchlist-item" onclick="showCryptoDetails('${crypto.id}')">
                <div class="watchlist-item-header">
                    <span class="watchlist-crypto-name">${crypto.symbol.toUpperCase()}</span>
                    <button class="watchlist-remove" onclick="event.stopPropagation(); removeFromFavorites('${crypto.id}'); updateWatchlistDisplay();" title="Retirer">×</button>
                </div>
                <div class="watchlist-item-info">
                    <span class="watchlist-price">$${crypto.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="watchlist-change ${changeClass}">${changeIcon} ${priceChange.toFixed(1)}%</span>
                </div>
                <div class="watchlist-score">
                    <span style="font-size: 11px; color: var(--text-secondary);">Score</span>
                    <span class="score-badge score-${crypto.score >= 80 ? 'excellent' : crypto.score >= 70 ? 'good' : 'medium'}">${crypto.score}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== EXPORT FUNCTIONALITY =====
function convertToCSV(data) {
    if (!data || data.length === 0) return '';

    // Define headers
    const headers = [
        'Name', 'Symbol', 'Price (USD)', 'Change 24h (%)', 'Market Cap',
        'Score', 'Signal', 'MVRV', 'Address Growth (%)',
        'GitHub Commits', 'Contributors', 'Category'
    ];

    // Create CSV rows
    const rows = data.map(crypto => [
        crypto.name,
        crypto.symbol.toUpperCase(),
        crypto.price.toFixed(2),
        crypto.priceChange24h.toFixed(2),
        crypto.marketCap,
        crypto.score,
        new CryptoScoring(crypto).getSignal().signal,
        crypto.mvrv.toFixed(2),
        crypto.addressGrowth.toFixed(1),
        crypto.githubCommits || 'N/A',
        crypto.contributors || 'N/A',
        crypto.category || 'N/A'
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell =>
            typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
    ].join('\n');

    return csvContent;
}

function convertToJSON(data) {
    if (!data || data.length === 0) return '[]';

    // Create simplified objects for export
    const exportData = data.map(crypto => ({
        name: crypto.name,
        symbol: crypto.symbol.toUpperCase(),
        price: parseFloat(crypto.price.toFixed(2)),
        priceChange24h: parseFloat(crypto.priceChange24h.toFixed(2)),
        marketCap: crypto.marketCap,
        score: crypto.score,
        signal: new CryptoScoring(crypto).getSignal().signal,
        mvrv: parseFloat(crypto.mvrv.toFixed(2)),
        addressGrowth: parseFloat(crypto.addressGrowth.toFixed(1)),
        githubCommits: crypto.githubCommits || null,
        contributors: crypto.contributors || null,
        category: crypto.category || null,
        exportDate: new Date().toISOString()
    }));

    return JSON.stringify(exportData, null, 2);
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportOpportunities(format = 'csv') {
    const opportunities = filteredCryptos.length > 0 ? filteredCryptos :
        (typeof getCurrentOpportunities !== 'undefined' ? getCurrentOpportunities(50) : getOpportunities(50));

    if (opportunities.length === 0) {
        showNotification('❌ Aucune opportunité à exporter', 'error');
        return;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
        const csv = convertToCSV(opportunities);
        downloadFile(csv, `crypto-opportunities-${timestamp}.csv`, 'text/csv');
        showNotification(`📥 ${opportunities.length} opportunités exportées en CSV`, 'success');
    } else if (format === 'json') {
        const json = convertToJSON(opportunities);
        downloadFile(json, `crypto-opportunities-${timestamp}.json`, 'application/json');
        showNotification(`📥 ${opportunities.length} opportunités exportées en JSON`, 'success');
    }
}

// ===== THEME MANAGEMENT =====
function getTheme() {
    try {
        return localStorage.getItem('crypto_theme') || 'dark';
    } catch (error) {
        return 'dark';
    }
}

function setTheme(theme) {
    try {
        localStorage.setItem('crypto_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeButton(theme);
    } catch (error) {
        console.warn('Error saving theme:', error);
    }
}

function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function updateThemeButton(theme) {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (theme === 'light') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Mode Sombre';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Mode Clair';
    }
}

function initTheme() {
    const theme = getTheme();
    setTheme(theme);

    // Add click listener to theme toggle button
    const toggleBtn = document.getElementById('toggle-theme');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initRefresh();
    initTheme();
    loadScannerPage();
    updateMarketStatus();
    updateWatchlistDisplay();

    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (currentPage === 'scanner') {
            updateOpportunitiesTable();
        }
        updateMarketStatus();
        updateWatchlistDisplay();
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
    // Use live data if enabled, otherwise simulate
    if (typeof liveDataEnabled !== 'undefined' && liveDataEnabled) {
        updateLiveMarketStatus();
    } else {
        // Simulate live updates
        const btcDom = 54.2 + (Math.random() - 0.5) * 0.5;
        const marketCap = 2.1 + (Math.random() - 0.5) * 0.1;
        const volume = 89.5 + (Math.random() - 0.5) * 5;

        document.querySelectorAll('.status-item .value')[0].textContent = btcDom.toFixed(1) + '%';
        document.querySelectorAll('.status-item .value')[1].textContent = '$' + marketCap.toFixed(2) + 'T';
        document.querySelectorAll('.status-item .value')[2].textContent = '$' + volume.toFixed(1) + 'B';
    }
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

    // Use live data filter if enabled, otherwise use simulated
    if (typeof filterCurrentCryptos !== 'undefined') {
        filteredCryptos = filterCurrentCryptos(category, mcap, minScore, signal);
    } else {
        filteredCryptos = filterCryptos(category, mcap, minScore, signal);
    }
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

// ===== ADAPTIVE THRESHOLD =====
function getAdaptiveThreshold(cryptos, targetCount = 15, idealThreshold = 70) {
    if (!cryptos || cryptos.length === 0) return idealThreshold;

    const scores = cryptos.map(c => c.score).sort((a, b) => b - a);
    const countAboveIdeal = scores.filter(s => s >= idealThreshold).length;

    // If we have enough cryptos above ideal threshold, use it
    if (countAboveIdeal >= targetCount) {
        return idealThreshold;
    }

    // Otherwise, find the threshold that gives us ~targetCount results
    // But never go below 50
    if (scores.length >= targetCount) {
        return Math.max(50, scores[targetCount - 1]);
    }

    // If we don't have enough cryptos at all, lower threshold significantly
    return 50;
}

// ===== RESET FILTERS =====
function resetFilters() {
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-mcap').value = 'all';
    document.getElementById('filter-score').value = '50';
    document.getElementById('filter-signal').value = 'all';
    applyFilters();
}

// ===== PAGE: SCANNER =====
function loadScannerPage() {
    // Get all cryptos
    const allCryptos = typeof getCurrentDatabase !== 'undefined' ?
        getCurrentDatabase() : cryptoDatabase;

    // Calculate adaptive threshold
    const adaptiveThreshold = getAdaptiveThreshold(allCryptos, 15, 70);

    // Update stats - use adaptive threshold
    const opportunities = typeof getCurrentOpportunities !== 'undefined' ?
        getCurrentOpportunities(adaptiveThreshold) : getOpportunities(adaptiveThreshold);

    const strongBuy = opportunities.filter(c => c.score >= 80).length;
    const avgScore = opportunities.length > 0 ?
        opportunities.reduce((sum, c) => sum + c.score, 0) / opportunities.length : 0;

    document.getElementById('active-opportunities').textContent = opportunities.length;
    document.getElementById('strong-buy-signals').textContent = strongBuy;
    document.getElementById('average-score').textContent = avgScore.toFixed(1);
    document.getElementById('new-entries').textContent = newEntrants.length;

    // Display scoring stats if live data enabled
    if (typeof liveDataEnabled !== 'undefined' && liveDataEnabled) {
        displayScoringStats(allCryptos);
    }

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

// ===== DISPLAY SCORING STATS =====
function displayScoringStats(cryptos) {
    if (!cryptos || cryptos.length === 0) return;

    const stats = {
        total: cryptos.length,
        excellent: cryptos.filter(c => c.score >= 80).length,
        good: cryptos.filter(c => c.score >= 70 && c.score < 80).length,
        moderate: cryptos.filter(c => c.score >= 60 && c.score < 70).length,
        avgScore: (cryptos.reduce((sum, c) => sum + c.score, 0) / cryptos.length).toFixed(1),
        maxScore: Math.max(...cryptos.map(c => c.score)),
        minScore: Math.min(...cryptos.map(c => c.score))
    };

    // Update subtitle with stats
    const subtitle = document.getElementById('page-subtitle');
    if (subtitle && currentPage === 'scanner') {
        subtitle.innerHTML = `
            📊 ${stats.total} cryptos | Score moyen: ${stats.avgScore} |
            Range: ${stats.minScore}-${stats.maxScore} |
            <span style="color: var(--color-success)">Excellentes: ${stats.excellent}</span> |
            <span style="color: var(--color-info)">Bonnes: ${stats.good}</span> |
            <span style="color: var(--color-warning)">Modérées: ${stats.moderate}</span>
        `;
    }
}

function updateOpportunitiesTable() {
    const tbody = document.getElementById('opportunities-tbody');
    if (!tbody) return;

    const opportunities = filteredCryptos.length > 0 ? filteredCryptos :
        (typeof getCurrentOpportunities !== 'undefined' ? getCurrentOpportunities(70) : getOpportunities(70));

    // Empty state message
    if (opportunities.length === 0) {
        const currentScore = parseInt(document.getElementById('filter-score')?.value || '70');
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 60px 40px;">
                    <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;">📊</div>
                    <h3 style="margin-bottom: 12px; font-size: 22px;">Aucune opportunité trouvée</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px; max-width: 500px; margin-left: auto; margin-right: auto;">
                        ${typeof liveDataEnabled !== 'undefined' && liveDataEnabled ?
                            `Aucune crypto n'atteint le score minimum de ${currentScore}. Essayez d'abaisser le seuil ou d'ajuster les filtres.` :
                            'Activez les "Données Réelles" pour voir les opportunités actuelles du marché.'}
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn-primary" onclick="resetFilters()">
                            🔄 Réinitialiser les Filtres
                        </button>
                        ${typeof liveDataEnabled === 'undefined' || !liveDataEnabled ?
                            '<button class="btn-secondary" onclick="toggleLiveData()">📡 Activer Données Réelles</button>' :
                            ''}
                    </div>
                </td>
            </tr>
        `;
        return;
    }

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

        const isFav = isFavorite(crypto.id);
        const starIcon = isFav ? '⭐' : '☆';
        const starTitle = isFav ? 'Retirer de la watchlist' : 'Ajouter à la watchlist';

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
                <td style="text-align: center;">
                    <button class="btn-favorite" onclick="toggleFavorite('${crypto.id}')" title="${starTitle}">
                        ${starIcon}
                    </button>
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
                    <button class="btn-secondary btn-small" onclick="showScoringDebug('${crypto.id}')"
                            style="margin-top: 4px;" title="Voir le détail du scoring">
                        🔍 Debug
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
    selectedCrypto = typeof getCurrentCryptoById !== 'undefined' ?
        getCurrentCryptoById(cryptoId) : getCryptoById(cryptoId);
    if (!selectedCrypto) return;

    switchPage('analysis');
    loadAnalysisPage();
}

function loadAnalysisPage() {
    if (!selectedCrypto) {
        selectedCrypto = typeof getCurrentCryptoById !== 'undefined' ?
            getCurrentCryptoById('ethereum') : getCryptoById('ethereum');
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

// ===== DEBUG MODE =====
function showScoringDebug(cryptoId) {
    const crypto = typeof getCurrentCryptoById !== 'undefined' ?
        getCurrentCryptoById(cryptoId) : getCryptoById(cryptoId);

    if (!crypto) {
        alert('Crypto non trouvée');
        return;
    }

    const scoring = new CryptoScoring(crypto);
    scoring.calculateTotalScore();
    const breakdown = scoring.getBreakdown();
    const signal = scoring.getSignal();

    const debugInfo = `
╔════════════════════════════════════════════════════════════
║ 🔍 DEBUG SCORING: ${crypto.name} (${crypto.symbol})
╠════════════════════════════════════════════════════════════
║ 📊 SCORE TOTAL: ${scoring.total}/100
║ 🎯 SIGNAL: ${signal.signal} (Confiance: ${signal.confidence.toFixed(1)}%)
╠════════════════════════════════════════════════════════════
║ 💰 VALORISATION: ${breakdown.valuation.score}/35 (${breakdown.valuation.percentage}%)
║    • MVRV Ratio: ${crypto.mvrv.toFixed(2)}
║      ${crypto.mvrv < 0.7 ? '→ Forte sous-évaluation (20 pts)' :
         crypto.mvrv < 1.0 ? '→ Sous-évaluation (15 pts)' :
         crypto.mvrv < 1.5 ? '→ Fair value (10 pts)' :
         crypto.mvrv < 2.5 ? '→ Surévaluation (5 pts)' : '→ Forte surévaluation (0 pts)'}
║    • Market Cap: ${formatNumber(crypto.marketCap)}
${crypto.tvl ? `║    • TVL: ${formatNumber(crypto.tvl)}
║    • MCap/TVL: ${(crypto.marketCap / crypto.tvl).toFixed(2)}` : ''}
║
║ 📈 CROISSANCE: ${breakdown.growth.score}/30 (${breakdown.growth.percentage}%)
║    • Address Growth (30j): ${crypto.addressGrowth > 0 ? '+' : ''}${crypto.addressGrowth.toFixed(1)}%
║      ${crypto.addressGrowth > 30 ? '→ Exceptionnelle (20 pts)' :
         crypto.addressGrowth > 20 ? '→ Forte (16 pts)' :
         crypto.addressGrowth > 10 ? '→ Bonne (12 pts)' :
         crypto.addressGrowth > 5 ? '→ Modérée (8 pts)' :
         crypto.addressGrowth > 0 ? '→ Faible (4 pts)' : '→ Décroissance (0 pts)'}
║    • Volume 24h: ${formatNumber(crypto.volume24h)}
║    • Vol/MCap Ratio: ${(crypto.volume24h / crypto.marketCap * 100).toFixed(2)}%
║
║ ⚙️ FONDAMENTAUX: ${breakdown.fundamental.score}/25 (${breakdown.fundamental.percentage}%)
║    • GitHub Commits (90j): ${crypto.githubCommits}
║      ${crypto.githubCommits > 200 ? '→ Très actif (15 pts)' :
         crypto.githubCommits > 100 ? '→ Actif (12 pts)' :
         crypto.githubCommits > 50 ? '→ Modéré (8 pts)' :
         crypto.githubCommits > 20 ? '→ Faible (4 pts)' : '→ Très faible (0 pts)'}
║    • Contributors: ${crypto.contributors}
║      ${crypto.contributors > 80 ? '→ Communauté large (10 pts)' :
         crypto.contributors > 50 ? '→ Bonne communauté (8 pts)' :
         crypto.contributors > 30 ? '→ Communauté moyenne (6 pts)' :
         crypto.contributors > 10 ? '→ Petite communauté (4 pts)' : '→ Très petite (2 pts)'}
║
║ ⚡ MOMENTUM: ${breakdown.momentum.score}/10 (${breakdown.momentum.percentage}%)
║    • Whale Accumulation (7j): +${crypto.whaleAccumulation.toFixed(1)}%
║      ${crypto.whaleAccumulation > 5 ? '→ Forte accumulation (6 pts)' :
         crypto.whaleAccumulation > 3 ? '→ Bonne accumulation (4 pts)' :
         crypto.whaleAccumulation > 1 ? '→ Accumulation modérée (2 pts)' : '→ Faible (0 pts)'}
║    • Price Change 24h: ${crypto.priceChange24h > 0 ? '+' : ''}${crypto.priceChange24h.toFixed(2)}%
║      ${crypto.priceChange24h > 10 ? '→ Fort momentum (4 pts)' :
         crypto.priceChange24h > 5 ? '→ Bon momentum (3 pts)' :
         crypto.priceChange24h > 0 ? '→ Positif (2 pts)' :
         crypto.priceChange24h > -5 ? '→ Neutre (1 pt)' : '→ Négatif (0 pts)'}
╠════════════════════════════════════════════════════════════
║ 📋 RAISONS DU SIGNAL:
${signal.reasons.length > 0 ? signal.reasons.map(r => `║    • ${r}`).join('\n') : '║    (Aucune raison spécifique)'}
╚════════════════════════════════════════════════════════════
    `.trim();

    console.log(debugInfo);

    // Show modal or alert
    alert(`Score détaillé pour ${crypto.name}: ${scoring.total}/100\n\nVoir la console (F12) pour les détails complets.`);
}

// ===== PRICE CHARTS WITH CHART.JS =====
async function loadPriceHistory(cryptoId, days = 30) {
    try {
        // Try to fetch from CoinGecko
        if (typeof CoinGeckoAPI !== 'undefined') {
            const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.prices) {
                return data.prices.map(([timestamp, price]) => ({
                    date: new Date(timestamp),
                    price: price
                }));
            }
        }
    } catch (error) {
        console.warn('Could not load price history:', error);
    }

    // Fallback: generate simulated data based on current price
    const crypto = selectedCrypto || getCurrentCryptoById(cryptoId);
    if (!crypto) return [];

    const currentPrice = crypto.price;
    const prices = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Simulate price with some volatility
        const volatility = 0.02;
        const trend = crypto.priceChange24h / 100 / days;
        const randomWalk = (Math.random() - 0.5) * volatility;
        const price = currentPrice * (1 - trend * i) * (1 + randomWalk);

        prices.push({
            date: date,
            price: price
        });
    }

    return prices;
}

function createPriceChart(canvasId, crypto) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`Canvas ${canvasId} not found`);
        return null;
    }

    const ctx = canvas.getContext('2d');

    // Load price history and create chart
    loadPriceHistory(crypto.id, 30).then(priceHistory => {
        if (!priceHistory || priceHistory.length === 0) {
            console.warn('No price history available');
            return;
        }

        // Calculate technical indicators
        const prices = priceHistory.map(p => p.price);
        const rsi = TechnicalIndicators.calculateRSI(prices, 14);
        const sma20 = TechnicalIndicators.calculateSMA(prices, 20);
        const sma50 = TechnicalIndicators.calculateSMA(prices, 50);
        const trend = TechnicalIndicators.analyzeTrend(prices, sma20, sma50);

        // Prepare data for chart
        const labels = priceHistory.map(p => p.date.toLocaleDateString('fr-FR', {
            month: 'short',
            day: 'numeric'
        }));
        const priceData = priceHistory.map(p => p.price);

        // Determine chart color based on overall trend
        const isPositive = prices[prices.length - 1] > prices[0];
        const lineColor = isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)';
        const gradientColor = isPositive ?
            'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, gradientColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        // Destroy existing chart if any
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }

        // Create new chart
        charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Prix (USD)',
                    data: priceData,
                    borderColor: lineColor,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: lineColor,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: lineColor,
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Prix: $${context.parsed.y.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            callback: function(value) {
                                return '$' + value.toLocaleString('en-US');
                            }
                        }
                    }
                }
            }
        });

        // Display technical indicators in UI
        displayTechnicalIndicators(crypto, rsi, sma20, sma50, trend);
    });

    return charts[canvasId];
}

function displayTechnicalIndicators(crypto, rsi, sma20, sma50, trend) {
    // Find or create technical indicators container
    let container = document.getElementById('technical-indicators');

    if (!container) {
        // Create container if it doesn't exist
        const metricsSection = document.querySelector('#page-analysis .metrics-grid');
        if (metricsSection) {
            const cardHtml = `
                <div class="metric-card">
                    <h3>📊 Indicateurs Techniques</h3>
                    <div id="technical-indicators" class="metric-list"></div>
                </div>
            `;
            metricsSection.insertAdjacentHTML('beforeend', cardHtml);
            container = document.getElementById('technical-indicators');
        }
    }

    if (!container) return;

    const rsiSignal = TechnicalIndicators.getRSISignal(rsi);

    container.innerHTML = `
        <div class="metric-row">
            <span class="metric-label">RSI (14)</span>
            <span class="metric-value ${rsiSignal.class}">
                ${rsi ? rsi.toFixed(2) : 'N/A'} ${rsiSignal.emoji}
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Signal RSI</span>
            <span class="metric-value ${rsiSignal.class}">
                ${rsiSignal.signal}
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">SMA (20)</span>
            <span class="metric-value neutral">
                $${sma20 ? sma20.toFixed(2) : 'N/A'}
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">SMA (50)</span>
            <span class="metric-value neutral">
                $${sma50 ? sma50.toFixed(2) : 'N/A'}
            </span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Tendance</span>
            <span class="metric-value ${trend.trend === 'Bullish' ? 'positive' : trend.trend === 'Bearish' ? 'negative' : 'neutral'}">
                ${trend.trend} ${trend.trend === 'Bullish' ? '📈' : trend.trend === 'Bearish' ? '📉' : '➡️'}
            </span>
        </div>
        ${trend.strength > 0 ? `
        <div class="metric-row">
            <span class="metric-label">Force Tendance</span>
            <span class="metric-value neutral">
                ${trend.strength}%
            </span>
        </div>
        ` : ''}
    `;
}

// ===== PORTFOLIO MANAGEMENT =====
function getPortfolio() {
    try {
        const portfolio = localStorage.getItem('crypto_portfolio');
        return portfolio ? JSON.parse(portfolio) : {};
    } catch (error) {
        console.warn('Error reading portfolio:', error);
        return {};
    }
}

function savePortfolio(portfolio) {
    try {
        localStorage.setItem('crypto_portfolio', JSON.stringify(portfolio));
        return true;
    } catch (error) {
        console.warn('Error saving portfolio:', error);
        return false;
    }
}

function addToPortfolio(cryptoId, quantity, avgPrice) {
    const portfolio = getPortfolio();

    if (portfolio[cryptoId]) {
        // Update existing position
        const existingQty = portfolio[cryptoId].quantity;
        const existingAvg = portfolio[cryptoId].avgPrice;

        // Calculate new average price
        const newAvgPrice = ((existingQty * existingAvg) + (quantity * avgPrice)) / (existingQty + quantity);

        portfolio[cryptoId] = {
            quantity: existingQty + quantity,
            avgPrice: newAvgPrice,
            addedAt: portfolio[cryptoId].addedAt,
            updatedAt: new Date().toISOString()
        };
    } else {
        // New position
        portfolio[cryptoId] = {
            quantity: quantity,
            avgPrice: avgPrice,
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    savePortfolio(portfolio);
    updatePortfolioDisplay();
    showNotification(`✅ Position ajoutée au portfolio`, 'success');
}

function removeFromPortfolio(cryptoId) {
    const portfolio = getPortfolio();
    if (portfolio[cryptoId]) {
        delete portfolio[cryptoId];
        savePortfolio(portfolio);
        updatePortfolioDisplay();
        showNotification(`Position retirée du portfolio`, 'info');
    }
}

function calculatePortfolioStats() {
    const portfolio = getPortfolio();
    const db = getCurrentDatabase();

    let totalInvested = 0;
    let totalValue = 0;
    let positions = [];

    Object.keys(portfolio).forEach(cryptoId => {
        const position = portfolio[cryptoId];
        const crypto = db.find(c => c.id === cryptoId);

        if (crypto) {
            const invested = position.quantity * position.avgPrice;
            const currentValue = position.quantity * crypto.price;
            const pnl = currentValue - invested;
            const pnlPercent = ((currentValue - invested) / invested) * 100;

            totalInvested += invested;
            totalValue += currentValue;

            positions.push({
                crypto,
                quantity: position.quantity,
                avgPrice: position.avgPrice,
                currentPrice: crypto.price,
                invested,
                currentValue,
                pnl,
                pnlPercent,
                addedAt: position.addedAt
            });
        }
    });

    const totalPnL = totalValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;

    return {
        positions,
        totalInvested,
        totalValue,
        totalPnL,
        totalPnLPercent,
        positionCount: positions.length
    };
}

function updatePortfolioDisplay() {
    const statsContainer = document.getElementById('portfolio-stats');
    const positionsContainer = document.getElementById('portfolio-positions');

    if (!statsContainer || !positionsContainer) return;

    const stats = calculatePortfolioStats();

    // Update stats cards
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon ${stats.totalPnL >= 0 ? 'success' : 'danger'}">💰</div>
            <div class="stat-info">
                <h3>Valeur Totale</h3>
                <p class="stat-value">$${stats.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p class="stat-change ${stats.totalPnL >= 0 ? 'positive' : 'negative'}">
                    ${stats.totalPnL >= 0 ? '+' : ''}$${Math.abs(stats.totalPnL).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon info">📊</div>
            <div class="stat-info">
                <h3>Montant Investi</h3>
                <p class="stat-value">$${stats.totalInvested.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p class="stat-change neutral">${stats.positionCount} position${stats.positionCount > 1 ? 's' : ''}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon ${stats.totalPnLPercent >= 0 ? 'success' : 'danger'}">${stats.totalPnLPercent >= 0 ? '📈' : '📉'}</div>
            <div class="stat-info">
                <h3>P&L Global</h3>
                <p class="stat-value ${stats.totalPnLPercent >= 0 ? 'positive' : 'negative'}">
                    ${stats.totalPnLPercent >= 0 ? '+' : ''}${stats.totalPnLPercent.toFixed(2)}%
                </p>
                <p class="stat-change ${stats.totalPnLPercent >= 0 ? 'positive' : 'negative'}">
                    ${stats.totalPnL >= 0 ? 'Profit' : 'Perte'}
                </p>
            </div>
        </div>
    `;

    // Update positions table
    if (stats.positions.length === 0) {
        positionsContainer.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;">💼</div>
                <h3 style="margin-bottom: 12px;">Portfolio vide</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    Ajoutez vos premières positions pour suivre votre P&L en temps réel.
                </p>
                <button class="btn-primary" onclick="showAddPositionModal()">
                    ➕ Ajouter une Position
                </button>
            </div>
        `;
        return;
    }

    positionsContainer.innerHTML = `
        <div style="margin-bottom: 20px; text-align: right;">
            <button class="btn-primary" onclick="showAddPositionModal()">
                ➕ Ajouter une Position
            </button>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Crypto</th>
                        <th>Quantité</th>
                        <th>Prix Moyen</th>
                        <th>Prix Actuel</th>
                        <th>Investi</th>
                        <th>Valeur Actuelle</th>
                        <th>P&L</th>
                        <th>P&L %</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.positions.map(pos => `
                        <tr>
                            <td>
                                <div class="crypto-cell">
                                    <div class="crypto-icon">${pos.crypto.symbol.charAt(0)}</div>
                                    <div class="crypto-info">
                                        <div class="crypto-name">${pos.crypto.name}</div>
                                        <div class="crypto-symbol">${pos.crypto.symbol.toUpperCase()}</div>
                                    </div>
                                </div>
                            </td>
                            <td>${pos.quantity.toFixed(4)}</td>
                            <td>$${pos.avgPrice.toFixed(2)}</td>
                            <td>
                                <div class="price">$${pos.currentPrice.toFixed(2)}</div>
                                <div class="price-change ${pos.crypto.priceChange24h >= 0 ? 'positive' : 'negative'}">
                                    ${pos.crypto.priceChange24h >= 0 ? '+' : ''}${pos.crypto.priceChange24h.toFixed(2)}%
                                </div>
                            </td>
                            <td>$${pos.invested.toFixed(2)}</td>
                            <td>$${pos.currentValue.toFixed(2)}</td>
                            <td class="${pos.pnl >= 0 ? 'positive' : 'negative'}">
                                ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)}
                            </td>
                            <td>
                                <span class="score-badge ${pos.pnlPercent >= 10 ? 'excellent' : pos.pnlPercent >= 0 ? 'good' : 'moderate'}">
                                    ${pos.pnlPercent >= 0 ? '+' : ''}${pos.pnlPercent.toFixed(2)}%
                                </span>
                            </td>
                            <td>
                                <button class="btn-secondary btn-small" onclick="removeFromPortfolio('${pos.crypto.id}')">
                                    🗑️ Retirer
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showAddPositionModal() {
    const db = getCurrentDatabase();

    const modalHtml = `
        <div id="add-position-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: var(--bg-card); border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-color);">
                <h2 style="margin-bottom: 20px;">➕ Ajouter une Position</h2>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Crypto</label>
                    <select id="position-crypto" style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                        <option value="">Sélectionner une crypto...</option>
                        ${db.map(crypto => `
                            <option value="${crypto.id}">${crypto.name} (${crypto.symbol.toUpperCase()})</option>
                        `).join('')}
                    </select>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Quantité</label>
                    <input type="number" id="position-quantity" step="0.0001" placeholder="0.5" style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                </div>

                <div style="margin-bottom: 30px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Prix d'Achat Moyen (USD)</label>
                    <input type="number" id="position-price" step="0.01" placeholder="45000.00" style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                </div>

                <div style="display: flex; gap: 12px;">
                    <button class="btn-primary" onclick="submitAddPosition()" style="flex: 1;">
                        ✅ Ajouter
                    </button>
                    <button class="btn-secondary" onclick="closeAddPositionModal()" style="flex: 1;">
                        ❌ Annuler
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeAddPositionModal() {
    const modal = document.getElementById('add-position-modal');
    if (modal) {
        modal.remove();
    }
}

function submitAddPosition() {
    const cryptoId = document.getElementById('position-crypto').value;
    const quantity = parseFloat(document.getElementById('position-quantity').value);
    const price = parseFloat(document.getElementById('position-price').value);

    if (!cryptoId || !quantity || !price || quantity <= 0 || price <= 0) {
        showNotification('❌ Veuillez remplir tous les champs avec des valeurs valides', 'error');
        return;
    }

    addToPortfolio(cryptoId, quantity, price);
    closeAddPositionModal();
}

function loadPortfolioPage() {
    updatePortfolioDisplay();

    // Auto-refresh every 30 seconds
    if (typeof portfolioRefreshInterval !== 'undefined') {
        clearInterval(portfolioRefreshInterval);
    }

    window.portfolioRefreshInterval = setInterval(() => {
        if (currentPage === 'portfolio') {
            updatePortfolioDisplay();
        }
    }, 30000);
}
