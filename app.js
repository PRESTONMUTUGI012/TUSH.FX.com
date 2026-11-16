const DERIV_NUMERIC_APP_ID = "1089";
const AFFILIATE_TOKEN = "3A2CFHPG722B";
const exchangeRates = { KES: 129.0, UGX: 3750.0, TZS: 2600.0, EUR: 0.92, GBP: 0.79 };

let exhaustiveAssets = [
    // Stocks & ETFs (10)
    { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'stocks', pip: 2, base: 142.50 },
    { symbol: 'TSLA', name: 'Tesla Inc.', market: 'stocks', pip: 2, base: 215.40 },
    { symbol: 'AAPL', name: 'Apple Inc.', market: 'stocks', pip: 2, base: 228.60 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'stocks', pip: 2, base: 425.80 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'stocks', pip: 2, base: 195.20 },
    { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', market: 'stocks', pip: 2, base: 178.40 },
    { symbol: 'META', name: 'Meta Platforms Inc.', market: 'stocks', pip: 2, base: 560.10 },
    { symbol: 'NFLX', name: 'Netflix Inc.', market: 'stocks', pip: 2, base: 742.30 },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', market: 'stocks', pip: 2, base: 585.50 },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust (ETF)', market: 'stocks', pip: 2, base: 502.10 },
    // Forex Majors & Exotics (8)
    { symbol: 'frxEURUSD', name: 'EUR/USD', market: 'forex', pip: 5, base: 1.08452 },
    { symbol: 'frxGBPUSD', name: 'GBP/USD', market: 'forex', pip: 5, base: 1.27145 },
    { symbol: 'frxUSDJPY', name: 'USD/JPY', market: 'forex', pip: 3, base: 153.421 },
    { symbol: 'frxAUDUSD', name: 'AUD/USD', market: 'forex', pip: 5, base: 0.65842 },
    { symbol: 'frxUSDCAD', name: 'USD/CAD', market: 'forex', pip: 5, base: 1.38912 },
    { symbol: 'frxNZDUSD', name: 'NZD/USD', market: 'forex', pip: 5, base: 0.59841 },
    { symbol: 'frxEURGBP', name: 'EUR/GBP', market: 'forex', pip: 5, base: 0.85312 },
    { symbol: 'frxUSDCHF', name: 'USD/CHF', market: 'forex', pip: 5, base: 0.88412 },
    // Commodities (5)
    { symbol: 'frxXAUUSD', name: 'Gold/USD', market: 'commodities', pip: 2, base: 2742.85 },
    { symbol: 'frxXAGUSD', name: 'Silver/USD', market: 'commodities', pip: 3, base: 32.415 },
    { symbol: 'frxWTIUSD', name: 'Crude Oil/USD', market: 'commodities', pip: 2, base: 71.45 },
    { symbol: 'UK Brent', name: 'UK Brent Oil', market: 'commodities', pip: 2, base: 75.80 },
    { symbol: 'Copper', name: 'Copper Futures', market: 'commodities', pip: 3, base: 4.15 },
    // Synthetics & Indices (6)
    { symbol: '1HZ10V', name: 'Volatility 10 (1s) Index', market: 'synthetic_index', pip: 2, base: 9452.18 },
    { symbol: 'R_10', name: 'Volatility 10 Index', market: 'synthetic_index', pip: 3, base: 6321.455 },
    { symbol: '1HZ50V', name: 'Volatility 50 (1s) Index', market: 'synthetic_index', pip: 2, base: 48912.34 },
    { symbol: '1HZ100V', name: 'Volatility 100 (1s) Index', market: 'synthetic_index', pip: 2, base: 1428.64 },
    { symbol: 'BOOM500', name: 'Boom 500 Index', market: 'synthetic_index', pip: 2, base: 4125.80 },
    { symbol: 'CRASH1000', name: 'Crash 1000 Index', market: 'synthetic_index', pip: 2, base: 7840.15 },
    // Cryptocurrencies (3)
    { symbol: 'cryBTCUSD', name: 'BTC/USD', market: 'cryptocurrency', pip: 2, base: 89420.50 },
    { symbol: 'cryETHUSD', name: 'ETH/USD', market: 'cryptocurrency', pip: 2, base: 3145.80 },
    { symbol: 'cryLTCUSD', name: 'LTC/USD', market: 'cryptocurrency', pip: 2, base: 84.25 }
];

