# DEPENDENCIES.md - Analyse des Dépendances Techniques

## Vue d'ensemble

Ce document analyse les dépendances nécessaires pour implémenter les méthodologies de trading avancées (Phases 4-10).

---

## Dépendances Actuelles (Projet Existant)

### Frontend
```json
{
  "dependencies": {
    "chart.js": "^4.4.0"
  }
}
```

### APIs Externes (Free Tier)
- **CoinGecko** : Prix, market data, historiques
- **GitHub API** : Dev metrics
- **DefiLlama** : TVL DeFi
- **CryptoPanic** : Sentiment news
- **Blockchair** : On-chain stats

### Browser APIs
- `localStorage` : Cache persistant
- `fetch` : HTTP requests
- `WebSocket` : (Natif, pas encore utilisé)
- `IndexedDB` : (Pas encore utilisé, requis pour Phase 4)

---

## Nouvelles Dépendances Requises par Phase

### Phase 4 : Order Flow & Market Microstructure

#### WebSocket Libraries
**Option 1 : WebSocket natif** (Recommandé pour MVP)
- ✅ Natif navigateur, pas de dépendance
- ✅ Support auto-reconnect possible (implémentation custom)
- ❌ Nécessite code boilerplate pour reconnection

**Option 2 : reconnecting-websocket**
```javascript
// Via CDN (pas de npm requis)
<script src="https://cdn.jsdelivr.net/npm/reconnecting-websocket@4.4.0/dist/reconnecting-websocket-min.js"></script>
```
- ✅ Auto-reconnect avec exponential backoff
- ✅ API compatible WebSocket natif
- ❌ Dépendance externe (~4KB)

**Recommandation** : **WebSocket natif** avec wrapper custom (contrôle total, 0 dépendance)

---

#### IndexedDB Wrapper
**Option 1 : IndexedDB natif**
- ✅ Natif navigateur
- ❌ API complexe (callbacks, transactions)

**Option 2 : idb (Jake Archibald)**
```javascript
// Via CDN
<script src="https://cdn.jsdelivr.net/npm/idb@7.1.1/build/umd.js"></script>
```
- ✅ API Promise-based simple
- ✅ Très léger (~1.5KB gzipped)
- ✅ Maintenance active

**Recommandation** : **idb library** (gain productivité énorme, taille négligeable)

---

#### Parquet Storage (Optionnel)
**Option : parquet-wasm**
```javascript
// Via CDN
<script src="https://cdn.jsdelivr.net/npm/parquet-wasm@0.5.0/dist/parquet_wasm.js"></script>
```
- ✅ Lecture/écriture Parquet in-browser
- ✅ Compression efficace pour gros volumes
- ❌ ~500KB (wasm), overhead initial
- ❌ Complexité supplémentaire

**Recommandation** : **Pas nécessaire pour MVP**, utiliser IndexedDB raw. Considérer plus tard si volumes >100MB.

---

### Phase 5 : Smart Money Concepts (SMC)

**Pas de nouvelles dépendances** - Utilise données OHLCV existantes et logique algorithmique pure.

**Dépendances partagées** :
- Chart.js (déjà présent) pour annotations BOS/CHoCH/OB/FVG
- `utils/math.js` (custom) pour détection swings, zigzag

---

### Phase 6 : Arbitrage

#### Multi-Exchange APIs

**APIs requises** :
1. **Binance Futures API** (funding rates)
   - REST : `https://fapi.binance.com`
   - WebSocket : `wss://fstream.binance.com/ws`
   - Rate limit : 2400 req/min (Weight system)

2. **Bybit API** (funding rates, prix)
   - REST : `https://api.bybit.com`
   - WebSocket : `wss://stream.bybit.com`
   - Rate limit : 120 req/min

3. **OKX API** (options data, funding)
   - REST : `https://www.okx.com/api/v5`
   - WebSocket : `wss://ws.okx.com:8443/ws/v5/public`
   - Rate limit : 20 req/2s

4. **Coinbase API** (prix spot)
   - REST : `https://api.coinbase.com/v2`
   - Rate limit : 10 req/s

**Implémentation** :
- Ajouter clients API dans `api.js` (pattern existant)
- Pas de library externe (utiliser `fetch` natif)
- Rate limiting avec queue (pattern déjà présent dans api.js)

