/** @param {NS} ns **/
import { GetCrimes } from "s/sing-functions.js"

export async function main(ns) {

	ns.tprint("CRIMMESSSSSS");
	ns.tprint("------------------------------------------------------------");
	// TODO: PRETTY THIS UP. ADD HEADERS, ETC

	let crimes = GetCrimes(ns, 1000);
	crimes.sort((a, b) => a.earnRate < b.earnRate ? 1 : -1);

	crimes.forEach(crime => {
		let crimeChance = (crime.chance*100).toFixed(1) + "%"
		ns.tprint(`${crime.name.padEnd(22)} \$${crime.money.toString().padEnd(10)} / ` +
			`${crime.time.toString().padEnd(8)} * ${crimeChance.padEnd(7)} = ` +
			`${crime.earnRate.toFixed(1)} earn rate`);
	})
}