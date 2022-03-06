/** @param {NS} ns **/
import * as hn from "/hn/hn-helper.js"
import { Vprint, FormatMoney } from "helper-functions.js"

// TODO: ADD OPTION TO SPEND ALL AVAILABLE MONEY FOR AN INSTANTANEOUS UPGRADE INSTEAD OF INCREMENTAL OVER TIME

export async function main(ns) {
	let mode = ns.args[0];
	let verbose = ns.args[1];

	if (mode == "cash")
		mode = "cash";
	else if (mode == "hash")
		mode = "hash";
	else
		mode = "upgrade";
	verbose = (verbose == true || verbose == "true") ? true : false;
	let hashCapacityUpgradePct = .75;
	let waitIntervalMs = 100;

	while (true) {
		let upgradeCost = 0;
		if (mode == "upgrade")
			upgradeCost = HnsUpgradeHacknetServers(ns, verbose);
		else if (mode == "cash")
			hn.HnsGetMoney(ns, Number.MAX_SAFE_INTEGER);
		else if (mode == "hash") {
			waitIntervalMs = 5000;
			if (ns.hacknet.numHashes() >= ns.hacknet.hashCapacity() * hashCapacityUpgradePct) {
				let nodes = hn.GetHacknetNodes(ns);
				let nodeToUpgrade = -1;
				let minCache = Number.MAX_SAFE_INTEGER;
				for (let i=0; i<nodes.length; i++) {
					let node = nodes[i];
					if (node.cache < minCache) {
						minCache = node.cache
						nodeToUpgrade = i;
					}
				}
				hn.HnsUpgradeCache(ns, nodeToUpgrade, verbose);
			}
			else {
				let numHashesK = (ns.hacknet.numHashes()/1000).toFixed(3);
				let hashCapacityK = (ns.hacknet.hashCapacity()/1000).toFixed(3);
				let upgradeK = ((ns.hacknet.hashCapacity() * hashCapacityUpgradePct)/1000).toFixed(3);
				Vprint(ns, verbose, `Accumulating hashes: ${numHashesK}k / ${hashCapacityK}k ` +
					`max. Will upgrade max capacity at ${upgradeK}`);
			}
		}
		let costMultiple = upgradeCost / ns.getServerMoneyAvailable("home");
		if (costMultiple <= 1)
			waitIntervalMs = 1;	// buy everything now!
		else
			waitIntervalMs = 5000;

		await ns.sleep(waitIntervalMs);
	}
}

