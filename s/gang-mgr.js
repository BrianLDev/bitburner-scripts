/** @param {NS} ns **/
import { Vprint, FormatMoney } from "helper-functions.js"

export async function main(ns) {
	const g = ns.gang;
	const TARGET_AVG_STATS_BASE = 50;	// Target base stats before multipliers
	const ASCEND_MULT = 1.05;			// Ascend when multiplers will grow by this much
	const LOOP_INTERVAL = 5000-50;		// 5 seconds - 50ms to sync w/ terr war cushion
	const TERR_WAR_INTERVAL = 20000-300;// 20 seconds - 300ms cushion
	let verbose = true;	// TODO: UPDATE THIS LATER

	let gangInfo, gangMembers;
	let bonusTime = g.getBonusTime();

	// GET NEXT TERRITORY WARFARE TICK (UPDATES EVERY 20 SECONDS)
	let nextTerrWarfareTick;
	if (bonusTime <= 0)
		nextTerrWarfareTick = await GetTerrWarfareTick(ns) + TERR_WAR_INTERVAL;
	
	while (true) {
		// UPDATE GANG INFO
		gangInfo = g.getGangInformation();
		gangMembers = GetGangMembers(ns);
		bonusTime = g.getBonusTime();

		// RECRUIT NEW MEMBERS
		if (g.canRecruitMember()) {
			let newMember = GangNames[gangMembers.length]
			g.recruitMember(newMember);
			gangMembers = GetGangMembers(ns);
			Vprint(ns, verbose, `Recruiting new gang member: ${newMember}`)
		}
		
		// TERRITORY WARFARE (ENGAGE ONCE EVERY 20 SEC, SYNCHRONIZED WITH CHECK)
		if (Date.now() >= nextTerrWarfareTick && bonusTime <= 0) {
			// assign everyone to territory warfare
			gangMembers.forEach(m => {
				g.setMemberTask(m.name, GangTasks.Hacking.TERRITORY_WARFARE);
			})
			nextTerrWarfareTick = await GetTerrWarfareTick(ns) + TERR_WAR_INTERVAL;
		}

		gangMembers.forEach(m => {
			// TRAINING
			TrainMember(ns, m, TARGET_AVG_STATS_BASE)
			
			// ASSIGN TASKS
			if (m.isTrained) {
				let rand = Math.random()
				// HACKING GANG TASKS
				if (gangInfo.isHacking) {
					// reduce wanted penalty when it gets bad (lower=worse)
					if (gangInfo.wantedPenalty < rand)
						g.setMemberTask(m.name, GangTasks.Hacking.ETHICAL_HACKING);
					// early game
					else if (m.hack < 100)
						g.setMemberTask(m.name, GangTasks.Hacking.PHISHING);
					// mid game
					else if (m.hack < 500)
						g.setMemberTask(m.name, GangTasks.Hacking.FRAUD);
					// late game
					else {
						if (m.earnedRespect < 15000 * m.avgAscMult)
							g.setMemberTask(m.name, GangTasks.Hacking.CYBERTERRORISM);
						else
							g.setMemberTask(m.name, GangTasks.Hacking.MONEY_LAUNDERING);
					}
				}
				// COMBAT GANG TASKS
				else {
					// reduce wanted penalty when it gets bad (lower=worse)
					if (gangInfo.wantedPenalty < rand)
						g.setMemberTask(m.name, GangTasks.Combat.VIGILANTE_JUSTICE);
					// early game
					else if (m.avgStats < 175) {
						rand = Math.random();
						if (rand < .50)
							g.setMemberTask(m.name, GangTasks.Combat.MUG);
						else if (rand < .75)
							g.setMemberTask(m.name, GangTasks.Combat.TRAIN_COMBAT);
						else
							g.setMemberTask(m.name, GangTasks.Combat.TRAIN_HACKING);
					}
					// mid-early game
					else if (m.avgStats < 250)
						g.setMemberTask(m.name, GangTasks.Combat.ARMED_ROBBERY);
					// mid-late game
					else if (m.avgStats < 500)
						g.setMemberTask(m.name, GangTasks.Combat.TRAFFICK_ARMS);
					// late game
					else {
						if (m.earnedRespect < 500 * m.avgAscMult)
							g.setMemberTask(m.name, GangTasks.Combat.ARMED_ROBBERY);
						else if (m.earnedRespect < 15000 * m.avgAscMult)
							g.setMemberTask(m.name, GangTasks.Combat.TERRORISM);
						else
							g.setMemberTask(m.name, GangTasks.Combat.HUMAN_TRAFFICKING);
					}
				}
			}

			// BUY EQUIPMENT AND AUGS
			const paybkTimeEq = 20 * 60;			// 20 min (in seconds)
			const paybkTimeAug = 30 * 24 * 60 * 60;	// 30 days (in seconds)
			let cash = ns.getServerMoneyAvailable('home');
			let equipAugs = GetGangEquipment(ns, true);
			let equip = GetGangEquipment(ns, false)	// excludes augs
			let augs = equipAugs.filter(e => e.type == EquipType.AUG);
			// filter out already owned
			if (m.upgrades.length > 0) {
				equip = equip.filter(e => m.upgrades.includes(e.name) === false);
				augs = augs.filter(a => m.upgrades.includes(a.name) === false);
			}
			// buy 1 aug per loop
			if (augs[0].cost < gangInfo.moneyGainRate * paybkTimeAug && augs[0].cost < cash) {
				g.purchaseEquipment(m.name, augs[0].name);
				Vprint(ns, verbose, `Bought aug for ${m.name}: ${augs[0].name} ` +
					`costing ${FormatMoney(augs[0].cost)}`);
			}
			// buy 1 quipment per loop
			if (equip[0].cost < gangInfo.moneyGainRate * paybkTimeEq && equip[0].cost < cash) {
				g.purchaseEquipment(m.name, equip[0].name);
				Vprint(ns, verbose, `Bought equip for ${m.name}: ${equip[0].name} ` +
					`costing ${FormatMoney(equip[0].cost)}`);
			}


			// ASCENSION
			m.ascMult = g.getAscensionResult(m.name);
			// make sure ascending doesn't jack up the wanted penalty
			let respectRemain = gangInfo.respect - m.earnedRespect;			
			if (m.ascMult && (respectRemain > gangInfo.wantedLevel * 2)) {
				if (gangInfo.isHacking) {
					// Hacking gang ascension
					if (m.ascMult.hack > ASCEND_MULT) {
						Vprint(ns, verbose, `Gang member is ascending!  ${m.name}`)
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
						Vprint(ns, verbose, `Gang member is ascending!  ${m.name}`)
						g.ascendMember(m.name);
					}
				}
			}
		});

		// GANG TERRITORY WARFARE ON/OFF
		if (!gangInfo.territoryWarfareEngaged && gangInfo.power > 5) {
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

export function TrainMember(ns, member, targetAvgStatsBase) {
	const g = ns.gang;
	let gangInfo = g.getGangInformation();
	member.isTrained = false;

	if (gangInfo.isHacking) {
		// Hacking gang training
		// First check if training is complete or not
		if (member.hack < targetAvgStatsBase * member.hack_mult) {
			g.setMemberTask(member.name, GangTasks.Hacking.TRAIN_HACKING);
		}
		else if (member.cha < targetAvgStatsBase * member.cha_mult  * 0.5) {
			g.setMemberTask(member.name, GangTasks.Hacking.TRAIN_CHARISMA);
		}
		// even hacking gang needs combat stats for territory warfare
		else if (member.avgCombatStats < targetAvgStatsBase * member.avgMult) {
			g.setMemberTask(member.name, GangTasks.Hacking.TRAIN_COMBAT);
		}
		else
			member.isTrained = true;
	}
	else {
		// Combat gang training
		if (member.hack < targetAvgStatsBase * member.hack_mult) {
			g.setMemberTask(member.name, GangTasks.Combat.TRAIN_HACKING);
		}
		else if (member.cha < targetAvgStatsBase * member.cha_mult * 0.5) {
			g.setMemberTask(member.name, GangTasks.Combat.TRAIN_CHARISMA);
		}
		else if (member.avgCombatStats < targetAvgStatsBase * member.avgMult) {
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
		m.avgCombatStats = (m.str + m.def + m.dex + m.agi) / 4;
		m.avgMult = (m.hack_mult + m.str_mult + m.def_mult + m.dex_mult + 
			m.agi_mult + m.cha_mult) / 6;
		m.avgCombatMult = (m.str_mult + m.def_mult + m.dex_mult + m.agi_mult) / 4;
		m.avgAscMult = (m.hack_asc_mult + m.str_asc_mult + m.def_asc_mult + m.dex_asc_mult + 
			m.agi_asc_mult + m.cha_asc_mult) / 6;
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