**Recommandation** : **fetch natif + rate limiter custom** (cohérent avec code existant)

---

#### Statistical Functions

**Requis pour pair trading** :
- Correlation (Pearson)
- Z-score
- Mean, Std deviation
- Covariance

**Option 1 : Implementation custom** dans `utils/math.js`
- ✅ Contrôle total
- ✅ Pas de dépendance
- ❌ Effort initial (50-100 lignes)

**Option 2 : simple-statistics**
```javascript
<script src="https://cdn.jsdelivr.net/npm/simple-statistics@7.8.3/dist/simple-statistics.min.js"></script>
```
- ✅ Fonctions statistiques complètes
- ✅ Bien testé
- ❌ ~20KB, potentiellement overkill

**Recommandation** : **Custom implementation** (fonctions simples, educational)

---

### Phase 7 : Options & Derivatives

#### Black-Scholes & Greeks

**Option 1 : Implementation custom**
- ✅ Contrôle total, educational
- ❌ Complexité mathématique (cumulative normal distribution)

**Option 2 : black-scholes library**
```javascript
<script src="https://cdn.jsdelivr.net/npm/black-scholes@1.1.0/dist/black-scholes.min.js"></script>
```
- ✅ Testé, précis
- ✅ Léger (~3KB)
- ✅ Calcul Greeks inclus

**Recommandation** : **black-scholes library** (évite erreurs mathématiques)

---

#### Implied Volatility Solver

**Requis** : Newton-Raphson ou autre méthode numérique

**Option 1 : Implementation custom**
```javascript
// Newton-Raphson pour IV
function solveImpliedVolatility(optionPrice, S, K, T, r, type) {
  let sigma = 0.5; // Initial guess
  for (let i = 0; i < 100; i++) {
    const price = blackScholes(S, K, T, r, sigma, type);
    const vega = calculateVega(S, K, T, r, sigma);
    const diff = price - optionPrice;
    if (Math.abs(diff) < 0.001) return sigma;
    sigma -= diff / vega;
  }
  return sigma;
}
```
- ✅ Pas de dépendance
- ⚠️ Convergence à tester

**Recommandation** : **Custom implementation** (algorithm simple, 30 lignes)

---

### Phase 8 : On-Chain Analytics Avancée

#### Blockchain APIs

**APIs requises** :

1. **Etherscan API** (Ethereum on-chain)
   - REST : `https://api.etherscan.io/api`
   - Rate limit : 5 req/s (free), 100/s (pro)
   - Usage : Whale tracking, exchange flows

2. **Blockchain.com API** (Bitcoin on-chain)
   - REST : `https://blockchain.info/`
   - Rate limit : Variable
   - Usage : SOPR, dormant coins

3. **Glassnode API** (Metrics on-chain premium)
   - REST : `https://api.glassnode.com/v1`
   - ❌ Paid tiers only (skip pour MVP)

4. **Alternative : QuickNode** (Multi-chain nodes)
   - WebSocket + REST
   - Free tier : 50M credits/month
   - Usage : Direct blockchain access

**Recommandation** : **Etherscan + Blockchain.com** (free tiers suffisants pour MVP)

---

#### Big Number Handling

**Problème** : JavaScript `Number` limité à 2^53-1, insuffisant pour wei (1e18)

**Option 1 : BigInt natif**
```javascript
const wei = BigInt("1000000000000000000"); // 1 ETH
const eth = Number(wei) / 1e18;
```
- ✅ Natif ES2020
- ✅ Support arithmétique
- ❌ Pas de division décimale (conversion Number requise)

**Option 2 : bignumber.js**
```javascript
<script src="https://cdn.jsdelivr.net/npm/bignumber.js@9.1.2/bignumber.min.js"></script>
```
- ✅ Arithmétique décimale précise
- ❌ ~10KB

**Recommandation** : **BigInt natif** (suffisant pour conversions simples)

---

### Phase 9 : Machine Learning

⚠️ **ATTENTION** : Phase 9 peut nécessiter migration backend Python ou utilisation TensorFlow.js

#### Option A : TensorFlow.js (In-Browser)

```javascript
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.13.0/dist/tf.min.js"></script>
```

**Capabilities** :
- ✅ LSTM, GRU, CNN, Transformer
- ✅ Training in-browser
- ✅ Pre-trained models

