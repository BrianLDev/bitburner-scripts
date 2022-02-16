/** @param {NS} ns **/
import * as hn from "/hn/hn-helper.js"

export async function main(ns) {
	let verbose = ns.args[0];
	verbose = (verbose == true || verbose == "true") ? true : false;
	let checkIntervalMs = 5000;

	while (true) {
		hn.HnsUpgradeHacknetServers(ns, verbose);

		await ns.sleep(checkIntervalMs);
	}
}