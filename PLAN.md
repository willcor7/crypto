# PLAN.md - Roadmap Incrémentale d'Intégration

## Vue d'ensemble

Ce document suit l'approche **"Explore → Plan → Execute"** pour intégrer des méthodologies de trading crypto avancées dans le dashboard existant.

**Principes** :
- ✅ **Incrémental** : Une fonctionnalité à la fois, <5 fichiers touchés par étape
- ✅ **Testable** : Tests unitaires + validation manuelle à chaque étape
- ✅ **Rollback facile** : Points de sauvegarde clairs
- ✅ **Documentation** : Mise à jour CLAUDE.md après chaque phase

---

## État Global

| Phase | Statut | Progression | Dernière MAJ |
|-------|--------|-------------|--------------|
| **Phase 1-3** : Base existante | ✅ Terminé | 100% | 2025-11-10 |
| **Phase 4** : Order Flow | 📋 Planifié | 0% | - |
| **Phase 5** : Smart Money Concepts | 📋 Planifié | 0% | - |
| **Phase 6** : Arbitrage | 📋 Planifié | 0% | - |
| **Phase 7** : Options & Derivatives | 📋 Planifié | 0% | - |
| **Phase 8** : On-Chain Analytics | 📋 Planifié | 0% | - |
| **Phase 9** : Machine Learning | 📋 Planifié | 0% | - |
| **Phase 10** : Backtesting & Execution | 📋 Planifié | 0% | - |

**Légende** :
- 📋 Planifié
- 🚧 En cours
- ✅ Terminé
- ⏸️ En pause
- ❌ Abandonné

---

## Phase 4 : Order Flow & Market Microstructure

### Objectif
Intégrer l'analyse du flux d'ordres temps réel pour détecter les mouvements institutionnels et les zones de pression achat/vente.

### Tâches

#### 4.1 - Setup Infrastructure WebSocket

**Objectif** : Créer un client WebSocket réutilisable pour connecter aux exchanges (Binance en priorité).

**Fichiers touchés** :
- `utils/websocket-client.js` (NOUVEAU)
- `.gitignore` (ajout .env si pas déjà présent)
- `.env.example` (NOUVEAU)

**Plan d'implémentation** :
1. Créer `utils/websocket-client.js` avec classe `WebSocketClient`
   - Connection avec auto-reconnect (exponential backoff)
   - Event handlers (onMessage, onError, onConnect, onDisconnect)
   - Subscription management (subscribe/unsubscribe à différents streams)
   - Heartbeat/ping-pong pour maintenir connexion alive

2. Créer `.env.example` avec template :
   ```
   # Exchange WebSocket URLs
   BINANCE_WS_URL=wss://stream.binance.com:9443/ws
   BYBIT_WS_URL=wss://stream.bybit.com/v5/public/spot
   ```

3. Ajouter `.env` à `.gitignore` (si pas déjà)

**Tests** :
- [ ] Mock WebSocket server (simuler messages)
- [ ] Test reconnection après disconnect forcé
- [ ] Test subscription/unsubscription
- [ ] Assert pas de memory leak (disconnect propre)

**Critères de validation** :
- [ ] WebSocket se connecte avec succès à Binance testnet
- [ ] Reconnection automatique fonctionne (tester avec disconnect réseau)
- [ ] Logs clairs des événements (connect, disconnect, error)
- [ ] Code réutilisable pour différents exchanges

**Prompts Claude utilisés** :
```
USER: Implémente un client WebSocket réutilisable dans utils/websocket-client.js.
Features :
- Auto-reconnect avec exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Event handlers personnalisables (onMessage, onError, etc.)
- Subscribe/unsubscribe à des streams (ex: btcusdt@trade)
- Heartbeat pour maintenir connexion
- Tests avec mock WebSocket
```

**Rollback** : Supprimer `utils/websocket-client.js`

**Estimation** : 3-4 heures

**Status** : 📋 Planifié

---

#### 4.2 - Ingestion Order Book & Trades

**Objectif** : Récupérer en temps réel les trades et order book depth pour BTC, ETH, SOL.

**Fichiers touchés** :
- `modules/order-flow.js` (NOUVEAU)
- `utils/storage.js` (NOUVEAU - wrapper IndexedDB)
- `index.html` (ajout page "Order Flow" dans navigation)
- `app.js` (routing vers page Order Flow)

**Plan d'implémentation** :
1. Créer `utils/storage.js` avec wrapper IndexedDB
   - Store trades dans table "trades" (clé composite : symbol + timestamp)
   - Store snapshots order book dans "orderbook"
   - Fonctions : saveTrades(), getTrades(symbol, startTime, endTime), clearOldData()

