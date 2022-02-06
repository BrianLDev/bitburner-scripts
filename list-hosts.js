/** @param {NS} ns **/
import { GetHosts } from "helper-functions.js";

export async function main(ns) {
	let sortByFreeRam = ns.args[0];
	if (sortByFreeRam == null)
		sortByFreeRam = false;

	// EXECUTE
	PrintHosts(ns, sortByFreeRam);
}

export function PrintHosts(ns, sortByFreeRam) {
	let hostList = GetHosts(ns);
	if (sortByFreeRam)
		hostList.sort((a, b) => (a.freeRam < b.freeRam) ? 1 : -1);
	else
		hostList.sort((a, b) => (a.maxRam < b.maxRam) ? 1 : -1);

	// print list of hosts
	ns.tprint("SERVER\t\tRAM:\tAVAIL\tUSED\tMAX");
	ns.tprint("_______________\t______________________________");
	hostList.forEach(host => {
		// get tabs based on name length
		let tabs = host.server.length < 9 ? "\t\t\t" : 
			host.server.length > 16 ? "\t" : "\t\t";
		ns.tprint(host.server + tabs + Math.round(host.freeRam) + "\t" + Math.round(host.usedRam) + "\t" + host.maxRam);
	});
}