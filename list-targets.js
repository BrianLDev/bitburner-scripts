/** @param {NS} ns **/
import { GetTargets, FormatMoney} from "helper-functions.js";

export async function main(ns) {

	// EXECUTE
	PrintTargets(ns);
}

export function PrintTargets(ns) {
	let targetList = GetTargets(ns);
	// format money into easier to read format
	targetList.forEach(target => {
		target.maxMoney = FormatMoney(target.maxMoney);
		target.currentMoney = FormatMoney(target.currentMoney);
	});
	// print list of targets
	ns.tprint("SERVER\t\t\tMONEY AVAIL \/ MAX\t\tSECURITY CURRENT => MIN");
	ns.tprint("_______________\t\_________________________\t\_________________________");
	targetList.forEach(target => {
		// get tabs based on name length
		let tabs = target.server.length < 7 ? "\t\t\t" : 
			target.server.length > 14 ? "\t" : "\t\t";
		ns.tprint(target.server + tabs + target.currentMoney + " / " + target.maxMoney + "\t\t" + 
			target.securityCurrent + " => " + target.securityMin + " security");
	});
}