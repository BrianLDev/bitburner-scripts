/** @param {NS} ns **/
import { GetTargets, FormatMoney} from "helper-functions.js";

export async function main(ns) {

	// EXECUTE
	PrintTargets(ns);
}

export function PrintTargets(ns) {
	let targetList = GetTargets(ns);

	// print list of targets
	ns.tprint("SERVER\t\t\tMONEY AVAIL \/ MAX\t\tSECURITY\tHACK REQ\tMINUTES\t\tEARN RATE");
	ns.tprint("_______________\t\_________________________\t\__________\t\__________\t\________\t\_________");
	targetList.forEach(target => {
		let hackEmoji = (target.isHackable) ? "✅" : "❌";
		ns.tprint(target.hostname.padEnd(23) + 
			`${FormatMoney(target.moneyAvailable)} / ${FormatMoney(target.moneyMax)}`.padEnd(32) +
			`${Math.round(target.hackDifficulty)} => ${Math.round(target.minDifficulty)}`.padEnd(16) + 
			`${hackEmoji}${target.requiredHackingSkill}`.padEnd(16) +
			(target.weakenTime/1000/60).toFixed(1).padEnd(16) +
			target.hackEarnRate);
	});

}