/**
 * CONFIGURATION DASHBOARD
 * Modifiez ces paramètres selon vos besoins
 */

const CONFIG = {
    // ===== DATA SOURCE =====

    /**
     * USE_REAL_API_DATA
     * true : Essayer de fetcher les données réelles depuis CoinGecko
     * false : Utiliser uniquement les données simulées (pas d'appels API)
     *
     * ⚠️ IMPORTANT : Si vous avez des erreurs CORS, mettez false OU utilisez un serveur HTTP local
     * Voir START_HERE.md pour les instructions
     */
    USE_REAL_API_DATA: true,

    /**
     * FORCE_SIMULATED_DATA
     * true : Force l'utilisation de données simulées (ignore USE_REAL_API_DATA)
     * false : Comportement normal (essaie API puis fallback simulé)
     */
    FORCE_SIMULATED_DATA: true, // Activé pour éviter rate limiting CoinGecko

    // ===== CACHE =====

    /**
     * API_CACHE_DURATION_MS
     * Durée du cache pour les données API (en millisecondes)
     * Default: 30 minutes (30 * 60 * 1000)
     */
    API_CACHE_DURATION_MS: 30 * 60 * 1000,

    /**
     * SIGNALS_CACHE_DURATION_MS
     * Durée du cache pour les signaux générés (en millisecondes)
     * Default: 5 minutes (5 * 60 * 1000)
     */
    SIGNALS_CACHE_DURATION_MS: 5 * 60 * 1000,

    // ===== RATE LIMITING =====

    /**
     * API_RATE_LIMIT_DELAY_MS
     * Délai entre chaque requête API (en millisecondes)
     * CoinGecko free tier: 50 requêtes/minute → 1200ms minimum
     * Default: 1200ms
     */
    API_RATE_LIMIT_DELAY_MS: 1200,

    // ===== SIGNAL GENERATION =====

    /**
     * MINIMUM_FUNDAMENTAL_SCORE
     * Score fondamental minimum pour générer un signal
     * Default: 70 (seulement cryptos avec score ≥ 70)
     * Range: 0-100
     */
    MINIMUM_FUNDAMENTAL_SCORE: 70,

    /**
     * ACCOUNT_SIZE
     * Taille du compte pour le calcul du position sizing (en USD)
     * Default: 100000 ($100k)
     */
    ACCOUNT_SIZE: 100000,

    /**
     * MAX_RISK_PER_TRADE_PERCENT
     * Risque maximum par trade (en pourcentage du capital)
     * Default: 2 (2% du capital)
     */
    MAX_RISK_PER_TRADE_PERCENT: 2,

    // ===== UI =====

    /**
     * SHOW_MODERATE_SIGNALS
     * true : Afficher aussi les signaux MODERATE_ENTRY
     * false : Afficher uniquement STRONG_ENTRY et GOOD_ENTRY
     */
    SHOW_MODERATE_SIGNALS: true,

    /**
     * MAX_SIGNALS_DISPLAYED
     * Nombre maximum de signaux affichés
     * Default: 15
     */
    MAX_SIGNALS_DISPLAYED: 15,

    /**
     * AUTO_REFRESH_INTERVAL_MS
     * Intervalle de rafraîchissement automatique des signaux (en millisecondes)
     * Default: 30 secondes (30 * 1000)
     * Set to 0 to disable auto-refresh
     */
    AUTO_REFRESH_INTERVAL_MS: 30 * 1000,

    // ===== DEBUG =====

    /**
     * DEBUG_MODE
     * true : Affiche les logs détaillés dans la console
     * false : Logs minimaux
     */
    DEBUG_MODE: true,

    /**
     * SHOW_CORS_WARNING
     * true : Affiche un message d'avertissement si erreur CORS détectée
     * false : Pas de message (fallback silencieux)
     */
    SHOW_CORS_WARNING: true
};

// ===== VALIDATION =====
(function validateConfig() {
    if (CONFIG.MINIMUM_FUNDAMENTAL_SCORE < 0 || CONFIG.MINIMUM_FUNDAMENTAL_SCORE > 100) {
        console.warn('⚠️ MINIMUM_FUNDAMENTAL_SCORE doit être entre 0 et 100. Utilisation de 70 par défaut.');
        CONFIG.MINIMUM_FUNDAMENTAL_SCORE = 70;
    }

    if (CONFIG.MAX_RISK_PER_TRADE_PERCENT < 0.1 || CONFIG.MAX_RISK_PER_TRADE_PERCENT > 10) {
        console.warn('⚠️ MAX_RISK_PER_TRADE_PERCENT doit être entre 0.1 et 10. Utilisation de 2 par défaut.');
        CONFIG.MAX_RISK_PER_TRADE_PERCENT = 2;
    }

    if (CONFIG.ACCOUNT_SIZE < 1000) {
        console.warn('⚠️ ACCOUNT_SIZE semble faible. Minimum recommandé : $1,000.');
    }

    if (CONFIG.DEBUG_MODE) {
        console.log('📋 Configuration chargée:', CONFIG);
    }
})();

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
