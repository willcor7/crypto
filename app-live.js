// ===== LIVE DATA INTEGRATION =====
// This file handles real-time data from free APIs

// ===== GLOBAL STATE FOR LIVE DATA =====
let liveDataEnabled = false;
let liveCryptoDatabase = [];
let isLoadingLiveData = false;

// ===== LIVE DATA MANAGEMENT =====
async function toggleLiveData() {
    const toggleBtn = document.getElementById('toggle-live-data');
    const icon = document.getElementById('live-data-icon');
    const text = document.getElementById('live-data-text');

    if (!liveDataEnabled) {
        // Enable live data
        icon.textContent = '⏳';
        text.textContent = 'Chargement...';
        toggleBtn.style.pointerEvents = 'none';

        const success = await loadLiveData();

        if (success) {
            liveDataEnabled = true;
            icon.textContent = '✅';
            text.textContent = 'Données Live';
            toggleBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

            // Reload current page with live data
            if (currentPage === 'scanner') {
                loadScannerPage();
            }

            showNotification('✅ Données réelles chargées avec succès !', 'success');
        } else {
            icon.textContent = '❌';
            text.textContent = 'Erreur';
            setTimeout(() => {
                icon.textContent = '📡';
                text.textContent = 'Données Réelles';
            }, 3000);

            showNotification('❌ Erreur lors du chargement des données réelles', 'error');
        }

        toggleBtn.style.pointerEvents = 'auto';
    } else {
        // Disable live data
        liveDataEnabled = false;
        icon.textContent = '📡';
        text.textContent = 'Données Réelles';
        toggleBtn.style.background = '';

        // Reload with simulated data
        if (currentPage === 'scanner') {
            loadScannerPage();
        }

        showNotification('ℹ️ Retour aux données simulées', 'info');
    }
}

async function loadLiveData() {
    console.log('🚀 Loading live crypto data from APIs...');
    isLoadingLiveData = true;

    try {
        // Show initial progress
        showProgressBar('Chargement des données...', 0);

        // Fetch top 100 cryptos from CoinGecko
        showProgressBar('Récupération des prix en temps réel...', 20);
        liveCryptoDatabase = await CryptoDataFetcher.fetchTopCryptos(100);

        if (!liveCryptoDatabase || liveCryptoDatabase.length === 0) {
            throw new Error('No data received from API');
        }

        // Calculate scores for all cryptos
        showProgressBar('Calcul des scores fondamentaux...', 50);
        liveCryptoDatabase = liveCryptoDatabase.map(crypto => {
            const scoring = new CryptoScoring(crypto);
            crypto.score = scoring.calculateTotalScore();
            return crypto;
        });

        // Enrich with GitHub data for top cryptos (async, non-blocking)
        showProgressBar('Enrichissement avec données GitHub...', 70);
        enrichTopCryptosWithGitHub();

        // Enrich DeFi protocols with real TVL (async, non-blocking)
        showProgressBar('Chargement des données DeFi TVL...', 85);
        enrichDefiWithTVL();

        // Complete
        showProgressBar('Chargement terminé !', 100);
        setTimeout(hideProgressBar, 800);

        console.log(`✅ Loaded ${liveCryptoDatabase.length} live cryptos with scores`);
        isLoadingLiveData = false;
        return true;

    } catch (error) {
        console.error('❌ Error loading live data:', error);
        hideProgressBar();
        isLoadingLiveData = false;
        return false;
    }
}

async function enrichTopCryptosWithGitHub() {
    // Enrich top 20 cryptos with GitHub data in background
    const topCryptos = liveCryptoDatabase.slice(0, 20);

    for (const crypto of topCryptos) {
        const repoInfo = GITHUB_REPOS[crypto.id];
        if (repoInfo) {
            try {
                const githubStats = await GitHubAPI.getRepoStats(repoInfo.owner, repoInfo.repo);
                if (githubStats) {
                    crypto.githubCommits = githubStats.commits90d;
                    crypto.contributors = githubStats.contributors;
                    crypto.githubStars = githubStats.stars;
                    crypto.lastGithubUpdate = githubStats.lastUpdate;

                    // Recalculate score with real GitHub data
                    const scoring = new CryptoScoring(crypto);
                    crypto.score = scoring.calculateTotalScore();

                    console.log(`✅ Enriched ${crypto.name} with GitHub data (${githubStats.commits90d} commits)`);
                }

                // Add delay to respect GitHub API rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.warn(`⚠️ Could not enrich ${crypto.name} with GitHub data:`, error.message);
            }
        }
    }

    console.log('✅ GitHub enrichment complete');

    // Refresh display if still on scanner page
    if (currentPage === 'scanner' && liveDataEnabled) {
        updateOpportunitiesTable();
    }
}

