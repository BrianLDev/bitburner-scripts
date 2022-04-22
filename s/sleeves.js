/** @param {NS} ns */
import * as c from 'constants.js'

export async function main(ns) {
	const mode = ns.args[0];
	if (ModeArr.includes(mode) === false) {
		ns.tprint(`ERROR: mode entered: ${mode} is not found in ${Object.values(Mode)}`);
		ns.exit();
	}

	const sleeveCount = ns.sleeve.getNumSleeves();
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
		if (sleeveCount > 8)
			ns.sleeve.setToCommitCrime(8, c.SleeveCrime.homicide);
		ns.tprint(`Sleeve training mode complete.`);
	}
	// HOMICIDE MODE
	else if (mode === Mode.homicide) {
		for (let i=0; i<sleeveCount; i++) {
			ns.sleeve.setToCommitCrime(i, c.SleeveCrime.homicide);
		}
		ns.tprint(`Sleeve homicide mode complete.`);
	}
	// RECOVERY MODE
	else if (mode === Mode.recovery) {
		for (let i=0; i<sleeveCount; i++) {
			ns.sleeve.setToShockRecovery(i);
		}
	}
}

export const Mode = {
	train: 'train',
	homicide: 'homicide',
	recovery: 'recovery'
};
export const ModeArr = Object.values(Mode);