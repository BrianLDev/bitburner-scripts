/** @param {NS} ns **/
import { GetTargets, FormatMoney, GetNextHost, GetHosts, CopyHackFilesToHost } from "helper-functions.js"

export async function main(ns) {
	let targets = GetTargets(ns, true);
	targets.sort((a, b) => a.roi < b.roi ? 1 : -1);
	
	for (let i=0; i<targets.length; i++) {
		let target = targets[i];
		ns.tprint(target.server + ":\t" + FormatMoney(target.maxMoney * .5, 3) + 
			" / " + ((target.weakenTime + (200*3))/1000/60).toFixed(2) + " =\t" + target.roi.toFixed(2));
	}
}