// Determines the ideal next upgrade out of all current Hacknet servers and buys it if there's enough money
export function HnsUpgradeHacknetServers(ns, verbose) {
	let nodes = hn.GetHacknetNodes(ns);
	let minHashGain = Number.MAX_SAFE_INTEGER;
	let minCache = Number.MAX_SAFE_INTEGER;
	let nodeToUpgrade = -1;
	let upgradePart = hn.HnsUpgradeParts.None;
	let upgradeCost = 0;

	// cycle through nodes and determine next best upgrade
	for (let i=0; i<nodes.length; i++) {
		let node = nodes[i];
		// check level
		if (node.levelCostPerHashGain < minHashGain) {
			minHashGain = node.levelCostPerHashGain;
			nodeToUpgrade = i;
			upgradePart = hn.HnsUpgradeParts.Level;
			upgradeCost = node.levelCost;
		}
		// check ram
		if (node.ramCostPerHashGain < minHashGain) {
			minHashGain = node.ramCostPerHashGain;
			nodeToUpgrade = i;
			upgradePart = hn.HnsUpgradeParts.Ram;
			upgradeCost = node.ramCost;
		}
		// check cores
		if (node.coresCostPerHashGain < minHashGain) {
			minHashGain = node.coresCostPerHashGain;
			nodeToUpgrade = i;
			upgradePart = hn.HnsUpgradeParts.Cores;
			upgradeCost = node.coresCost;
		}
		// check cache (Increase cache size instead of upgrading if hashes > 75% of max)
		if (ns.hacknet.numHashes() >= ns.hacknet.hashCapacity() * .75) {
			if (node.cache < minCache) {
				minCache = node.cache;
				nodeToUpgrade = i;
				upgradePart = hn.HnsUpgradeParts.Cache;
				upgradeCost = node.cacheCost;
			}
		}
	}

	// 1) First, upgrade cache if that's needed
	if (upgradePart == hn.HnsUpgradeParts.Cache && nodeToUpgrade > -1) {
		hn.HnsUpgradeCache(ns, nodeToUpgrade, verbose);
	}
	// 2) Buy a new server instead of upgrading when it's less expensive than upgradeCost * costMultiple
	let newServerCost = ns.hacknet.getPurchaseNodeCost();
	let costMultiple = 3;	// manually set based on personal preferences (lower=longer wait for new servers)
	if (newServerCost < upgradeCost * costMultiple) {
		let moneyPotential = hn.HnsCheckMoneyPotential(ns);
		Vprint(ns, verbose, `Saving up for a new hacknet server. ` +
			`${Math.round((moneyPotential / newServerCost) * 100)}% saved so far...`);
		if (moneyPotential > newServerCost) {
			hn.HnsIncreaseMoneyTo(ns, newServerCost);
			if (ns.hacknet.purchaseNode() > -1) {
				Vprint(ns, verbose, `Purchased new Hacknet Server! ` +
					`Cost of server: ${FormatMoney(newServerCost)}`);
			}
			else
				Vprint(ns, verbose, `ERROR: Unable to purchase new Hacknet Server for ${FormatMoney(newServerCost)}`);
		}
	}
	// 3) Else, Purchase the Upgrade
	// 3a) Upgrade Level
	else if (upgradePart == hn.HnsUpgradeParts.Level && nodeToUpgrade > -1) {
		let node = nodes[nodeToUpgrade];
		let moneyPotential = hn.HnsCheckMoneyPotential(ns);
		if (moneyPotential > node.levelCost) {
			hn.HnsIncreaseMoneyTo(ns, node.levelCost);
			if (ns.hacknet.upgradeLevel(nodeToUpgrade, 1)) {
				Vprint(ns, verbose, `Upgraded Level ${node.level}->${node.level+1} on Hacknet Server ` + 
					`${nodeToUpgrade}, hash gain +${node.levelHashGain.toFixed(5)}, cost of upgrade: ` + 
					`${FormatMoney(node.levelCost)}, costPerHashGain: ${FormatMoney(node.levelCostPerHashGain)}`);
			}
			else
				Vprint(ns, verbose, `ERROR: Unable to upgrade Level on Hacknet Server ${nodeToUpgrade}`);
		}
	}
	// 3b) Upgrade Ram
	else if (upgradePart == hn.HnsUpgradeParts.Ram && nodeToUpgrade > -1) {
		let node = nodes[nodeToUpgrade];
		let moneyPotential = hn.HnsCheckMoneyPotential(ns);
		if (moneyPotential > node.ramCost) {
			hn.HnsIncreaseMoneyTo(ns, node.ramCost);
			if (ns.hacknet.upgradeRam(nodeToUpgrade, 1)) {
				let ramLog = Math.log2(node.ram);
				let ramBefore = Math.pow(2, ramLog);
				let ramAfter = Math.pow(2, ramLog+1);
				Vprint(ns, verbose, `Upgraded RAM ${ramBefore}->${ramAfter} on Hacknet Server ` + 
					`${nodeToUpgrade}, hash gain +${node.ramHashGain.toFixed(5)}, cost of upgrade: ` + 
					`${FormatMoney(node.ramCost)}, costPerHashGain: ${FormatMoney(node.ramCostPerHashGain)}`);
			}
			else
				Vprint(ns, verbose, `ERROR: Unable to upgrade RAM on Hacknet Server ${nodeToUpgrade}`);
		}		
	}
	// 3c) Upgrade Cores
	else if (upgradePart == hn.HnsUpgradeParts.Cores && nodeToUpgrade > -1) {
		let node = nodes[nodeToUpgrade];
		let moneyPotential = hn.HnsCheckMoneyPotential(ns);
		if (moneyPotential > node.coresCost) {
			hn.HnsIncreaseMoneyTo(ns, node.coresCost);
			if (ns.hacknet.upgradeCore(nodeToUpgrade, 1)) {
				Vprint(ns, verbose, `Upgraded Cores ${node.cores}->${node.cores+1} on Hacknet Server ` + 
					`${nodeToUpgrade}, hash gain +${node.coresHashGain.toFixed(5)}, cost of upgrade: ` + 
					`${FormatMoney(node.coresCost)}, costPerHashGain: ${FormatMoney(node.coresCostPerHashGain)}`);
			}
			else
				Vprint(ns, verbose, `ERROR: Unable to upgrade Cores on Hacknet Server ${nodeToUpgrade}`);
		}
	}
	return upgradeCost;
}