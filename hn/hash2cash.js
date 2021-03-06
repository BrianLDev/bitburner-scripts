/** @param {NS} ns **/
import { HnsGetMoney } from "/hn/hn-helper.js";

export async function main(ns) {
	let millionsToBuy = ns.args[0];
	millionsToBuy = (millionsToBuy == null || millionsToBuy == NaN) ? 
		Number.MAX_SAFE_INTEGER : millionsToBuy;

	let millionsBought = HnsGetMoney(ns, millionsToBuy);	// defaults to liquidating maximum hashes for cash (99999)
	ns.tprint(`Exchanged ${millionsBought * 4} out of ` +
		`${Math.round(ns.hacknet.numHashes() + millionsBought * 4)} hashes for \$${millionsBought}m cash.`);
}