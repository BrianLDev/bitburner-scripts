/** @param {NS} ns **/
import { Crime } from "constants.js"
import { FormatMoney } from "helper-functions.js"

export async function main(ns) {

	ns.tprint("CRIMMESSSSSS");
	ns.tprint("------------------------------------------------------------");
	// TODO: PRETTY THIS UP. ADD HEADERS, ETC

	let crimes = GetCrimes(ns, 1000);
	crimes.sort((a, b) => a.earnRate < b.earnRate ? 1 : -1);

	crimes.forEach(crime => {
		let crimeChance = (crime.chance*100).toFixed(1) + "%"
		let crimeTimeS = crime.time / 1000;
		ns.tprint(`${crime.name.padEnd(22)} \$${crime.money.toString().padEnd(10)} / ` +
			`${crimeTimeS.toString().padEnd(5)} * ${crimeChance.padEnd(7)} = ` +
			`${FormatMoney(crime.earnRate, 1)} earn rate`);
	})
}

export function GetCrimes(ns, timeCushion=1000) {
	// note: this requires Singularity API
	// timeCushion = time in ms in between crimes to allow time to kill script
	const crimeNames = Object.values(Crime);
	let crimesList = [];
	for (let crimeName of crimeNames) {
		let crime = ns.getCrimeStats(crimeName);
		crime.chance = ns.getCrimeChance(crime.name)	// TODO: UNCOMMENT THIS WHEN SINGULARITY USES LESS RAM
		
		if (!crime.chance || crime.chance == null)
			crime.chance = 1;	// fallback in case RAM too low to run ns.getCrimeChance()

		// earnRate is $1 per s
		crime.earnRate = crime.money / ((crime.time + timeCushion)/1000) * crime.chance;
		crimesList.push(crime);
	}
	crimesList.sort((a, b) => a.earnRate < b.earnRate ? 1 : -1);
	return crimesList;
}