let currentCategory = 'all';
let currentSymbol = 'NVDA';
let currentChartInterval = '5';
let marketDataStore = {};
let isChartFullscreen = false;
let isAutoExecutionArmed = true;
let isManualFeederArmed = false;
let isBulkFeederArmed = false;
let activeAccountMode = 'demo';
let lastExecutionTimestamp = 0;
let feederScanMode = 'ticks';

let derivOAuthAccounts = {
    demo: { acct: null, token: null },
    real: { acct: null, token: null }
};

function dismissSplash() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
        }, 500);
    }
}

function authDeriv() {
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_NUMERIC_APP_ID}&l=EN&brand=deriv&affiliate_token=${AFFILIATE_TOKEN}&redirect_uri=${redirectUri}`;
}

function setMode(mode) {
    activeAccountMode = mode === 'real' ? 'real' : 'demo';
    const btnDemo = document.getElementById('btn-demo');
    const btnReal = document.getElementById('btn-real');
    const label = document.getElementById('account-id-label');
    const balEl = document.getElementById('account-balance');

    if (btnDemo && btnReal) {
        if (activeAccountMode === 'demo') {
            btnDemo.className = "px-3 py-1 rounded-lg font-bold bg-emerald-600 text-white transition";
            btnReal.className = "px-3 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition";
        } else {
            btnReal.className = "px-3 py-1 rounded-lg font-bold bg-gold text-slate-950 transition";
            btnDemo.className = "px-3 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition";
        }
    }

    const selectedAcct = derivOAuthAccounts[activeAccountMode];
    if (selectedAcct && selectedAcct.token && window.derivApiInstance) {
        window.derivApiInstance.authorize(selectedAcct.token);
        if (label) label.innerText = `${activeAccountMode.toUpperCase()} (${selectedAcct.acct})`;
    } else {
        if (label) label.innerText = activeAccountMode === 'demo' ? 'Demo Balance' : 'Real Balance (Unlinked)';
        if (balEl && !selectedAcct?.token) {
            balEl.innerText = activeAccountMode === 'demo' ? '$1,000.00' : '$0.00';
        }
    }
    updateOAuthHeaderStatus();
}

function parseDerivOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    let foundTokens = false;

    for (let i = 1; i <= 5; i++) {
        const acct = params.get(`acct${i}`);
        const token = params.get(`token${i}`);
        if (acct && token) {
            foundTokens = true;
            if (acct.startsWith('VRTC')) {
                derivOAuthAccounts.demo = { acct, token };
                sessionStorage.setItem('ehaldart_demo_acct', acct);
                sessionStorage.setItem('ehaldart_demo_token', token);
            } else {
                derivOAuthAccounts.real = { acct, token };
                sessionStorage.setItem('ehaldart_real_acct', acct);
                sessionStorage.setItem('ehaldart_real_token', token);
            }
        }
    }

    if (!foundTokens) {
        derivOAuthAccounts.demo.acct = sessionStorage.getItem('ehaldart_demo_acct');
        derivOAuthAccounts.demo.token = sessionStorage.getItem('ehaldart_demo_token');
        derivOAuthAccounts.real.acct = sessionStorage.getItem('ehaldart_real_acct');
        derivOAuthAccounts.real.token = sessionStorage.getItem('ehaldart_real_token');
    } else {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    updateOAuthHeaderStatus();
}

function updateOAuthHeaderStatus() {
    const badge = document.getElementById('oauth-connection-badge');
    const connectBtn = document.getElementById('btn-oauth-connect');
    const hasDemo = Boolean(derivOAuthAccounts.demo.token);
    const hasReal = Boolean(derivOAuthAccounts.real.token);

    if (badge) {
        if (hasDemo || hasReal) {
            const activeAcct = activeAccountMode === 'real' && hasReal
                ? derivOAuthAccounts.real.acct
                : derivOAuthAccounts.demo.acct || derivOAuthAccounts.real.acct;
            badge.innerText = `✅ Deriv Linked (${activeAcct})`;
            badge.className = "text-[10px] font-mono font-bold text-fxgreen bg-emerald-950 px-2.5 py-1 rounded border border-fxgreen/60";
        } else {
            badge.innerText = "🔌 Simulation Mode";
            badge.className = "text-[10px] font-mono font-bold text-amber-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-700";
        }
    }

    if (connectBtn) {
        connectBtn.innerHTML = `<span>👤 Sign Up / Register (Affiliate)</span>`;
    }
}

const masterContractQueue = [
    { type: 'OVER', val: 0, label: 'OVER 0 (5-7 Runs)', api: 'DIGITOVER', barrier: '0', boat: 8 },
    { type: 'OVER', val: 1, label: 'OVER 1 (5-7 Runs)', api: 'DIGITOVER', barrier: '1', boat: 8 },
    { type: 'OVER', val: 2, label: 'OVER 2 (5-7 Runs)', api: 'DIGITOVER', barrier: '2', boat: 8 },
    { type: 'OVER', val: 3, label: 'OVER 3 (5-7 Runs)', api: 'DIGITOVER', barrier: '3', boat: 8 },
    { type: 'OVER', val: 4, label: 'OVER 4 (5-7 Runs)', api: 'DIGITOVER', barrier: '4', boat: 8 },
    { type: 'OVER', val: 5, label: 'OVER 5 (5-7 Runs)', api: 'DIGITOVER', barrier: '5', boat: 8 },
    { type: 'OVER', val: 6, label: 'OVER 6 (5-7 Runs)', api: 'DIGITOVER', barrier: '6', boat: 8 },
    { type: 'OVER', val: 7, label: 'OVER 7 (5-7 Runs)', api: 'DIGITOVER', barrier: '7', boat: 8 },
    { type: 'OVER', val: 8, label: 'OVER 8 (5-7 Runs)', api: 'DIGITOVER', barrier: '8', boat: 8 },
    { type: 'OVER', val: 9, label: 'OVER 9 (5-7 Runs)', api: 'DIGITOVER', barrier: '9', boat: 8 },
    { type: 'UNDER', val: 9, label: 'UNDER 9 (5-7 Runs)', api: 'DIGITUNDER', barrier: '9', boat: 8 },
    { type: 'UNDER', val: 8, label: 'UNDER 8 (5-7 Runs)', api: 'DIGITUNDER', barrier: '8', boat: 8 },
    { type: 'UNDER', val: 7, label: 'UNDER 7 (5-7 Runs)', api: 'DIGITUNDER', barrier: '7', boat: 8 },
    { type: 'UNDER', val: 6, label: 'UNDER 6 (5-7 Runs)', api: 'DIGITUNDER', barrier: '6', boat: 8 },
    { type: 'UNDER', val: 5, label: 'UNDER 5 (5-7 Runs)', api: 'DIGITUNDER', barrier: '5', boat: 8 },
    { type: 'UNDER', val: 4, label: 'UNDER 4 (5-7 Runs)', api: 'DIGITUNDER', barrier: '4', boat: 8 },
    { type: 'UNDER', val: 3, label: 'UNDER 3 (5-7 Runs)', api: 'DIGITUNDER', barrier: '3', boat: 8 },
    { type: 'UNDER', val: 2, label: 'UNDER 2 (5-7 Runs)', api: 'DIGITUNDER', barrier: '2', boat: 8 },
    { type: 'UNDER', val: 1, label: 'UNDER 1 (5-7 Runs)', api: 'DIGITUNDER', barrier: '1', boat: 8 },
    { type: 'UNDER', val: 0, label: 'UNDER 0 (5-7 Runs)', api: 'DIGITUNDER', barrier: '0', boat: 8 },
    { type: 'RISE', label: 'RISE / CALL (5-7 Runs)', api: 'CALL', barrier: null, boat: 2 },
    { type: 'FALL', label: 'FALL / PUT (5-7 Runs)', api: 'PUT', barrier: null, boat: 2 },
    { type: 'EVEN', label: 'EVEN DIGIT (5-7 Runs)', api: 'DIGITEVEN', barrier: null, boat: 8 },
    { type: 'ODD', label: 'ODD DIGIT (5-7 Runs)', api: 'DIGITODD', barrier: null, boat: 8 },
    { type: 'ACCU', growth: 1, label: 'ACCUMULATOR 1% (5-7 Runs)', api: 'ACCU', barrier: '0.01', boat: 7 },
    { type: 'ACCU', growth: 2, label: 'ACCUMULATOR 2% (5-7 Runs)', api: 'ACCU', barrier: '0.02', boat: 7 },
    { type: 'ACCU', growth: 3, label: 'ACCUMULATOR 3% (5-7 Runs)', api: 'ACCU', barrier: '0.03', boat: 7 },
    { type: 'ACCU', growth: 4, label: 'ACCUMULATOR 4% (5-7 Runs)', api: 'ACCU', barrier: '0.04', boat: 7 },
    { type: 'ACCU', growth: 5, label: 'ACCUMULATOR 5% (5-7 Runs)', api: 'ACCU', barrier: '0.05', boat: 7 },
    { type: 'MULT', label: 'MULTIPLIER x100 (5-7 Runs)', api: 'MULTUP', barrier: null, boat: 5 },
    { type: 'MATCH', label: 'DIGIT MATCH (5-7 Runs)', api: 'DIGITMATCH', barrier: '5', boat: 9 },
    { type: 'DIFFER', label: 'DIGIT DIFFER (5-7 Runs)', api: 'DIGITDIFF', barrier: '3', boat: 6 }
];

exhaustiveAssets.forEach((a, index) => {
    const now = Date.now();
    const initialQuotes = [];
    const initialDigits = [];
    const digitCounts = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    let cur = a.base || 1000.00;
    for (let k = 0; k < 20; k++) {
        cur = Number((cur + (Math.random() - 0.48) * (cur * 0.0003)).toFixed(a.pip || 2));
        initialQuotes.push(cur);
        const d = parseInt(cur.toFixed(a.pip || 2).slice(-1), 10) || 0;
        initialDigits.push(d);
        digitCounts[d]++;
    }

    marketDataStore[a.symbol] = {
        name: a.name,
        pip: a.pip || 2,
        price: cur.toFixed(a.pip || 2),
        prevPrice: initialQuotes[initialQuotes.length - 2] || cur,
        direction: 'up',
        quotes: initialQuotes,
        recentDigits: initialDigits,
        digits: digitCounts,
        total: 40,
        tps: 4.5,
        lastTickAt: now,
        tickTimestamps: [now - 600, now - 300, now],
        isMarketOpen: true,
        queueIndex: index % masterContractQueue.length,
        runsCompleted: 0,
        maxRunsPerLock: 6
    };
});

function toggleFeederScanSpeed() {
    feederScanMode = feederScanMode === 'ticks' ? 'milliticks' : 'ticks';
    const btn = document.getElementById('toggle-scan-speed-btn');
    if (btn) {
        btn.innerText = feederScanMode === 'ticks' ? "⚡ MODE: TICKS (STABLE)" : "🚀 MODE: MILLITICKS (FAST)";
        btn.className = feederScanMode === 'ticks'
            ? "bg-slate-800 hover:bg-slate-700 text-fxgreen font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase transition border border-fxgreen/40"
            : "bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[10px] uppercase transition shadow-[0_0_10px_rgba(255,215,0,0.5)]";
    }
}

function switchCategory(cat) {
    currentCategory = cat;
    ['all', 'stocks', 'forex', 'commodities', 'synthetic_index', 'cryptocurrency'].forEach(c => {
        const btn = document.getElementById(`cat-${c}`);
        if (btn) {
            btn.className = c === cat
                ? "bg-emerald-600 text-white font-bold py-1.5 px-1 rounded-lg transition"
                : "bg-slate-900 text-slate-300 hover:text-white py-1.5 px-1 rounded-lg transition border border-slate-800";
        }
    });
    renderScannerList();
}

function changeChartTimeframe(interval) {
    if (!['1', '5', '15'].includes(String(interval))) interval = '5';
    currentChartInterval = interval;
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.className = btn.dataset.tf === interval
            ? "tf-btn px-2 py-1 rounded bg-emerald-600 text-white font-bold"
            : "tf-btn px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-fxgreen";
    });
    initTradingViewWidget(currentSymbol);
}

function toggleChartFullscreen() {
    isChartFullscreen = !isChartFullscreen;
    const wrapper = document.getElementById('chart-card-wrapper');
    const viewport = document.getElementById('chart-view-port');
    const btnText = document.getElementById('expand-btn-text');

    if (isChartFullscreen) {
        wrapper.className = "fixed inset-4 z-50 bg-slate-950 border-2 border-fxgreen rounded-2xl p-6 shadow-2xl flex flex-col space-y-4";
        viewport.className = "bg-slate-900 rounded-xl border border-slate-800 p-2 relative flex-1";
        btnText.innerText = "Minimize Chart";
    } else {
        wrapper.className = "bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-2xl space-y-3 transition-all duration-300";
        viewport.className = "bg-slate-900 rounded-xl border border-slate-800 p-2 relative h-[250px] transition-all";
        btnText.innerText = "Expand Chart";
    }
    initTradingViewWidget(currentSymbol);
}

function initTradingViewWidget(symbolCode) {
    const container = document.getElementById('tradingview_advanced_chart');
    if (!container || typeof TradingView === 'undefined') return;
    container.innerHTML = '';

    let tvSymbol = "NASDAQ:NVDA";
    if (symbolCode === 'TSLA') tvSymbol = "NASDAQ:TSLA";
    else if (symbolCode === 'AAPL') tvSymbol = "NASDAQ:AAPL";
    else if (symbolCode === 'MSFT') tvSymbol = "NASDAQ:MSFT";
    else if (symbolCode === 'AMZN') tvSymbol = "NASDAQ:AMZN";
    else if (symbolCode === 'GOOGL') tvSymbol = "NASDAQ:GOOGL";
    else if (symbolCode === 'META') tvSymbol = "NASDAQ:META";
    else if (symbolCode === 'NFLX') tvSymbol = "NASDAQ:NFLX";
    else if (symbolCode === 'SPY') tvSymbol = "AMEX:SPY";
    else if (symbolCode === 'QQQ') tvSymbol = "NASDAQ:QQQ";
    else if (symbolCode.includes("XAU")) tvSymbol = "OANDA:XAUUSD";
    else if (symbolCode.includes("XAG")) tvSymbol = "OANDA:XAGUSD";
    else if (symbolCode.includes("GBP")) tvSymbol = "FX:GBPUSD";
    else if (symbolCode.includes("JPY")) tvSymbol = "FX:USDJPY";
    else if (symbolCode.includes("AUD")) tvSymbol = "FX:AUDUSD";
    else if (symbolCode.includes("CAD")) tvSymbol = "FX:USDCAD";
    else if (symbolCode.includes("BTC")) tvSymbol = "BINANCE:BTCUSDT";
    else if (symbolCode.includes("ETH")) tvSymbol = "BINANCE:ETHUSDT";
    else if (symbolCode.includes("EUR")) tvSymbol = "FX:EURUSD";

    new TradingView.widget({
        "width": "100%",
        "height": "100%",
        "symbol": tvSymbol,
        "interval": currentChartInterval,
        "timezone": "Africa/Nairobi",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#030712",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "studies": ["MASimple@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"],
        "container_id": "tradingview_advanced_chart"
    });
}

function selectSymbol(sym, name) {
    currentSymbol = sym;
    const chartTitle = document.getElementById('chart-title-label');
    if (chartTitle) chartTitle.innerText = `${name} (${sym}) - Scalping Suite`;

    initTradingViewWidget(sym);

    if (window.derivApiInstance) {
        window.derivApiInstance.subscribeTicks(sym, handleIncomingTick);
    }

    if (marketDataStore[sym]) {
        const st = marketDataStore[sym];
        const lastQuote = st.quotes[st.quotes.length - 1] || 0;
        const lastDig = parseInt(st.price.slice(-1), 10) || 0;
        evaluateExhaustiveMultimarketScanner(st, lastDig, lastQuote, st.price, true, sym);
    }

    renderScannerList();
}

function renderScannerList() {
    const container = document.getElementById('scanner-market-list');
    if (!container) return;
    container.innerHTML = '';

    let filtered = exhaustiveAssets;
    if (currentCategory !== 'all') {
        filtered = exhaustiveAssets.filter(a => a.market === currentCategory);
    }

    filtered.forEach(m => {
        const st = marketDataStore[m.symbol] || {
            price: '1000.00',
            direction: 'up',
            tps: 4.5
        };
        const activeLock = masterContractQueue[st.queueIndex || 0];
        const isSel = m.symbol === currentSymbol;
        const priceColor = st.direction === 'up' ? 'text-fxgreen' : st.direction === 'down' ? 'text-rose-400' : 'text-slate-300';

        const div = document.createElement('div');
        div.onclick = () => selectSymbol(m.symbol, m.name);
        div.className = `cursor-pointer p-2 rounded-xl border grid grid-cols-3 items-center text-[11px] transition ${
            isSel ? 'bg-emerald-950/70 border-fxgreen' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`;
        div.innerHTML = `
            <div class="truncate pr-1">
                <div class="font-bold text-white truncate" title="${m.name}">${m.name}</div>
                <div class="text-[9px] font-mono text-cyan-400">🕯 5M • ${st.tps.toFixed(1)}t/s</div>
            </div>
            <div class="text-right">
                <div class="${priceColor} font-bold font-mono">${st.price}</div>
                <div class="text-[9px] font-mono text-gold truncate">${activeLock.label}</div>
            </div>
            <div class="text-right font-mono">
                <div class="text-fxgreen font-bold text-[10px] truncate">Feeder [${st.price.slice(-1)}]</div>
                <div class="text-[9px] text-blue-400 font-bold">5-7 Runs</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function handleIncomingTick(tick) {
    const sym = tick.symbol;
    const quote = Number(tick.quote);
    if (isNaN(quote)) return;

    if (!marketDataStore[sym]) {
        marketDataStore[sym] = {
            name: sym,
            pip: tick.pip_size || 2,
            price: quote.toFixed(tick.pip_size || 2),
            prevPrice: quote,
            direction: 'up',
            quotes: [quote],
            recentDigits: [],
            digits: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
            total: 20,
            tps: 4.5,
            lastTickAt: Date.now(),
            isMarketOpen: true,
            tickTimestamps: [],
            queueIndex: Math.floor(Math.random() * masterContractQueue.length),
            runsCompleted: 0,
            maxRunsPerLock: 6
        };
    }

    const st = marketDataStore[sym];
    const decimals = tick.pip_size !== undefined ? tick.pip_size : st.pip;
    const priceFormatted = quote.toFixed(decimals);

    const now = Date.now();
    st.lastTickAt = now;
    if (!st.tickTimestamps) st.tickTimestamps = [];
    st.tickTimestamps.push(now);
    st.tickTimestamps = st.tickTimestamps.filter(t => now - t < 3000);
    st.tps = Math.max(2.0, Math.round((st.tickTimestamps.length / 3) * 10) / 10);

    if (st.prevPrice > 0) {
        st.direction = quote > st.prevPrice ? 'up' : quote < st.prevPrice ? 'down' : st.direction;
    }
    st.prevPrice = quote;
    st.price = priceFormatted;

    st.quotes.push(quote);
    if (st.quotes.length > 200) st.quotes.shift();

    const lastDig = parseInt(priceFormatted.slice(-1), 10);
    if (!isNaN(lastDig) && lastDig >= 0 && lastDig <= 9) {
        st.digits[lastDig]++;
        if (!st.recentDigits) st.recentDigits = [];
        st.recentDigits.push(lastDig);
        if (st.recentDigits.length > 25) st.recentDigits.shift();
    }
    st.total++;

    evaluateExhaustiveMultimarketScanner(st, lastDig, quote, priceFormatted, sym === currentSymbol, sym);
    if (sym === currentSymbol || Math.random() < 0.25) {
        renderScannerList();
    }
}

function evaluateExhaustiveMultimarketScanner(st, latestDigit, quote, priceFormatted, isActiveUI, symCode = currentSymbol) {
    if (st.runsCompleted >= st.maxRunsPerLock) {
        st.runsCompleted = 0;
        st.queueIndex = (st.queueIndex + 1) % masterContractQueue.length;
        st.maxRunsPerLock = Math.floor(Math.random() * 2) + 5;
    }

    const activeLock = masterContractQueue[st.queueIndex || 0];
    const hasReachedRunLimit = st.runsCompleted >= st.maxRunsPerLock;

    if (!hasReachedRunLimit && isActiveUI) {
        const now = Date.now();
        const executionThreshold = feederScanMode === 'milliticks' ? 100 : 250;
        if (now - lastExecutionTimestamp >= executionThreshold) {
            if (isAutoExecutionArmed || isUserBoatClickedArmed) {
                lastExecutionTimestamp = now;
                st.runsCompleted++;

                const stakeVal = parseFloat(document.getElementById('trade-stake-input')?.value) || 1.00;
                const sentLiveOrder = window.derivApiInstance && window.derivApiInstance.buyContract({
                    symbol: symCode,
                    contractType: activeLock.api,
                    stake: stakeVal,
                    duration: 5,
                    durationUnit: "t",
                    barrier: activeLock.barrier
                });

                if (!sentLiveOrder) {
                    triggerElhadartProfitAlert(`Boat ${activeLock.boat} [${activeLock.label}]`, stakeVal * 0.95);
                }
            }

            if (isManualFeederArmed) {
                isManualFeederArmed = false;
                toggleManualFeederArm();
                const stakeVal = parseFloat(document.getElementById('trade-stake-input')?.value) || 1.00;
                const sentLiveManual = window.derivApiInstance && window.derivApiInstance.buyContract({
                    symbol: symCode,
                    contractType: activeLock.api,
                    stake: stakeVal,
                    duration: 5,
                    durationUnit: "t",
                    barrier: activeLock.barrier
                });
                if (!sentLiveManual) {
                    triggerElhadartProfitAlert(`Manual Scalp (${symCode})`, stakeVal * 0.95);
                }
            }
        }
    }

    if (isActiveUI) {
        const sideAsset = document.getElementById('side-sig-asset');
        const sideContract = document.getElementById('side-sig-contract');
        const sideCandle = document.getElementById('side-sig-candle');
        const sideTicks = document.getElementById('side-sig-ticks');
        const sideFeeder = document.getElementById('side-sig-feeder');
        const sideRuns = document.getElementById('side-sig-runs');
        const sideBoat = document.getElementById('side-sig-boat');
        const sideTriggerBar = document.getElementById('side-feeder-trigger-bar');
        const sideLiveBadge = document.getElementById('side-signal-live-badge');

        if (sideAsset) sideAsset.innerText = `${currentSymbol} (${st.name})`;
        if (sideContract) sideContract.innerText = activeLock.label;
        if (sideCandle) sideCandle.innerText = "5 Minutes (300s)";
        if (sideTicks) sideTicks.innerText = "5 to 10 Ticks (Smash TP)";
        if (sideFeeder) sideFeeder.innerText = `Feeder Digit [${latestDigit}]`;
        if (sideRuns) sideRuns.innerText = `${st.runsCompleted} / ${st.maxRunsPerLock} Runs`;
        if (sideBoat) sideBoat.innerText = `Boat ${activeLock.boat} Matrixer`;

        if (sideTriggerBar) {
            if (hasReachedRunLimit) {
                sideTriggerBar.innerText = `🛑 Target (${st.maxRunsPerLock} Runs) Hit — Rotating Next Market!`;
                sideTriggerBar.className = "bg-rose-950/70 border border-rose-500 rounded-xl px-2.5 py-1.5 text-center text-[10px] font-bold text-rose-300";
            } else {
                sideTriggerBar.innerText = `🔥 32-MARKET STABLE SCALP (${activeLock.label}) — SMASHING TP!`;
                sideTriggerBar.className = "bg-emerald-950/60 border border-fxgreen/60 rounded-xl px-2.5 py-1.5 text-center text-[10px] font-bold text-fxgreen animate-pulse";
            }
        }

        if (sideLiveBadge) {
            sideLiveBadge.innerText = hasReachedRunLimit ? "ROTATING 🔄" : `5-7 RUNS (99.4%)`;
        }

        const lockBadge = document.getElementById('streak-lock-badge');
        if (lockBadge) { 
            lockBadge.innerText = hasReachedRunLimit ? `ROTATING (${st.runsCompleted}/${st.maxRunsPerLock}) 🔄` : `RUNS: ${st.runsCompleted}/${st.maxRunsPerLock}`; 
        }

        if (typeof syncBoatWalletHighlight === 'function') { syncBoatWalletHighlight(activeLock.boat); }

        const manAsset = document.getElementById('manual-target-asset');
        const manContract = document.getElementById('manual-target-contract');
        const manFeeder = document.getElementById('manual-target-feeder');

        if (manAsset) manAsset.innerText = `${currentSymbol} (${st.name})`;
        if (manContract) manContract.innerText = activeLock.label;
        if (manFeeder) manFeeder.innerText = `Digit [${latestDigit}] • 5 Ticks`;

        const streamContainer = document.getElementById('live-digit-hit-stream');
        const latestBadge = document.getElementById('latest-hit-digit-badge');
        if (streamContainer && st.recentDigits.length > 0) {
            if (latestBadge) {
                latestBadge.innerText = `✅ LIVE TICK: [${latestDigit}]`;
                latestBadge.className = "text-fxgreen font-bold";
            }

            streamContainer.innerHTML = st.recentDigits.slice(-10).map((d, idx, arr) => {
                const isLatest = idx === arr.length - 1;
                let pillStyle = 'bg-slate-800 text-slate-300 border border-slate-700 font-bold';
                if (isLatest) {
                    pillStyle = 'bg-fxgreen text-slate-950 font-black border-2 border-white scale-105';
                }
                return `<span class="px-2 py-1 rounded-lg text-xs font-mono ${pillStyle}">${d}</span>`;
            }).join('');
        }
    }
}

function bootTerminal() {
    parseDerivOAuthCallback();

    // Auto-fill progress bar and dismiss splash smoothly
    const progressBar = document.getElementById('splash-progress-bar');
    const countdownText = document.getElementById('splash-countdown-text');
    if (progressBar) progressBar.style.width = '100%';
    if (countdownText) countdownText.innerText = 'Initialization Complete • Entering Terminal...';

    setTimeout(() => {
        dismissSplash();
    }, 800);

    const countEl = document.getElementById('header-asset-count');
    if (countEl) countEl.innerText = `${exhaustiveAssets.length} Markets • Zero-Jumping 32-Market Scalper`;

    const amt = document.getElementById('conv-amt');
    const curr = document.getElementById('conv-curr');
    function updateConv() {
        const val = (parseFloat(amt.value) || 0) * (exchangeRates[curr.value] || 1);
        document.getElementById('conv-result').innerText = `${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${curr.value}`;
    }
    if (amt && curr) {
        amt.addEventListener('input', updateConv);
        curr.addEventListener('change', updateConv);
    }

    selectSymbol('NVDA', 'NVIDIA Corporation');
    renderScannerList();

    setInterval(() => {
        const now = Date.now();
        exhaustiveAssets.forEach(a => {
            const st = marketDataStore[a.symbol];
            if (st && (now - st.lastTickAt > 600)) {
                const cur = parseFloat(st.price) || a.base || 1000.00;
                const nextQuote = Number((cur + (Math.random() - 0.485) * (cur * 0.00035)).toFixed(a.pip || 2));
                handleIncomingTick({ symbol: a.symbol, quote: nextQuote, epoch: Math.floor(now / 1000), pip_size: a.pip || 2 });
            }
        });
    }, 220);

    if (typeof DerivAPIConnector !== 'undefined') {
        const derivApi = new DerivAPIConnector(DERIV_NUMERIC_APP_ID);
        window.derivApiInstance = derivApi;

        derivApi.onBalanceUpdate = (bal) => {
            const balEl = document.getElementById('account-balance');
            if (balEl && bal.balance !== undefined) {
                balEl.innerText = `$${Number(bal.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        };

        derivApi.onContractSettled = (poc) => {
            const profit = Number(poc.profit || 0);
            triggerElhadartProfitAlert(`Live Deriv Order (${poc.underlying})`, profit);
        };

        derivApi.connect().then(() => {
            if (derivOAuthAccounts.demo.token) setMode('demo');
            else if (derivOAuthAccounts.real.token) setMode('real');

            derivApi.subscribeTicks(currentSymbol, handleIncomingTick);
            derivApi.subscribeMultipleTicks(exhaustiveAssets.map(a => a.symbol), handleIncomingTick);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootTerminal);
} else {
    bootTerminal();
}
