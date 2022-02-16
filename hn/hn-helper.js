/** @param {NS} ns **/
import { Vprint, FormatMoney } from "helper-functions.js"

export async function main(ns) {
}

export function HnsGetMoney(ns, millionsToBuy=1) {
	let hashes = ns.hacknet.numHashes();
	let moneyCost = ns.hacknet.hashCost(HnsUpgrades.Money);
	let sellQty = Math.floor(hashes / moneyCost);
	sellQty = Math.min(sellQty, millionsToBuy);
	for (let i=0; i<sellQty; i++) {
		ns.hacknet.spendHashes(HnsUpgrades.Money);
	}
	return sellQty;
}

export function HnsCheckMoneyPotential(ns) {
	let hashes = ns.hacknet.numHashes();
	let moneyCost = ns.hacknet.hashCost(HnsUpgrades.Money);
	let sellQty = Math.floor(hashes / moneyCost);
	let hashMoney = sellQty * 1000000;
	let player = ns.getPlayer();
	let moneyPotential = player.money + hashMoney;
	return moneyPotential;
}

export function HnsIncreaseMoneyTo(ns, moneyTarget) {
	let player = ns.getPlayer();
	let increase = moneyTarget - player.money;
	let increaseMillions = Math.ceil(increase / 1000000);
	if (increaseMillions >= 1) {
		let millionsGot = HnsGetMoney(ns, increaseMillions);
		player = ns.getPlayer();
		if (player.money >= moneyTarget)
			return true;
		else
			return false;
	}
	
}

export function GetHacknetNodes(ns) {
	let nodeCount = ns.hacknet.numNodes();

	let nodeObj = {};
	let nodes = [];
	for (let i=0; i<nodeCount; i++) {
		nodeObj = HnsAnalyzeNode(ns, i);
		nodes.push(nodeObj);
	}
	return nodes;
}

export function HnsAnalyzeNode(ns, index) {
	const hns = ns.formulas.hacknetServers;
	const player = ns.getPlayer();
	let node = ns.hacknet.getNodeStats(index);

	node.levelCost = Math.ceil(hns.levelUpgradeCost(node.level, 1, player.hacknet_node_level_cost_mult));
	node.levelHashGain = HnsHashGainLevel(ns, index);
	node.levelCostPerHashGain = Math.floor(node.levelCost / node.levelHashGain);
	
	node.ramCost = Math.ceil(hns.ramUpgradeCost(node.ram, 1, player.hacknet_node_ram_cost_mult));
	node.ramHashGain = HnsHashGainRam(ns, index);
	node.ramCostPerHashGain = Math.floor(node.ramCost / node.ramHashGain);

	node.coresCost = Math.ceil(hns.coreUpgradeCost(node.cores, 1, player.hacknet_node_core_cost_mult));
	node.coresHashGain = HnsHashGainCores(ns, index);
	node.coresCostPerHashGain = Math.floor(node.coresCost / node.coresHashGain);

	node.cacheCost = Math.ceil(hns.cacheUpgradeCost(node.cache, 1));

	return node;
}

