// ===== CHART CONFIGURATION =====
const chartColors = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    background: '#1e2433',
    border: '#2d3748',
    text: '#9ca3af'
};

const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: chartColors.text,
                font: {
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }
            }
        },
        tooltip: {
            backgroundColor: chartColors.background,
            titleColor: '#ffffff',
            bodyColor: chartColors.text,
            borderColor: chartColors.border,
            borderWidth: 1
        }
    },
    scales: {
        x: {
            ticks: {
                color: chartColors.text
            },
            grid: {
                color: chartColors.border
            }
        },
        y: {
            ticks: {
                color: chartColors.text
            },
            grid: {
                color: chartColors.border
            }
        }
    }
};

// ===== SPARKLINE CHART =====
function createSparkline(canvasId, data, color = chartColors.success) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(data.length).fill(''),
            datasets: [{
                data: data,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

// ===== HEATMAP CHART (Bubble) =====
function createHeatmap(canvasId, cryptos) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const bubbleData = cryptos.map((crypto, index) => {
        const scoring = new CryptoScoring(crypto);
        scoring.calculateTotalScore();

        return {
            x: crypto.priceChange24h,
            y: scoring.total,
            r: Math.sqrt(crypto.marketCap / 1000000000) * 5, // Scale bubble size
            crypto: crypto,
            score: scoring.total
        };
    });

    return new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Opportunités',
                data: bubbleData,
                backgroundColor: bubbleData.map(d => {
                    if (d.score >= 80) return chartColors.success + '80';
                    if (d.score >= 75) return chartColors.info + '80';
                    return chartColors.warning + '80';
                }),
                borderColor: bubbleData.map(d => {
                    if (d.score >= 80) return chartColors.success;
                    if (d.score >= 75) return chartColors.info;
                    return chartColors.warning;
                }),
                borderWidth: 2
            }]
        },
        options: {
            ...defaultChartOptions,
            plugins: {
                ...defaultChartOptions.plugins,
                legend: { display: false },
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const crypto = context.raw.crypto;
                            return [
                                `${crypto.name} (${crypto.symbol})`,
                                `Score: ${context.raw.score}`,
                                `Prix: $${crypto.price.toFixed(2)}`,
                                `Market Cap: ${formatNumber(crypto.marketCap)}`,
                                `Performance 30j: ${context.parsed.x.toFixed(2)}%`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Performance 30 jours (%)',
                        color: chartColors.text
                    },
                    ticks: { color: chartColors.text },
                    grid: { color: chartColors.border }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Score d\'Opportunité',
                        color: chartColors.text
                    },
                    min: 60,
                    max: 100,
                    ticks: { color: chartColors.text },
                    grid: { color: chartColors.border }
                }
            }
        }
    });
}

// ===== PRICE HISTORY CHART =====
function createPriceChart(canvasId, crypto) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const priceHistory = generatePriceHistory(crypto.price, 90);

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: priceHistory.map(d => d.date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Prix (USD)',
                data: priceHistory.map(d => d.price),
                borderColor: chartColors.primary,
                backgroundColor: chartColors.primary + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            ...defaultChartOptions,
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return 'Prix: $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: chartColors.text,
                        maxTicksLimit: 10
                    },
                    grid: { color: chartColors.border }
                },
                y: {
                    ticks: {
                        color: chartColors.text,
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    },
                    grid: { color: chartColors.border }
                }
            }
        }
    });
}

