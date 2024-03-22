const Binance = require('node-binance-api');
const { SMA, RSI, MACD, ATR } = require('technicalindicators');

const binance = new Binance().options({
    APIKEY: '<YOUR_API_KEY>',
    APISECRET: '<YOUR_API_SECRET>'
});

// 定义技术指标的设置
const settings = {
    smaLength: 14,
    rsiPeriod: 14,
    macdSettings: {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    },
    atrPeriod: 14
};

// 获取并处理数据
const processData = async (symbol) => {
    try {
        const candlesticks = await binance.futuresCandles(symbol, '1d', { limit: 50 });
        const closes = candlesticks.map(c => parseFloat(c[4]));
        const highs = candlesticks.map(c => parseFloat(c[2]));
        const lows = candlesticks.map(c => parseFloat(c[3]));
        const opens = candlesticks.map(c => parseFloat(c[1]));

        // 计算技术指标
        const sma = SMA.calculate({ period: settings.smaLength, values: closes });
        const rsi = RSI.calculate({ period: settings.rsiPeriod, values: closes });
        const macd = MACD.calculate({ values: closes, ...settings.macdSettings });
        const atr = ATR.calculate({ period: settings.atrPeriod, high: highs, low: lows, close: closes });

        console.log(`Symbol: ${symbol}`);
        console.log(`SMA: ${sma[sma.length - 1]}`);
        console.log(`RSI: ${rsi[rsi.length - 1]}`);
        console.log(`MACD: ${macd[macd.length - 1].MACD}`);
        console.log(`ATR: ${atr[atr.length - 1]}`);

        // 根据指标和你的交易逻辑判断交易机会
        // 示例：简单的买入信号判断
        if (rsi[rsi.length - 1] < 30 && sma[sma.length - 1] > closes[closes.length - 1]) {
            console.log(`买入信号：${symbol}`);
        }
    } catch (error) {
        console.error(`Error processing ${symbol}: `, error.message);
    }
};

// 获取所有交易对并遍历它们
const findTradingOpportunities = async () => {
    const exchangeInfo = await binance.futuresExchangeInfo();
    const symbols = exchangeInfo.symbols
        .filter(s => s.status === 'TRADING')
        .map(s => s.symbol);

    for (let symbol of symbols) {
        await processData(symbol);
    }
};

findTradingOpportunities();
