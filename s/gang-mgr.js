/** @param {NS} ns **/
import { Vprint, FormatMoney } from "helper-functions.js"

// NOTE: SCRIPT WORKS GREAT! (but has a few "magic numbers" in code below).
// TODO: EXTRACT MAGIC NUMBERS AND MAKE THEM INTO GLOBAL OR LOCAL CONSTANTS

export async function main(ns) {
	ns.disableLog("ALL");
	let buyEnabled = ns.args[0];
	let verbose = ns.args[1];

	buyEnabled = (buyEnabled == true || buyEnabled == "true") ? true : false;	// default=false
	verbose = (verbose == true || verbose == "true") ? true : false;			// default=false

	Vprint(ns, true, `Gang manager started. buyEnabled: ${buyEnabled}, verbose: ${verbose}`)

	const g = ns.gang;
	const TARGET_AVG_STATS_BASE = 50;			// Target base stats before multipliers
	const ASCEND_MULT = 1.13;					// Ascend when multiplers will grow by this much
	const ASCEND_MULT_HACK = 1.20;				// Ascend multiplier for hacking gang
	const TERR_WAR_INTERVAL = 20000-1500;		// 20 seconds - 1.5s cushion
	let LOOP_INTERVAL = TERR_WAR_INTERVAL / 4;	// roughly 5 seconds per loop

	let gangInfo, gangMembers, bonusTime;

	// GET NEXT TERRITORY WARFARE TICK (UPDATES EVERY 20 SECONDS)
	let nextTerrWarfareTick = await GetTerrWarfareTick(ns) + TERR_WAR_INTERVAL;
	
	while (true) {
		// UPDATE GANG INFO
		gangInfo = g.getGangInformation();
		gangMembers = GetGangMembers(ns);
		bonusTime = g.getBonusTime();	// bonusTime often has random small values < 5

		// RECRUIT NEW MEMBERS
		if (g.canRecruitMember()) {
			// try each available name until one works
			let listOfNames = Object.values(GangNames);
			let newMember = "";
			// cycle through names from start --> end in case someone died
			for (let i=0; i<listOfNames.length; i++) {
				if (!gangMembers.find(m => m.name === listOfNames[i])) {
					newMember = listOfNames[i];
					break;
				}
			}
			g.recruitMember(newMember);
			gangMembers = GetGangMembers(ns);
			Vprint(ns, verbose, `🕵️‍♂️ Recruited new gang member: ${newMember}`)
		}
		
		// TERRITORY WARFARE (ENGAGE ONCE EVERY 20 SEC, SYNCHRONIZED WITH CHECK)
		if (bonusTime <= 5) {
			if (Math.random() > gangInfo.territory) {	// runs more often with low territory
				if (Date.now() >= nextTerrWarfareTick) {
					// Vprint(ns, verbose, `⚔️All gang members temporarily assigned to territory warfare.`)
					// assign everyone to territory warfare
					for (let m of gangMembers) {
						SetMemberTaskSafe(ns, m.name, GangTasks.Hacking.TERRITORY_WARFARE);
					}
					nextTerrWarfareTick = await GetTerrWarfareTick(ns) + TERR_WAR_INTERVAL;
					LOOP_INTERVAL = (nextTerrWarfareTick - Date.now()) / 4;
					// Vprint(ns, verbose, `Territory warfare done for now. It's crime time...`)
				}
			}
		}

		for (let m of gangMembers) {
			// SKIP IF DEAD
			if (!m || m == null || m == undefined)
				continue;

			// TRAINING
			TrainMember(ns, m, TARGET_AVG_STATS_BASE)
			
			// ASSIGN TASKS
			if (m.isTrained) {
				let rand = Math.random();
				// TERRITORY WARFARE DURING BONUS TIME (less frequent the more territory owned)
				if (bonusTime >= 5 && rand < .55 - gangInfo.territory)
					SetMemberTaskSafe(ns, m.name, GangTasks.Hacking.TERRITORY_WARFARE);
				// HACKING GANG TASKS
				else if (gangInfo.isHacking) {
					rand = Math.random();
					// reduce wanted penalty when it gets bad (lower=worse)
					if (gangInfo.wantedPenalty < rand)
						SetMemberTaskSafe(ns, m.name, GangTasks.Hacking.ETHICAL_HACKING);
					// early game
					else if (m.hack < 100)
						SetMemberTaskSafe(ns, m.name, GangTasks.Hacking.PHISHING);
					// mid game
					else if (m.hack < 2500)
						SetMemberTaskSafe(ns, m.name, GangTasks.Hacking.FRAUD);
					// late game
					else {
						rand = Math.random();
						if (rand < .40)
							SetMemberTaskSafe(ns, m.name, GangTasks.Hacking.CYBERTERRORISM);
						else
							SetMemberTaskSafe(ns, m.name, GangTasks.Hacking.MONEY_LAUNDERING);
					}
				}
				// COMBAT GANG TASKS
				else {
					rand = Math.random();
					// reduce wanted penalty when it gets bad (lower=worse)
					if (gangInfo.wantedPenalty < rand)
						SetMemberTaskSafe(ns, m.name, GangTasks.Combat.VIGILANTE_JUSTICE);
					// early game
					else if (m.avgStats < 175) {
						rand = Math.random();
						if (rand < .25)
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.MUG);
						else if (rand < .50)
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.DEAL_DRUGS);
						else if (rand < .75)
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.TRAIN_COMBAT);
						else
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.TRAIN_HACKING);
					}
					// mid-early game
					else if (m.avgStats < 225) {
						rand = Math.random();
						if (rand < .50)
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.ARMED_ROBBERY);
						else
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.CON);
					}
					// mid-late game
					else if (m.avgStats < 500) {
						rand = Math.random();
						if (rand < .40)
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.CON);
						else
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.TRAFFICK_ARMS);
					}
					// late game
					else {
						if (m.agi < TARGET_AVG_STATS_BASE * m.avgAscMult * .50)
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.CON);
						else if (m.earnedRespect < 10000 * m.avgAscMult) {
							rand = Math.random();
							if (rand < .40)
								SetMemberTaskSafe(ns, m.name, GangTasks.Combat.TERRORISM);
							else
								SetMemberTaskSafe(ns, m.name, GangTasks.Combat.HUMAN_TRAFFICKING);
						}
						else
							SetMemberTaskSafe(ns, m.name, GangTasks.Combat.HUMAN_TRAFFICKING);
					}
				}
			}

			// BUY EQUIPMENT AND AUGS
			if (buyEnabled) {
				// for payback time, shorter time == less $$ spent
				// augs last forever incl. after ascension so assume a very large payback time
				const paybkTimeEq = 30 * 60;			// 30 min (in seconds)
				const paybkTimeAug = 30 * 24 * 60 * 60;	// 30 days (in seconds)
				let equipAugs = GetGangEquipment(ns, true);
				let equip = GetGangEquipment(ns, false)	// excludes augs
				let augs = equipAugs.filter(e => e.type == EquipType.AUG);
				// filter out already owned
				if (m.upgrades.length > 0 || m.augmentations.length > 0) {
					equip = equip.filter(e => m.upgrades.includes(e.name) === false);
					augs = augs.filter(a => m.augmentations.includes(a.name) === false);
				}
				// buy 1 aug per loop
				let cash = ns.getServerMoneyAvailable('home');

				if (augs.length > 0 && augs[0].cost < gangInfo.moneyGainRate * paybkTimeAug && augs[0].cost < cash) {
					if (g.purchaseEquipment(m.name, augs[0].name)) {
						Vprint(ns, verbose, `🦾 Bought aug for ${m.name}: ${augs[0].name} ` +
							`at ${FormatMoney(augs[0].cost)}`);
					}
				}
				// buy 1 equipment per loop (must have 5x cash, don't buy during bonusTime)
				cash = ns.getServerMoneyAvailable('home');
				// Vprint(ns, true, `${equip[0].name}: ${FormatMoney(equip[0].cost)} < ${FormatMoney(gangInfo.moneyGainRate * paybkTimeEq)}? ${equip[0].cost < gangInfo.moneyGainRate * paybkTimeEq}`)
				if (equip.length > 0) {
					if ((equip[0].cost < gangInfo.moneyGainRate*paybkTimeEq) && (equip[0].cost < cash*5) && (bonusTime <= 5)) {
						if (g.purchaseEquipment(m.name, equip[0].name)) {
							Vprint(ns, verbose, `🔪 Bought equip for ${m.name}: ` +
								`${equip[0].name} at ${FormatMoney(equip[0].cost)}`);
						}
					}
				}
			}


			// ASCENSION
			m.ascMult = g.getAscensionResult(m.name);
			// make sure ascending doesn't jack up the wanted penalty
			let respectRemain = gangInfo.respect - m.earnedRespect;			
			if (m.ascMult && (respectRemain > gangInfo.wantedLevel * gangMembers.length)) {
				if (gangInfo.isHacking) {
					// Hacking gang ascension
					if (m.ascMult.hack > ASCEND_MULT_HACK) {
						Vprint(ns, verbose, `🌟 Gang member is ascending!  ${m.name}`)
						g.ascendMember(m.name);	
					}
				}
				else {
					// Combat gang ascension
					m.avgAscMult = (m.ascMult.hack + m.ascMult.str + m.ascMult.def + 
						m.ascMult.dex + m.ascMult.agi + m.ascMult.cha) / 6;
					m.avgCombatAscMult = (m.ascMult.str + m.ascMult.def + 
						m.ascMult.dex + m.ascMult.agi) / 4;
					// Ascend when multipliers increased by certain multiple
					if (m.avgCombatAscMult > ASCEND_MULT) {
						Vprint(ns, verbose, `🌟 Gang member is ascending!  ${m.name}`)
						g.ascendMember(m.name);
					}
				}
			}
		}

		// GANG TERRITORY WARFARE ON/OFF
		if (gangInfo.power > 5) {
			gangInfo = g.getGangInformation();
			// have to do gymnastics here to convert messy object w/ magic strings into a clean array
			let otherGangs = g.getOtherGangInformation();
			let otherGangsArr = Object.entries(otherGangs);
			let declareWar = true;
			for (let gang of otherGangsArr) {
				gang = gang[1];
				// skip self
				if (gangInfo.power === gang.power)
					continue;
				// check if our gang's power is > 30% stronger vs all other gangs
				if (gangInfo.power < gang.power * 1.30 || gang.power == undefined)
					declareWar = false;
			}
			if (declareWar == true && gangInfo.territoryWarfareEngaged == false) {
				g.setTerritoryWarfare(declareWar);
				Vprint(ns, true, `⚔️⚔️⚔️ THIS MEANS WAR!!! ⚔️⚔️⚔️ (gang warfare engaged)`);
			}
			// retreat if power falls below 30% stronger
			else if (declareWar == false && gangInfo.territoryWarfareEngaged == true) {
				g.setTerritoryWarfare(declareWar);
				Vprint(ns, true, `🏃💨💨 RETREAT!!! 🏃💨💨 (gang warfare disengaged)`);
			}
		}
		
		// END OF LOOP
		let bonusDivisor = bonusTime > 5 ? 10 : 1;	// loops run 10x faster during bonusTime
		await ns.sleep(LOOP_INTERVAL / bonusDivisor);
	}
}

