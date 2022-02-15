/** @param {NS} ns **/
import { Vprint, FormatMoney } from "helper-functions.js"

export async function main(ns) {
	// const hns = ns.formulas.hacknetServers;
	// const constants = hns.constants();
	// const maxNumNodes = ns.hacknet.maxNumNodes();

	let verbose = true;

	while (true) {
		HnsUpgradeHacknetServers(ns, verbose);

		await ns.sleep(1);
	}
}

export function HnsGetMoney(ns, millionsToBuy=1) {
	let hashes = ns.hacknet.numHashes();
	let moneyCost = ns.hacknet.hashCost(HnsUpgrades.Money);
	let sellQty = Math.floor(hashes / moneyCost);
	sellQty = Math.min(sellQty, millionsToBuy);
	for (let i=0; i<sellQty; i++) {
		ns.hacknet.spendHashes(HnsUpgrades.Money);
	}
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
	const player = ns.getPlayer();
	let increase = moneyTarget - player.money;
	let increaseMillions = increase / 1000000;
	if (increaseMillions >= 1)
		HnsGetMoney(ns, increaseMillions);
}

// Determines the ideal next upgrade out of all current Hacknet servers and buys it if there's enough money
export function HnsUpgradeHacknetServers(ns, verbose) {
	// TODO: ALSO INCLUDE BUYING A NEW SERVER
	// TODO: ALSO INCLUDE CACHE UPGRADES
	let nodes = GetHacknetNodes(ns);
	let minHashGain = Number.MAX_SAFE_INTEGER;
	let nodeToUpgrade = -1;
	let upgradePart = HnsUpgradeParts.None;

	// cycle through nodes and determine next best upgrade
	for (let i=0; i<nodes.length; i++) {
		let node = nodes[i];
		if (node.levelCostPerHashGain < minHashGain) {
			minHashGain = node.levelCostPerHashGain;
			nodeToUpgrade = i;
			upgradePart = HnsUpgradeParts.Level;
		}
		if (node.ramCostPerHashGain < minHashGain) {
			minHashGain = node.ramCostPerHashGain;
			nodeToUpgrade = i;
			upgradePart = HnsUpgradeParts.Ram;
		}
		if (node.coresCostPerHashGain < minHashGain) {
			minHashGain = node.coresCostPerHashGain;
			nodeToUpgrade = i;
			upgradePart = HnsUpgradeParts.Cores;
		}
	}

	// Purchase the upgrade if there's enough money to do it
	// 1) Upgrade Level
	if (upgradePart == HnsUpgradeParts.Level && nodeToUpgrade > -1) {
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
	// 2) Upgrade Ram
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
	// 2) Upgrade Cores
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