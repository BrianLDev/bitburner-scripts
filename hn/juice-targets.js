/** @param {NS} ns **/
import { GetTargets, Vprint } from "helper-functions.js"

export async function main(ns) {
	let numServers = ns.args[0];
	if (!numServers || numServers == null || numServers == "" || numServers < 1)
		numServers = 3;	// default to 3

	const hn = ns.hacknet;
	const ReduceSec = "Reduce Minimum Security";
	const IncreaseMoney = "Increase Maximum Money"; 
	let verbose = false;	// TODO: add this to args (low priority)
	let sleeptime = 5000;
	let targetIdx = 0;

	while (true) {
		let targets = GetTargets(ns, true)
		targets = targets.slice(0, numServers);
		let target = targets[targetIdx];
		
		// get cost of upgrades, and check if enough hashes available
		let hashesAvailable = hn.numHashes();
		let upgradeCost = hn.hashCost(ReduceSec) + hn.hashCost(IncreaseMoney);
		Vprint(ns, verbose, `hashes avail: ${Math.round(hashesAvailable)} vs upgrade cost: ${upgradeCost}`);
		if (hashesAvailable > upgradeCost) {
			// buy both upgrades
			hn.spendHashes(ReduceSec, target.hostname);
			hn.spendHashes(IncreaseMoney, target.hostname);
			Vprint(ns, verbose, `Reduced security and increased money on ${target.hostname}`)

			// increment targetIdx (restart when > numServers)
			targetIdx += 1;
			if (targetIdx > targets.length - 1)
				targetIdx = 0;

			// reduce sleeptime if enough hashes available for next upgrade
			hashesAvailable = hn.numHashes();
			upgradeCost = hn.hashCost(ReduceSec) + hn.hashCost(IncreaseMoney);
			if (hashesAvailable > upgradeCost)
				sleeptime = 1;
		}
		else {
			sleeptime = 5000;
		}

		await ns.sleep(sleeptime);
	}

}