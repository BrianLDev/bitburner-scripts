/*
Algorithmic Stock Trader II
You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

158,182,14,162,116,6,70,60,17,72,126,186,142,52,67,148,85,45,50,55,76,42,157,90,90,138,57,2

Determine the maximum possible profit you can earn using AS MANY transactions as you'd like. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

If no profit can be made, then the answer should be 0
*/

// INPUT
let prices = [158,182,14,162,116,6,70,60,17,72,126,186,142,52,67,148,85,45,50,55,76,42,157,90,90,138,57,2]

// OUTPUT
let maxProfit = MaxProfit(prices);
console.log(`Max Profit: ${maxProfit}`);

// FUNCTIONS
// TODO: START WITH FUNCTION FROM STOCK1 AND IMPROVE
// POSSIBLE SOLUTION: CREATE SUB-ARRAYS AND RUN MULTIPLE ITERATIONS OF STOCK1 MAXPROFIT FUNCTION.  

// STOCK 1 FUNCTION (SINGLE TRX)
function MaxProfit(prices) {
  let maxProfit = 0;
  for (let i=0; i<prices.length-1; i++) {
    for (let j=1; j<prices.length; j++) {
      let tempProfit = prices[j]-prices[i];
      if (tempProfit > maxProfit) {
        console.log(`New max profit: ${prices[j]} - ${prices[i]} = ${tempProfit}`)
        maxProfit = tempProfit;
      }
    }
  }
  return maxProfit;
}