// FUNCTIONS

// Makes sure that member is alive before assigning task so script won't crash
export function SetMemberTaskSafe(ns, memberName, task) {
	let gangMembers = GetGangMembers(ns);
	if (gangMembers.find(m => m.name === memberName))
		ns.gang.setMemberTask(memberName, task);
	else
		Vprint(ns, true, `Can't assign ${memberName} to task ${task}.  Probably they dead.`);
}

export async function GetTerrWarfareTick(ns) {
	let otherGangs = Object.values(ns.gang.getOtherGangInformation());
	let prevPower = 0, power = 0;
	otherGangs.forEach(gang => power += gang.power);
	prevPower = power;
	while (prevPower === power) {
		otherGangs = Object.values(ns.gang.getOtherGangInformation());
		prevPower = power;
		power = 0;
		otherGangs.forEach(gang => power += gang.power);
		await ns.sleep(1);
	}
	return Date.now()-5;	// return now minus 5 ms cushion
}

// TRAIN MEMBER
export function TrainMember(ns, member, targetAvgStatsBase) {
	const g = ns.gang;
	let gangInfo = g.getGangInformation();
	member.isTrained = false;

	// HACKING GANG TRAINING
	if (gangInfo.isHacking) {
		if (member.avgCombatStats < targetAvgStatsBase * member.avgMult) {
			// even hacking gang needs combat stats for territory warfare
			SetMemberTaskSafe(ns, member.name, GangTasks.Hacking.TRAIN_COMBAT);
		}
		else if (member.hack < targetAvgStatsBase * member.hack_mult) {
			SetMemberTaskSafe(ns, member.name, GangTasks.Hacking.TRAIN_HACKING);
		}
		else if (member.cha < targetAvgStatsBase * member.cha_mult) {
			SetMemberTaskSafe(ns, member.name, GangTasks.Hacking.TRAIN_CHARISMA);
		}
		else
			member.isTrained = true;
	}
	// COMBAT GANG TRAINING
	else {
		if (member.avgCombatStats < targetAvgStatsBase * member.avgMult) {
			SetMemberTaskSafe(ns, member.name, GangTasks.Combat.TRAIN_COMBAT);
		}
		else if (member.hack < targetAvgStatsBase * member.hack_mult) {
			SetMemberTaskSafe(ns, member.name, GangTasks.Combat.TRAIN_HACKING);
		}
		else if (member.cha < targetAvgStatsBase * member.cha_mult * 0.75) {
			SetMemberTaskSafe(ns, member.name, GangTasks.Combat.TRAIN_CHARISMA);
		}
		else
			member.isTrained = true;
	}
}

