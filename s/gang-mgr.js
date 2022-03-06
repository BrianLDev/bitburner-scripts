/** @param {NS} ns **/
import { Vprint } from "helper-functions.js"

export async function main(ns) {
	const g = ns.gang;
	const TARGET_AVG_STATS =75;
	const ASCEND_MULT = 1.10;	// Ascend when multiplers will grow by this much
	let verbose = true;	// TODO: UPDATE THIS LATER

	let gangInfo, gangMembers, gangTasks;
		gangTasks = GetGangTasks(ns);
	
	while (true) {
		// UPDATE GANG INFO
		gangInfo = g.getGangInformation();	// may not need this.  TBD
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
			// ASSIGN TASKS
			let targetAvgStats = TARGET_AVG_STATS * m.avgMult;
			if (m.avgStats < targetAvgStats) {
				TrainMember(ns, m, targetAvgStats);
			}
			else {
				// TODO: ASSIGN TASKS DYNAMICALLY DEPENDING ON STATS
				let random = Math.random();
				if (random <= .9) {
					if (m.earnedRespect < 5000 * m.avgMult)
						g.setMemberTask(m.name, GangTasks.TERRORISM);
					else
						g.setMemberTask(m.name, GangTasks.HUMAN_TRAFFICKING);
				}
				else
					g.setMemberTask(m.name, GangTasks.TERRITORY_WARFARE);
			}

			// BUY WEAPONS AND AUGS


			// ASCENSION
			m.ascMult = g.getAscensionResult(m.name);
			if (m.ascMult) {
				m.avgAscMult = (m.ascMult.hack + m.ascMult.str + m.ascMult.def + m.ascMult.dex +
					m.ascMult.agi + m.ascMult.cha) / 6;
				// Ascend when multipliers increased by certain multiple
				if (m.avgAscMult > ASCEND_MULT) {
					Vprint(ns, verbose, `Gang member is ascending!  ${m.name}`)
					g.ascendMember(m.name);
				}
			}
		});

		// GANG WARFARE
		if (!gangInfo.territoryWarfareEngaged) {
			// have to do some gymnastics here to get a messy object into a clean array
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
		await ns.sleep(5000);
		// ns.exit();	// TODO: REMOVE LATER
	}
}

export function TrainMember(ns, member, targetAvgStats) {
	const g = ns.gang;

	// first hacking
	if (member.hack < targetAvgStats * 1.5) {
		g.setMemberTask(member.name, GangTasks.TRAIN_HACKING);
		// member.busyUntil = // TODO
	}
	// then charisma
	else if (member.cha < targetAvgStats / 1.5) {
		g.setMemberTask(member.name, GangTasks.TRAIN_CHARISMA);
		// member.busyUntil = // TODO
	}
	// combat last
	else if (member.avgCombatStats < targetAvgStats) {
		g.setMemberTask(member.name, GangTasks.TRAIN_COMBAT);
		// member.busyUntil = // TODO
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
		m.avgMult = (m.hack_mult + m.str_mult + m.def_mult + m.dex_mult + m.agi_mult + m.cha_mult) / 6;
		m.avgCombatStats = (m.str + m.def + m.dex + m.agi) / 4;
		m.avgCombatMult = (m.str_mult + m.def_mult + m.dex_mult + m.agi_mult) / 4;
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
	UNASSIGNED : "Unassigned",
	MUG_PEOPLE : "Mug People",
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