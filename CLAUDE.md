# CLAUDE.md - Mémoire Centrale du Projet

## Vue d'ensemble du projet

**Crypto Fundamental Analysis Dashboard** - Plateforme d'analyse fondamentale et technique de cryptomonnaies avec intégration de méthodologies de trading avancées.

### Objectifs principaux
1. **Analyse fondamentale** : Scoring à 100 points multi-critères (valuation, growth, dev, on-chain)
2. **Portfolio tracking** : Gestion de positions avec P&L temps réel
3. **Risk management** : VaR, position sizing, stress testing
4. **Trading avancé** : Intégration progressive de Order Flow, SMC, Arbitrage, Options, On-chain analytics

### Schéma d'architecture actuelle

```
┌─────────────────────────────────────────────────────────────┐
│                    INDEX.HTML (UI Layer)                     │
│  [Scanner] [Analyse] [Portfolio] [Signaux] [Risk Mgmt]      │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────────┐
│                     APP.JS (Controller)                      │
│  - Navigation & State Management                            │
│  - Watchlist/Favorites (localStorage)                       │
│  - Portfolio Tracking & P&L Calculator                      │
│  - Export (CSV/JSON)                                        │
│  - Theme Management                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
┌───────▼────┐ ┌──▼──────┐ ┌─▼────────┐ ┌▼─────────────┐
│  API.JS    │ │SCORING.JS│ │CHARTS.JS │ │APP-LIVE.JS  │
│ ──────────│ │──────────│ │──────────│ │─────────────│
│ CoinGecko  │ │100-point │ │Chart.js  │ │Live/Mock    │
│ GitHub     │ │Algorithm │ │Sparklines│ │Auto-refresh │
│ DefiLlama  │ │4 categ.  │ │RSI/SMA   │ │Notifications│
│ CryptoPanic│ │Signals   │ │Heatmaps  │ │Progress     │
│ Blockchair │ │Risk      │ └──────────┘ └─────────────┘
└────────────┘ └──────────┘
                   │
            ┌──────▼──────┐
            │   DATA.JS   │
            │ Mock/Sample │
            └─────────────┘
```

---

## Modules principaux

### 1. Ingestion & Data Layer
- **Actuellement** : API.js (CoinGecko, GitHub, DefiLlama, CryptoPanic, Blockchair)
- **À venir** :
  - Order Flow WebSocket (Binance, Bybit)
  - On-chain data streaming (Etherscan, blockchain nodes)
  - Options data (Deribit, OKX)
  - Funding rates multi-exchanges

### 2. Signaux & Analyse
- **Actuellement** : scoring.js (100 points), RSI/SMA basiques
- **À venir** :
  - Order Flow : CVD, Footprint, Delta analysis
  - Smart Money Concepts : BOS, CHoCH, Order Blocks, Fair Value Gaps
  - Technical indicators avancés : Volume Profile, Market Profile
  - Sentiment on-chain : whale movements, dormant coins

### 3. Stratégies de Trading
- **Actuellement** : Signals basiques (STRONG BUY → SELL)
- **À venir** :
  - Arbitrage funding rate (spot + perps)
  - Statistical arbitrage (pair trading)
  - Options strategies (straddle, strangle, gamma squeeze detection)
  - Mean reversion, momentum

### 4. Backtesting & Exécution
- **Actuellement** : N/A
- **À venir** :
  - Backtesting engine (vectorized avec Pandas-like JS lib)
  - Paper trading mode
  - Ordre management system (OMS)
  - Smart execution (TWAP, VWAP, iceberg)

### 5. Gestion des risques
- **Actuellement** : VaR 95%, position sizing, stress testing
- **À venir** :
  - Greeks portfolio (pour options)
  - Correlation matrices temps réel
  - Drawdown tracking
  - Kelly criterion pour sizing

### 6. Dashboard & Rapports
- **Actuellement** : 5 pages HTML, Chart.js, export CSV/JSON
- **À venir** :
  - Real-time orderflow visualization
  - Footprint charts
  - Options chain visualization
  - Performance attribution dashboard

---

## Outils & Dépendances Techniques

