/** @param {NS} ns */
import * as c from 'constants.js'

export async function main(ns) {
	const mode = ns.args[0];
	if (ModeArr.includes(mode) === false) {
		ns.tprint(`ERROR: mode entered: [${mode}] is not found in ${Object.values(Mode)}`);
		ns.exit();
	}

	// Get info on all sleeves and put in array
	let sleeves = [];
	let sleeve;
	for (let i=0; i<8; i++) {
		sleeve = ns.sleeve.getSleeveStats(i);
		if (sleeve != null && sleeve != undefined)
			sleeves.push(sleeve);
	}

	// exit if no sleeves found
	const sleeveCount = sleeves.length;
	if (sleeveCount <= 0) {
		ns.tprint(`ERROR: no sleeves found.`);
		ns.exit();
	}

	// TRAIN MODE
	if (mode === Mode.train) {
		ns.sleeve.travel(0, c.City.volhaven);
		ns.sleeve.setToUniversityCourse(0, c.UniName.zb, c.Course.algorithms);
		if (sleeveCount > 1)
			ns.sleeve.setToGymWorkout(1, c.GymName.powerhouse, 'str');
		if (sleeveCount > 2)
			ns.sleeve.setToGymWorkout(2, c.GymName.powerhouse, 'def');
		if (sleeveCount > 3)
			ns.sleeve.setToGymWorkout(3, c.GymName.powerhouse, 'dex');
		if (sleeveCount > 4)
			ns.sleeve.setToGymWorkout(4, c.GymName.powerhouse, 'agi');
		if (sleeveCount > 5)
			ns.sleeve.setToUniversityCourse(5, c.UniName.rothman, c.Course.leadership);
		if (sleeveCount > 6)
			ns.sleeve.setToCommitCrime(6, c.SleeveCrime.homicide);
		if (sleeveCount > 7)
			ns.sleeve.setToCommitCrime(7, c.SleeveCrime.homicide);
		ns.tprint(`Sleeves training mode complete.`);
	}
	// HOMICIDE MODE
	else if (mode === Mode.crimes) {
		for (let i=0; i<sleeveCount; i++) {
			ns.sleeve.setToCommitCrime(i, c.SleeveCrime.homicide);
		}
		ns.tprint(`Sleeves crimes mode complete.`);
	}
	// RECOVERY MODE
	else if (mode === Mode.recovery) {
		for (let i=0; i<sleeveCount; i++) {
			ns.sleeve.setToShockRecovery(i);
		}
		ns.tprint(`Sleeves recovery mode complete.`);
	}
	// QUICKSTART MODE
	if (mode === Mode.quickstart) {
		ns.sleeve.travel(0, c.City.volhaven);
		ns.sleeve.setToUniversityCourse(0, c.UniName.zb, c.Course.algorithms);
		for (let i=1; i<sleeves.length; i++) {
			// NOTE: EXCLUDING SYNC SINCE I MAXIMIZED SYNC AND SETTOSYNCHRONIZE COSTS 4GB RAM
			// if (sleeves[i].sync < 100)
			// 	ns.sleeve.setToSynchronize(i);
			if (sleeves[i] > 0)
				ns.sleeve.setToShockRecovery(i);
			else
				ns.sleeve.setToCommitCrime(i, c.SleeveCrime.homicide);
		}
		
		ns.tprint(`Sleeves quickstart mode complete.`);
	}
}

export const Mode = {
	train: 'train',
	crimes: 'crimes',
	recovery: 'recovery',
	quickstart: 'quickstart',
};
export const ModeArr = Object.values(Mode);