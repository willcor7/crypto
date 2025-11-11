/**
 * TEST - Crypto ID Resolver
 * Valide la résolution d'IDs et symbols
 */

const resolver = require('../utils/crypto-id-resolver.js');

console.log('=== TEST CRYPTO ID RESOLVER ===\n');

// Test 1: Résolution d'aliases
console.log('Test 1: ID Aliases');
const aliases = [
    { input: 'polygon', expected: 'matic-network' },
    { input: 'immutable', expected: 'immutable-x' },
    { input: 'render', expected: 'render-token' },
    { input: 'curve', expected: 'curve-dao-token' },
    { input: 'fetchai', expected: 'fetch-ai' },
    { input: 'lido', expected: 'lido-dao' }
];

let passed = 0;
let failed = 0;

aliases.forEach(test => {
    const result = resolver.resolveCryptoId(test.input);
    if (result === test.expected) {
        console.log(`✓ ${test.input} → ${result}`);
        passed++;
    } else {
        console.log(`✗ ${test.input} → ${result} (expected: ${test.expected})`);
        failed++;
    }
});

console.log(`\nTest 1 Results: ${passed}/${aliases.length} passed\n`);

// Test 2: Résolution de symbols
console.log('Test 2: Symbol Resolution');
const symbols = [
    { input: 'MATIC', expected: 'matic-network' },
    { input: 'IMX', expected: 'immutable-x' },
    { input: 'RNDR', expected: 'render-token' },
    { input: 'CRV', expected: 'curve-dao-token' },
    { input: 'FET', expected: 'fetch-ai' },
    { input: 'LDO', expected: 'lido-dao' }
];

let passed2 = 0;
let failed2 = 0;

symbols.forEach(test => {
    const result = resolver.resolveSymbolToId(test.input);
    if (result === test.expected) {
        console.log(`✓ ${test.input} → ${result}`);
        passed2++;
    } else {
        console.log(`✗ ${test.input} → ${result} (expected: ${test.expected})`);
        failed2++;
    }
});

console.log(`\nTest 2 Results: ${passed2}/${symbols.length} passed\n`);

// Test 3: Résolution flexible
console.log('Test 3: Flexible Resolution');
const flexible = [
    { input: 'polygon', expected: 'matic-network' },
    { input: 'MATIC', expected: 'matic-network' },
    { input: 'ethereum', expected: 'ethereum' },
    { input: 'ETH', expected: 'ethereum' }
];

let passed3 = 0;
let failed3 = 0;

flexible.forEach(test => {
    const result = resolver.resolveFlexible(test.input);
    if (result === test.expected) {
        console.log(`✓ ${test.input} → ${result}`);
        passed3++;
    } else {
        console.log(`✗ ${test.input} → ${result} (expected: ${test.expected})`);
        failed3++;
    }
});

console.log(`\nTest 3 Results: ${passed3}/${flexible.length} passed\n`);

// Test 4: Validation des aliases
console.log('Test 4: isAlias()');
console.log(`  polygon is alias: ${resolver.isAlias('polygon')} (expected: true)`);
console.log(`  ethereum is alias: ${resolver.isAlias('ethereum')} (expected: false)`);
console.log(`  immutable is alias: ${resolver.isAlias('immutable')} (expected: true)`);

// Test 5: Liste complète
console.log('\nTest 5: Complete Lists');
const allAliases = resolver.getAllAliases();
const allSymbols = resolver.getAllSymbols();
console.log(`  Total aliases defined: ${Object.keys(allAliases).length}`);
console.log(`  Total symbols defined: ${Object.keys(allSymbols).length}`);

// Résumé final
const totalTests = aliases.length + symbols.length + flexible.length;
const totalPassed = passed + passed2 + passed3;
const totalFailed = failed + failed2 + failed3;

console.log('\n=== SUMMARY ===');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${totalPassed} ✓`);
console.log(`Failed: ${totalFailed} ✗`);

if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    process.exit(0);
} else {
    console.log('\n❌ SOME TESTS FAILED');
    process.exit(1);
}
