/** @param {NS} ns **/
import { GetServersToRoot, GainRootAccess, FormatMoney } from "helper-functions.js";

export async function main(ns) {
	// GLOBAL VARIABLES
	let serversToRoot = [], serversRooted = [], serversNotRooted = [];

	// EXECUTE
	serversToRoot = RootServers();
	serversToRoot.forEach(server => server.hasAdminRights ? serversRooted.push(server.hostname) : 
		serversNotRooted.push(server.hostname));
	ns.tprint("--- SERVERS ROOTED: ---\n" + serversRooted + "\n\n");
	ns.tprint("--- SERVERS NOT ROOTED: ---\n" + serversNotRooted + "\n\n");
	// Print the top 5 next servers to root, sorted by hackDifficulty
	ns.tprint("--- NEXT SERVERS TO ROOT: ---\n");
	let max = 5;
	let found = 1;
	serversToRoot.forEach(server => {
		if (server.hasAdminRights == false && found <= max) {
			ns.tprint(found + ". " + server.hostname + " --- " + server.hackDifficulty + " hack lvl --- " + 
				server.numOpenPortsRequired + " ports req --- " + FormatMoney(server.moneyMax, 3) + " max money");
			found++;
		}
	})


	// FUNCTIONS
	function RootServers() {
		let serverNames = GetServersToRoot(ns);
		let serverObjs = [];

		for (let i=0; i < serverNames.length; i++) {
			let server = ns.getServer(serverNames[i]);
			serverObjs.push(server);
		}
		serverObjs.sort((a, b) => a.hackDifficulty > b.hackDifficulty ? 1 : -1);

		ns.tprint("*** ATTEMPTING TO ROOT: " + serverNames + "\n\n");

		for (let i=0; i < serverObjs.length; i++) {
			let server = serverObjs[i];
			
			if (ns.getHackingLevel() < server.hackDifficulty) {
				ns.tprint("Can't root " + server.hostname + " - Hacking level is below " + 
					server.hackDifficulty);
				continue;
			}
			else {
				if (GainRootAccess(ns, server.hostname) == false) {
					// ns.tprint("WARNING: couldn't gain root access on " + server.hostname);
					continue;
				}
				if (ns.hasRootAccess(server.hostname) == true) {
					ns.tprint("SUCCESS!  " + server.hostname + " is rooted.");
				}
			}
		}
		return serverObjs;
	}

}