2. Créer `modules/order-flow.js` avec :
   - Classe `OrderFlowManager`
   - Méthode `startStream(symbols)` : Connect WebSocket et subscribe à trades + depth
   - Méthode `stopStream()`
   - Event handler `onTrade(trade)` : Parse et save to IndexedDB
   - Event handler `onDepthUpdate(depth)` : Update order book snapshot

3. Modifier `index.html` :
   - Ajouter `<div id="orderflow-page" class="page">` avec structure basique
   - Ajouter onglet navigation "Order Flow"

4. Modifier `app.js` :
   - Ajouter routing case 'orderflow'
   - Initialiser OrderFlowManager au load

**Tests** :
- [ ] Mock 100 trades, assert sauvegarde IndexedDB
- [ ] Vérifier lecture trades par plage de temps
- [ ] Test nettoyage données anciennes (>7 jours)
- [ ] Assert format trades : {symbol, price, qty, side, timestamp}

**Critères de validation** :
- [ ] Trades s'affichent en temps réel dans console
- [ ] IndexedDB contient données après 1 minute de stream
- [ ] Order book snapshot est à jour
- [ ] Pas de lag UI (processing en background)

**Prompts Claude** :
```
USER: Crée module modules/order-flow.js pour ingérer trades temps réel via WebSocket.
- Utilise utils/websocket-client.js
- Sauvegarde trades dans IndexedDB (wrapper utils/storage.js)
- Subscribe à btcusdt@trade, ethusdt@trade, solusdt@trade
- Tests avec mock trades (100 entrées)
```

**Rollback** : Supprimer modules/order-flow.js, utils/storage.js, revert index.html & app.js

**Estimation** : 5-6 heures

**Status** : 📋 Planifié

---

#### 4.3 - Calcul Cumulative Volume Delta (CVD)

**Objectif** : Implémenter l'indicateur CVD pour détecter pression achat/vente institutionnelle.

**Fichiers touchés** :
- `modules/order-flow.js` (ajout fonctions de calcul)
- `modules/order-flow.js` (ajout visualisation basique)

**Plan d'implémentation** :
1. Ajouter fonction `calculateCVD(trades, interval)` dans order-flow.js
   - Input : Array de trades {price, qty, side, timestamp}
   - Interval : '1m', '5m', '15m'
   - Logic :
     ```javascript
     CVD = Σ(buy_volume) - Σ(sell_volume)
     Delta = buy_volume - sell_volume (par interval)
     ```
   - Output : Array de {timestamp, cvd, delta, buy_vol, sell_vol}

2. Ajouter fonction `renderCVDChart(cvdData)` :
   - Line chart CVD cumulé
   - Bar chart delta par interval (vert = achat, rouge = vente)
   - Utiliser Chart.js existant

**Tests** :
- [ ] Mock trades avec 60% buy, 40% sell → assert CVD > 0
- [ ] Test agrégation 1m : 100 trades → X candles
- [ ] Edge case : pas de trades → CVD = 0
- [ ] Vérifier calcul : sum(buy) - sum(sell) = CVD final

**Critères de validation** :
- [ ] CVD s'affiche en temps réel sur page Order Flow
- [ ] Chart lisible, axes corrects
- [ ] Delta bars distinguent buy/sell
- [ ] Performance OK (calcul <100ms pour 1000 trades)

**Prompts Claude** :
```
USER: Ajoute calcul CVD dans modules/order-flow.js.
Fonction calculateCVD(trades, interval='1m') :
- Agrège trades par interval
- CVD = somme(buy_volume) - somme(sell_volume)
- Retourne [{timestamp, cvd, delta}]
Tests : mock trades 60% buy, assert CVD > 0
```

**Rollback** : Revert changes dans order-flow.js (Git diff)

**Estimation** : 2-3 heures

**Status** : 📋 Planifié

---

#### 4.4 - Footprint Chart (Order Flow Visualization)

**Objectif** : Visualiser le footprint (heatmap des volumes par niveau de prix et temps).

**Fichiers touchés** :
- `modules/order-flow.js` (ajout fonction footprint)
- `charts.js` (ajout chart type custom ou heatmap)
- `index.html` (canvas pour footprint)

