/** @param {NS} ns **/
import { Vprint } from "helper-functions.js"

export async function main(ns) {
	const g = ns.gang;
	const TARGET_AVG_STATS_BASE = 30;	// Target base stats before multipliers
	const ASCEND_MULT = 1.20;			// Ascend when multiplers will grow by this much
	const LOOP_INTERVAL = 5000;
	let verbose = true;	// TODO: UPDATE THIS LATER

	let gangInfo, gangMembers, gangTasks;
	gangTasks = GetGangTasks(ns);
	
	while (true) {
		// UPDATE GANG INFO
		gangInfo = g.getGangInformation();
		gangMembers = GetGangMembers(ns);
		gangTasks = GetGangTasks(ns);

		// RECRUIT NEW MEMBERS
		if (g.canRecruitMember()) {
			let newMember = GangNames[gangMembers.length]
			g.recruitMember(newMember);
			gangMembers = GetGangMembers(ns);
			Vprint(ns, verbose, `Recruiting new gang member: ${newMember}`)
		}

		gangMembers.forEach(m => {
			// TRAINING
			TrainMember(ns, m, TARGET_AVG_STATS_BASE)
			
			// ASSIGN TASKS
			if (m.isTrained) {
				// TODO: FIGURE OUT HOW TO TIME TERRITORY WARFARE EXACTLY ON 20 SECOND CHECK
				// Engage in territory warfare more the worse it is
				if (gangInfo.territory * 2 <= Math.random() ) {
					g.setMemberTask(m.name, GangTasks.Hacking.TERRITORY_WARFARE);
				}
				else {
					// HACKING GANG TASKS
					if (gangInfo.isHacking) {
						// reduce wanted penalty 50% of the time when it gets bad (lower=worse)
						if (gangInfo.wantedPenalty <= .25 && Math.random() <= .50)
							g.setMemberTask(m.name, GangTasks.Hacking.ETHICAL_HACKING);
						// early game
						else if (m.hack < 100) {
							g.setMemberTask(m.name, GangTasks.Hacking.PHISHING);
						}
						// mid game
						else if (m.hack < 500)
							g.setMemberTask(m.name, GangTasks.Hacking.FRAUD);
						// late game
						else {
							if (m.earnedRespect < 10000 * m.avgAscMult)
								g.setMemberTask(m.name, GangTasks.Hacking.CYBERTERRORISM);
							else
								g.setMemberTask(m.name, GangTasks.Hacking.MONEY_LAUNDERING);
						}
					}
					// COMBAT GANG TASKS
					else {
						// early game
						if (m.avgStats < 100) {
							g.setMemberTask(m.name, GangTasks.Combat.PHISHING);
						}
						// mid game
						else if (m.avgStats < 500)
							g.setMemberTask(m.name, GangTasks.Combat.FRAUD);
						// late game
						else {
							if (m.earnedRespect < 5000 * m.avgAscMult)
								g.setMemberTask(m.name, GangTasks.Combat.TERRORISM);
							else
								g.setMemberTask(m.name, GangTasks.Combat.HUMAN_TRAFFICKING);
						}
					}

				}
			}

			// BUY WEAPONS AND AUGS
			// TODO: BUY WEAPONS/AUGS IN EARLY GAME
			let equipAugs = GetGangEquipment(ns, true);
			let equip = GetGangEquipment(ns, false)	// excludes augs
			// equip = // TODO: FILTER BASED ON UNOWNED
			let augs = equipAugs.filter(e => e.type == EquipType.AUG);
			// augs = // TODO: FILTER BASED ON UNOWNED
			let totalEquipCost = 0;
			equip.forEach(e => totalEquipCost += e.cost);
			let totalAugsCost = 0;
			augs.forEach(e => totalAugsCost += e.cost);
			
			// Buy Augs (late game)
			if (gangInfo.moneyGainRate > totalAugsCost) {
				augs.forEach(aug => {
					g.purchaseEquipment(m.name, aug.name);
				});
			}
			// Buy Equip (late game)
			if (gangInfo.moneyGainRate > totalEquipCost) {
				equip.forEach(e => {
					g.purchaseEquipment(m.name, e.name);
				});
			}


			// ASCENSION
			m.ascMult = g.getAscensionResult(m.name);
			if (m.ascMult) {
				if (gangInfo.isHacking) {
					// Hacking related gang ascension
					if (m.ascMult.hack > ASCEND_MULT) {
						Vprint(ns, verbose, `Gang member is ascending!  ${m.name}`)
						g.ascendMember(m.name);	
					}
				}
				else {
					// Combat related gang ascension
					m.avgAscMult = (m.ascMult.hack + m.ascMult.str + m.ascMult.def + 
						m.ascMult.dex + m.ascMult.agi + m.ascMult.cha) / 6;
					// Ascend when multipliers increased by certain multiple
					if (m.avgAscMult > ASCEND_MULT) {
						Vprint(ns, verbose, `Gang member is ascending!  ${m.name}`)
						g.ascendMember(m.name);
					}
				}
			}
		});

		// GANG WARFARE
		if (!gangInfo.territoryWarfareEngaged) {
			gangInfo = g.getGangInformation();
			// have to do gymnastics here to convert messy object w/ magic strings into a clean array
			let otherGangs = g.getOtherGangInformation();
			let otherGangsArr = Object.entries(otherGangs);
			let declareWar = true;
			otherGangsArr.forEach(gang => {
				gang = gang[1];
				if (gangInfo.power < gang.power || gang.power == undefined)
					declareWar = false;
			});
			if (declareWar) {
				g.setTerritoryWarfare(declareWar);
				Vprint(ns, verbose, `THIS MEANS WAR!!! (gang warfare engaged)`);
			}
		}
		
		// END OF LOOP
		await ns.sleep(LOOP_INTERVAL);
	}
}

