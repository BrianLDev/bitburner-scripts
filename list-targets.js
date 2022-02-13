/** @param {NS} ns **/
import { GetTargets, FormatTabs, FormatMoney} from "helper-functions.js";

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
		let tabs1 = FormatTabs(target.hostname);
		let tabs2 = FormatTabs(Math.round(target.hackDifficulty) + " => " + target.minDifficulty, 8, 14);
		ns.tprint(target.hostname + tabs1 + 
			FormatMoney(target.moneyAvailable) + " / " + FormatMoney(target.moneyMax) + "\t\t" +
			Math.round(target.hackDifficulty) + " => " + target.minDifficulty+ tabs2 + 
			(target.weakenTime/1000/60).toFixed(1) + "\t\t" +
			target.hackEarnRate);
	});

}