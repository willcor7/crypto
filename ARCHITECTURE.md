# ARCHITECTURE.md - Architecture Modulaire des Features Avancées

## Vue d'ensemble

Ce document décrit l'architecture détaillée des modules de trading avancés (Phases 4-10) et leur intégration avec le système existant.

---

## Principes d'Architecture

### 1. Séparation des Responsabilités
- **Data Layer** : Ingestion et stockage (WebSocket, IndexedDB)
- **Logic Layer** : Algorithmes et calculs (CVD, SMC, arbitrage)
- **Presentation Layer** : UI et visualisations (Chart.js, tables)
- **API Layer** : Communication avec exchanges et services externes

### 2. Modularité
- Chaque feature dans un module séparé (`modules/`)
- Dépendances explicites et minimales
- Réutilisabilité du code (utilitaires dans `utils/`)

### 3. Scalabilité
- Architecture event-driven (WebSocket → Events → Handlers)
- Cache multi-niveaux (Memory → localStorage → IndexedDB)
- Lazy loading des modules lourds

### 4. Testabilité
- Fonctions pure (input → output, pas d'effets de bord)
- Mock data systématique pour tests
- Injection de dépendances (API clients passés en paramètres)

---

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         INDEX.HTML (UI)                         │
│  [Scanner] [Analyse] [Portfolio] [Signaux] [Risk] [OrderFlow]  │
│  [SMC] [Arbitrage] [Options] [OnChain] [Backtest]              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                      APP.JS (Controller)                        │
│  - Router (pages)                                               │
│  - State Management                                             │
│  - Module Initialization                                        │
│  - Event Coordination                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
┌───────▼───────┐ ┌───▼────────┐ ┌───▼────────┐ ┌───▼─────────┐
│   MODULES/    │ │   UTILS/   │ │   API.JS   │ │ CHARTS.JS   │
│ ─────────────│ │ ──────────│ │ ──────────│ │ ────────────│
│ order-flow.js │ │ websocket- │ │ CoinGecko  │ │ Chart.js    │
│ smart-money.js│ │ client.js  │ │ Binance    │ │ Wrappers    │
│ arbitrage.js  │ │ storage.js │ │ Bybit      │ │ Custom      │
│ options.js    │ │ math.js    │ │ Etherscan  │ │ Charts      │
│ onchain.js    │ │ events.js  │ │ ...        │ └─────────────┘
│ backtest.js   │ └────────────┘ └────────────┘
│ execution.js  │
└───────┬───────┘
        │
┌───────▼──────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ IndexedDB  │  │ localStorage │  │ Memory Cache     │    │
│  │ (Trades,   │  │ (Preferences,│  │ (API responses)  │    │
│  │  OrderBook)│  │  Portfolio)  │  │                  │    │
│  └────────────┘  └──────────────┘  └──────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Détail des Modules

### modules/order-flow.js

**Responsabilités** :
- Connexion WebSocket aux exchanges (trades, order book)
- Stockage temps réel dans IndexedDB
- Calculs Order Flow (CVD, Delta, Volume Profile)
- Génération Footprint chart data

**API publique** :
```javascript
class OrderFlowManager {
  constructor(exchangeConfig);

  // Connection lifecycle
  async connect(symbols);
  disconnect();

  // Data access
  async getTrades(symbol, startTime, endTime);
  async getOrderBookSnapshot(symbol);

  // Indicators
  calculateCVD(trades, interval = '1m');
  calculateVolumeProfile(trades, priceStep);
  generateFootprint(trades, priceStep, timeInterval);

  // Events
  on(event, callback); // 'trade', 'depth', 'cvd_update'
}
```

**Architecture interne** :
```
OrderFlowManager
  ├── WebSocketClient (utils/websocket-client.js)
  │   ├── Auto-reconnect
  │   ├── Subscription management
  │   └── Heartbeat
  │
  ├── TradeProcessor
  │   ├── Parse raw messages
  │   ├── Normalize format
  │   └── Batch writes (1min)
  │
  ├── OrderBookManager
  │   ├── Maintain local book state
  │   ├── Apply deltas
  │   └── Snapshot storage
  │
  └── IndicatorCalculator
      ├── CVD algorithm
      ├── Volume Profile (POC, VAH, VAL)
      └── Footprint generator
```

**Dépendances** :
- `utils/websocket-client.js`
- `utils/storage.js` (IndexedDB wrapper)
- `utils/events.js` (EventEmitter)

**Tests clés** :
- Mock WebSocket → assert trades sauvegardés
- CVD calculation : 60% buy → CVD > 0
- Volume Profile : POC = max volume bin

---

### modules/smart-money.js

**Responsabilités** :
- Détection structures SMC (BOS, CHoCH, OB, FVG)
- Mapping liquidity zones
- Signaux trading basés sur SMC

**API publique** :
```javascript
class SmartMoneyAnalyzer {
  constructor(ohlcvData);

  // Structure detection
  detectBOS(lookback = 50);
  detectCHoCH(bosData);
  identifyOrderBlocks(bosData);
  detectFVG();
  mapLiquidityZones(lookback = 100);

  // Signals
  generateSignals(); // Combine tous les indicateurs

  // Chart annotations
  getAnnotations(); // Pour Chart.js plugins
}
```

**Architecture interne** :
```
SmartMoneyAnalyzer
  ├── SwingDetector
  │   ├── Zigzag algorithm (2-3% threshold)
  │   ├── Swing high/low identification
  │   └── Caching (éviter recalcul)
  │
  ├── BOS_Detector
  │   ├── Compare prix vs swing high/low
  │   ├── Confidence scoring
  │   └── Bullish/Bearish classification
  │
  ├── CHoCH_Detector
  │   ├── Analyze BOS sequence
  │   └── Reversal identification
  │
  ├── OrderBlock_Identifier
  │   ├── Last opposite candle before BOS
  │   ├── Zone calculation [low, high]
  │   └── Tested/untested filter
  │
  ├── FVG_Detector
  │   ├── 3-candle gap detection
  │   ├── Filled status tracking
  │   └── Bullish/Bearish classification
  │
  └── Liquidity_Mapper
      ├── Swing detection
      ├── Volume scoring
      ├── Round number bonus
      └── Zone ranking
```

**Dépendances** :
- `utils/math.js` (zigzag, statistics)
- `charts.js` (annotations)

**Tests clés** :
- Mock OHLCV → 3 BOS détectés
- CHoCH après série BOS
- Order Block = dernière bougie opposée

---

### modules/arbitrage.js

**Responsabilités** :
- Monitoring funding rates multi-exchanges
- Détection opportunités spot-perp arbitrage
- Cross-exchange arbitrage scanner
- Pair trading (correlation-based)

**API publique** :
```javascript
class ArbitrageScanner {
  constructor(apiClients);

  // Funding rate arbitrage
  async monitorFundingRates(symbols);
  calculateSpotPerpArbitrage(symbol, fundingRate, size);

  // Cross-exchange
  async scanCrossExchangeArbitrage(symbols);

  // Pair trading
  async findPairTradingOpportunities(cryptos, lookback = 30);

  // Alerts
  on(event, callback); // 'funding_opportunity', 'cross_exchange_arb', 'pair_signal'
}
```

**Architecture interne** :
```
ArbitrageScanner
  ├── FundingRateMonitor
  │   ├── Multi-exchange polling (1h interval)
  │   ├── APY calculation
  │   ├── Alert threshold (>20%)
  │   └── Historical tracking
  │
  ├── SpotPerpCalculator
  │   ├── P&L estimation
  │   ├── Fees inclusion (spot + perp)
  │   ├── Slippage modeling
  │   └── Break-even calculator
  │
  ├── CrossExchangeScanner
  │   ├── Parallel price fetching
  │   ├── Spread calculation
  │   ├── Fees deduction (withdrawal + trading)
  │   └── Opportunity ranking
  │
  └── PairTradingEngine
      ├── Correlation matrix
      ├── Pair selection (r > 0.8)
      ├── Ratio calculation
      ├── Z-score computation
      └── Signal generation (|z| > 2)
```

**Dépendances** :
- `api.js` (Binance, Bybit, OKX clients)
- `utils/math.js` (correlation, z-score)
- `utils/events.js`

**Tests clés** :
- Funding 0.01% → APY = 10.95%
- Spread calc : Binance 50000, Coinbase 50500 → 1%
- Correlation : r > 0.8 → pair détecté

---

### modules/options.js

**Responsabilités** :
- Ingestion options data (Deribit, OKX)
- Black-Scholes pricing & Greeks
- IV surface construction
- Straddle/Strangle scanner
- Gamma squeeze detection

**API publique** :
```javascript
class OptionsAnalyzer {
  constructor(optionsDataProvider);

  // Pricing
  calculatePrice(S, K, T, r, sigma, type); // Black-Scholes
  calculateGreeks(S, K, T, r, sigma, type); // Delta, Gamma, Theta, Vega

  // Implied Volatility
  solveIV(optionPrice, S, K, T, r, type); // Newton-Raphson

  // Strategies
  scanStraddles(minIV, maxIV);
  scanStrangles(minIV, maxIV);

  // Market analysis
  constructIVSurface(options);
  detectGammaSqueeze();
}
```

**Architecture interne** :
```
OptionsAnalyzer
  ├── BlackScholesEngine
  │   ├── Pricing formula
  │   ├── Cumulative normal distribution
  │   └── Greeks calculation
  │
  ├── IVSolver
  │   ├── Newton-Raphson method
  │   ├── Initial guess optimization
  │   └── Convergence validation
  │
  ├── StrategyScanner
  │   ├── Straddle finder (ATM calls + puts)
  │   ├── Strangle finder (OTM calls + puts)
  │   ├── P&L calculator
  │   └── Risk/reward ratio
  │
  ├── IVSurfaceBuilder
  │   ├── Group by expiry & strike
  │   ├── 3D surface interpolation
  │   └── Skew detection
  │
  └── GammaSqueezeDetector
      ├── Open Interest analysis
      ├── Dealer gamma exposure
      ├── Pin risk calculation
      └── Alert threshold
```

**Dépendances** :
- `black-scholes` library (CDN)
- `api.js` (Deribit, OKX clients)
- `charts.js` (3D surface chart)

**Tests clés** :
- Black-Scholes : Known values → assert price
- IV solve : Given price → recover sigma
- Gamma squeeze : High OI → alert

---

### modules/onchain.js

**Responsabilités** :
- Whale wallet tracking (>$500K moves)
- Exchange flow analysis (inflows/outflows)
- Dormant coins detection (>1 year)
- SOPR (Spent Output Profit Ratio)
- MVRV Z-Score (improved)

**API publique** :
```javascript
class OnChainAnalyzer {
  constructor(blockchainAPIs);

  // Whale tracking
  async trackWhaleMovements(threshold = 500000);
  async getExchangeFlows(exchange, timeframe = '24h');

  // Metrics
  async calculateSOPR(addresses);
  async calculateMVRV(crypto);
  async detectDormantCoins(minAge = 365);

  // Alerts
  on(event, callback); // 'whale_move', 'exchange_inflow', 'dormant_awakening'
}
```

**Architecture interne** :
```
OnChainAnalyzer
  ├── WhaleTracker
  │   ├── Labeled wallet monitoring
  │   ├── Transaction parsing (>$500K)
  │   ├── Classification (exchange, cold, contract)
  │   └── Alert system
  │
  ├── ExchangeFlowMonitor
  │   ├── Known exchange addresses
  │   ├── Inflow/outflow aggregation
  │   ├── Net flow calculation
  │   └── Trend detection
  │
  ├── DormantCoinDetector
  │   ├── UTXO age analysis
  │   ├── Dormancy threshold (365d)
  │   ├── Awakening detection
  │   └── Historical patterns
  │
  ├── SOPR_Calculator
  │   ├── Spent outputs tracking
  │   ├── Profit/loss determination
  │   ├── Ratio calculation
  │   └── Trend analysis
  │
  └── MVRV_Calculator
      ├── Market cap (realized & current)
      ├── Z-Score computation
      ├── Top/bottom zone detection
      └── Historical comparison
```

**Dépendances** :
- `api.js` (Etherscan, Blockchain.com clients)
- `utils/math.js` (statistics)

**Tests clés** :
- Whale move : Transfer >$500K → alert
- SOPR : Profit sales → SOPR > 1
- Dormant : Coin inactive 400d → detected

---

### modules/backtest.js

**Responsabilités** :
- Backtesting vectorisé de stratégies
- Gestion des trades simulés
- Calcul metrics (Sharpe, Sortino, Drawdown)
- Rapport de performance

**API publique** :
```javascript
class BacktestEngine {
  constructor(initialCapital, feeRate);

  // Backtesting
  async run(strategy, ohlcvData, parameters);

  // Analysis
  calculateMetrics(trades);
  generateReport(trades);

  // Optimization
  async optimizeParameters(strategy, ohlcvData, paramGrid);
}
```

**Architecture interne** :
```
BacktestEngine
  ├── StrategyExecutor
  │   ├── Signal generation (per candle)
  │   ├── Position management
  │   ├── Order execution (market, limit)
  │   └── Slippage simulation
  │
  ├── PortfolioManager
  │   ├── Cash management
  │   ├── Position sizing
  │   ├── Equity tracking
  │   └── Margin calculation
  │
  ├── MetricsCalculator
  │   ├── Total return
  │   ├── Sharpe ratio
  │   ├── Sortino ratio
  │   ├── Max drawdown
  │   ├── Win rate
  │   ├── Profit factor
  │   └── Calmar ratio
  │
  └── ParameterOptimizer
      ├── Grid search
      ├── Parallel execution (Web Workers)
      ├── Overfitting detection
      └── Walk-forward analysis
```

**Dépendances** :
- `utils/math.js` (statistics)
- Web Workers (parallélisation)

**Tests clés** :
- Simple strategy → validate return
- Sharpe ratio calculation
- Drawdown tracking

---

### modules/execution.js

**Responsabilités** :
- Order Management System (OMS)
- Smart execution (TWAP, VWAP)
- Paper trading mode
- Risk checks pré-trade

**API publique** :
```javascript
class ExecutionManager {
  constructor(apiClient, mode = 'paper');

  // Order placement
  async placeOrder(symbol, side, qty, type, price);
  async placeTWAP(symbol, side, totalQty, duration);
  async placeVWAP(symbol, side, totalQty, vwapTarget);

  // Order management
  async cancelOrder(orderId);
  async getOrderStatus(orderId);
  async getOpenOrders();

  // Risk checks
  validateOrder(order); // Pre-trade checks
}
```

**Architecture interne** :
```
ExecutionManager
  ├── OrderManager
  │   ├── Order creation & validation
  │   ├── Order tracking (pending, filled, cancelled)
  │   ├── Fill simulation (paper trading)
  │   └── Order history
  │
  ├── SmartExecution
  │   ├── TWAP (Time-Weighted Average Price)
  │   │   ├── Split total qty into chunks
  │   │   ├── Schedule orders over duration
  │   │   └── Execution monitoring
  │   │
  │   └── VWAP (Volume-Weighted Average Price)
  │       ├── Volume profile analysis
  │       ├── Adaptive slicing
  │       └── Target price tracking
  │
  ├── RiskManager
  │   ├── Position limit checks
  │   ├── Capital limit checks
  │   ├── Concentration limits
  │   └── Drawdown protection
  │
  └── PaperTradingEngine
      ├── Simulated fills (realistic slippage)
      ├── Fake order IDs
      ├── Portfolio state tracking
      └── Performance logging
```

**Dépendances** :
- `api.js` (Binance trading client)
- `modules/order-flow.js` (pour VWAP data)

**Tests clés** :
- Paper trade : Order → simulated fill
- TWAP : Split 1000 qty over 10min
- Risk check : Reject oversized order

---

## Utilitaires Communs (utils/)

### utils/websocket-client.js

```javascript
class WebSocketClient {
  constructor(url, options = {});

  // Connection
  connect();
  disconnect();

  // Subscription
  subscribe(stream);
  unsubscribe(stream);

  // Events
  on(event, callback); // 'message', 'connect', 'disconnect', 'error'

  // Reconnection
  // Auto-reconnect avec exponential backoff (1s, 2s, 4s, 8s, max 30s)
}
```

**Features** :
- Auto-reconnect avec exponential backoff
- Heartbeat/ping-pong automatique
- Subscription queue (subscribe après connect)
- Event emitter pattern

---

### utils/storage.js

```javascript
class StorageManager {
  constructor(dbName, version);

  // IndexedDB operations
  async saveTrades(trades);
  async getTrades(symbol, startTime, endTime);
  async saveOrderBook(symbol, snapshot);
  async getOrderBook(symbol);

  // Cleanup
  async clearOldData(maxAge = 7 * 24 * 60 * 60 * 1000); // 7 days
}
```

**Features** :
- Wrapper simple pour IndexedDB (Promise-based)
- Auto-creation tables (trades, orderbook, metadata)
- Index optimization (symbol + timestamp)
- Quota management

---

### utils/math.js

```javascript
// Statistical functions
function mean(values);
function stddev(values, sample = true);
function correlation(series1, series2); // Pearson
function zScore(value, mean, stddev);
function covariance(series1, series2);

// Technical indicators
function sma(values, period);
function ema(values, period);
function rsi(values, period = 14);

// Financial math
function sharpeRatio(returns, riskFreeRate = 0);
function sortinoRatio(returns, riskFreeRate = 0);
function maxDrawdown(equity);
```

---

### utils/events.js

```javascript
class EventEmitter {
  on(event, callback);
  off(event, callback);
  emit(event, data);
  once(event, callback);
}
```

Simple EventEmitter pour coordination inter-modules.

---

## Intégration avec Système Existant

### 1. Extension du Router (app.js)

```javascript
// app.js - Ajout pages Order Flow, SMC, Arbitrage, etc.

function showPage(pageName) {
  // ... code existant ...

  // Nouveaux cases
  switch(pageName) {
    case 'orderflow':
      showOrderFlowPage();
      break;
    case 'smc':
      showSMCPage();
      break;
    case 'arbitrage':
      showArbitragePage();
      break;
    case 'options':
      showOptionsPage();
      break;
    case 'onchain':
      showOnChainPage();
      break;
    case 'backtest':
      showBacktestPage();
      break;
  }
}
```

### 2. Lazy Loading Modules

```javascript
// app.js - Lazy load modules uniquement quand nécessaire

let orderFlowManager = null;

async function showOrderFlowPage() {
  if (!orderFlowManager) {
    // Load dependencies
    await loadScript('https://cdn.jsdelivr.net/npm/idb@7.1.1/build/umd.js');

    // Load module
    await loadScript('modules/order-flow.js');

    // Initialize
    orderFlowManager = new OrderFlowManager({
      exchange: 'binance',
      wsUrl: 'wss://stream.binance.com:9443/ws'
    });
  }

  // Connect si pas déjà connecté
  if (!orderFlowManager.isConnected()) {
    await orderFlowManager.connect(['btcusdt', 'ethusdt', 'solusdt']);
  }

  // Render UI
  renderOrderFlowPage();
}
```

### 3. Extension Navigation (index.html)

```html
<!-- index.html - Ajout onglets navigation -->

<nav class="main-nav">
  <!-- Existant -->
  <button onclick="showPage('scanner')">Scanner</button>
  <button onclick="showPage('portfolio')">Portfolio</button>
  <!-- ... -->

  <!-- Nouveaux -->
  <button onclick="showPage('orderflow')">Order Flow</button>
  <button onclick="showPage('smc')">SMC</button>
  <button onclick="showPage('arbitrage')">Arbitrage</button>
  <button onclick="showPage('options')">Options</button>
  <button onclick="showPage('onchain')">On-Chain</button>
  <button onclick="showPage('backtest')">Backtest</button>
</nav>
```

### 4. Extension Scoring (scoring.js)

**Intégration signaux SMC dans scoring** :

```javascript
// scoring.js - Ajout catégorie "Price Action"

function calculateScore(crypto) {
  // ... catégories existantes (Valuation, Growth, Dev, OnChain) ...

  // NOUVELLE : Price Action (15 points) - basée sur SMC
  let priceActionScore = 0;

  if (crypto.smcSignals) {
    // BOS bullish récent = +5
    if (crypto.smcSignals.bosType === 'bullish' && crypto.smcSignals.bosAge < 24) {
      priceActionScore += 5;
    }

    // Order Block non testé proche = +5
    if (crypto.smcSignals.nearbyOrderBlock && !crypto.smcSignals.nearbyOrderBlock.tested) {
      priceActionScore += 5;
    }

    // Liquidity zone proche = +5
    if (crypto.smcSignals.nearLiquidityZone) {
      priceActionScore += 5;
    }
  }

  // Total = 100 + 15 = 115 points (renormaliser à 100 après)
  const totalScore = valuationScore + growthScore + devScore + onChainScore + priceActionScore;

  return {
    total: normalizeToMax100(totalScore),
    breakdown: {
      valuation: valuationScore,
      growth: growthScore,
      dev: devScore,
      onChain: onChainScore,
      priceAction: priceActionScore // NOUVEAU
    }
  };
}
```

---

## Patterns de Communication Inter-Modules

### 1. Event Bus (Pub/Sub)

```javascript
// Global event bus
const eventBus = new EventEmitter();

// Module A : Order Flow
orderFlowManager.on('cvd_update', (data) => {
  eventBus.emit('trading:cvd_update', data);
});

// Module B : SMC Analyzer
eventBus.on('trading:cvd_update', (cvdData) => {
  // Use CVD pour confirmer BOS
  if (smcAnalyzer.hasBullishBOS() && cvdData.delta > 0) {
    eventBus.emit('trading:strong_signal', {
      type: 'BOS_CVD_CONFLUENCE',
      confidence: 0.9
    });
  }
});

// Module C : Notification System
eventBus.on('trading:strong_signal', (signal) => {
  showNotification(`Strong ${signal.type} signal detected!`);
});
```

### 2. Shared State (Redux-like)

```javascript
// Simple state management
const appState = {
  selectedCrypto: 'BTC',
  timeframe: '1h',
  activeStrategies: [],
  portfolio: {},
  // ...
};

function updateState(key, value) {
  appState[key] = value;
  eventBus.emit('state:updated', { key, value });
}

// Modules react to state changes
eventBus.on('state:updated', ({ key, value }) => {
  if (key === 'selectedCrypto') {
    // Reload charts, indicators, etc.
    orderFlowManager.switchSymbol(value.toLowerCase() + 'usdt');
    smcAnalyzer.loadData(value);
  }
});
```

---

## Performance Optimizations

### 1. Web Workers pour Calculs Lourds

```javascript
// backtest-worker.js
self.onmessage = function(e) {
  const { strategy, ohlcv, params } = e.data;

  // Run backtest (CPU-intensive)
  const results = runBacktest(strategy, ohlcv, params);

  self.postMessage(results);
};

// Main thread
const worker = new Worker('backtest-worker.js');
worker.postMessage({ strategy, ohlcv, params });
worker.onmessage = (e) => {
  displayBacktestResults(e.data);
};
```

### 2. Throttling & Debouncing

```javascript
// utils/helpers.js
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

// Usage : Limit CVD updates à 1/sec max
const updateCVDChart = throttle((cvdData) => {
  renderCVDChart(cvdData);
}, 1000);
```

### 3. Virtual Scrolling pour Grandes Listes

```javascript
// Pour afficher 10000+ trades sans lag
class VirtualScroller {
  constructor(container, itemHeight, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
  }

  render(data) {
    const visibleCount = Math.ceil(this.container.offsetHeight / this.itemHeight);
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);

    // Render only visible items + buffer
    const visibleItems = data.slice(startIndex, startIndex + visibleCount + 5);
    // ... DOM update ...
  }
}
```

---

## Monitoring & Debugging

### 1. Logging System

```javascript
// utils/logger.js
const LogLevel = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

class Logger {
  constructor(moduleName, level = LogLevel.INFO) {
    this.moduleName = moduleName;
    this.level = level;
  }

  debug(msg, data) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[${this.moduleName}] DEBUG:`, msg, data);
    }
  }

  info(msg, data) { /* ... */ }
  warn(msg, data) { /* ... */ }
  error(msg, data) { /* ... */ }
}