// ===== HELPER FUNCTIONS FOR LIVE DATA =====
function getCurrentDatabase() {
    return liveDataEnabled ? liveCryptoDatabase : cryptoDatabase;
}

function getCurrentCryptoById(id) {
    const db = getCurrentDatabase();
    return db.find(crypto => crypto.id === id);
}

function getCurrentOpportunities(minScore = 70) {
    const db = getCurrentDatabase();
    return db.filter(crypto => crypto.score >= minScore)
        .sort((a, b) => b.score - a.score);
}

function filterCurrentCryptos(category = 'all', mcap = 'all', minScore = 70, signal = 'all') {
    const db = getCurrentDatabase();
    let filtered = db.filter(crypto => crypto.score >= minScore);

    if (category !== 'all') {
        filtered = filtered.filter(crypto => crypto.category === category);
    }

    if (mcap !== 'all') {
        const ranges = {
            small: [50000000, 500000000],
            medium: [500000000, 5000000000],
            large: [5000000000, 50000000000],
            mega: [50000000000, Infinity]
        };
        const [min, max] = ranges[mcap];
        filtered = filtered.filter(crypto => crypto.marketCap >= min && crypto.marketCap < max);
    }

    if (signal !== 'all') {
        filtered = filtered.filter(crypto => getSignal(crypto.score) === signal);
    }

    return filtered.sort((a, b) => b.score - a.score);
}

