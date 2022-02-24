/** @param {NS} ns **/
import { GetTargets, FormatMoney} from "helper-functions.js";

export async function main(ns) {

	// EXECUTE
	PrintTargets(ns);
}

export function PrintTargets(ns) {
	let targetList = GetTargets(ns);

	// print list of targets
	ns.tprint("SERVER\t\t\tMONEY AVAIL \/ MAX\t\tSEC. CURR => MIN\tMINUTES\t\tEARN RATE");
	ns.tprint("_______________\t\_________________________\t\________________\t\________\t\_________");
	targetList.forEach(target => {
		ns.tprint(target.hostname.padEnd(23) + 
			`${FormatMoney(target.moneyAvailable)} / ${FormatMoney(target.moneyMax)}`.padEnd(32) +
			`${Math.round(target.hackDifficulty)} => ${Math.round(target.minDifficulty)}`.padEnd(24) + 
			(target.weakenTime/1000/60).toFixed(1).padEnd(16) +
			target.hackEarnRate);
	});

}