**Plan d'implémentation** :
1. Fonction `generateFootprint(trades, priceStep, timeInterval)` :
   - Grouper trades par bins de prix (ex: 100$ steps pour BTC)
   - Grouper par time interval (ex: 1 minute)
   - Pour chaque cell (price bin, time bin) : calculer buy_vol, sell_vol
   - Output : Matrix 2D {price, time, buy_vol, sell_vol}

2. Visualisation :
   - Heatmap avec Chart.js (ou canvas custom)
   - Couleur : vert si buy_vol > sell_vol, rouge sinon
   - Intensité : proportionnelle au volume total
   - Axe X : temps, Axe Y : niveaux de prix

**Tests** :
- [ ] Mock trades à différents prix → assert matrix correcte
- [ ] Test bins : price_step=100, assert grouping
- [ ] Vérifier couleurs heatmap : buy dominant → vert

**Critères de validation** :
- [ ] Footprint chart s'affiche sur page Order Flow
- [ ] Zones de buying/selling pressure visibles
- [ ] Interactive (hover montre détails : buy vol, sell vol)
- [ ] Performance : render <1s pour 1000 trades

**Prompts Claude** :
```
USER: Implémente footprint chart dans modules/order-flow.js.
Fonction generateFootprint(trades, priceStep=100, timeInterval='1m') :
- Grouper trades par bins prix et temps
- Calculer buy/sell volume par cell
- Retourner matrix 2D pour heatmap
Visualisation : Chart.js heatmap, vert=buy dominant, rouge=sell
```

**Rollback** : Revert changes dans order-flow.js, charts.js, index.html

**Estimation** : 4-5 heures

**Status** : 📋 Planifié

---

#### 4.5 - Volume Profile (POC, VAH, VAL)

**Objectif** : Calculer le Volume Profile pour identifier Point of Control, Value Area High/Low.

**Fichiers touchés** :
- `modules/order-flow.js` (ajout fonction volume profile)
- `charts.js` (horizontal histogram sur chart prix)

**Plan d'implémentation** :
1. Fonction `calculateVolumeProfile(trades, priceStep)` :
   - Grouper trades par bins de prix
   - Pour chaque bin : total_volume = sum(qty)
   - POC (Point of Control) : bin avec le plus gros volume
   - Value Area : 70% du volume total, centré autour POC
   - VAH (Value Area High) : limite supérieure value area
   - VAL (Value Area Low) : limite inférieure value area

2. Visualisation :
   - Horizontal histogram sur le côté du price chart
   - Highlight POC, VAH, VAL avec lignes
   - Color coding : POC en jaune, Value Area en bleu transparent

**Tests** :
- [ ] Mock trades avec distribution normale → POC au centre
- [ ] Assert Value Area contient ~70% volume
- [ ] Edge case : peu de trades → POC = bin unique

**Critères de validation** :
- [ ] Volume Profile s'affiche sur chart prix (page Order Flow)
- [ ] POC, VAH, VAL identifiables visuellement
- [ ] Calcul correct (vérifier avec exemple connu)

**Prompts Claude** :
```
USER: Ajoute calcul Volume Profile dans modules/order-flow.js.
Fonction calculateVolumeProfile(trades, priceStep) :
- Grouper par prix, calculer total volume
- POC = bin avec max volume
- Value Area = 70% volume centré sur POC
- Retourner {poc, vah, val, profile}
Tests + visualisation histogram horizontal
```

**Rollback** : Revert changes dans order-flow.js, charts.js

**Estimation** : 3-4 heures

**Status** : 📋 Planifié

---

### Récapitulatif Phase 4

| Tâche | Fichiers | Tests | Estimation | Status |
|-------|----------|-------|------------|--------|
| 4.1 WebSocket Client | 2 nouveaux | ✅ Mock WS | 3-4h | 📋 |
| 4.2 Ingestion Order Flow | 4 (2 nouveaux) | ✅ IndexedDB | 5-6h | 📋 |
| 4.3 CVD Calculation | 1 modifié | ✅ Math logic | 2-3h | 📋 |
| 4.4 Footprint Chart | 3 modifiés | ✅ Heatmap render | 4-5h | 📋 |
| 4.5 Volume Profile | 2 modifiés | ✅ POC/VAH/VAL | 3-4h | 📋 |
| **TOTAL** | **~8 fichiers** | **5 test suites** | **17-22h** | **📋** |

---

## Phase 5 : Smart Money Concepts (SMC)

### Objectif
Détecter automatiquement les structures Smart Money (BOS, CHoCH, Order Blocks, FVG) pour identifier les zones d'intérêt institutionnel.

### Tâches

#### 5.1 - Break of Structure (BOS) Detection