// ===== LIVE MARKET DATA =====
async function updateLiveMarketStatus() {
    if (!liveDataEnabled) return;

    try {
        // Get global market data from CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        const data = await response.json();

        if (data && data.data) {
            const globalData = data.data;

            // Update market status
            const btcDom = globalData.market_cap_percentage.btc;
            const totalMarketCap = globalData.total_market_cap.usd;
            const totalVolume = globalData.total_volume.usd;

            document.querySelectorAll('.status-item .value')[0].textContent = btcDom.toFixed(1) + '%';
            document.querySelectorAll('.status-item .value')[1].textContent = formatNumber(totalMarketCap);
            document.querySelectorAll('.status-item .value')[2].textContent = formatNumber(totalVolume);

            console.log('✅ Updated live market status');
        }
    } catch (error) {
        console.error('❌ Error updating live market status:', error);
    }
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ===== PROGRESS BAR =====
function showProgressBar(message, percent) {
    let bar = document.getElementById('progress-bar');
    if (!bar) {
        console.warn('Progress bar element not found');
        return;
    }

    bar.innerHTML = `
        <div style="text-align: center; padding: 16px; color: white;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">${message}</div>
            <div style="width: 300px; height: 8px; background: rgba(255, 255, 255, 0.1);
                        border-radius: 4px; margin: 0 auto; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2);">
                <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #06b6d4);
                           transition: width 0.4s ease; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 8px;">${percent}%</div>
        </div>
    `;
    bar.style.display = 'block';
}

function hideProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (bar) {
        bar.style.display = 'none';
    }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== LIVE DATA DETAILS PAGE =====
async function loadLiveCryptoDetails(cryptoId) {
    if (!liveDataEnabled) return null;

    try {
        console.log(`🔄 Loading live details for ${cryptoId}...`);

        const details = await CryptoDataFetcher.fetchCryptoDetails(cryptoId);

        if (details) {
            // Update in database
            const index = liveCryptoDatabase.findIndex(c => c.id === cryptoId);
            if (index !== -1) {
                // Preserve score
                const score = liveCryptoDatabase[index].score;
                liveCryptoDatabase[index] = { ...details, score };
            }

            console.log(`✅ Loaded live details for ${cryptoId}`);
            return details;
        }

        return null;
    } catch (error) {
        console.error(`❌ Error loading live details for ${cryptoId}:`, error);
        return null;
    }
}

// ===== LIVE PRICE UPDATES =====
async function startLivePriceUpdates() {
    if (!liveDataEnabled) return;

    // Update prices every 30 seconds
    setInterval(async () => {
        if (!liveDataEnabled) return;

        try {
            // Get IDs of visible cryptos
            const visibleIds = getCurrentOpportunities(70)
                .slice(0, 20)
                .map(c => c.id)
                .join(',');

            if (!visibleIds) return;

            // Fetch updated prices
            const marketData = await CoinGeckoAPI.getMarketData(visibleIds, 20);

            if (marketData) {
                // Update prices in database
                marketData.forEach(coin => {
                    const index = liveCryptoDatabase.findIndex(c => c.id === coin.id);
                    if (index !== -1) {
                        liveCryptoDatabase[index].price = coin.current_price;
                        liveCryptoDatabase[index].priceChange24h = coin.price_change_percentage_24h || 0;
                        liveCryptoDatabase[index].volume24h = coin.total_volume;
                        liveCryptoDatabase[index].marketCap = coin.market_cap;
                    }
                });

                // Refresh display
                if (currentPage === 'scanner') {
                    updateOpportunitiesTable();
                }

                console.log('✅ Updated live prices');
            }
        } catch (error) {
            console.error('❌ Error updating live prices:', error);
        }
    }, 30000);
}

// ===== DEFI TVL ENRICHMENT =====
async function enrichDefiWithTVL() {
    if (!liveDataEnabled) return;

    const defiCryptos = liveCryptoDatabase.filter(c => c.category === 'defi');
    console.log(`🔄 Enriching ${defiCryptos.length} DeFi protocols with real TVL data...`);

    for (const crypto of defiCryptos) {
        const defiLlamaSlug = DEFILLAMA_SLUGS[crypto.id];
        if (defiLlamaSlug) {
            try {
                const tvlData = await DefiLlamaAPI.getProtocolTVL(defiLlamaSlug);
                if (tvlData && tvlData.tvl > 0) {
                    crypto.tvl = tvlData.tvl;
                    crypto.tvlChange1d = tvlData.change1d;
                    crypto.tvlChange7d = tvlData.change7d;

                    // Recalculate score with real TVL
                    const scoring = new CryptoScoring(crypto);
                    crypto.score = scoring.calculateTotalScore();

                    console.log(`✅ ${crypto.name}: TVL $${(tvlData.tvl / 1000000000).toFixed(2)}B`);
                }

                // Delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.warn(`⚠️ Could not fetch TVL for ${crypto.name}:`, error.message);
            }
        }
    }

    console.log('✅ DeFi TVL enrichment complete');

    // Refresh display if still on scanner page
    if (currentPage === 'scanner' && liveDataEnabled) {
        loadScannerPage();
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Add toggle button listener
    const toggleBtn = document.getElementById('toggle-live-data');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleLiveData);
    }

    // Show info about live data
    console.log(`
    ╔══════════════════════════════════════════════════╗
    ║  🚀 Crypto Dashboard with Live Data Support     ║
    ╠══════════════════════════════════════════════════╣
    ║  Click "Données Réelles" to load live data      ║
    ║                                                  ║
    ║  📡 Free APIs Used:                             ║
    ║  • CoinGecko API (prices, market data)          ║
    ║  • GitHub API (development metrics)             ║
    ║                                                  ║
    ║  ⚡ Features:                                    ║
    ║  • Real-time prices & market caps               ║
    ║  • Actual trading volumes                       ║
    ║  • Live GitHub commit counts                    ║
    ║  • Automatic caching (5min)                     ║
    ║  • Rate limit protection                        ║
    ╚══════════════════════════════════════════════════╝
    `);
});

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleLiveData,
        loadLiveData,
        getCurrentDatabase,
        getCurrentCryptoById,
        getCurrentOpportunities,
        filterCurrentCryptos,
        updateLiveMarketStatus,
        loadLiveCryptoDetails,
        startLivePriceUpdates
    };
}
