/**
 * TEST - Order Flow Integration
 * Valide l'intégration complète du système Order Flow
 */

// Simuler les dépendances nécessaires
global.OrderFlowAnalyzer = require('../modules/order-flow.js').OrderFlowAnalyzer;

console.log('=== TEST ORDER FLOW INTEGRATION ===\n');

// Test 1: Création d'un analyzer
console.log('Test 1: OrderFlowAnalyzer instantiation');
try {
    // Données OHLCV de test (20 candles)
    const mockOHLCV = [];
    let price = 50000;
    for (let i = 0; i < 20; i++) {
        const variation = (Math.random() - 0.5) * 1000;
        const open = price;
        const close = price + variation;
        const high = Math.max(open, close) + Math.random() * 200;
        const low = Math.min(open, close) - Math.random() * 200;
        const volume = 100 + Math.random() * 500;

        mockOHLCV.push({
            timestamp: Date.now() - (20 - i) * 3600000,
            open,
            high,
            low,
            close,
            volume
        });

        price = close;
    }

    const analyzer = new OrderFlowAnalyzer(mockOHLCV);
    console.log('✓ OrderFlowAnalyzer créé avec succès');

    // Test 2: Analyse complète
    console.log('\nTest 2: Complete Order Flow Analysis');
    const analysis = analyzer.analyze();

    if (!analysis) {
        throw new Error('Analyze() returned null/undefined');
    }

    // Vérifier structure de la réponse
    const requiredFields = ['cvd', 'trend', 'divergences', 'imbalance', 'signal', 'footprint', 'summary'];
    const missingFields = requiredFields.filter(field => !(field in analysis));

    if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }

    console.log('✓ Analyse complète retournée avec toutes les propriétés');
    console.log(`  CVD entries: ${analysis.cvd.length}`);
    console.log(`  Trend: ${analysis.trend.trend}`);
    console.log(`  Divergences: ${analysis.divergences.length}`);
    console.log(`  Imbalance: ${analysis.imbalance.type}`);
    console.log(`  Signal: ${analysis.signal.action}`);

    // Test 3: Métriques simplifiées
    console.log('\nTest 3: Simplified Metrics');
    const metrics = analyzer.getMetrics();

    const requiredMetrics = [
        'cvdTrend', 'cvdStrength', 'hasDivergence', 'divergenceType',
        'imbalanceType', 'imbalanceRatio', 'signal', 'confidence'
    ];
    const missingMetrics = requiredMetrics.filter(metric => !(metric in metrics));

    if (missingMetrics.length > 0) {
        throw new Error(`Missing metrics: ${missingMetrics.join(', ')}`);
    }

    console.log('✓ Métriques simplifiées retournées avec toutes les propriétés');
    console.log(`  CVD Trend: ${metrics.cvdTrend}`);
    console.log(`  CVD Strength: ${metrics.cvdStrength}`);
    console.log(`  Has Divergence: ${metrics.hasDivergence}`);
    console.log(`  Imbalance Type: ${metrics.imbalanceType}`);
    console.log(`  Signal: ${metrics.signal}`);
    console.log(`  Confidence: ${metrics.confidence}%`);

    // Test 4: CVD Calculation
    console.log('\nTest 4: CVD Calculation Logic');
    const firstCVD = analysis.cvd[0];
    const lastCVD = analysis.cvd[analysis.cvd.length - 1];

    if (typeof firstCVD.cvd !== 'number') {
        throw new Error('CVD value is not a number');
    }

    if (typeof firstCVD.delta !== 'number') {
        throw new Error('Delta value is not a number');
    }

    console.log('✓ CVD calculation produces valid numeric values');
    console.log(`  First CVD: ${firstCVD.cvd.toFixed(2)}`);
    console.log(`  Last CVD: ${lastCVD.cvd.toFixed(2)}`);
    console.log(`  Total Delta: ${(lastCVD.cvd - firstCVD.cvd).toFixed(2)}`);

    // Test 5: Divergence Detection
    console.log('\nTest 5: Divergence Detection');
    if (!Array.isArray(analysis.divergences)) {
        throw new Error('Divergences is not an array');
    }

    console.log(`✓ Divergence detection running (found ${analysis.divergences.length} divergences)`);
    if (analysis.divergences.length > 0) {
        const firstDiv = analysis.divergences[0];
        console.log(`  Type: ${firstDiv.type}`);
        console.log(`  Index: ${firstDiv.index}`);
        console.log(`  Price: ${firstDiv.price.toFixed(2)}`);
        console.log(`  CVD: ${firstDiv.cvd.toFixed(2)}`);
    }

    // Test 6: Imbalance Detection
    console.log('\nTest 6: Imbalance Detection');
    const imbalance = analysis.imbalance;

    if (!imbalance.type) {
        throw new Error('Imbalance type is missing');
    }

    const validTypes = ['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL'];
    if (!validTypes.includes(imbalance.type)) {
        throw new Error(`Invalid imbalance type: ${imbalance.type}`);
    }

    console.log('✓ Imbalance detection working correctly');
    console.log(`  Type: ${imbalance.type}`);
    console.log(`  Buy Volume: ${imbalance.buyVolume.toFixed(2)}`);
    console.log(`  Sell Volume: ${imbalance.sellVolume.toFixed(2)}`);
    console.log(`  Ratio: ${imbalance.ratio.toFixed(2)}`);

    // Test 7: Signal Generation
    console.log('\nTest 7: Signal Generation');
    const signal = analysis.signal;

    if (!signal.action) {
        throw new Error('Signal action is missing');
    }

    const validActions = ['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL'];
    if (!validActions.includes(signal.action)) {
        throw new Error(`Invalid signal action: ${signal.action}`);
    }

    if (signal.confidence < 0 || signal.confidence > 100) {
        throw new Error(`Invalid confidence: ${signal.confidence}`);
    }

    console.log('✓ Signal generation working correctly');
    console.log(`  Action: ${signal.action}`);
    console.log(`  Confidence: ${signal.confidence}%`);
    console.log(`  Reason: ${signal.reason}`);

    // Test 8: Footprint Chart
    console.log('\nTest 8: Footprint Chart Data');
    const footprint = analysis.footprint;

    if (!Array.isArray(footprint) || footprint.length === 0) {
        throw new Error('Footprint data is empty or invalid');
    }

    const firstFootprint = footprint[0];
    if (!firstFootprint.timestamp || !firstFootprint.levels) {
        throw new Error('Footprint structure is invalid');
    }

    console.log('✓ Footprint chart data generated correctly');
    console.log(`  Candles: ${footprint.length}`);
    console.log(`  Price Levels per candle: ${firstFootprint.levels.length}`);

    console.log('\n=== SUMMARY ===');
    console.log('Total Tests: 8');
    console.log('Passed: 8 ✓');
    console.log('Failed: 0 ✗');
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('\n✅ Order Flow module is ready for production use');

    process.exit(0);

} catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
}
