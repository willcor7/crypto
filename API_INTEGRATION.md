# 🔌 Intégration des APIs Gratuites

Ce document explique comment le dashboard utilise des **APIs gratuites** pour obtenir des données en temps réel.

## 🎯 APIs Gratuites Utilisées

### 1. CoinGecko API (Principale)

**URL**: https://api.coingecko.com/api/v3
**Rate Limit**: 50 requêtes/minute (tier gratuit)
**Clé API**: Non requise ✅

**Données fournies**:
- Prix en temps réel (BTC, ETH, et 100+ cryptos)
- Market cap et volume 24h
- Performance prix (24h, 7j, 30j)
- Supply en circulation
- Données historiques (jusqu'à 90 jours)
- Sparklines pour les graphiques miniatures

**Endpoints utilisés**:
```
GET /coins/markets - Liste des cryptos avec données de marché
GET /coins/{id} - Détails complets d'une crypto
GET /coins/{id}/market_chart - Historique de prix
GET /search/trending - Cryptos trending
GET /global - Données globales du marché
```

### 2. GitHub API

**URL**: https://api.github.com
**Rate Limit**: 60 requêtes/heure (sans authentification)
**Clé API**: Non requise ✅

**Données fournies**:
- Nombre de commits (90 derniers jours)
- Nombre de contributeurs
- Stars, forks, watchers
- Date de dernière mise à jour
- Langage principal

**Endpoints utilisés**:
```
GET /repos/{owner}/{repo} - Infos du repository
GET /repos/{owner}/{repo}/commits - Liste des commits
GET /repos/{owner}/{repo}/contributors - Liste des contributeurs
```

### 3. CoinCap API (Alternative/Backup)

**URL**: https://api.coincap.io/v2
**Rate Limit**: 200 requêtes/minute
**Clé API**: Non requise ✅

**Utilisation**: Backup pour certaines données si CoinGecko atteint sa limite.

## 🚀 Utilisation

### Activation des Données Réelles

1. Ouvrez le dashboard dans votre navigateur
2. Cliquez sur le bouton **"Données Réelles"** dans l'en-tête
3. Attendez que les données se chargent (5-10 secondes)
4. Le bouton devient vert ✅ "Données Live"

### Ce qui se passe en arrière-plan

```javascript
// 1. Fetch top 100 cryptos from CoinGecko
const cryptos = await CoinGeckoAPI.getMarketData(null, 100);

// 2. Transform data to internal format
const transformed = cryptos.map(coin =>
    DataTransformer.transformCoinGeckoToCrypto(coin)
);

// 3. Calculate scores for each crypto
transformed.forEach(crypto => {
    const scoring = new CryptoScoring(crypto);
    crypto.score = scoring.calculateTotalScore();
});

// 4. Enrich with GitHub data (top 20 cryptos only)
await enrichTopCryptosWithGitHub();

// 5. Display in dashboard
updateOpportunitiesTable();
```

## 📊 Données Disponibles vs Estimées

### ✅ Données Réelles (APIs)

- Prix actuel
- Market cap
- Volume 24h
- Performance 24h/7j/30j
- Supply en circulation
- Commits GitHub (90j)
- Contributeurs GitHub
- Historique de prix

### 📈 Données Estimées (Calculées)

#### MVRV Ratio
Estimé basé sur :
- Performance prix 30 jours
- Rank de market cap
- Formule: `MVRV = 1.0 + (priceChange30d * 0.3) - (marketCapRank * 0.002)`

**Pourquoi estimé**: Les APIs gratuites ne fournissent pas cette métrique on-chain avancée. Pour des données MVRV réelles, il faudrait Glassnode ($$$).

#### Croissance des Adresses Actives
Estimée basée sur :
- Ratio Volume/Market Cap
- Performance prix
- Formule: `addressGrowth = (volumeRatio * 100) + (priceChange30d * 0.5)`

**Pourquoi estimé**: Nécessite des données on-chain qui requièrent des APIs premium (Nansen, Glassnode).

#### Accumulation par les Baleines
Estimée basée sur :
- Patterns de volume inhabituels
- Stabilité/hausse du prix
- Formule: Si `volumeRatio > 0.15 && priceChange > -5%` → Accumulation forte

**Pourquoi estimé**: Tracking des wallets de baleines disponible uniquement via Nansen ($$$).

#### TVL (Total Value Locked) pour DeFi
Estimé pour les protocoles DeFi :
- Formule: `TVL ≈ marketCap * (2-5)x multiplier`

**Pourquoi estimé**: CoinGecko ne fournit pas les TVL. DefiLlama API pourrait être ajoutée (gratuite).

## 🔧 Optimisations Implémentées

### 1. Cache Intelligent (5 minutes)

```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getFromCache(api, endpoint) {
    const cached = cache[endpoint];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data; // ✅ Pas de requête API
    }
    return null; // ❌ Cache expiré, nouvelle requête
}
```

**Avantage**: Réduit drastiquement les appels API, évite les rate limits.

### 2. Retry Logic avec Backoff Exponentiel

```javascript
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.status === 429) { // Rate limit
                const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                await sleep(waitTime);
                continue;
            }
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            await sleep(1000 * (i + 1));
        }
    }
}
```

**Avantage**: Gère automatiquement les rate limits et erreurs réseau.

### 3. Enrichissement Asynchrone GitHub

```javascript
// Load main data first (fast)
const cryptos = await fetchTopCryptos(100); // ~3 seconds
displayCryptos(cryptos); // Show immediately ✅

// Enrich with GitHub data in background (slow)
enrichWithGitHub(cryptos); // ~20 seconds
updateDisplayWhenReady(); // Update progressively
```

**Avantage**: Interface réactive, données GitHub arrivent progressivement.

### 4. Batch Requests

```javascript
// ❌ BAD: 50 separate requests
for (const crypto of cryptos) {
    await fetchDetails(crypto.id); // 50 requests
}

// ✅ GOOD: 1 batch request
const ids = cryptos.map(c => c.id).join(',');
await fetchDetails(ids); // 1 request for 50 cryptos
```

## 📈 Métriques de Performance

### Chargement Initial (Données Live)

- **Premier affichage**: 3-5 secondes
- **Données complètes**: 10-15 secondes (avec GitHub)
- **Consommation API**: ~10 requêtes CoinGecko + 20 requêtes GitHub

### Rafraîchissement Auto (30 secondes)

- **Prix uniquement**: 1-2 secondes
- **Consommation API**: 1 requête CoinGecko (cached 5 min)

### Limites Quotidiennes Estimées

Avec utilisation intensive (10 heures/jour) :
- **CoinGecko**: ~600 requêtes → ⚠️ 50/min = max 3000/heure (largement suffisant)
- **GitHub**: ~120 requêtes → ✅ 60/heure (peut être limitant si > 20 cryptos)

## 🔮 Améliorations Futures Possibles

### APIs Gratuites à Ajouter

1. **DefiLlama API** (gratuite)
   - TVL réel pour protocoles DeFi
   - Données de revenus
   - Endpoint: `https://api.llama.fi/protocol/{protocol}`

2. **Alternative.me Crypto Fear & Greed Index** (gratuite)
   - Sentiment du marché
   - Endpoint: `https://api.alternative.me/fng/`

3. **CryptoCompare API** (tier gratuit)
   - Données sociales (Reddit, Twitter)
   - News crypto
   - 100K requêtes/mois gratuites

4. **Etherscan/BSCScan APIs** (gratuites)
   - Données on-chain pour Ethereum/BSC
   - Gas prices
   - Smart contract events

### Estimations à Améliorer

#### MVRV Plus Précis
Utiliser les données de prix historiques de CoinGecko pour calculer un "realized price" approximatif :

```javascript
// Get 365 days of prices
const history = await CoinGecko.getHistoricalData(coinId, 365);

// Calculate volume-weighted average price (proxy for realized price)
const realizedPrice = calculateVWAP(history);
const mvrv = currentPrice / realizedPrice;
```

#### Address Growth Réel
Intégrer **Etherscan API** (gratuite) pour Ethereum :

```javascript
const response = await fetch(
    `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${address}`
);
// Parse real holder count growth
```

## 🛡️ Gestion des Erreurs

### Stratégies Implémentées

```javascript
// 1. Fallback to simulated data
if (!liveDataLoaded) {
    return getSimulatedData(); // Always works
}

// 2. Graceful degradation
try {
    const githubData = await fetchGitHub();
} catch (error) {
    console.warn('GitHub unavailable, using estimates');
    useEstimatedGithubData();
}

// 3. User notifications
if (apiError) {
    showNotification('❌ API temporairement indisponible', 'error');
}
```

## 💡 Conseils d'Utilisation

### Pour Éviter les Rate Limits

1. **Activez les données live uniquement quand nécessaire**
   - Les données simulées sont instantanées
   - Basculez en live pour des analyses précises

2. **Laissez le cache travailler**
   - Le cache de 5 minutes évite 90% des requêtes
   - Ne spammez pas le bouton "Actualiser"

3. **Utilisez le dashboard avec parcimonie**
   - GitHub limite à 60 req/heure sans authentification
   - ~20 cryptos max enrichis avec GitHub

### Pour Augmenter les Limites (Optionnel)

#### GitHub Personal Access Token (Gratuit)

Créez un token sur https://github.com/settings/tokens pour passer de 60 à **5000 requêtes/heure** :

```javascript
// Dans api.js, ajoutez:
const GITHUB_TOKEN = 'votre_token_ici'; // Créer sur GitHub

fetch(url, {
    headers: {
        'Authorization': `token ${GITHUB_TOKEN}`
    }
});
```

⚠️ **Attention**: Ne committez jamais le token dans le code public !

## 🎓 Ressources

- [CoinGecko API Docs](https://www.coingecko.com/en/api/documentation)
- [GitHub API Docs](https://docs.github.com/en/rest)
- [DefiLlama API Docs](https://defillama.com/docs/api)
- [Rate Limiting Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

---

**Résumé**: Le dashboard utilise uniquement des APIs 100% gratuites, avec un système de cache intelligent et des estimations pour les métriques premium. Pour un usage production avec argent réel, considérez l'ajout d'APIs payantes (Glassnode, Nansen) pour des données on-chain précises.