**Limitations** :
- ❌ Performance (CPU/GPU browser limité vs GPU server)
- ❌ Taille bundle (~500KB)
- ❌ RAM browser limitée (gros datasets problématiques)

**Use cases viables** :
- Price prediction (LSTM sur derniers 100 points)
- Anomaly detection (simple autoencoders)
- Clustering (K-means, ~1000 points)

---

#### Option B : Backend Python (Recommandé pour ML sérieux)

**Architecture** :
```
Frontend (JS) ↔ REST API ↔ Backend Python (Flask/FastAPI)
                                    ↓
                            ML Models (scikit, TensorFlow, PyTorch)
```

**Stack Python** :
```python
# requirements.txt
pandas==2.1.0
numpy==1.25.0
scikit-learn==1.3.0
tensorflow==2.14.0  # ou pytorch
xgboost==2.0.0
ta-lib==0.4.28  # Technical analysis
ccxt==4.1.0  # Unified exchange API
```

**Avantages** :
- ✅ Performance GPU serveur
- ✅ Ecosystem ML mature (scikit, PyTorch)
- ✅ Gros datasets possibles
- ✅ Scheduled tasks (cron)

**Inconvénients** :
- ❌ Infrastructure serveur requise
- ❌ Coûts hébergement
- ❌ Complexité déploiement

**Recommandation** :
- **MVP** : TensorFlow.js pour démos simples
- **Production** : Backend Python si ML critique

---

### Phase 10 : Backtesting & Execution

#### Backtesting Engine

**Option 1 : Implementation custom (vectorized)**
```javascript
// Utiliser Array.map/reduce pour vectorization
function backtest(strategy, ohlcv) {
  const signals = ohlcv.map(candle => strategy.generateSignal(candle));
  const positions = signals.map((signal, i) => executeTrade(signal, ohlcv[i]));
  const equity = positions.reduce((acc, pos) => acc + pos.pnl, initial_capital);
  return { equity, trades: positions, sharpe: calculateSharpe(positions) };
}
```
- ✅ Pas de dépendance
- ⚠️ Performance limitée (JavaScript single-threaded)

**Option 2 : Web Workers (parallélisation)**
```javascript
// Main thread
const worker = new Worker('backtest-worker.js');
worker.postMessage({ strategy, data });
worker.onmessage = (e) => console.log('Results:', e.data);

// backtest-worker.js
self.onmessage = (e) => {
  const results = runBacktest(e.data.strategy, e.data.data);
  self.postMessage(results);
};
```
- ✅ Parallélisation (utilise multi-cores)
- ✅ UI non bloquée
- ⚠️ Complexité sérialisation

**Recommandation** : **Custom vectorized + Web Workers** pour backtests longs

---

#### Order Management System (OMS)

**APIs Trading requises** :

1. **Binance Spot/Futures Trading**
   - Authentification : HMAC SHA256
   - Endpoints : POST /api/v3/order, GET /api/v3/order
   - Testnet : https://testnet.binance.vision

2. **Paper Trading Mode**
   - Simulation locale (pas de vraies orders)
   - State management : positions, orders, fills
   - Slippage simulation

**Recommandation** : **Commencer par Paper Trading** (0 risque, test stratégies)

---

## Résumé des Dépendances Recommandées

### Phase 4 : Order Flow
```html
<!-- IndexedDB wrapper -->
<script src="https://cdn.jsdelivr.net/npm/idb@7.1.1/build/umd.js"></script>
```
**Total** : ~1.5KB

---

### Phase 5 : SMC
**Aucune dépendance externe** (logique pure)

---

### Phase 6 : Arbitrage
**Aucune dépendance externe** (APIs natives + custom math)

---

### Phase 7 : Options
```html
<!-- Black-Scholes & Greeks -->
<script src="https://cdn.jsdelivr.net/npm/black-scholes@1.1.0/dist/black-scholes.min.js"></script>
```
**Total** : ~3KB

---

### Phase 8 : On-Chain
**Aucune dépendance externe** (BigInt natif + APIs)

---

### Phase 9 : ML (MVP)
```html
<!-- TensorFlow.js -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.13.0/dist/tf.min.js"></script>
```
**Total** : ~500KB (⚠️ lourd)

**Alternative** : Backend Python (infrastructure requise)

---

