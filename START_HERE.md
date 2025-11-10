# 🚀 Comment Démarrer le Dashboard (IMPORTANT)

## ⚠️ Problème CORS

Si vous ouvrez `index.html` directement dans le navigateur, vous aurez des erreurs CORS :
```
Access to fetch at 'https://api.coingecko.com/...' from origin 'null' has been blocked by CORS policy
```

**Pourquoi ?** Les navigateurs bloquent les appels API depuis `file://` pour des raisons de sécurité.

**Solution :** Utiliser un serveur HTTP local.

---

## ✅ Solution 1 : Python (Recommandé)

### Windows
```bash
# Double-cliquer sur start-server.bat
# OU exécuter dans le terminal :
python -m http.server 8000
```

### Linux / macOS
```bash
# Rendre le script exécutable
chmod +x start-server.sh

# Lancer le serveur
./start-server.sh

# OU directement :
python3 -m http.server 8000
```

### Ensuite
1. Ouvrir votre navigateur
2. Aller sur **http://localhost:8000**
3. ✅ Les APIs fonctionneront !

---

## ✅ Solution 2 : Node.js (Alternative)

Si vous avez Node.js installé :

```bash
node server.js
```

Puis ouvrir **http://localhost:8000**

---

## ✅ Solution 3 : VS Code Live Server (Simple)

Si vous utilisez VS Code :

1. Installer l'extension **Live Server**
2. Clic-droit sur `index.html`
3. Choisir **"Open with Live Server"**
4. ✅ S'ouvre automatiquement sur http://localhost:5500

---

## ✅ Solution 4 : Autres Serveurs

### npx (sans installation)
```bash
npx http-server -p 8000
```

### PHP
```bash
php -S localhost:8000
```

### Ruby
```bash
ruby -run -ehttpd . -p 8000
```

---

## 🔍 Vérifier que ça fonctionne

Après avoir lancé le serveur :

1. Ouvrir **http://localhost:8000**
2. Ouvrir la Console (F12)
3. Vous devriez voir :
   ```
   ✅ Fetched 180 candles for ethereum
   ✅ Using real data for ETH
   ✅ Fetched 180 candles for arbitrum
   ✅ Using real data for ARB
   ...
   ```

4. Pas d'erreurs CORS !

---

## 🚨 Si Python n'est pas installé

### Télécharger Python

**Windows** : https://www.python.org/downloads/
- ✅ Cocher "Add Python to PATH" pendant l'installation

**macOS** :
```bash
brew install python3
```

**Ubuntu/Debian** :
```bash
sudo apt-get install python3
```

---

## 📊 Résultat Attendu

Après avoir résolu CORS, vous devriez voir :

### Console
```
🎯 Generating advanced signals for 15 qualified cryptos...
📊 Processing ETH...
  🌐 Fetching real data for ethereum (30 days)...
  ✅ Fetched 180 candles for ethereum
  ✅ Using real data for ETH
  ↳ ETH: GOOD_ENTRY (Score: 65.3%, Conf: 4/7)

📊 Processing ARB...
  ✅ Fetched 180 candles for arbitrum
  ✅ Using real data for ARB
  ↳ ARB: MODERATE_ENTRY (Score: 52.4%, Conf: 3/7)

...

📈 Signal Distribution: {
  STRONG_ENTRY: 3,
  GOOD_ENTRY: 8,
  MODERATE_ENTRY: 4
}
✅ Top signals (STRONG + GOOD): 11
```

### Interface
- Section **🎯 Signaux d'Entrée Optimaux** visible
- Statistiques : `[3 STRONG] [8 GOOD] [4 MODERATE]`
- Cartes de signaux avec plans de trade

---

## ❓ Questions Fréquentes

### Q: Puis-je simplement désactiver CORS dans mon navigateur ?
**R:** Non recommandé pour des raisons de sécurité. Utilisez un serveur local.

### Q: Le port 8000 est déjà utilisé
**R:** Changez le port :
```bash
python -m http.server 8080  # Utilisez 8080
```
Puis ouvrez http://localhost:8080

### Q: J'ai toujours des erreurs
**R:** Vérifiez :
1. Le serveur est bien lancé (message dans le terminal)
2. Vous accédez à `http://localhost:8000` (pas `file://`)
3. Votre pare-feu autorise le port 8000

---

## 📝 Notes Techniques

### Pourquoi CORS existe ?
- Protège contre les attaques XSS (Cross-Site Scripting)
- Empêche les scripts malveillants de voler des données

### Pourquoi `file://` ne fonctionne pas ?
- Le navigateur considère `file://` comme "origin null"
- CoinGecko API n'autorise pas "origin null" (sécurité)

### Pourquoi un serveur local résout le problème ?
- `http://localhost:8000` est une origin valide
- Le navigateur autorise les requêtes CORS depuis localhost

---

## 🎯 Quick Start (TL;DR)

**Windows** :
```bash
python -m http.server 8000
```

**Linux/Mac** :
```bash
python3 -m http.server 8000
```

**Ouvrir** : http://localhost:8000

**C'est tout !** 🚀

---

Créé le : 2025-11-10
Version : 1.0.0