**Objectif** : Détecter les cassures de structure (BOS) bullish et bearish.

**Fichiers touchés** :
- `modules/smart-money.js` (NOUVEAU)
- `index.html` (ajout page "SMC" dans navigation)
- `app.js` (routing vers page SMC)

**Plan d'implémentation** :
1. Créer `modules/smart-money.js` avec classe `SmartMoneyAnalyzer`

2. Fonction `detectBOS(ohlcv, lookback=50)` :
   - Logic :
     - **Bullish BOS** : Prix casse au-dessus du dernier swing high
     - **Bearish BOS** : Prix casse en-dessous du dernier swing low
   - Identifier swing highs/lows avec zigzag (threshold 2-3%)
   - Retourner : [{timestamp, type: 'bullish'|'bearish', price, confidence}]

3. Ajouter page SMC dans index.html avec :
   - Chart prix avec annotations BOS
   - Liste des BOS détectés (dernières 24h)

**Tests** :
- [ ] Mock OHLCV avec 3 BOS connus → assert détection
- [ ] Test swing identification : zigzag correct
- [ ] Edge case : marché flat → pas de BOS

**Critères de validation** :
- [ ] BOS s'affichent sur chart prix (marqueurs visuels)
- [ ] Faux positifs <10% (tester sur historique réel)
- [ ] Liste BOS mise à jour temps réel

**Prompts Claude** :
```
USER: Crée modules/smart-money.js pour SMC.
Fonction detectBOS(ohlcv, lookback) :
- Identifier swing highs/lows (zigzag 2% threshold)
- BOS bullish = cassure swing high
- BOS bearish = cassure swing low
Retourner [{timestamp, type, price}]
Tests avec mock OHLCV
```

**Rollback** : Supprimer modules/smart-money.js, revert index.html & app.js

**Estimation** : 4-5 heures

**Status** : 📋 Planifié

---

#### 5.2 - Change of Character (CHoCH) Detection

**Objectif** : Détecter les changements de caractère du marché (reversal signals).

**Fichiers touchés** :
- `modules/smart-money.js` (ajout fonction)

**Plan d'implémentation** :
1. Fonction `detectCHoCH(ohlcv, bosData)` :
   - Logic :
     - CHoCH = BOS dans direction opposée après série de BOS dans une direction
     - Ex: Après 2 BOS bullish, un BOS bearish = CHoCH bearish
   - Utiliser résultats de detectBOS()
   - Confidence score basé sur nombre de BOS précédents dans même direction

2. Annoter sur chart avec couleur différente (orange pour CHoCH vs bleu pour BOS)

**Tests** :
- [ ] Mock : 3 BOS bullish puis 1 bearish → assert CHoCH bearish
- [ ] Vérifier confidence score
- [ ] Edge case : alternance BOS → pas de CHoCH

**Critères de validation** :
- [ ] CHoCH distingués visuellement des BOS
- [ ] Taux de détection correct (valider sur historique)

**Prompts Claude** :
```
USER: Ajoute detectCHoCH(ohlcv, bosData) dans smart-money.js.
Logic : CHoCH = BOS opposé après série dans une direction.
Confidence basé sur nombre de BOS précédents.
Tests + annotations chart (orange)
```

**Rollback** : Revert changes dans smart-money.js

**Estimation** : 2-3 heures

**Status** : 📋 Planifié

---

#### 5.3 - Order Block (OB) Identification

**Objectif** : Identifier les zones Order Block (dernière bougie avant mouvement impulsif).

**Fichiers touchés** :
- `modules/smart-money.js` (ajout fonction)
- `charts.js` (rectangles pour zones OB)