### Frontend (Client-side pur)
- **HTML5** + **CSS3** (CSS Variables, Flexbox, Grid)
- **JavaScript ES6+** (Vanilla, async/await, modules)
- **Chart.js 4.4.0** (visualisations)
- **localStorage** (cache persistant, portfolio, préférences)

### APIs actuelles (Free Tier)
| API | Limite | Usage |
|-----|--------|-------|
| CoinGecko | 50 req/min | Prix, market caps, historiques |
| GitHub | 60 req/h (5000 avec token) | Dev metrics |
| DefiLlama | 300 req/5min | TVL DeFi |
| CryptoPanic | 100 req/jour | Sentiment news |
| Blockchair | 30 req/min | On-chain stats |

### Futures dépendances (Trading avancé)

#### Pour Order Flow & SMC
```javascript
// Librairies WebSocket
- WebSocket API native (navigateur)
- Bibliothèques de reconnection (ex: reconnecting-websocket)

// Parsing & Storage
- Parquet-wasm (lecture/écriture parquet en browser)
- IndexedDB (stockage local volumétrique)
```

#### Pour Arbitrage & Options
```javascript
// APIs trading
- Binance API (spot + futures)
- Bybit API (derivatives)
- Deribit API (options crypto)
- OKX API (multi-produits)

// Calculs financiers
- Black-Scholes JS implementation
- Greeks calculator
- Implied volatility solver (Newton-Raphson)
```

#### Pour ML & Analytics
```javascript
// Pour phase ultérieure (si migration vers Python backend)
- TensorFlow.js (ML in-browser)
- OU transition vers Python :
  - pandas, numpy, scipy
  - scikit-learn, xgboost
  - ta-lib (technical analysis)
  - ccxt (unified exchange API)
```

---

## Standards de Code

### Conventions de nommage
- **Variables/fonctions** : `camelCase` (ex: `calculateScore`, `portfolioValue`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `MAX_SCORE`, `API_RATE_LIMIT`)
- **Classes** : `PascalCase` (ex: `PortfolioManager`, `OrderFlowAnalyzer`)
- **Fichiers** : `kebab-case.js` (ex: `order-flow.js`, `smart-money.js`)

### Organisation des modules
```
crypto/
├── index.html              # UI principale
├── styles.css              # Styles globaux
├── app.js                  # Controller principal
├── api.js                  # Clients API
├── data.js                 # Data mock/sample
├── scoring.js              # Scoring algorithms
├── charts.js               # Visualisations
├── app-live.js             # Live data management
│
├── modules/                # NOUVEAU : modules avancés
│   ├── order-flow.js       # Order Flow & CVD
│   ├── smart-money.js      # SMC (BOS, CHoCH, OB)
│   ├── arbitrage.js        # Funding rate, pair trading
│   ├── options.js          # Greeks, vol surface
│   ├── onchain.js          # Whale tracking, dormant coins
│   ├── backtest.js         # Backtesting engine
│   └── execution.js        # Order management
│
├── utils/                  # Utilitaires communs
│   ├── websocket-client.js # WebSocket wrapper
│   ├── storage.js          # IndexedDB wrapper
│   └── math.js             # Fonctions mathématiques
│
├── tests/                  # Tests unitaires
│   ├── order-flow.test.js
│   ├── smart-money.test.js
│   └── ...
│
├── docs/                   # Documentation
│   ├── README.md
│   ├── API_INTEGRATION.md
│   ├── IMPROVEMENTS.md
│   ├── SUGGESTIONS.md
│   ├── CLAUDE.md           # CE FICHIER
│   └── PLAN.md             # Roadmap
│
└── .env.example            # Template pour clés API
```

### Style de code
- **Indentation** : 2 espaces (cohérent avec code existant)
- **Quotes** : Simple quotes `'...'` (sauf JSON)
- **Semicolons** : Optionnels mais cohérents
- **Comments** : JSDoc pour fonctions publiques
- **Error handling** : try-catch systématique sur appels API
- **Async** : Préférer async/await à .then()

