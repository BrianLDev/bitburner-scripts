/** @param {NS} ns **/
export async function main(ns) {
	// GLOBAL VARIABLES
    let tickers = ns.stock.getSymbols();
	let stonk = new Object();
	let stonks = new Object();
	let portfolio = new Object();

	// FUNCTIONS
	function UpdateStonkData() {
		stonks = new Object();
		portfolio = new Object();
		for (let i=0; i<tickers.length; i++) {
			stonk = new Object();	// clear temp stock object
			stonk.ticker = tickers[i];
			let pos = CalcNetPosition(ns.stock.getPosition(tickers[i]));
			if (pos) {
				stonk.shares = pos.shares;
				stonk.avgPrice = pos.avgPrice;
				stonk.costBasis = (pos.avgPrice * pos.shares).toFixed(2);
				stonk.direction = pos.direction;
				stonk.saleProceeds = ns.stock.getSaleGain(stonk.ticker, stonk.shares, stonk.direction).toFixed(2);
				stonk.profit = (stonk.saleProceeds - stonk.costBasis).toFixed(2);
				stonk.profitPct = ((stonk.profit / stonk.costBasis)*100).toFixed(2);
				portfolio[stonk.ticker] = stonk;
			}
			stonks[stonk.ticker] = stonk;
		}
	}

	function CalcNetPosition(position) {
		let pos = new Object();
		pos.shares = position[0] - position[2];
		pos.avgPrice = (position[1] + position[3]).toFixed(3);
		pos.shares > 0 ? pos.direction = "Long" : pos.direction = "Short";
		pos.shares = Math.abs(pos.shares);
		if (pos.shares > 0)
			return pos;
		else
			return null;
	}

	function PrintPnL() {
		UpdateStonkData();
		ns.tprint(portfolio);
	}

	// NOT AVAILABLE YET
	// function GetAllForecasts() {
	// 	for (let i=0; i<tickers.length; i++) {
	// 		stonk.forecast = ns.stock.getForecast(tickers[i]);
	// 	}
	// }

	// EXECUTE
	PrintPnL();

}