# 🔧 Guide de Dépannage

## Table des Matières
1. [Erreurs CORS](#erreurs-cors)
2. [Pas de signaux affichés](#pas-de-signaux-affichés)
3. [Performance lente](#performance-lente)
4. [Problèmes d'API](#problèmes-dapi)
5. [Autres problèmes](#autres-problèmes)

---

## 🚨 Erreurs CORS

### Symptôme
```
Access to fetch at 'https://api.coingecko.com/...' from origin 'null'
has been blocked by CORS policy
```

### Cause
Vous ouvrez `index.html` directement (`file://` protocol) au lieu d'utiliser un serveur HTTP.

### Solution

**Option 1 : Serveur Python (Recommandé)**
```bash
# Windows
python -m http.server 8000

# Linux/Mac
python3 -m http.server 8000
```
Puis ouvrir **http://localhost:8000**

**Option 2 : VS Code Live Server**
1. Installer l'extension "Live Server"
2. Clic-droit sur `index.html`
3. "Open with Live Server"

**Option 3 : Désactiver les API**
Dans `config.js`, modifier :
```javascript
FORCE_SIMULATED_DATA: true
```
→ Utilise uniquement des données simulées (pas d'appels API)

**Voir aussi** : [START_HERE.md](START_HERE.md) pour plus de détails

---

## 📊 Pas de signaux affichés

### Symptôme
La section "🎯 Signaux d'Entrée Optimaux" est vide ou affiche "Aucun signal détecté".

### Diagnostic

**Ouvrir la Console (F12)** et vérifier les messages :

#### Cas 1 : "0 STRONG/GOOD signals"
```
📈 Signal Distribution: {
  STRONG_ENTRY: 0,
  GOOD_ENTRY: 0,
  MODERATE_ENTRY: 12
}
```

**Cause** : Aucune crypto ne qualifie pour STRONG ou GOOD, mais il y a des MODERATE.

**Solution** :
1. Activer l'affichage des signaux MODERATE dans `config.js` :
   ```javascript
   SHOW_MODERATE_SIGNALS: true
   ```

2. **OU** baisser le seuil du score fondamental :
   ```javascript
   MINIMUM_FUNDAMENTAL_SCORE: 65  // au lieu de 70
   ```

#### Cas 2 : "0 qualified cryptos"
```
🎯 Generating advanced signals for 0 qualified cryptos...
```

**Cause** : Aucune crypto n'a un score fondamental ≥ 70.

**Solution** : Baisser le seuil dans `config.js` :
```javascript
MINIMUM_FUNDAMENTAL_SCORE: 60
```

#### Cas 3 : Erreurs dans la console
```
❌ Error generating signal for BTC: ...
```

**Solution** : Vérifier que tous les modules sont chargés correctement (F12 → Network).

---

## 🐌 Performance lente

### Symptôme
La génération des signaux prend plus de 10 secondes.

### Solutions

**1. Réduire le nombre de cryptos**
Dans `data.js`, garder seulement les cryptos qui vous intéressent.

**2. Augmenter le cache**
Dans `config.js` :
```javascript
SIGNALS_CACHE_DURATION_MS: 10 * 60 * 1000  // 10 minutes au lieu de 5
```

**3. Désactiver les données réelles**
Si vous testez localement :
```javascript
FORCE_SIMULATED_DATA: true
```

**4. Désactiver le mode debug**
```javascript
DEBUG_MODE: false
```

---

## 🌐 Problèmes d'API

### Rate Limiting (429 Too Many Requests)

**Symptôme** :
```
⚠️ Rate limited by CoinGecko API, using simulated data
```

**Cause** : CoinGecko free tier = 50 requêtes/minute max.

**Solutions** :
1. Augmenter le délai entre requêtes dans `config.js` :
   ```javascript
   API_RATE_LIMIT_DELAY_MS: 2000  // 2 secondes au lieu de 1.2s
   ```

2. Utiliser le cache plus longtemps :
   ```javascript
   API_CACHE_DURATION_MS: 60 * 60 * 1000  // 1 heure au lieu de 30 min
   ```

### API Indisponible

**Symptôme** :
```
❌ API error: 503
```

**Cause** : CoinGecko API temporairement down.

**Solution** : Le système utilise automatiquement les données simulées. Réessayer plus tard.

---

## 🔍 Autres problèmes

### Modules manquants

**Symptôme** :
```
⚠️ Missing classes: Array(9)
```

**Vérification** : F12 → Network → Vérifier que tous les fichiers sont chargés :
- `config.js`
- `modules/technical-analysis.js`
- `modules/fibonacci-clusters.js`
- `modules/entry-signals.js`
- `modules/risk-management.js`
- `modules/ohlcv-generator.js`
- `modules/real-data-fetcher.js`
- `advanced-signals.js`

**Solution** : Si un fichier est 404, vérifier le chemin dans `index.html`.

### Plans de trade ne s'ouvrent pas

**Symptôme** : Cliquer sur "Voir Plan de Trade" ne fait rien ou affiche une erreur.

**Causes possibles** :
1. **Cache expiré (5 minutes)** : Le signal a été généré il y a plus de 5 minutes
2. **Signal non généré** : Une erreur s'est produite lors de la génération initiale
3. **Erreur JavaScript** : Problème dans le code

**Diagnostic** :

**Étape 1 : Vérifier la console (F12)**
```
🔍 Opening trade plan for crypto ID: ethereum
✅ Found crypto: ETH (Ethereum)
⚠️ Signal not in cache for ETH, regenerating...
✅ Signal regenerated for ETH
✅ Trade plan generated for ETH
```

Si vous voyez ce pattern, c'est **normal** - le système régénère automatiquement le signal.

**Étape 2 : Déboguer le cache**
Dans la console, taper :
```javascript
debugSignalsCache()
```

Cela affiche :
```
═══════════════════════════════════════
🔍 SIGNALS CACHE DEBUG
═══════════════════════════════════════

📦 Cache size: 15
📊 Signals generated: 15

🗂️ Cached signals:
   ✅ ethereum: ETH - MODERATE_ENTRY (2 min ago)
   ✅ arbitrum: ARB - MODERATE_ENTRY (2 min ago)
   ❌ optimism: OP - MODERATE_ENTRY (6 min ago)  ← Expiré!
   ...
```

**Solutions** :

1. **Si cache expiré** : Actualiser les signaux (bouton 🔄)

2. **Si signal manquant** : Le système le régénère automatiquement. Attendre 2-3 secondes.

3. **Si erreur persiste** :
   ```javascript
   // Tester manuellement
   showTradePlan('ethereum');
   ```

4. **Si l'erreur dit "Crypto non trouvée"** :
   - Vérifier que l'ID existe dans la database :
   ```javascript
   getCurrentDatabase().find(c => c.id === 'ethereum')
   ```

### Graphiques ne s'affichent pas

**Cause** : Données OHLCV manquantes ou invalides.

**Vérification** :
```javascript
// Dans la console
const crypto = getCurrentDatabase().find(c => c.symbol === 'btc');
const builder = new HybridDataBuilder(crypto);
builder.build().then(data => console.log(data));
```

Si `data` est vide, problème de génération.

---

## 📞 Support

### Vérifications de base

Avant de chercher de l'aide, vérifier :

1. ✅ **Serveur HTTP lancé** (pas `file://`)
   - URL commence par `http://localhost`

2. ✅ **Console sans erreur** (F12)
   - Pas d'erreurs rouges

3. ✅ **Tous les modules chargés**
   - F12 → Network → Pas de 404

4. ✅ **Configuration valide**
   - `config.js` chargé en premier
   - Pas d'erreur de syntaxe

### Collecter les logs

Pour signaler un problème :

1. Ouvrir la Console (F12)
2. Copier TOUS les messages (Ctrl+A, Ctrl+C)
3. Joindre aussi :
   - Votre configuration (`config.js`)
   - Version du navigateur
   - Système d'exploitation

---

## 🎯 Checklist de démarrage rapide

**Avant la première utilisation** :

- [ ] Lancer un serveur HTTP (`python -m http.server 8000`)
- [ ] Ouvrir http://localhost:8000 (pas `file://`)
- [ ] Vérifier la console : pas d'erreur CORS
- [ ] Attendre 5-10 secondes que les signaux se génèrent
- [ ] Aller sur la page **Scanner**
- [ ] Voir la section **🎯 Signaux d'Entrée Optimaux**

**Si problème** :

1. Lire la console (F12)
2. Identifier l'erreur dans ce guide
3. Appliquer la solution

---

## 💡 Conseils de configuration

### Configuration recommandée (production)
```javascript
USE_REAL_API_DATA: true,
FORCE_SIMULATED_DATA: false,
MINIMUM_FUNDAMENTAL_SCORE: 70,
SHOW_MODERATE_SIGNALS: true,
MAX_SIGNALS_DISPLAYED: 15,
DEBUG_MODE: false
```

### Configuration recommandée (développement)
```javascript
USE_REAL_API_DATA: false,  // Plus rapide
FORCE_SIMULATED_DATA: true,
MINIMUM_FUNDAMENTAL_SCORE: 60,  // Plus de signaux
SHOW_MODERATE_SIGNALS: true,
MAX_SIGNALS_DISPLAYED: 20,
DEBUG_MODE: true  // Logs détaillés
```

### Configuration recommandée (test API)
```javascript
USE_REAL_API_DATA: true,
FORCE_SIMULATED_DATA: false,
API_CACHE_DURATION_MS: 5 * 60 * 1000,  // 5 min (cache court)
DEBUG_MODE: true
```

---

Créé le : 2025-11-10
Version : 1.0.0