### Exemple de fonction documentée
```javascript
/**
 * Calcule le Cumulative Volume Delta (CVD) pour un instrument
 * @param {Array<Object>} trades - Liste des trades {price, size, side, timestamp}
 * @param {String} interval - Intervalle d'agrégation ('1m', '5m', '15m')
 * @returns {Array<Object>} CVD par interval {timestamp, cvd, delta}
 * @throws {Error} Si trades est vide ou mal formé
 */
async function calculateCVD(trades, interval = '1m') {
  if (!Array.isArray(trades) || trades.length === 0) {
    throw new Error('Trades array must be non-empty');
  }
  // ...
}
```

---

## Stratégie de Tests

### Principes
- **Tests unitaires** obligatoires pour toute nouvelle fonction critique
- **Couverture minimale** : 80% sur modules de trading/risk
- **Tests d'intégration** pour workflows complets (ex: scan → signal → sizing → ordre)
- **Mock data** pour tous les tests (pas de vraies APIs)

### Framework de test
```javascript
// Utilisation de QUnit (léger, browser-compatible)
// OU migration vers Jest si backend Node.js

// Exemple test Order Flow
QUnit.test('CVD calculation', function(assert) {
  const mockTrades = [
    { price: 50000, size: 1.5, side: 'buy', timestamp: 1000 },
    { price: 50001, size: 0.8, side: 'sell', timestamp: 1001 },
    // ...
  ];

  const cvd = calculateCVD(mockTrades, '1m');

  assert.equal(cvd.length, 1, 'Should aggregate to 1 minute');
  assert.ok(cvd[0].delta > 0, 'Net buying detected');
});
```

### Couverture actuelle
- ✅ Scoring algorithm : Manuellement testé, pas de tests automatisés
- ✅ Portfolio P&L : Logique vérifiée avec mock data
- ❌ API clients : Pas de tests unitaires (seulement intégration manuelle)
- ❌ Risk calculations : Pas de tests automatisés

### Objectifs de couverture
| Module | Cible | Actuel |
|--------|-------|--------|
| scoring.js | 90% | ~60% (manuel) |
| Portfolio | 85% | ~50% (manuel) |
| Order Flow (nouveau) | 90% | 0% |
| SMC (nouveau) | 85% | 0% |
| Arbitrage (nouveau) | 80% | 0% |

---

## Sécurité & Secrets

### Gestion des clés API

**Actuellement** : Clés en clair dans api.js (acceptable pour free tier public APIs)

**À venir** (pour APIs de trading) :
```javascript
// .env (NON VERSIONNÉ dans .gitignore)
BINANCE_API_KEY=xxx
BINANCE_API_SECRET=xxx
BYBIT_API_KEY=xxx
DERIBIT_API_KEY=xxx

// Chargement sécurisé
const config = loadEnvConfig(); // Fonction wrapper
const binanceClient = new BinanceAPI(config.BINANCE_API_KEY, config.BINANCE_API_SECRET);
```

### Principes de sécurité
1. **Rotation des clés** : Tous les 90 jours minimum
2. **Permissions minimales** : Read-only pour analyse, trade permissions seulement si paper trading
3. **IP Whitelisting** : Activer sur exchanges si possible
4. **Audit logging** : Logger toutes les actions sensibles (trades, withdrawals)
5. **Rate limiting** : Respect strict des limites API (déjà implémenté avec backoff exponentiel)
6. **HTTPS only** : Toutes les requêtes API en TLS
7. **No hardcoded secrets** : Jamais de clés en dur dans le code versionné

### Audit de sécurité
- [ ] Vérifier .gitignore pour .env
- [ ] Scanner le code pour secrets exposés (utiliser `git-secrets`)
- [ ] Review des permissions API exchanges
- [ ] Activation 2FA sur tous les comptes exchange
- [ ] Backup encrypted des clés (KeePass, 1Password)

---

## Workflow Git

### Structure des branches
```
main (ou master)
  ├── develop (branche d'intégration)
  │   ├── feature/order-flow
  │   ├── feature/smc-detection
  │   ├── feature/arbitrage-funding
  │   ├── feature/options-module
  │   └── feature/whale-alerts
  │
  └── hotfix/critical-bug (direct depuis main si urgent)
```

