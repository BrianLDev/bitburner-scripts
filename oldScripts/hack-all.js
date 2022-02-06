/** @param {NS} ns **/
import * as funcs from "helper-functions.js";	// saves RAM!

export async function main(ns) {
	// GLOBAL VARIABLES
	let filename = ns.args[0]	// name of hacking script
	let serversHacked = [], serversNotHacked = [];

	// FUNCTIONS
	async function HackServers() {
		let serverList = ns.scan();	// list of 1st level servers
		let serversToHack = funcs.GetServersToHack(ns, serverList);
		let hackTarget = funcs.GetTargets(ns)[0].server;
		ns.tprint("\nATTEMPTING TO HACK: " + serversToHack);

		for (let i=0; i<serversToHack.length; i++) {
			let server = serversToHack[i];
			if (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(server)) {
				ns.tprint("Can't hack " + server + " - Hacking level is below " + 
					ns.getServerRequiredHackingLevel(server));
				serversNotHacked.push(server);
				continue;
			}
			else {
				ns.tprint("*** ATTEMPTING TO HACK: " + server);
				if (funcs.GainRootAccess(ns, server) == false) {
					ns.tprint("Error: couldn't gain root access on " + server);
					serversNotHacked.push(server);
					continue;
				}
				if (await funcs.RunHackScript(ns, filename, server, hackTarget) == false) {
					ns.tprint("Error: couldn't run hack script on " + server);
					serversNotHacked.push(server);
					continue;
				}
				if (ns.hasRootAccess(server) == true) {
					ns.tprint("SUCCESS!  " + server + " is hacked.");
					serversHacked.push(server);
				}
			}
		}
	}

	// EXECUTE
	if (!filename) {
		ns.tprint("Error: no filename listed in args");
	}
	else {
		await HackServers();
		ns.tprint("--- SERVERS HACKED: ---\n" + serversHacked + "\n\n");
		ns.tprint("--- SERVERS NOT HACKED: ---\n" + serversNotHacked);
		ns.alert("Hack-all finished running.");
	}

}