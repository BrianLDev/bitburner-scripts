/** @param {NS} ns **/
/** @type import(".").NS */let ns = null;
import { Vprint, FormatMoney } from "helper-functions.js"

// Requires access to the TIX API and the 4S Mkt Data API
// TODO: ALLOW BUYING ALL STOCKS THAT HAVE PROFITABLE OUTLOOK (expRet > 0)
 
// GLOBAL VARIABLES
const investPct = 0.80;         // Percent of assets to invest
const holdPct = 1-investPct;    // Percent of assets to keep as cash
 
const commission = 100000; // Buy or sell commission
const numCycles = 10; // Each cycle is 2 seconds
 
export async function main(ns) {
    let verbose = false; // TODO: ALLOW THIS TO BE ENTERED IN ARGS

    // INITIALIZE
    ns.disableLog("ALL");
    Vprint(ns, true, `STONK MANAGER STARTED... Stonks only go up!!`);

    let stocks = [];
    let myStocks = [];
    let cash = 0;
    let assets = 0;

 
    // STOCK TRADING LOOP
    while(true) {
        Vprint(ns, verbose, `--- Beginning stock trading cycle ---`);
        stocks = GetStockData(ns);
        cash = ns.getServerMoneyAvailable("home")
        assets = CalcAssets(ns);

        // Sell stock when forecast no longer profitable
        for (let i = 0; i < myStocks.length; i++) {
            if(myStocks[i].expRet < 0 ) {
                Vprint(ns, verbose, `Selling ${myStocks[i].sym}, future outlook no longer profitable.`);
                SellStock(ns, myStocks[i], myStocks[i].shares);
                assets -= commission;
            }
        }
    
        // Sell shares if not enough cash in hand
        for (let i = 0; i < myStocks.length; i++){
            if(cash < (investPct * assets)){
                let cashNeeded = (assets * holdPct - cash + commission);
                let numShares = Math.floor(cashNeeded / myStocks[i].price);
                Vprint(ns, verbose, `Selling ${myStocks[i].sym} to free up cash: ${numShares} shares for ${myStocks[i].price * numShares - commission}`);
                SellStock(ns, myStocks[i], numShares);
                assets -= commission;
            }
        }
    
        // Buy shares with cash available
        for (let stock of stocks) {
            let cashToSpend = cash - (assets * holdPct);
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

        
        await ns.sleep(2 * numCycles * 1000);
    }


    /// FUNCTIONS
    function CalcAssets(ns) {
        let cash = ns.getServerMoneyAvailable('home');
        let assets = 0;
        if (myStocks.length <= 0)
            assets = cash;
        else if (myStocks.length == 1)
            assets = cash + (myStocks[0].shares * myStocks[0].buyPrice);
        else {
            assets = myStocks.reduce(
                function(sum, stock) {
                    return sum + (stock.shares * stock.buyPrice);
                },
            cash);
        }
        return assets;
    }

    function GetStockData(ns){
        myStocks = [];
        let symbols = ns.stock.getSymbols();
        // make array of stock objects
        let stocks = [];
        for(let i = 0; i < symbols.length; i++)
            stocks.push( { sym: symbols[i] } );
        // gather stock data
        for(let i = 0; i < stocks.length; i++){
            let s = stocks[i];  // shorten name
            s.price = ns.stock.getPrice(s.sym);
            s.shares = ns.stock.getPosition(s.sym)[0];
            s.buyPrice = ns.stock.getPosition(s.sym)[1];
            s.vol = ns.stock.getVolatility(s.sym);
            s.prob = ns.stock.getForecast(s.sym) - 0.5;  // adjust so downward forcast is negative
            s.spread = Math.abs(ns.stock.getAskPrice(s.sym) - ns.stock.getBidPrice(s.sym));
            s.target = s.price + (s.price * s.vol * s.prob * numCycles);
            s.target = Math.round(s.target * 100) / 100;    // round to 2 decimals
            s.expRet = s.target - s.price - s.spread;
            s.expRetPct = s.expRet / s.price;
            s.expRetPct = Math.round(s.expRet * 10000000) / 10000000;    // round to 7 decimals

            if(s.shares > 0) 
                myStocks.push(s);
        }
        stocks.sort(function(a, b){return b.expRet - a.expRet});
        stocks.forEach(stock => {
            if (stock.expRet > -15)
                Vprint(ns, verbose, `${stock.sym} expected return per share: ${FormatMoney(stock.expRet)}`);
        })
        return stocks;
    }
 
    function BuyStock(ns, stock, numShares){
        // limit buy to max shares
        let sharesOwned = ns.stock.getPosition(stock.sym)[0];
        let maxShares = ns.stock.getMaxShares(stock.sym);
        if (sharesOwned == maxShares){
            Vprint(ns, verbose, `... Can't buy ${stock.sym}, already own max shares.`);
            return;
        }
        numShares = numShares > maxShares ? maxShares : numShares;

        // buy stock
        let buyPrice = ns.stock.buy(stock.sym, numShares);
        if (buyPrice > 0)
            Vprint(ns, verbose, `💸 Bought ${numShares} shares of ${stock.sym} for ${FormatMoney(numShares * stock.price)}`);
        else
            Vprint(ns, verbose, `ERROR: Couldn't buy ${stock.sym} for ${FormatMoney(numShares * stock.price)}`);
    }
 
    function SellStock(ns, stock, numShares){
        let sellPrice = ns.stock.sell(stock.sym, numShares);
        if (sellPrice > 0) {
            let profit = numShares * (sellPrice - stock.buyPrice) - 2 * commission;
            let type = profit >= 0 ? "profit" : "loss";
            let emoji = profit >= 0 ? "💰" : "❌";
            Vprint(ns, verbose, `${emoji} Sold ${stock.sym} for ${type} of ${FormatMoney(profit)}`);
        }
        else {
            Vprint(ns, verbose, `ERROR: Couldn't sell ${stock.sym} at ${stock.price}`);
        }
    }
}