### Convention de nommage des branches
- `feature/order-flow-cvd` : Nouvelle fonctionnalité
- `fix/portfolio-pnl-bug` : Correction de bug
- `refactor/api-client-cleanup` : Refactoring
- `docs/update-readme` : Documentation
- `test/add-scoring-tests` : Ajout de tests

### Commits
**Format** : `type(scope): description`

Exemples :
```
feat(order-flow): add CVD calculation and visualization
fix(portfolio): correct P&L calculation for multiple positions
refactor(api): improve rate limiting with exponential backoff
docs(claude): update architecture diagram
test(smc): add unit tests for BOS detection
```

**Types** : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`

### Workflow PR (Pull Request)
1. **Créer une branche** depuis `develop`
2. **Commit atomiques** (une fonctionnalité = plusieurs petits commits)
3. **Tests passent** (manuel pour l'instant, CI à venir)
4. **Review Claude** : Utiliser `/claude review` (si disponible) ou demande de mini-review
5. **Merge** dans `develop` après validation
6. **Delete branch** après merge

### Protection de branche
- `main` : Protected, requiert PR + review
- `develop` : Semi-protected, PR recommandée

---

## Checklist d'Intégration Continue

### Avant chaque commit
- [ ] Code fonctionne localement (ouvrir index.html et tester)
- [ ] Pas d'erreurs console JavaScript
- [ ] Pas de secrets exposés
- [ ] Commentaires à jour
- [ ] Conventions de nommage respectées

### Avant chaque PR
- [ ] Tests unitaires passent (quand implémentés)
- [ ] Fonctionnalité testée manuellement end-to-end
- [ ] Documentation mise à jour (README, CLAUDE.md, PLAN.md)
- [ ] Pas de régression sur features existantes
- [ ] Code review par Claude (demander explicitement)

### Avant merge dans main
- [ ] Tous les tests passent
- [ ] Performance acceptable (pas de lag UI)
- [ ] Compatibilité navigateurs (Chrome, Firefox, Safari)
- [ ] Mobile responsive (si UI modifiée)
- [ ] Changelog mis à jour

### CI/CD futur (si backend Node.js)
```yaml
# .github/workflows/ci.yml (exemple)
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run lint
      - run: npm run build
```

---

## Règles Contextuelles pour Claude

### Format des prompts
**Préférer** :
```
USER: Implémente la détection de Break of Structure (BOS) dans le module SMC.
Inputs : OHLCV 1m array
Output : Array de {timestamp, type: 'bullish'|'bearish', price}
Tests : Mock data avec 3 BOS connus
```

**Éviter** :
```
USER: Ajoute SMC
```

### Style de réponse Claude
- **Concis** : Pas de longues explications sauf demandé
- **Actionable** : Code + tests + mini-review
- **Incrémental** : Une feature à la fois
- **Documenté** : JSDoc + commentaires inline si logique complexe

### Diff style
- Montrer `old_string` et `new_string` clairement
- Préférer Edit tool à réécriture complète de fichier
- Highlight des changements importants

### Documentation des plans (PLAN.md)
Chaque tâche doit inclure :
```markdown
## [TÂCHE] Ajouter module Order Flow

**Objectif** : Ingestion WebSocket + calcul CVD + visualisation footprint

**Fichiers touchés** :
- `modules/order-flow.js` (nouveau)
- `utils/websocket-client.js` (nouveau)
- `index.html` (ajout onglet Order Flow)
- `app.js` (routing vers page Order Flow)

**Tests** :
- Mock WebSocket avec 100 trades simulés
- Assert CVD = somme(buy volume) - somme(sell volume)
- Vérifier rendu footprint chart

**Critères de validation** :
- [ ] WebSocket se connecte et reçoit données
- [ ] CVD calculé correctement (test unitaire)
- [ ] Footprint chart s'affiche sans erreur
- [ ] Pas de memory leak (disconnect propre)

