/*
ALGORITHMIC STOCK TRADER I
You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

101,21,83,45,11,59,102,105,172,178,172,101,121,197,184,45,166,79,117,98,63,145,5,85,128,75,153,87,98,173,47,146,182,91,139,108,186,12,198,136,118,14,154

Determine the maximum possible profit you can earn using at most one transaction (i.e. you can only buy and sell the stock once). If no profit can be made then the answer should be 0. Note that you have to buy the stock before you can sell it
*/


// INPUT
let prices = 
[167,151,178,38,29,104,186,138,179,110,14,83,140,199,57]

// OUTPUT
let maxProfit = MaxProfit(prices);
console.log(`Max Profit: ${maxProfit}`);

// FUNCTIONS
function MaxProfit(prices) {
  let maxProfit = 0;
  for (let i=0; i<prices.length-1; i++) {
    for (let j=i+1; j<prices.length; j++) {
      let tempProfit = prices[j]-prices[i];
      if (tempProfit > maxProfit) {
        console.log(`New max profit: ${prices[j]} - ${prices[i]} = ${tempProfit}`)
        maxProfit = tempProfit;
      }
    }
  }
  return maxProfit;
}
