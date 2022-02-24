/** @param {NS} ns **/
import * as c from "constants.js"

export async function main(ns) {
	let crime = ns.args[0];
	let timeCushion = ns.args[1];	// small cushion in ms to allow time to kill script in between crimes
	
	if (crime == null || crime == "")
		crime = c.Crimes.homicide;
	if (timeCushion == null || timeCushion == NaN)
		timeCushion = 1000;

	let runtime = ns.commitCrime(crime);

	while(true) {
		await ns.sleep(runtime + timeCushion);
	}
}