// Usage
const logger = new Logger('OrderFlow', LogLevel.DEBUG);
logger.debug('CVD calculated', { cvd: 1234.56 });
```

### 2. Performance Monitoring

```javascript
// utils/profiler.js
class Profiler {
  static start(label) {
    performance.mark(`${label}-start`);
  }

  static end(label) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    const measure = performance.getEntriesByName(label)[0];
    console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
  }
}

// Usage
Profiler.start('CVD Calculation');
const cvd = calculateCVD(trades, '1m');
Profiler.end('CVD Calculation');
```

---

## Security Considerations

### 1. API Key Management

```javascript
// NEVER store API keys in code
// Use environment variables loaded at runtime

// config.js (loaded from secure source)
const config = {
  binance: {
    apiKey: process.env.BINANCE_API_KEY,  // Server-side
    apiSecret: process.env.BINANCE_SECRET
  }
};

// Client-side : Use server proxy for authenticated requests
async function placeOrder(order) {
  // Call your backend API, never expose keys to browser
  const response = await fetch('/api/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  return response.json();
}
```

### 2. Input Validation

```javascript
// modules/execution.js
validateOrder(order) {
  const errors = [];

  if (!order.symbol || typeof order.symbol !== 'string') {
    errors.push('Invalid symbol');
  }

  if (!['buy', 'sell'].includes(order.side)) {
    errors.push('Side must be buy or sell');
  }

  if (order.qty <= 0 || isNaN(order.qty)) {
    errors.push('Quantity must be positive number');
  }

  // Max position size check
  if (order.qty * order.price > MAX_POSITION_SIZE) {
    errors.push('Position size exceeds limit');
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}
```

---

## Testing Strategy

### Unit Tests (per module)

```javascript
// tests/order-flow.test.js
QUnit.module('Order Flow Module');

QUnit.test('CVD calculation - bullish scenario', function(assert) {
  const mockTrades = [
    { price: 50000, qty: 1.5, side: 'buy', timestamp: 1000 },
    { price: 50001, qty: 0.8, side: 'sell', timestamp: 1001 },
    { price: 50002, qty: 2.0, side: 'buy', timestamp: 1002 }
  ];

  const cvd = calculateCVD(mockTrades, '1m');

  assert.equal(cvd.length, 1, 'Should have 1 interval');
  assert.ok(cvd[0].delta > 0, 'Net buying detected');
  assert.equal(cvd[0].delta, 1.5 + 2.0 - 0.8, 'Delta calculation correct');
});
```

### Integration Tests

```javascript
// tests/integration/smc-orderflow.test.js
QUnit.test('SMC + Order Flow confluence', async function(assert) {
  // Setup
  const ohlcv = loadMockOHLCV('BTC_1h_bullish_bos.json');
  const trades = loadMockTrades('BTC_trades_high_cvd.json');

  const smcAnalyzer = new SmartMoneyAnalyzer(ohlcv);
  const bosSignals = smcAnalyzer.detectBOS();

  const cvd = calculateCVD(trades, '1h');

  // Assert confluence
  const bullishBOS = bosSignals.find(b => b.type === 'bullish');
  const positiveCVD = cvd.find(c => c.timestamp === bullishBOS.timestamp && c.delta > 0);

  assert.ok(bullishBOS, 'Bullish BOS detected');
  assert.ok(positiveCVD, 'Positive CVD at same time');
  // → Strong signal !
});
```

---

## Deployment Checklist

- [ ] **Minification** : Minifier JS/CSS (si migration vers build system)
- [ ] **CDN** : Librairies externes via CDN avec SRI hashes
- [ ] **Lazy Loading** : Modules chargés à la demande
- [ ] **Service Worker** : Cache assets pour PWA (optionnel)
- [ ] **Analytics** : Tracking erreurs (Sentry, LogRocket)
- [ ] **Rate Limiting** : Respecter limites API
- [ ] **Error Handling** : Try-catch sur tous appels API
- [ ] **Graceful Degradation** : App fonctionne sans APIs
- [ ] **Mobile Responsive** : Tester sur mobile/tablet
- [ ] **Browser Compat** : Chrome, Firefox, Safari, Edge

---

## Migration Path (MVP → Production)

### Phase 1 : MVP (Current approach)
- ✅ Client-side pur
- ✅ CDN dependencies
- ✅ IndexedDB local storage
- ✅ Free APIs

### Phase 2 : Enhanced MVP
- Add Web Workers (backtesting)
- Add Service Worker (PWA)
- Lazy loading all modules
- Performance monitoring

### Phase 3 : Backend Integration
```
Frontend (JS) ↔ REST API ↔ Backend (Node.js ou Python)
                                    ↓
                            - Database (PostgreSQL)
                            - Redis (cache)
                            - ML models
                            - Scheduled tasks (cron)
```

**Benefits** :
- Server-side API calls (pas de CORS, rate limits partagés)
- Database pour historique long terme
- ML models plus puissants
- Scheduled jobs (whale tracking H24)

### Phase 4 : Scalable Production
```
Frontend → Load Balancer → API Gateway
                              ↓
                      [Microservices]
                      - Order Flow Service
                      - SMC Service
                      - Arbitrage Service
                      - Options Service
                      - ML Service
                              ↓
                      [Data Layer]
                      - TimescaleDB (time-series)
                      - Redis (cache)
                      - S3 (parquet files)
```

---

## Conclusion

Cette architecture modulaire permet :

1. **Développement incrémental** : Chaque phase indépendante
2. **Testabilité** : Modules isolés, testables unitairement
3. **Scalabilité** : Migration progressive vers backend si nécessaire
4. **Maintenabilité** : Code organisé, responsabilités claires
5. **Performance** : Lazy loading, Web Workers, caching multi-niveaux

**Next Steps** : Choisir Phase 4, 5, ou 6 pour commencer l'implémentation (voir PLAN.md).

---

**Dernière mise à jour** : 2025-11-10
**Maintenu par** : Claude Code Agent
