/** @param {NS} ns **/
/** @type import(".").NS */let ns = null;
import { Vprint, FormatMoney } from "helper-functions.js"

/* NOTE: There are 6 layers of Stock access:
1) WSE - Access to manually buy/sell stocks
2) TIX API - Allows you to buy/sell stocks via script
3) 4S MARKET DATA - Displays stock forecasts in the UI
4) 4S MARKET DATA API - Allows you to retrieve stock forecast data via script
5) SHORT STOCKS - Allows short selling of stocks (BN 8.2)
6) LIMIT ORDERS - Allows placement of limit orders when buying/selling stocks (BN 8.3)
*/
// This script requires access to the TIX API and the 4S MARKET DATA API
// TODO: ALLOW BUYING ALL STOCKS THAT HAVE PROFITABLE OUTLOOK (expRet > 0)
 
// GLOBAL VARIABLES
const pctPerTrade = 0.25;       // Max % of total assets to invest per trade
const investPct = 0.55;         // % of total assets to invest across all trades
const holdPct = 1-investPct;    // % of total assets to keep as cash
const targetGainPct = 0.05;     // sell after reaching this gain % (let winners run)
const targetLossPct = -0.10;    // sell after stock loses this % (cut losers short)
const commission = 100000;      // commission cost to buy or sell stock
const tickInterval = 6000;      // stock prices update every 6 seconds

let player;
let stocks, myStocks;
let cash, assets;
 