// ===== ALLOCATION PIE CHART =====
function createAllocationChart(canvasId, holdings, cryptoDatabase) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const sectorAllocation = {};
    let totalValue = 0;

    holdings.forEach(holding => {
        const crypto = cryptoDatabase.find(c => c.id === holding.crypto);
        if (!crypto) return;

        const value = holding.quantity * crypto.price;
        totalValue += value;

        if (!sectorAllocation[crypto.category]) {
            sectorAllocation[crypto.category] = 0;
        }
        sectorAllocation[crypto.category] += value;
    });

    const sectorColors = {
        layer1: chartColors.primary,
        layer2: chartColors.secondary,
        defi: chartColors.success,
        oracle: chartColors.warning,
        gaming: chartColors.danger,
        ai: chartColors.info
    };

    const sectorLabels = {
        layer1: 'Layer 1',
        layer2: 'Layer 2',
        defi: 'DeFi',
        oracle: 'Oracle',
        gaming: 'Gaming',
        ai: 'AI'
    };

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(sectorAllocation).map(k => sectorLabels[k]),
            datasets: [{
                data: Object.values(sectorAllocation),
                backgroundColor: Object.keys(sectorAllocation).map(k => sectorColors[k]),
                borderColor: chartColors.background,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: chartColors.text,
                        padding: 15,
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percent = ((value / totalValue) * 100).toFixed(1);
                            return `${context.label}: ${formatNumber(value)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ===== RISK ALLOCATION BAR CHART =====
function createRiskAllocationChart(canvasId, holdings, cryptoDatabase) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const positions = holdings.map(holding => {
        const crypto = cryptoDatabase.find(c => c.id === holding.crypto);
        if (!crypto) return null;

        const value = holding.quantity * crypto.price;
        // Risk score = inverse of crypto score (lower score = higher risk)
        const riskScore = 100 - crypto.score;

        return {
            name: crypto.symbol,
            value: value,
            risk: riskScore,
            riskValue: value * (riskScore / 100)
        };
    }).filter(p => p !== null).sort((a, b) => b.riskValue - a.riskValue);

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: positions.map(p => p.name),
            datasets: [{
                label: 'Valeur Risque ($)',
                data: positions.map(p => p.riskValue),
                backgroundColor: positions.map(p => {
                    if (p.risk > 30) return chartColors.danger;
                    if (p.risk > 20) return chartColors.warning;
                    return chartColors.success;
                }),
                borderColor: chartColors.border,
                borderWidth: 1
            }]
        },
        options: {
            ...defaultChartOptions,
            indexAxis: 'y',
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return 'Valeur à Risque: $' + context.parsed.x.toFixed(0);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: chartColors.text,
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    },
                    grid: { color: chartColors.border }
                },
                y: {
                    ticks: { color: chartColors.text },
                    grid: { display: false }
                }
            }
        }
    });
}

// ===== SCORE BREAKDOWN RADAR CHART =====
function createScoreRadarChart(canvasId, crypto) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const scoring = new CryptoScoring(crypto);
    scoring.calculateTotalScore();
    const breakdown = scoring.getBreakdown();

    return new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Valorisation (35)', 'Croissance (30)', 'Fondamentaux (25)', 'Momentum (10)'],
            datasets: [{
                label: 'Score',
                data: [
                    breakdown.valuation.score,
                    breakdown.growth.score,
                    breakdown.fundamental.score,
                    breakdown.momentum.score
                ],
                backgroundColor: chartColors.primary + '40',
                borderColor: chartColors.primary,
                borderWidth: 2,
                pointBackgroundColor: chartColors.primary,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: chartColors.primary
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.r.toFixed(1) + ' points';
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: { color: chartColors.text },
                    grid: { color: chartColors.border },
                    pointLabels: { color: chartColors.text }
                }
            }
        }
    });
}

// ===== CORRELATION HEATMAP =====
function createCorrelationHeatmap(containerId, holdings, cryptoDatabase) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`[Correlation Heatmap] Container "${containerId}" not found`);
        return;
    }

    if (!holdings || holdings.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-secondary);">Aucune position dans le portfolio</p>';
        console.warn('[Correlation Heatmap] No holdings provided');
        return;
    }

    const cryptos = holdings.map(h => cryptoDatabase.find(c => c.id === h.crypto)).filter(c => c);

    if (cryptos.length < 2) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-secondary);">Au moins 2 positions requises pour afficher la corrélation</p>';
        console.warn(`[Correlation Heatmap] Only ${cryptos.length} valid crypto(s) found`);
        return;
    }

    console.log(`[Correlation Heatmap] Generating heatmap for ${cryptos.length} cryptos:`, cryptos.map(c => c.symbol).join(', '));

    // Generate correlation matrix (simulated)
    const matrix = [];
    for (let i = 0; i < cryptos.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < cryptos.length; j++) {
            if (i === j) {
                matrix[i][j] = 1.0;
            } else {
                // Simulate correlation based on category
                const sameCategory = cryptos[i].category === cryptos[j].category;
                matrix[i][j] = sameCategory ?
                    0.6 + Math.random() * 0.3 :
                    0.2 + Math.random() * 0.4;
            }
        }
    }

    // Build HTML table
    let html = '<table class="correlation-table" style="width: 100%; border-collapse: collapse;">';
    html += '<tr><th style="padding: 8px; border: 1px solid #2d3748;"></th>';
    cryptos.forEach(c => {
        html += `<th style="padding: 8px; border: 1px solid #2d3748; font-size: 12px;">${c.symbol}</th>`;
    });
    html += '</tr>';

    cryptos.forEach((c1, i) => {
        html += `<tr><th style="padding: 8px; border: 1px solid #2d3748; font-size: 12px;">${c1.symbol}</th>`;
        cryptos.forEach((c2, j) => {
            const corr = matrix[i][j];
            const color = corr > 0.7 ? '#ef4444' : corr > 0.4 ? '#f59e0b' : '#10b981';
            html += `<td style="padding: 8px; border: 1px solid #2d3748; text-align: center; background: ${color}30; color: ${color}; font-weight: 600; font-size: 11px;">${corr.toFixed(2)}</td>`;
        });
        html += '</tr>';
    });
    html += '</table>';

    container.innerHTML = html;
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createSparkline,
        createHeatmap,
        createPriceChart,
        createAllocationChart,
        createRiskAllocationChart,
        createScoreRadarChart,
        createCorrelationHeatmap
    };
}
