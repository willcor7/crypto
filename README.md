# 🚀 Dashboard Crypto d'Analyse Fondamentale

Dashboard interactif complet d'analyse fondamentale crypto avec système de screening automatique, signaux d'achat/vente et gestion de risque optimisée.

![Dashboard Preview](https://img.shields.io/badge/Status-Demo-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Caractéristiques Principales

### Système de Scoring Sophistiqué (100 points)

Le dashboard implémente un système de notation multi-critères qui évalue automatiquement les cryptomonnaies selon quatre catégories fondamentales :

- **Valorisation (35 points)** : MVRV ratio, Market Cap/TVL pour les protocoles DeFi
- **Croissance (30 points)** : Croissance des adresses actives, croissance du TVL
- **Qualité Fondamentale (25 points)** : Activité GitHub, nombre de contributeurs
- **Momentum Technique (10 points)** : Accumulation par les baleines, performance prix

### 5 Pages Principales

1. **Scanner d'Opportunités** : Tableau des 15 meilleures opportunités (Score ≥70), heatmap sectorielle interactive, nouveaux entrants
2. **Analyse Détaillée** : Analyse fondamentale exhaustive avec métriques de valorisation, croissance, développement et on-chain
3. **Mon Portfolio** : Vue complète du portfolio avec allocation sectorielle, heatmap de corrélation, et alertes automatiques
4. **Signaux & Alertes** : Signaux d'achat/vente avec historique de performance et configuration d'alertes personnalisées
5. **Gestion du Risque** : Calculateur de position sizing, analyse de risque du portfolio, stress tests

## 🚀 Installation et Utilisation

### Prérequis

Aucun prérequis ! Le dashboard fonctionne entièrement côté client avec des technologies web standards.

### Lancement

1. Clonez ou téléchargez ce repository
2. Ouvrez `index.html` dans votre navigateur web moderne (Chrome, Firefox, Safari, Edge)
3. Le dashboard se charge automatiquement avec des données simulées

### Structure des Fichiers

```
crypto-dashboard/
├── index.html          # Structure HTML principale
├── styles.css          # Styles CSS avec thème dark mode
├── data.js            # Données simulées et fonctions helper
├── scoring.js         # Système de scoring sophistiqué
├── charts.js          # Gestion des graphiques Chart.js
├── app.js             # Logique applicative et interactivité
└── README.md          # Cette documentation
```

## 📊 Système de Scoring Détaillé

### Catégorie 1: Valorisation (35 points max)

**MVRV Ratio (20 points)**
- MVRV < 0.7 : Forte sous-évaluation → 20 points
- MVRV 0.7-1.0 : Sous-évaluation → 15 points
- MVRV 1.0-1.5 : Fair value → 10 points
- MVRV 1.5-2.5 : Surévaluation → 5 points
- MVRV > 2.5 : Forte surévaluation → 0 points

**Market Cap / TVL pour DeFi (15 points)**
- Ratio < 0.3 : Très sous-évalué → 15 points
- Ratio 0.3-0.5 : Sous-évalué → 12 points
- Ratio 0.5-1.0 : Fair value → 8 points
- Ratio 1.0-2.0 : Légèrement surévalué → 4 points
- Ratio > 2.0 : Surévalué → 0 points

### Catégorie 2: Croissance (30 points max)

**Croissance des Adresses Actives (20 points)**
- \> 30% : Croissance exceptionnelle → 20 points
- 20-30% : Forte croissance → 16 points
- 10-20% : Bonne croissance → 12 points
- 5-10% : Croissance modérée → 8 points
- 0-5% : Faible croissance → 4 points
- < 0% : Décroissance → 0 points

**Croissance du TVL/Volume (10 points)**
- Basé sur la croissance du TVL pour les protocoles DeFi
- Basé sur le ratio Volume/Market Cap pour les autres projets

### Catégorie 3: Qualité Fondamentale (25 points max)

**Activité GitHub (15 points)**
- \> 200 commits (90j) : Très actif → 15 points
- 100-200 commits : Actif → 12 points
- 50-100 commits : Modéré → 8 points
- 20-50 commits : Faible → 4 points
- < 20 commits : Très faible → 0 points

**Contributeurs (10 points)**
- \> 80 : Communauté large → 10 points
- 50-80 : Bonne communauté → 8 points
- 30-50 : Communauté moyenne → 6 points
- 10-30 : Petite communauté → 4 points
- < 10 : Très petite → 2 points

### Catégorie 4: Momentum (10 points max)

**Accumulation Baleines (6 points)**
- \> 5% : Forte accumulation → 6 points
- 3-5% : Bonne accumulation → 4 points
- 1-3% : Accumulation modérée → 2 points
- < 1% : Faible accumulation → 0 points

**Performance Prix 24h (4 points)**
- \> 10% : Fort momentum → 4 points
- 5-10% : Bon momentum → 3 points
- 0-5% : Momentum positif → 2 points
- -5-0% : Momentum neutre → 1 point
- < -5% : Momentum négatif → 0 points

## 🎨 Interface Utilisateur

### Design Dark Mode Professionnel

- **Palette de couleurs** inspirée des terminaux de trading institutionnels
- **Typographie** optimisée pour la lisibilité des données financières
- **Animations fluides** avec transitions de 0.2s pour une expérience premium
- **Graphiques interactifs** avec Chart.js pour des visualisations dynamiques
- **Responsive design** s'adaptant aux écrans mobiles, tablettes et desktop

### Composants Interactifs

- **Filtres dynamiques** : Catégorie, Market Cap, Score minimum, Signal
- **Sparklines** : Miniatures de graphiques montrant les tendances 30 jours
- **Heatmap sectorielle** : Visualisation en bulles des opportunités par secteur
- **Tables triables** : Tri par colonne pour toutes les tables de données
- **Tooltips contextuels** : Explications détaillées au survol des métriques

## 📈 Signaux d'Achat/Vente

### Niveaux de Signaux

- **STRONG BUY** (Score ≥ 80) : Opportunité exceptionnelle avec confluence de multiples indicateurs positifs
- **BUY** (Score 75-79) : Bonne opportunité d'achat avec fondamentaux solides
- **HOLD** (Score 70-74) : Position à conserver, pas d'action immédiate
- **WATCH** (Score 60-69) : Crypto à surveiller, pas encore qualifiée comme opportunité
- **SELL** (Score < 60) : Qualité fondamentale insuffisante

### Critères de Signal STRONG BUY

Un signal STRONG BUY est généré lorsque :
- Score global ≥ 80
- MVRV < 1.0 (sous-évaluation forte)
- Croissance des adresses actives > 15%
- Accumulation des baleines (flux net positif > 3%)
- Divergence haussière volume/prix

## 🛡️ Gestion du Risque

### Calculateur de Position Sizing

Formule professionnelle : **Position Size = (Capital × Risque%) ÷ Distance Stop-Loss**

Exemple :
- Capital : $10,000
- Risque par trade : 1% ($100)
- Prix d'entrée : $100
- Stop-loss : $95 (distance de $5)
- **Position optimale : 20 unités**

### Métriques de Risque Portfolio

- **Concentration Top 3** : Pourcentage du portfolio dans les 3 plus grandes positions (⚠️ si > 60%)
- **Score de Diversification Sectorielle** : 0-100 basé sur l'entropie de Shannon
- **Value at Risk (VaR 95%)** : Perte maximale probable sur 24h avec 95% de confiance
- **Stress Tests** : Simulation de différents scénarios de marché

### Recommandations Automatiques

Le système génère des recommandations basées sur l'analyse du portfolio :
- ✅ Bonne diversification (< 60% dans Top 3)
- ⚠️ Sur-exposition sectorielle (> 40% dans un secteur)
- 💡 Secteurs sous-représentés à considérer
- ✅ Qualité fondamentale forte (score moyen > 75)

## 🔄 Intégration APIs Réelles

### APIs Recommandées pour Production

**CoinGecko API** (https://www.coingecko.com/en/api)
- Prix en temps réel et historiques
- Market cap, volume, supply
- Données DEX via GeckoTerminal

**Messari API** (https://messari.io/api)
- Données institutionnelles
- Activité des développeurs
- Métriques fondamentales avancées

**Nansen** (https://www.nansen.ai)
- Analyse on-chain avec labels de wallets
- Smart money movements
- Tracking des baleines

**Glassnode** (https://glassnode.com)
- Métriques on-chain macro
- MVRV ratio
- HODL waves et statistiques miners

### Implémentation

Pour connecter une API réelle, modifiez `data.js` :

```javascript
// Exemple avec CoinGecko API
async function fetchRealTimeData() {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd');
    const data = await response.json();

    // Transformer les données au format du dashboard
    return data.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        priceChange24h: coin.price_change_percentage_24h,
        // ... autres champs
    }));
}
```

## 📱 Fonctionnalités Futures

### Roadmap

- [ ] Connexion aux APIs réelles (CoinGecko, Messari, Nansen)
- [ ] Backend Node.js avec base de données PostgreSQL
- [ ] Authentification utilisateur et multi-portfolios
- [ ] Exécution automatique des ordres via APIs exchanges
- [ ] Notifications push mobiles et intégrations Telegram/Discord
- [ ] Machine Learning pour prédictions de prix
- [ ] Backtesting avancé des stratégies
- [ ] Mode paper trading pour tester sans risque
- [ ] Export PDF des rapports d'analyse
- [ ] Dark/Light mode toggle

## 🛠️ Technologies Utilisées

- **HTML5** : Structure sémantique
- **CSS3** : Styles modernes avec variables CSS et flexbox/grid
- **JavaScript (ES6+)** : Logique applicative moderne
- **Chart.js 4.4.0** : Graphiques interactifs et responsives
- **Aucune dépendance lourde** : Framework-agnostic, vanilla JS

## 📄 Licence

Ce projet est fourni sous licence MIT. Vous êtes libre de l'utiliser, le modifier et le distribuer.

## ⚠️ Avertissement

Ce dashboard utilise des **données simulées** à des fins de démonstration. Pour un usage en production avec de l'argent réel :

1. Connectez des APIs crypto réputées pour des données en temps réel
2. Implémentez une authentification sécurisée
3. Ajoutez une validation backend pour toutes les opérations critiques
4. Consultez un conseiller financier avant de prendre des décisions d'investissement
5. Ne risquez jamais plus que ce que vous pouvez vous permettre de perdre

**Les performances passées ne garantissent pas les résultats futurs.** Le trading de cryptomonnaies comporte des risques significatifs.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs via les issues
- Proposer de nouvelles fonctionnalités
- Soumettre des pull requests
- Améliorer la documentation

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur le repository.

---

**Made with ❤️ for the crypto community**