// Determines the ideal next upgrade out of all current Hacknet servers and buys it if there's enough money
export function HnsUpgradeHacknetServers(ns, verbose) {
	let nodes = GetHacknetNodes(ns);
	let minHashGain = Number.MAX_SAFE_INTEGER;
	let minCache = Number.MAX_SAFE_INTEGER;
	let nodeToUpgrade = -1;
	let upgradePart = HnsUpgradeParts.None;
	let upgradeCost = 0;

	// cycle through nodes and determine next best upgrade
	for (let i=0; i<nodes.length; i++) {
		let node = nodes[i];
		// check level
		if (node.levelCostPerHashGain < minHashGain) {
			minHashGain = node.levelCostPerHashGain;
			nodeToUpgrade = i;
			upgradePart = HnsUpgradeParts.Level;
			upgradeCost = node.levelCost;
		}
		// check ram
		if (node.ramCostPerHashGain < minHashGain) {
			minHashGain = node.ramCostPerHashGain;
			nodeToUpgrade = i;
			upgradePart = HnsUpgradeParts.Ram;
			upgradeCost = node.ramCost;
		}
		// check cores
		if (node.coresCostPerHashGain < minHashGain) {
			minHashGain = node.coresCostPerHashGain;
			nodeToUpgrade = i;
			upgradePart = HnsUpgradeParts.Cores;
			upgradeCost = node.coresCost;
		}
		// check cache (Increase cache size instead of upgrading if hashes > 50% of max)
		if (ns.hacknet.numHashes() >= ns.hacknet.hashCapacity() * .50) {
			if (node.cache < minCache) {
				minCache = node.cache;
				nodeToUpgrade = i;
				upgradePart = HnsUpgradeParts.Cache;
				upgradeCost = node.cacheCost;
			}
		}
	}

	// 1) First, upgrade cache if that's needed
	if (upgradePart == HnsUpgradeParts.Cache && nodeToUpgrade > -1) {
		let node = nodes[nodeToUpgrade];
		let moneyPotential = HnsCheckMoneyPotential(ns);
		if (moneyPotential > node.cacheCost) {
			HnsIncreaseMoneyTo(ns, node.cacheCost);
			let prevCapacity = ns.hacknet.hashCapacity();
			if (ns.hacknet.upgradeCache(nodeToUpgrade, 1)) {
				let newCapacity = ns.hacknet.hashCapacity();
				Vprint(ns, verbose, `Upgraded Cache ${node.cache}->${node.cache+1} on Hacknet Server ` + 
					`${nodeToUpgrade}, cost of upgrade: ${FormatMoney(node.cacheCost)}, ` +
					`hash capacity ${prevCapacity}-->${newCapacity}`);
			}
			else
				Vprint(ns, verbose, `ERROR: Unable to upgrade Cache on Hacknet Server ${nodeToUpgrade}`);
		}
	}
	// 2) Buy a new server instead of upgrading when it's less expensive than upgradeCost * costMultiple
	let newServerCost = ns.hacknet.getPurchaseNodeCost();
	let costMultiple = 3;	// manually set based on personal preferences (lower=longer wait for new servers)
	if (newServerCost < upgradeCost * costMultiple) {
		let moneyPotential = HnsCheckMoneyPotential(ns);
		Vprint(ns, verbose, `Saving up for a new hacknet server. ` +
			`${Math.round((moneyPotential / newServerCost) * 100)}% saved so far...`);
		if (moneyPotential > newServerCost) {
			HnsIncreaseMoneyTo(ns, newServerCost);
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
	else if (upgradePart == HnsUpgradeParts.Level && nodeToUpgrade > -1) {
		let node = nodes[nodeToUpgrade];
		let moneyPotential = HnsCheckMoneyPotential(ns);
		if (moneyPotential > node.levelCost) {
			HnsIncreaseMoneyTo(ns, node.levelCost);
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
	else if (upgradePart == HnsUpgradeParts.Ram && nodeToUpgrade > -1) {
		let node = nodes[nodeToUpgrade];
		let moneyPotential = HnsCheckMoneyPotential(ns);
		if (moneyPotential > node.ramCost) {
			HnsIncreaseMoneyTo(ns, node.ramCost);
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
	else if (upgradePart == HnsUpgradeParts.Cores && nodeToUpgrade > -1) {
		let node = nodes[nodeToUpgrade];
		let moneyPotential = HnsCheckMoneyPotential(ns);
		if (moneyPotential > node.coresCost) {
			HnsIncreaseMoneyTo(ns, node.coresCost);
			if (ns.hacknet.upgradeCore(nodeToUpgrade, 1)) {
				Vprint(ns, verbose, `Upgraded Cores ${node.cores}->${node.cores+1} on Hacknet Server ` + 
					`${nodeToUpgrade}, hash gain +${node.coresHashGain.toFixed(5)}, cost of upgrade: ` + 
					`${FormatMoney(node.coresCost)}, costPerHashGain: ${FormatMoney(node.coresCostPerHashGain)}`);
			}
			else
				Vprint(ns, verbose, `ERROR: Unable to upgrade Cores on Hacknet Server ${nodeToUpgrade}`);
		}
	}
}

export function HnsHashGainLevel(ns, index) {
	const hns = ns.formulas.hacknetServers;
	const player = ns.getPlayer();
	let nodeObj = ns.hacknet.getNodeStats(index);
	nodeObj.level += 1;
	let newProduction = hns.hashGainRate(nodeObj.level, 0, nodeObj.ram, nodeObj.cores, 
		player.hacknet_node_money_mult);
	return (newProduction - nodeObj.production);
}

export function HnsHashGainRam(ns, index) {
	const hns = ns.formulas.hacknetServers;
	const player = ns.getPlayer();
	let nodeObj = ns.hacknet.getNodeStats(index);
	let ramBinaryLog = Math.log2(nodeObj.ram);
	nodeObj.ram = Math.floor(Math.pow(2, ramBinaryLog+1));
	let newProduction = hns.hashGainRate(nodeObj.level, 0, nodeObj.ram, nodeObj.cores, 
		player.hacknet_node_money_mult);
	return (newProduction - nodeObj.production);
}

export function HnsHashGainCores(ns, index) {
	const hns = ns.formulas.hacknetServers;
	const player = ns.getPlayer();
	let nodeObj = ns.hacknet.getNodeStats(index);
	nodeObj.cores += 1;
	let newProduction = hns.hashGainRate(nodeObj.level, 0, nodeObj.ram, nodeObj.cores, 
		player.hacknet_node_money_mult);
	return (newProduction - nodeObj.production);
}

export const HnsUpgradeParts = {
	Level: "level",
	Ram: "ram",
	Cores: "cores",
	Cache: "cache",
	None: "none"	// temp value only. Don't submit "none" to upgrade function as it will thow an error
}

export const HnsUpgrades = {
	Money: "Sell for Money",
	CorpFunds: "Sell for Corporation Funds",
	ReduceMinSecurity: "Reduce Minimum Security",
	IncreaseMaxMoney: "Increase Maximum Money",
	Studying: "Improve Studying",
	Gym: "Improve Gym Training",
	CorpResearch: "Exchange for Corporation Research",
	BladeburnerRank: "Exchange for Bladeburner Rank",
	BladeburnerSP: "Exchange for Bladeburner SP",
	CodingContract: "Generate Coding Contract",
}