**Plan d'implémentation** :
1. Fonction `identifyOrderBlocks(ohlcv, bosData)` :
   - Logic :
     - Order Block = dernière bougie opposée avant BOS
     - Ex: Bullish OB = dernière red candle avant BOS bullish
     - Zone = [low, high] de cette bougie
   - Filtrer OB non testés (prix n'est pas revenu dans la zone)

2. Visualisation :
   - Rectangles semi-transparents sur chart prix
   - Vert pour bullish OB, rouge pour bearish OB
   - Label avec timestamp et distance actuelle

**Tests** :
- [ ] Mock : BOS bullish à t+10, trouver dernière red candle avant
- [ ] Assert zone [low, high] correcte
- [ ] Test filtre : OB déjà testé → pas affiché

**Critères de validation** :
- [ ] Order Blocks affichés sur chart avec zones rectangles
- [ ] Filtre OB testés fonctionne
- [ ] Pertinence : OB = vraies zones support/résistance

**Prompts Claude** :
```
USER: Ajoute identifyOrderBlocks(ohlcv, bosData) dans smart-money.js.
Order Block = dernière bougie opposée avant BOS.
Zone = [low, high] de la bougie.
Filtrer OB déjà testés (prix revenu dans zone).
Visualisation : rectangles verts/rouges
```

**Rollback** : Revert smart-money.js, charts.js

**Estimation** : 4-5 heures

**Status** : 📋 Planifié

---

#### 5.4 - Fair Value Gap (FVG) Detection

**Objectif** : Détecter les Fair Value Gaps (zones d'inefficience de prix).

**Fichiers touchés** :
- `modules/smart-money.js` (ajout fonction)
- `charts.js` (rectangles pour FVG)

**Plan d'implémentation** :
1. Fonction `detectFVG(ohlcv)` :
   - Logic :
     - **Bullish FVG** : Candle[i].low > Candle[i-2].high (gap entre 3 bougies)
     - **Bearish FVG** : Candle[i].high < Candle[i-2].low
   - Zone FVG = gap non comblé
   - Retourner : [{timestamp, type, zoneTop, zoneBottom, filled: false}]

2. Tracking : Marquer FVG comme "filled" quand prix retourne dans zone

3. Visualisation :
   - Rectangles pointillés (non comblés) vs solides (comblés)
   - Couleur : bleu clair pour bullish FVG, rose pour bearish FVG

**Tests** :
- [ ] Mock 3 candles avec gap → assert FVG détecté
- [ ] Test fill detection : prix retourne → filled=true
- [ ] Edge case : pas de gap → pas de FVG

**Critères de validation** :
- [ ] FVG affichés sur chart
- [ ] Distinction comblés/non comblés
- [ ] Zones pertinentes (validées sur historique)

**Prompts Claude** :
```
USER: Ajoute detectFVG(ohlcv) dans smart-money.js.
Bullish FVG = candle[i].low > candle[i-2].high
Bearish FVG = candle[i].high < candle[i-2].low
Tracker filled status quand prix retourne.
Visualisation : rectangles pointillés bleu/rose
```

**Rollback** : Revert smart-money.js, charts.js

**Estimation** : 3-4 heures

**Status** : 📋 Planifié

---

#### 5.5 - Liquidity Zones Mapping

**Objectif** : Identifier les zones de liquidité (swing highs/lows où stop losses s'accumulent).

**Fichiers touchés** :
- `modules/smart-money.js` (ajout fonction)
- `charts.js` (lignes horizontales pour liquidity)

**Plan d'implémentation** :
1. Fonction `mapLiquidityZones(ohlcv, lookback=100)` :
   - Identifier tous les swing highs/lows (pivots)
   - Calculer "liquidity score" basé sur :
     - Volume au niveau
     - Nombre de rejets (touches multiples)
     - Proximité avec round numbers (ex: 50000 pour BTC)
   - Retourner zones triées par score

2. Visualisation :
   - Lignes horizontales en pointillés
   - Épaisseur proportionnelle au score
   - Couleur : magenta pour zones majeures

**Tests** :
- [ ] Mock OHLCV avec 5 swing highs → assert 5 liquidity zones
- [ ] Test score : niveau touché 3x → score > niveau touché 1x
- [ ] Round number bonus : 50000 vs 49823 → 50000 score plus haut

**Critères de validation** :
- [ ] Liquidity zones affichées sur chart
- [ ] Zones correspondent à vrais niveaux clés (historique)
- [ ] Scores pertinents

**Prompts Claude** :
```
USER: Ajoute mapLiquidityZones(ohlcv, lookback) dans smart-money.js.
Identifier swing highs/lows.
Score = f(volume, rejets, round_number_proximity)
Retourner zones triées par score.
Visualisation : lignes horizontales magenta, épaisseur = score
```

**Rollback** : Revert smart-money.js, charts.js

**Estimation** : 3-4 heures

**Status** : 📋 Planifié

---

### Récapitulatif Phase 5

| Tâche | Fichiers | Tests | Estimation | Status |
|-------|----------|-------|------------|--------|
| 5.1 BOS Detection | 3 (1 nouveau) | ✅ Swing logic | 4-5h | 📋 |
| 5.2 CHoCH Detection | 1 modifié | ✅ Reversal logic | 2-3h | 📋 |
| 5.3 Order Blocks | 2 modifiés | ✅ Zone identification | 4-5h | 📋 |
| 5.4 Fair Value Gaps | 2 modifiés | ✅ Gap detection | 3-4h | 📋 |
| 5.5 Liquidity Zones | 2 modifiés | ✅ Scoring logic | 3-4h | 📋 |
| **TOTAL** | **~6 fichiers** | **5 test suites** | **16-21h** | **📋** |

---

## Phase 6 : Arbitrage

### Objectif
Monitorer les opportunités d'arbitrage (funding rate spot-perp, cross-exchange, pair trading).

### Tâches

#### 6.1 - Funding Rate Monitoring Multi-Exchanges

**Objectif** : Suivre les funding rates sur Binance, Bybit, OKX pour détecter opportunités de cash-and-carry.

**Fichiers touchés** :
- `modules/arbitrage.js` (NOUVEAU)
- `api.js` (ajout clients Binance/Bybit futures)
- `index.html` (page "Arbitrage")
- `app.js` (routing)

**Plan d'implémentation** :
1. Créer `modules/arbitrage.js` avec classe `ArbitrageScanner`

2. Ajouter dans `api.js` :
   - `BinanceFuturesAPI.getFundingRate(symbol)`
   - `BybitAPI.getFundingRate(symbol)`
   - `OKXAPI.getFundingRate(symbol)`

3. Fonction `monitorFundingRates(symbols)` :
   - Fetch funding rates toutes les 1h (ou via WebSocket si dispo)
   - Calculer APY annualisé : `funding_rate * 3 * 365` (funding 3x/jour)
   - Comparer avec frais de trading + slippage
   - Alert si APY > 20%

4. Page Arbitrage :
   - Table : Symbol | Exchange | Funding Rate | APY | Spot-Perp Spread | Opportunity
   - Tri par APY décroissant
   - Highlight opportunités >20% APY

**Tests** :
- [ ] Mock funding rates : 0.01% → assert APY = 10.95%
- [ ] Test multi-exchanges : comparer funding Binance vs Bybit
- [ ] Alert trigger : APY > 20% → notification

**Critères de validation** :
- [ ] Funding rates mis à jour automatiquement
- [ ] APY calculés correctement
- [ ] Opportunités identifiables visuellement

**Prompts Claude** :
```
USER: Crée modules/arbitrage.js pour monitoring funding rates.
Ajoute API clients Binance/Bybit futures dans api.js.
Fonction monitorFundingRates(symbols) :
- Fetch funding rates multi-exchanges
- Calculer APY annualisé
- Alert si >20%
Page Arbitrage avec table triée
```

**Rollback** : Supprimer modules/arbitrage.js, revert api.js, index.html, app.js

**Estimation** : 5-6 heures

**Status** : 📋 Planifié

---

#### 6.2 - Spot-Perp Arbitrage Calculator

**Objectif** : Calculer le P&L potentiel d'un trade spot-perp (cash-and-carry) avec frais et slippage.

**Fichiers touchés** :
- `modules/arbitrage.js` (ajout fonction)

**Plan d'implémentation** :
1. Fonction `calculateSpotPerpArbitrage(symbol, fundingRate, position_size)` :
   - Inputs :
     - symbol (ex: 'BTCUSDT')
     - fundingRate (ex: 0.01% = 0.0001)
     - position_size (ex: 10000 USD)
   - Calcul :
     ```
     Daily funding = position_size * fundingRate * 3
     Trading fees = position_size * (spot_fee + perp_fee) // ex: 0.1% + 0.05%
     Net daily profit = daily_funding - trading_fees
     APY = (net_daily_profit * 365) / position_size
     ```
   - Retourner : {daily_profit, apy, break_even_days}

2. UI :
   - Calculator interactif sur page Arbitrage
   - Sliders : position size, funding rate
   - Affichage temps réel : daily profit, APY, break-even

**Tests** :
- [ ] Mock : funding 0.01%, position 10000 USD → assert daily profit
- [ ] Test fees : spot 0.1% + perp 0.05% → total 0.15%
- [ ] Break-even : frais = funding → days = 1 / (funding_rate - fee_rate)

**Critères de validation** :
- [ ] Calculator affiche résultats corrects
- [ ] Interactive (sliders update en temps réel)
- [ ] Formules validées (cross-check avec calculateur externe)

**Prompts Claude** :
```
USER: Ajoute calculateSpotPerpArbitrage(symbol, fundingRate, size) dans arbitrage.js.
Calculer :
- Daily funding = size * rate * 3
- Fees = size * (spot_fee + perp_fee)
- Net daily profit, APY, break-even days
UI calculator avec sliders
```

**Rollback** : Revert arbitrage.js

**Estimation** : 3-4 heures

**Status** : 📋 Planifié

---

#### 6.3 - Cross-Exchange Arbitrage Scanner

**Objectif** : Détecter les différences de prix entre exchanges (ex: BTC sur Binance vs Coinbase).

**Fichiers touchés** :
- `modules/arbitrage.js` (ajout fonction)
- `api.js` (ajout clients multi-exchanges si besoin)

**Plan d'implémentation** :
1. Fonction `scanCrossExchangeArbitrage(symbols)` :
   - Fetch prix spot sur Binance, Coinbase, Kraken, Bybit
   - Calculer spread : `(max_price - min_price) / min_price`
   - Soustraire fees (withdrawal + deposit + trading)
   - Alert si net spread > 0.5%

2. Table sur page Arbitrage :
   - Symbol | Exchange Buy | Price Buy | Exchange Sell | Price Sell | Gross Spread | Net Spread
   - Tri par net spread décroissant
   - Refresh toutes les 10s

**Tests** :
- [ ] Mock prix : Binance 50000, Coinbase 50500 → spread = 1%
- [ ] Test fees : withdrawal 0.0005 BTC + trading 0.1% → net spread
- [ ] Alert : net spread > 0.5%

**Critères de validation** :
- [ ] Spreads détectés en temps réel
- [ ] Fees inclus dans calcul
- [ ] Opportunités rares mais réelles (valider sur market réel)

**Prompts Claude** :
```
USER: Ajoute scanCrossExchangeArbitrage(symbols) dans arbitrage.js.
Fetch prix multi-exchanges (Binance, Coinbase, Kraken).
Calculer gross/net spread (avec fees).
Alert si net > 0.5%.
Table triée par net spread
```

**Rollback** : Revert arbitrage.js

**Estimation** : 4-5 heures

**Status** : 📋 Planifié

---

#### 6.4 - Pair Trading (Correlation-Based)

**Objectif** : Identifier des paires crypto corrélées pour mean reversion trading.

**Fichiers touchés** :
- `modules/arbitrage.js` (ajout fonction)
- `utils/math.js` (NOUVEAU - fonctions stat)

**Plan d'implémentation** :
1. Créer `utils/math.js` avec :
   - `calculateCorrelation(series1, series2)` : Pearson correlation
   - `calculateZScore(value, mean, stddev)` : Z-score

2. Fonction `findPairTradingOpportunities(cryptos, lookback=30)` :
   - Calculer correlation matrix pour tous les pairs
   - Identifier pairs avec correlation > 0.8
   - Pour chaque pair :
     - Calculer ratio prix (crypto1 / crypto2)
     - Calculer z-score du ratio vs moyenne 30j
     - Alert si |z-score| > 2 (divergence significative)
   - Retourner : [{pair, correlation, z_score, action: 'long_A_short_B'}]

3. UI :
   - Correlation heatmap (déjà structure existe dans code)
   - Table pair trading : Pair | Correlation | Z-Score | Signal
   - Detail view : chart du ratio avec mean + bands (±2σ)

**Tests** :
- [ ] Mock prix corrélés (r=0.9) → assert pair détecté
- [ ] Test z-score : ratio diverge 2σ → signal
- [ ] Edge case : corrélation faible → pas de signal

**Critères de validation** :
- [ ] Pairs corrélés identifiés (ex: ETH-BNB, SOL-AVAX)
- [ ] Z-scores corrects (vérifier calcul manuel)
- [ ] Signals pertinents (backtester sur historique)

**Prompts Claude** :
```
USER: Ajoute findPairTradingOpportunities(cryptos, lookback) dans arbitrage.js.
Créer utils/math.js avec correlation et z-score.
Logic :
- Correlation matrix
- Pairs r > 0.8
- Z-score ratio prix
- Signal si |z| > 2
UI : heatmap + table pairs
```

**Rollback** : Supprimer utils/math.js, revert arbitrage.js

**Estimation** : 5-6 heures

**Status** : 📋 Planifié

---

### Récapitulatif Phase 6

| Tâche | Fichiers | Tests | Estimation | Status |
|-------|----------|-------|------------|--------|
| 6.1 Funding Rate Monitor | 4 (1 nouveau) | ✅ APY calc | 5-6h | 📋 |
| 6.2 Spot-Perp Calculator | 1 modifié | ✅ P&L calc | 3-4h | 📋 |
| 6.3 Cross-Exchange Scan | 2 modifiés | ✅ Spread calc | 4-5h | 📋 |
| 6.4 Pair Trading | 3 (1 nouveau) | ✅ Correlation | 5-6h | 📋 |
| **TOTAL** | **~7 fichiers** | **4 test suites** | **17-21h** | **📋** |

---

## Phase 7 : Options & Derivatives

*(Détails à venir - Structure similaire aux phases précédentes)*

### Tâches planifiées
- 7.1 Options Data Ingestion (Deribit API)
- 7.2 Black-Scholes Pricing & Greeks
- 7.3 Implied Volatility Surface
- 7.4 Straddle/Strangle Scanner
- 7.5 Gamma Squeeze Detection

**Estimation totale** : 20-25 heures

---

## Phase 8 : On-Chain Analytics Avancée

*(Détails à venir)*

### Tâches planifiées
- 8.1 Whale Wallet Tracking
- 8.2 Exchange Flow Analysis
- 8.3 Dormant Coin Detection
- 8.4 SOPR (Spent Output Profit Ratio)
- 8.5 MVRV Z-Score Amélioration

**Estimation totale** : 18-22 heures

---

## Phase 9 : Machine Learning

*(Détails à venir - Peut nécessiter migration vers backend Python)*

### Tâches planifiées
- 9.1 Price Prediction (LSTM)
- 9.2 Anomaly Detection
- 9.3 Clustering Cryptos
- 9.4 Sentiment Analysis NLP

**Estimation totale** : 30-40 heures (complexe)

---

## Phase 10 : Backtesting & Execution

*(Détails à venir)*

### Tâches planifiées
- 10.1 Backtesting Engine
- 10.2 Paper Trading Mode
- 10.3 Order Management System
- 10.4 Smart Execution (TWAP/VWAP)

**Estimation totale** : 25-30 heures

---

## Logs de Progression

### 2025-11-10
- ✅ Création CLAUDE.md (documentation architecture complète)
- ✅ Création PLAN.md (roadmap incrémentale Phases 4-10)
- 📋 Phase 4 détaillée (Order Flow) : 5 tâches, 17-22h estimées
- 📋 Phase 5 détaillée (SMC) : 5 tâches, 16-21h estimées
- 📋 Phase 6 détaillée (Arbitrage) : 4 tâches, 17-21h estimées
- **Status global** : Planification terminée, prêt pour exécution

---

## Prochaines Actions Recommandées

### Choix utilisateur
**QUESTION** : Quelle phase souhaitez-vous commencer en premier ?

**Options** :
1. **Phase 4 (Order Flow)** - Recommandé si focus sur microstructure et institutional flow
2. **Phase 5 (SMC)** - Recommandé si focus sur price action et zones clés
3. **Phase 6 (Arbitrage)** - Recommandé si focus sur opportunités market-neutral

### Workflow proposé
1. **Choix de la phase** par l'utilisateur
2. **Review du plan** détaillé de la phase
3. **Exécution tâche par tâche** (Explore → Plan → Execute → Test → Review → Merge)
4. **Update PLAN.md** après chaque tâche terminée
5. **Mini-retrospective** après chaque phase

---

## Notes & Remarques

### Dépendances inter-phases
- **Phase 5 (SMC)** peut utiliser **Phase 4 (Order Flow)** pour confirmation (CVD + BOS)
- **Phase 6 (Arbitrage)** indépendante, peut être développée en parallèle
- **Phase 7 (Options)** peut utiliser **Phase 8 (On-chain)** pour sentiment
- **Phase 9 (ML)** dépend de toutes les phases précédentes (features)
- **Phase 10 (Backtest)** nécessite stratégies des phases 4-8

### Contraintes techniques actuelles
- **Client-side pur** : Limite complexité ML (TensorFlow.js ou migration backend)
- **No server** : Pas de scheduling côté serveur (cron jobs), seulement client-side intervals
- **Rate limits APIs** : Attention aux appels fréquents (WebSocket préférable)
- **Browser storage** : IndexedDB limité (~50MB par domaine, vérifier quotas)

### Recommandations
- **Commencer petit** : Phase 4.1 (WebSocket client) comme POC
- **Tester intensément** : Chaque fonction critique avec mock data
- **Documenter au fur et à mesure** : JSDoc + commentaires inline
- **Git discipline** : Branch par feature, commits atomiques, PR reviews

---

**Dernière mise à jour** : 2025-11-10
**Maintenu par** : Claude Code Agent
**Status** : 🟢 Planification complète, prêt pour exécution