export function TrainMember(ns, member, targetAvgStatsBase) {
	const g = ns.gang;
	let gangInfo = g.getGangInformation();
	member.isTrained = false;

	if (gangInfo.isHacking) {
		// Hacking focused training
		// First check if training is complete or not
		if (member.hack < targetAvgStatsBase * member.hack_asc_mult) {
			g.setMemberTask(member.name, GangTasks.Hacking.TRAIN_HACKING);
		}
		else if (member.cha < targetAvgStatsBase * member.cha_asc_mult  * 0.5) {
			g.setMemberTask(member.name, GangTasks.Hacking.TRAIN_CHARISMA);
		}
		// even hacking gang needs combat stats for territory warfare
		else if (member.avgCombatStats < targetAvgStatsBase * member.avgAscMult) {
			g.setMemberTask(member.name, GangTasks.Hacking.TRAIN_COMBAT);
		}
		else
			member.isTrained = true;
	}
	else {
		// Combat focused training
		if (member.hack < targetAvgStatsBase * member.hack_asc_mult * 0.75) {
			g.setMemberTask(member.name, GangTasks.Combat.TRAIN_HACKING);
		}
		else if (member.cha < targetAvgStatsBase * member.cha_asc_mult * 0.5) {
			g.setMemberTask(member.name, GangTasks.Combat.TRAIN_CHARISMA);
		}
		else if (member.avgCombatStats < targetAvgStatsBase * member.avgAscMult) {
			g.setMemberTask(member.name, GangTasks.Combat.TRAIN_COMBAT);
		}
		else
			member.isTrained = true;
	}
}

export function GetGangMembers(ns) {
	const g = ns.gang;
	let gangMemberNames = g.getMemberNames();
	let gangMembers = [];
	gangMemberNames.forEach(name => {
		let m = g.getMemberInformation(name);
		m.name = name;
		m.avgStats = (m.hack + m.str + m.def + m.dex + m.agi + m.cha) / 6;
		m.avgAscMult = (m.hack_asc_mult + m.str_asc_mult + m.def_asc_mult + m.dex_asc_mult + 
			m.agi_asc_mult + m.cha_asc_mult) / 6;
		m.avgCombatStats = (m.str + m.def + m.dex + m.agi) / 4;
		m.avgCombatAscMult = (m.str_asc_mult + m.def_asc_mult + m.dex_asc_mult + 
			m.agi_asc_mult) / 4;
		gangMembers.push(m);
	})
	return gangMembers;
}

export function GetGangTasks(ns) {
	const g = ns.gang;
	let taskNames = g.getTaskNames();
	let tasks = [];
	taskNames.forEach(name => {
		let task = g.getTaskStats(name);
		task.name = name;
		tasks.push(task);
	});
	return tasks;
}

export const GangTasks = {
	Hacking : {
		UNASSIGNED : "Unassigned",
		RANSOMWARE : "Ransomware",
		PHISHING : "Phishing",
		ID_THEFT : "Identity Theft",
		DDOS : "DDoS Attacks",
		VIRUS : "Plant Virus",
		FRAUD : "Fraud & Counterfeiting",
		MONEY_LAUNDERING : "Money Laundering",
		CYBERTERRORISM : "Cyberterrorism",
		ETHICAL_HACKING : "Ethical Hacking",
		VIGILANTE_JUSTICE : "Vigilante Justice",
		TRAIN_COMBAT : "Train Combat",
		TRAIN_HACKING : "Train Hacking",
		TRAIN_CHARISMA : "Train Charisma",
		TERRITORY_WARFARE : "Territory Warfare",
	},
	Combat : {	// FIX THESE
		RANSOMWARE : "Ransomware",
		PHISHING : "Phishing",
		ID_THEFT : "Identity Theft",
		DDOS : "DDoS Attacks",
		VIRUS : "Plant Virus",
		FRAUD : "Fraud & Counterfeiting",
		MONEY_LAUNDERING : "Money Laundering",
		CYBERTERRORISM : "Cyberterrorism",
		ETHICAL_HACKING : "Ethical Hacking",
		VIGILANTE_JUSTICE : "Vigilante Justice",
		TRAIN_COMBAT : "Train Combat",
		TRAIN_HACKING : "Train Hacking",
		TRAIN_CHARISMA : "Train Charisma",
		TERRITORY_WARFARE : "Territory Warfare",
	}

}

export function GetGangEquipment(ns, includeAugs=true) {
	const g = ns.gang;
	let equipNames = g.getEquipmentNames();
	let equip = [];
	equipNames.forEach(name => {
		let e = {};
		e.name = name;
		e.type = g.getEquipmentType(name);
		e.cost = g.getEquipmentCost(name);
		e.stats = g.getEquipmentStats(name);
		if (e.type != EquipType.AUG)
			equip.push(e);
		else if (e.type == EquipType.AUG && includeAugs == true)
			equip.push(e);
	});
	return equip;
}

export const EquipType = {
	WEAPON : 'Weapon',
	ARMOR : 'Armor',
	VEHICLE : 'Vehicle',
	ROOTKIT : 'Rootkit',
	AUG : 'Augmentation'
}

export const GangNames = [
	"Mr. Robot",
	"Tyrell Wellick",
	"Darlene",
	"Whitey Bulger",
	"Rifleman Flemmi",
	"The Irishman",
	"Tony Soprano",
	"Furio",
	"Paulie",
	"Michael De Santa",
	"Trevor Philips",
	"Franklin Clinton",
]