### Phase 10 : Backtesting
**Aucune dépendance externe** (custom engine + Web Workers natifs)

---

## Taille Bundle Totale

| Dépendance | Taille | Critique | Phase |
|------------|--------|----------|-------|
| Chart.js (existant) | ~200KB | ✅ Oui | 1-3 |
| idb | 1.5KB | ✅ Oui | 4 |
| black-scholes | 3KB | ⚠️ Optionnel | 7 |
| TensorFlow.js | 500KB | ⚠️ Optionnel | 9 |
| **TOTAL** | **~705KB** | | |

**Impact** :
- ✅ Acceptable pour app moderne (sans TensorFlow.js : ~205KB)
- ✅ Toutes librairies via CDN (pas de build step)
- ⚠️ TensorFlow.js ajoute 500KB → lazy load si Phase 9 activée

---

## Stratégie de Chargement

### Lazy Loading par Phase
```javascript
// app.js
async function loadPhase(phaseNumber) {
  switch(phaseNumber) {
    case 4: // Order Flow
      await loadScript('https://cdn.jsdelivr.net/npm/idb@7.1.1/build/umd.js');
      break;
    case 7: // Options
      await loadScript('https://cdn.jsdelivr.net/npm/black-scholes@1.1.0/dist/black-scholes.min.js');
      break;
    case 9: // ML
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.13.0/dist/tf.min.js');
      break;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
```

**Avantages** :
- ✅ Bundle initial léger (~200KB)
- ✅ Chargement à la demande
- ✅ Améliore Time to Interactive (TTI)

---

## APIs Rate Limits - Récapitulatif

| API | Rate Limit | Usage Phase | Stratégie |
|-----|------------|-------------|-----------|
| CoinGecko | 50 req/min | 1-3 (existant) | Cache 5min ✅ |
| Binance WS | Unlimited (streams) | 4 (Order Flow) | WebSocket ✅ |
| Binance REST | 2400 req/min | 6 (Arbitrage) | Queue + backoff |
| Bybit | 120 req/min | 6 (Arbitrage) | Cache 1min |
| OKX | 20 req/2s | 7 (Options) | Queue strict |
| Etherscan | 5 req/s (free) | 8 (On-chain) | Cache 10min |
| Blockchain.com | Variable | 8 (On-chain) | Backoff aggressive |

**Stratégie globale** :
- ✅ WebSocket préférable au polling REST
- ✅ Cache agressif (localStorage + memory)
- ✅ Rate limiter avec queue et exponential backoff (déjà implémenté dans api.js)

---

## Sécurité des Dépendances

### Vérification Intégrité (Subresource Integrity)

```html
<!-- Exemple avec Chart.js -->
<script
  src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
```

**Recommandation** : Ajouter SRI hashes pour toutes les librairies CDN

### Audit des Dépendances

**Outils** :
- `npm audit` (si migration vers npm/webpack)
- Snyk (scanning de vulnérabilités)
- Dependabot (GitHub, auto-updates)

**Fréquence** : Trimestrielle (tous les 3 mois)

---

## Migration vers Build System (Optionnel)

**Actuellement** : Aucun build, tout en CDN

**Si croissance du projet** :

### Option : Vite + NPM
```bash
npm init vite@latest crypto-dashboard --template vanilla
npm install chart.js idb black-scholes
```

**Avantages** :
- ✅ Tree shaking (bundle optimisé)
- ✅ Hot Module Replacement (HMR)
- ✅ TypeScript support
- ✅ Minification automatique

**Inconvénients** :
- ❌ Complexité build
- ❌ Pas de déploiement simple (nécessite npm build)

**Recommandation** : **Garder CDN pour MVP**, migrer vers Vite si projet scale >10 modules

---

## Checklist de Validation des Dépendances

Avant d'ajouter une dépendance :

- [ ] **Nécessité** : Fonctionnalité non implémentable facilement en custom ?
- [ ] **Taille** : <50KB ? (Sauf justification forte)
- [ ] **Maintenance** : Dernière release <1 an ?
- [ ] **Sécurité** : Pas de CVE connues ?
- [ ] **Licence** : MIT/Apache/BSD (compatible projet) ?
- [ ] **Bundle impact** : Acceptable avec lazy loading ?

---

**Dernière mise à jour** : 2025-11-10
**Maintenu par** : Claude Code Agent