**Rollback** : Supprimer `modules/order-flow.js` et revert changes in app.js
```

---

## État actuel du projet

### ✅ Implémenté (Phases 1-3 partielles)
- [x] Scanner avec scoring 100 points
- [x] Analyse détaillée par crypto
- [x] Portfolio tracking + P&L temps réel
- [x] Risk management (VaR, position sizing, stress tests)
- [x] Signaux & Alertes (config, historique)
- [x] Indicateurs techniques basiques (RSI, SMA)
- [x] Multi-API (CoinGecko, GitHub, DefiLlama, CryptoPanic, Blockchair)
- [x] Cache intelligent (localStorage + memory)
- [x] Export CSV/JSON
- [x] Watchlist/Favorites
- [x] Dark/Light theme
- [x] Auto-refresh

### 🚧 En cours (selon SUGGESTIONS.md)
- [ ] Corrélation heatmap (structure existe, data à implémenter)
- [ ] Notifications push (alertes configurées mais pas envoyées)

### 📋 Roadmap (selon guide d'intégration avancée)

#### Phase 4 : Order Flow & Market Microstructure
- [ ] Ingestion WebSocket order book/trades
- [ ] Cumulative Volume Delta (CVD)
- [ ] Footprint chart visualization
- [ ] Delta analysis (bid/ask imbalance)
- [ ] Volume Profile (POC, VAH, VAL)

#### Phase 5 : Smart Money Concepts (SMC)
- [ ] Break of Structure (BOS) detection
- [ ] Change of Character (CHoCH) detection
- [ ] Order Block identification
- [ ] Fair Value Gap (FVG) detection
- [ ] Liquidity zones mapping

#### Phase 6 : Arbitrage
- [ ] Funding rate monitoring multi-exchanges
- [ ] Spot-Perp arbitrage calculator
- [ ] Pair trading (correlation-based)
- [ ] Cross-exchange arbitrage (avec fees)

#### Phase 7 : Options & Derivatives
- [ ] Options data ingestion (Deribit/OKX)
- [ ] Black-Scholes pricing
- [ ] Greeks calculation (Delta, Gamma, Theta, Vega)
- [ ] IV surface visualization
- [ ] Straddle/Strangle scanner
- [ ] Gamma squeeze detection

#### Phase 8 : On-Chain Analytics Avancée
- [ ] Whale wallet tracking (>$500K moves)
- [ ] Exchange flow analysis (inflow/outflow)
- [ ] Dormant coin detection (coins non bougés >1 an)
- [ ] SOPR (Spent Output Profit Ratio)
- [ ] MVRV Z-Score (plus précis)

#### Phase 9 : Machine Learning
- [ ] Price prediction (LSTM/Transformer)
- [ ] Anomaly detection (Isolation Forest)
- [ ] Clustering cryptos (K-means par comportement)
- [ ] Sentiment analysis NLP sur news

#### Phase 10 : Backtesting & Exécution
- [ ] Backtesting engine vectorisé
- [ ] Paper trading mode
- [ ] Order Management System (OMS)
- [ ] TWAP/VWAP execution
- [ ] Smart order routing

---

## Prochaines étapes (selon PLAN.md)

Voir **PLAN.md** pour la roadmap détaillée et incrémentale.

**Priorité immédiate** : Créer PLAN.md avec première tâche (Order Flow ou SMC selon choix utilisateur).

---

## Contacts & Ressources

### Documentation externe
- [CoinGecko API](https://www.coingecko.com/en/api)
- [Binance WebSocket](https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams)
- [Chart.js Docs](https://www.chartjs.org/docs/latest/)
- [Order Flow Trading](https://www.orderflows.com/education/)
- [Smart Money Concepts](https://www.babypips.com/learn/forex/smart-money-concepts)

### Support
- **Issues** : GitHub repo (si configuré)
- **Claude Code** : `/help` dans CLI

---

## Changelog

| Date | Version | Changements |
|------|---------|-------------|
| 2025-11-10 | 0.1.0 | Création CLAUDE.md initial, documentation architecture existante |

---

## Licence

MIT License - Voir README.md pour détails complets.

---

**Dernière mise à jour** : 2025-11-10
**Maintenu par** : Claude Code Agent
**Statut** : 🟢 Active Development
