/** @param {NS} ns **/
import * as funcs from "helper-functions.js";	// saves RAM!

export async function main(ns) {
	// GLOBAL VARIABLES
	let filename = ns.args[0]	// name of hacking script
	let inactiveServers = [], activatedServers = [], failedServers = [];

	// FUNCTIONS
	async function HackInactive() {
		let serverList = ns.scan();	// list of 1st level servers
		let hackedServers = funcs.GetHackedServers(ns, serverList);
		let hackTarget = funcs.GetPrimaryTarget(ns);
		let scriptRam = ns.getScriptRam(filename);
		let serverAvailRam = 0;

		for (let i=0; i<hackedServers.length; i++) {
			serverAvailRam = ns.getServerMaxRam(hackedServers[i]) - ns.getServerUsedRam(hackedServers[i]);
			if (serverAvailRam >= scriptRam) {
				inactiveServers.push(hackedServers[i]);
				ns.tprint(hackedServers[i] + " can run script with available " + serverAvailRam + "GB RAM vs " + scriptRam + "GB script RAM.");
				// RunHackScript isn't working.  Why???  is it async/await related?
				await funcs.RunHackScript(ns, filename, hackedServers[i], hackTarget);
				// check that it worked
				serverAvailRam = ns.getServerMaxRam(hackedServers[i]) - ns.getServerUsedRam(hackedServers[i]);
				if (serverAvailRam < scriptRam) {
					ns.tprint("Successfully ran hack script on " + hackedServers[i]);
					activatedServers.push(hackedServers[i]);
				}
				else {
					ns.tprint("Failed to run hack script on " + hackedServers[i]);
					failedServers.push(hackedServers[i]);
				}
			}
		}
	}

	// EXECUTE
	if (!filename) {
		ns.tprint("Error: no filename listed in args");
	}
	else {
		await HackInactive();
		if (activatedServers.length > 0)
			ns.tprint("SUCCESSFULL: " + activatedServers);
		if (failedServers.length > 0)
			ns.tprint("FAILED: " + failedServers);
		ns.alert("Hack Inactive finished running.");
	}

}