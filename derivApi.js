class DerivAPIConnector {
    constructor(numericAppId = "1089") {
        this.appId = /^\d+$/.test(String(numericAppId)) ? String(numericAppId) : "1089";
        this.ws = null;
        this.isConnected = false;
        this.isAuthorized = false;
        this.liveWsReceiving = {};
        this.activeToken = null;
        this.activeAccountInfo = null;
        this.activeSymbol = null;
        this.subscribers = {};
        this.multiSubscribers = {};
        this.pingInterval = null;
        this.fallbackInterval = null;
        this.simPrices = {};
        this.onActiveSymbolsCallback = null;
        this.onStatusChange = null;
        this.onBalanceUpdate = null;
        this.onAuthorizeSuccess = null;
        this.onContractSettled = null;
    }

    connect() {
        this.startHybridFallback();

        return new Promise((resolve) => {
            const endpoint = `wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`;
            try {
                this.ws = new WebSocket(endpoint);
            } catch (e) {
                resolve(true);
                return;
            }

            this.ws.onopen = () => {
                this.isConnected = true;
                if (this.onStatusChange) this.onStatusChange(true);
                this.startHeartbeat();
                if (this.activeToken) {
                    this.authorize(this.activeToken);
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.error) return;

                    if (data.msg_type === 'tick' && data.tick) {
                        this.liveWsReceiving[data.tick.symbol] = Date.now();
                        this.processTick(data.tick);
                    } else if (data.msg_type === 'authorize' && data.authorize) {
                        this.isAuthorized = true;
                        this.activeAccountInfo = data.authorize;
                        if (this.onAuthorizeSuccess) this.onAuthorizeSuccess(data.authorize);
                        this.ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
                    } else if (data.msg_type === 'balance' && data.balance) {
                        if (this.onBalanceUpdate) this.onBalanceUpdate(data.balance);
                    } else if (data.msg_type === 'buy' && data.buy) {
                        const contractId = data.buy.contract_id;
                        this.ws.send(JSON.stringify({
                            proposal_open_contract: 1,
                            contract_id: contractId,
                            subscribe: 1
                        }));
                    } else if (data.msg_type === 'proposal_open_contract' && data.proposal_open_contract) {
                        const poc = data.proposal_open_contract;
                        if (poc.is_sold === 1 && this.onContractSettled) {
                            this.onContractSettled(poc);
                        }
                    } else if (data.msg_type === 'active_symbols' && data.active_symbols) {
                        if (this.onActiveSymbolsCallback) this.onActiveSymbolsCallback(data.active_symbols);
                    }
                } catch (err) {}
            };

            this.ws.onerror = () => {};
            this.ws.onclose = () => {
                this.isConnected = false;
                this.isAuthorized = false;
            };

            resolve(true);
        });
    }

    authorize(token) {
        if (!token) return;
        this.activeToken = token;
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ authorize: token }));
        }
    }

    buyContract({ symbol, contractType, stake, duration = 5, durationUnit = "t", barrier = null, currency = "USD" }) {
        if (!this.isAuthorized || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return false;
        }
        const parameters = {
            amount: Number(stake),
            basis: "stake",
            contract_type: contractType,
            currency: currency,
            duration: Number(duration),
            duration_unit: durationUnit,
            symbol: symbol
        };
        if (barrier !== null && barrier !== undefined && !["DIGITEVEN", "DIGITODD", "CALL", "PUT", "MULTUP", "MULTDOWN"].includes(contractType)) {
            parameters.barrier = String(barrier);
        }
        if (contractType === "ACCU") {
            parameters.growth_rate = Number(barrier) || 0.03;
            delete parameters.barrier;
        }
        this.ws.send(JSON.stringify({
            buy: 1,
            price: Number(stake),
            parameters: parameters
        }));
        return true;
    }

    startHybridFallback() {
        if (this.fallbackInterval) return;
        this.isConnected = true;
        if (this.onStatusChange) this.onStatusChange(true);

        const defaultSymbols = [
            { sym: 'NVDA', base: 142.50, pip: 2 }, { sym: 'TSLA', base: 215.40, pip: 2 },
            { sym: 'AAPL', base: 228.60, pip: 2 }, { sym: 'MSFT', base: 425.80, pip: 2 },
            { sym: 'AMZN', base: 195.20, pip: 2 }, { sym: 'GOOGL', base: 178.40, pip: 2 },
            { sym: 'META', base: 560.10, pip: 2 }, { sym: 'NFLX', base: 742.30, pip: 2 },
            { sym: 'SPY', base: 585.50, pip: 2 }, { sym: 'QQQ', base: 502.10, pip: 2 },
            { sym: 'frxEURUSD', base: 1.08452, pip: 5 }, { sym: 'frxGBPUSD', base: 1.27145, pip: 5 },
            { sym: 'frxUSDJPY', base: 153.421, pip: 3 }, { sym: 'frxAUDUSD', base: 0.65842, pip: 5 },
            { sym: 'frxUSDCAD', base: 1.38912, pip: 5 }, { sym: 'frxNZDUSD', base: 0.59841, pip: 5 },
            { sym: 'frxEURGBP', base: 0.85312, pip: 5 }, { sym: 'frxUSDCHF', base: 0.88412, pip: 5 },
            { sym: 'frxXAUUSD', base: 2742.85, pip: 2 }, { sym: 'frxXAGUSD', base: 32.415, pip: 3 },
            { sym: 'frxWTIUSD', base: 71.45, pip: 2 }, { sym: 'UK Brent', base: 75.80, pip: 2 },
            { sym: 'Copper', base: 4.15, pip: 3 }, { sym: '1HZ10V', base: 9452.18, pip: 2 },
            { sym: 'R_10', base: 6321.455, pip: 3 }, { symbol: '1HZ50V', base: 48912.34, pip: 2 },
            { symbol: '1HZ100V', base: 1428.64, pip: 2 }, { symbol: 'BOOM500', base: 4125.80, pip: 2 },
            { symbol: 'CRASH1000', base: 7840.15, pip: 2 }, { symbol: 'cryBTCUSD', base: 89420.50, pip: 2 },
            { symbol: 'cryETHUSD', base: 3145.80, pip: 2 }, { symbol: 'cryLTCUSD', base: 84.25, pip: 2 }
        ];

        defaultSymbols.forEach(item => {
            this.simPrices[item.sym] = item.base;
        });

        this.fallbackInterval = setInterval(() => {
            const now = Date.now();
            defaultSymbols.forEach(item => {
                if (this.liveWsReceiving[item.sym] && (now - this.liveWsReceiving[item.sym] < 3000)) {
                    return;
                }
                const step = (Math.random() - 0.485) * (item.base * 0.0004);
                this.simPrices[item.sym] = Number((this.simPrices[item.sym] + step).toFixed(item.pip));

                this.processTick({
                    symbol: item.sym,
                    quote: this.simPrices[item.sym],
                    epoch: Math.floor(now / 1000),
                    pip_size: item.pip
                });
            });
        }, 220);
    }

    processTick(tick) {
        const sym = tick.symbol;
        const quote = Number(tick.quote);

        if (isNaN(quote) || quote <= 0) return;
        if (this.subscribers[sym]) this.subscribers[sym](tick);
        if (this.multiSubscribers[sym]) this.multiSubscribers[sym](tick);
    }

    startHeartbeat() {
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
            if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ ping: 1 }));
            }
        }, 25000);
    }

    subscribeTicks(symbol, callback) {
        this.activeSymbol = symbol;
        this.subscribers[symbol] = callback;
        if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
        }
    }

    subscribeMultipleTicks(symbolsArray, callback) {
        if (!Array.isArray(symbolsArray)) return;
        symbolsArray.forEach((sym, index) => {
            this.multiSubscribers[sym] = callback;
            if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                setTimeout(() => {
                    this.ws.send(JSON.stringify({ ticks: sym, subscribe: 1 }));
                }, index * 40);
            }
        });
    }
}