export async function main(ns) {
    let verbose = true; // TODO: ALLOW THIS TO BE ENTERED IN ARGS

    // INITIALIZE
    ns.disableLog("ALL");
    Vprint(ns, true, `STONK MANAGER STARTED... Stonks only go up!!`);

    stocks = [];
    myStocks = [];
    cash = 0;
    assets = 0;

    // STOCK TRADING LOOP
    while(true) {
        Vprint(ns, verbose, `--- Beginning stock trading cycle ---`);
        player = ns.getPlayer();
        GetAccess(ns);  // Make sure player has access to max possible stock APIs
        stocks = GetStockData(ns);
        cash = ns.getServerMoneyAvailable("home")
        assets = CalcAssets(ns);

        // VERSION 1: WITHOUT 4S MARKET DATA
        if (!player.has4SDataTixApi) {
            // SELL
            for (let s of myStocks) {
                if(s.returnPct >= targetGainPct) {
                    Vprint(ns, verbose, `Selling ${s.sym}: beyond gain ${targetGainPct}.`);
                    SellStock(ns, s, s.shares);
                    assets -= commission;
                }
                if(s.returnPct <= targetLossPct) {
                    Vprint(ns, verbose, `Selling ${s.sym}: beyond max loss ${targetLossPct}.`);
                    SellStock(ns, s, s.shares);
                    assets -= commission;
                }
            }
            // BUY
            let targetLong = stocks[0];
            let cashToInvest = (assets * pctPerTrade) - commission;
            let cashAvailable = cash - (assets * holdPct);
            if (cashAvailable > cashToInvest && targetLong.chgPct) {
                let numShares = Math.floor(cashToInvest / targetLong.price);
                BuyStock(ns, targetLong, numShares);
            }
            // SHORTSELL
            // TODO
            // GROW & WEAKEN 
        }

        // VERSION 2: WITH 4S MARKET DATA
        else {
            // Sell stock when forecast no longer profitable
            for (let s of myStocks) {
                if(s.chgPct < 0 ) {
                    Vprint(ns, verbose, `Selling ${s.sym}, forecast no longer profitable.`);
                    SellStock(ns, s, s.shares);
                    assets -= commission;
                }
            }
        
            // // Sell shares if not enough cash in hand
            // for (let s of myStocks){
            //     if(cash < (investPct * assets)){
            //         let cashNeeded = (assets * holdPct - cash + commission);
            //         let numShares = Math.floor(cashNeeded / myStocks[i].price);
            //         Vprint(ns, verbose, `Selling ${myStocks[i].sym} to free up cash: ${numShares} shares for ${myStocks[i].price * numShares - commission}`);
            //         SellStock(ns, myStocks[i], numShares);
            //         assets -= commission;
            //     }
            // }
        
            // Buy shares with cash available
            for (let stock of stocks) {
                let cashToSpend = cash - (assets * holdPct);
                cashToSpend = Math.min(cashToSpend, pctPerTrade * assets);
                let numShares = Math.floor((cashToSpend - commission) / stock.price);
                let maxShares = ns.stock.getMaxShares(stock.sym);
                numShares = numShares > maxShares ? maxShares : numShares;
                let sharesAvailable = maxShares - stock.shares;

                if (numShares * stock.expRet > commission * 2 && sharesAvailable > 0) {
                    Vprint(ns, verbose, `📈 Buy opportunity on ${stock.sym}: ` + 
                        `Expected return ${FormatMoney(numShares * stock.expRet)} > ${FormatMoney(commission * 2)}`);
                    BuyStock(ns, stock, numShares);
                }
            }
        }

        await ns.sleep(tickInterval);
    }


    /// FUNCTIONS
    function GetAccess(ns) {
        player = ns.getPlayer();    // refresh player data
        // 1) WSE ACCESS
        if (!player.hasWseAccount) {
            if ( !ns.stock.purchaseWseAccount() ) {
                ns.tprint(`ERROR: WSE Access is required. Gotta spend money to make money...`);
                ns.exit();
            }
        }
        // 2) TIX API ACCESS
        if (!player.hasTixApiAccess) {
            if ( !ns.stock.purchaseTixApi() ) {
                ns.tprint(`ERROR: TIX API is required. Gotta spend money to make money...`);
                ns.exit();
            }
        }
        // 3) 4S MARKET DATA ACCESS
        if (!player.has4SData) {
            if ( !ns.stock.purchase4SMarketData() )
                ns.print("WARNING: Unable to buy 4S market data & API access. Profit limited.")
        }
        // 4) 4S MARKET DATA API ACCESS
        if (!player.has4SDataTixApi) {
            if ( !ns.stock.purchase4SMarketDataTixApi() )
                ns.print("WARNING: Unable to buy 4S market data API access. Profit limited.")
        }
        player = ns.getPlayer();    // refresh player data in case any new APIs purchased
    }


    function CalcAssets(ns) {
        cash = ns.getServerMoneyAvailable('home');
        assets = cash;
        if (myStocks.length > 0) {
            for (let s of myStocks)
                assets += (s.shares * s.buyPrice);
        }
        return assets;
    }

    function GetStockData(ns){
        myStocks = [];
        let symbols = ns.stock.getSymbols();
        // make array of stock objects
        let stocksTemp = [];
        for(let i = 0; i < symbols.length; i++)
            stocksTemp.push( { sym: symbols[i] } );
        // gather stock data
        for(let i = 0; i < stocksTemp.length; i++){
            let s = stocksTemp[i];  // shorten name
            s.price = ns.stock.getPrice(s.sym);
            s.price = Math.round(s.price * 100) / 100;    // round to 2 decimals
            s.spread = Math.abs(ns.stock.getAskPrice(s.sym) - ns.stock.getBidPrice(s.sym));
            s.spread = Math.round(s.spread * 10000) / 10000;    // round to 4 decimals
            if (stocks.length > 0) {
                let sPrev = stocks.find(sp => sp.sym === s.sym)
                s.pricePrev = sPrev.price;
                s.chgPct = (s.price / s.pricePrev) - 1;
                s.chgPct = Math.round(s.chgPct * 100000) / 100000; // round to 5 decimals
            }
            else {
                s.pricePrev = s.price;
                s.chgPct = 0;
            }
            let position = ns.stock.getPosition(s.sym);
            if (position) {
                s.shares = position[0];
                s.buyPrice = position[1];
                s.returnPct = (s.price / s.buyPrice) - 1;
            }
            else {
                s.shares = 0;
                s.returnPct = 0;
            }
            if (player.has4SDataTixApi) {
                s.vol = ns.stock.getVolatility(s.sym);
                s.forecast = ns.stock.getForecast(s.sym);  
                s.forecast = (s.forecast - 0.5) * 2;    // normalize btwn -1 and 1
                s.target = s.price + (s.price * s.vol * s.forecast);
                s.target = Math.round(s.target * 100) / 100;    // round to 2 decimals
                s.expRet = s.target - s.price - s.spread;
                s.expRetPct = s.expRet / s.price;
                s.expRetPct = Math.round(s.expRet * 100000) / 100000; // round to 5 decimals
            }

            if(s.shares > 0) 
                myStocks.push(s);
        }
        if (player.has4SDataTixApi)
            stocksTemp.sort(function(a, b){return b.expRet > a.expRet});  // highest to lowest
        else
            stocksTemp.sort(function(a, b){return b.chgPct < a.chgPct});  // highest to lowest

        return stocksTemp;
    }
 
    function BuyStock(ns, stock, numShares){
        // limit buy to max shares
        let sharesOwned = ns.stock.getPosition(stock.sym)[0];
        let maxShares = ns.stock.getMaxShares(stock.sym);
        let sharesLeft = maxShares - sharesOwned;
        if (sharesOwned == maxShares){
            Vprint(ns, verbose, `WARNING: Can't buy ${stock.sym}, already own max shares.`);
            return;
        }
        numShares = Math.min(numShares, sharesLeft);

        // buy stock
        stock.buyPrice = ns.stock.buy(stock.sym, numShares);
        stock.shares = numShares;
        stock.returnPct = 0;
        let pctOfAssets = (numShares * buyPrice) / assets;
        pctOfAssets = Math.round(pctOfAssets * 100);    // round to 2 decimals, convert to pct
        if (buyPrice > 0) {
            myStocks.push(stock);
            Vprint(ns, verbose, `💸 Bought ${numShares} shares of ${stock.sym}, allocated ` +
                `${FormatMoney(numShares * stock.price)} (${pctOfAssets}% of total assets)`);
        }
        else
            Vprint(ns, verbose, `ERROR: Couldn't buy ${stock.sym} for ${FormatMoney(numShares * stock.price)}`);
    }
 
    function SellStock(ns, stock, numShares){
        let sellPrice = ns.stock.sell(stock.sym, numShares);
        if (sellPrice > 0) {
            let profit = numShares * (sellPrice - stock.buyPrice) - 2 * commission;
            let profitPct = profit / (stock.buyPrice * stock.shares);
            profitPct = Math.round(profitPct * 100);    // round to 2 decimals, convert to pct
            let type = profit >= 0 ? "profit" : "loss";
            let emoji = profit >= 0 ? "💰" : "❌";
            Vprint(ns, verbose, `${emoji} Sold ${stock.sym} for ${type} of ` +
                `${FormatMoney(profit)} (${profitPct}% return on trade)`);
        }
        else {
            Vprint(ns, verbose, `ERROR: Couldn't sell ${stock.sym} at ${stock.price}`);
        }
    }
}