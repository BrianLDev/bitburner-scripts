/*
ALGORITHMIC STOCK TRADER I
You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

101,21,83,45,11,59,102,105,172,178,172,101,121,197,184,45,166,79,117,98,63,145,5,85,128,75,153,87,98,173,47,146,182,91,139,108,186,12,198,136,118,14,154

Determine the maximum possible profit you can earn using at most one transaction (i.e. you can only buy and sell the stock once). If no profit can be made then the answer should be 0. Note that you have to buy the stock before you can sell it
*/

// NOTE: THIS IS A SUPER SIMPLE AND FAST VERSION TO GET A SOLUTION ASAP.  FUTURE VERSIONS WILL NEED TO USE NESTED LOOPS TO ITERATE THROUGH ALL

let prices = [101,21,83,45,11,59,102,105,172,178,172,101,121,197,184,45,166,79,117,98,63,145,5,85,128,75,153,87,98,173,47,146,182,91,139,108,186,12,198,136,118,14,154]

let min = Math.min(...prices);
let max = Math.max(...prices);
let minIdx = prices.indexOf(min);
let maxIdx = prices.indexOf(max);
let maxProfit = 0;
if (minIdx < maxIdx) {
  maxProfit = max - min;
  console.log(`Found it!  Max profit: ${maxProfit}`);
}