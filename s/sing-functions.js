/** @param {NS} ns **/
import * as c from "constants.js"

export async function main(ns) {
}

export function GetCrimes(ns, timeCushion=1000) {
	// note: this requires Singularity API
	// timeCushion = time in ms in between crimes to allow time to kill script
	let crimes = [];
	for (let i=0; i<c.CrimesArr.length; i++) {
		let crime = ns.getCrimeStats(c.CrimesArr[i]);
		crime.chance = ns.getCrimeChance(crime.name)	// TODO: UNCOMMENT THIS WHEN SINGULARITY USES LESS RAM
		
		if (!crime.chance || crime.chance == null)
			crime.chance = 1;	// fallback in case RAM too low to run ns.getCrimeChance()

		crime.earnRate = crime.money / (crime.time + timeCushion) * crime.chance;
		crimes.push(crime);
	}
	crimes.sort((a, b) => a.earnRate < b.earnRate ? 1 : -1);
	return crimes;
}