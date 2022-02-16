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

	let node = {};
	let nodes = [];
	for (let i=0; i<nodeCount; i++) {
		node = HnsAnalyzeNode(ns, i);
		nodes.push(node);
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
	let node = ns.hacknet.getNodeStats(index);
	node.level += 1;
	let newProduction = hns.hashGainRate(node.level, 0, node.ram, node.cores, 
		player.hacknet_node_money_mult);
	return (newProduction - node.production);
}

export function HnsHashGainRam(ns, index) {
	const hns = ns.formulas.hacknetServers;
	const player = ns.getPlayer();
	let node = ns.hacknet.getNodeStats(index);
	let ramBinaryLog = Math.log2(node.ram);
	node.ram = Math.floor(Math.pow(2, ramBinaryLog+1));
	let newProduction = hns.hashGainRate(node.level, 0, node.ram, node.cores, 
		player.hacknet_node_money_mult);
	return (newProduction - node.production);
}

export function HnsHashGainCores(ns, index) {
	const hns = ns.formulas.hacknetServers;
	const player = ns.getPlayer();
	let node = ns.hacknet.getNodeStats(index);
	node.cores += 1;
	let newProduction = hns.hashGainRate(node.level, 0, node.ram, node.cores, 
		player.hacknet_node_money_mult);
	return (newProduction - node.production);
}

export function HnsUpgradeCache(ns, index, verbose=false) {
	let node = HnsAnalyzeNode(ns, index);
	let moneyPotential = HnsCheckMoneyPotential(ns);
	if (moneyPotential > node.cacheCost) {
		HnsIncreaseMoneyTo(ns, node.cacheCost);
		let prevCapacity = ns.hacknet.hashCapacity();
		if (ns.hacknet.upgradeCache(index, 1)) {
			let newCapacity = ns.hacknet.hashCapacity();
			Vprint(ns, verbose, `Upgraded Cache ${node.cache}->${node.cache+1} on Hacknet Server ` + 
				`${index}, cost of upgrade: ${FormatMoney(node.cacheCost)}, ` +
				`hash capacity ${prevCapacity}-->${newCapacity}`);
		}
		else
			Vprint(ns, verbose, `ERROR: Unable to upgrade Cache on Hacknet Server ${index}`);
	}
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