export function GetGangMembers(ns) {
	const g = ns.gang;
	let gangMemberNames = g.getMemberNames();
	let gangMembers = [];
	for (let name of gangMemberNames) {
		let m = g.getMemberInformation(name);
		m.name = name;
		m.avgStats = (m.hack + m.str + m.def + m.dex + m.agi + m.cha) / 6;
		m.avgCombatStats = (m.str + m.def + m.dex + m.agi) / 4;
		m.avgMult = (m.hack_mult + m.str_mult + m.def_mult + m.dex_mult + 
			m.agi_mult + m.cha_mult) / 6;
		m.avgCombatMult = (m.str_mult + m.def_mult + m.dex_mult + m.agi_mult) / 4;
		m.avgAscMult = (m.hack_asc_mult + m.str_asc_mult + m.def_asc_mult + m.dex_asc_mult + 
			m.agi_asc_mult + m.cha_asc_mult) / 6;
		m.avgCombatAscMult = (m.str_asc_mult + m.def_asc_mult + m.dex_asc_mult + 
			m.agi_asc_mult) / 4;
		gangMembers.push(m);
	}
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
	Combat : {
		MUG : "Mug People",
		DEAL_DRUGS : "Deal Drugs",
		STRONGARM : "Strongarm Civilians",
		CON : "Run a Con",
		ARMED_ROBBERY : "Armed Robbery",
		TRAFFICK_ARMS : "Traffick Illegal Arms",
		BLACKMAIL : "Threaten & Blackmail",
		HUMAN_TRAFFICKING : "Human Trafficking",
		TERRORISM : "Terrorism",
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
	equip.sort((a,b) => a.cost > b.cost ? 1 : -1)
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