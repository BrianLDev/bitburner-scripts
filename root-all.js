/** @param {NS} ns **/
import { GetServersToRoot, GainRootAccess, FormatMoney } from "helper-functions.js";	// saves RAM!

export async function main(ns) {
	// GLOBAL VARIABLES
	let serversToRoot = [], serversRooted = [], serversNotRooted = [];

	// EXECUTE
	RootServers();
	serversToRoot.forEach(server => server.rooted ? serversRooted.push(server.name) : 
		serversNotRooted.push(server.name));
	ns.tprint("--- SERVERS ROOTED: ---\n" + serversRooted + "\n\n");
	ns.tprint("--- SERVERS NOT ROOTED: ---\n" + serversNotRooted + "\n\n");
	ns.tprint("--- NEXT SERVERS TO ROOT: ---\n");
	let max = 5;
	let found = 1;
	serversToRoot.forEach(server => {
		if (server.rooted == false && found <= max) {
			ns.tprint(found + ". " + server.name + " --- " + server.hackingLevel + " hack lvl --- " + 
				server.portsRequired + " ports req --- " + FormatMoney(server.maxMoney, 3) + " max money");
			found++;
		}
	})


	// FUNCTIONS
	function RootServers() {
		let serverNames = GetServersToRoot(ns);
		serversToRoot = []

		for (let i=0; i < serverNames.length; i++) {
			let server = {};
			server.name = serverNames[i];
			server.hackingLevel = ns.getServerRequiredHackingLevel(server.name);
			server.portsRequired = ns.getServerNumPortsRequired(server.name);
			server.maxMoney = ns.getServerMaxMoney(server.name);
			server.rooted = false;
			serversToRoot.push(server);
		}
		serversToRoot.sort((a, b) => a.hackingLevel > b.hackingLevel ? 1 : -1);

		ns.tprint("*** ATTEMPTING TO ROOT: " + serverNames + "\n\n");

		for (let i=0; i < serversToRoot.length; i++) {
			let server = serversToRoot[i];
			
			if (ns.getHackingLevel() < server.hackingLevel) {
				ns.tprint("Can't root " + server.name + " - Hacking level is below " + 
					server.hackingLevel);
				continue;
			}
			else {
				if (GainRootAccess(ns, server.name) == false) {
					ns.tprint("Error: couldn't gain root access on " + server);
					continue;
				}
				if (ns.hasRootAccess(server.name) == true) {
					ns.tprint("SUCCESS!  " + server.name + " is rooted.");
					server.rooted = true;
				}
			}
		}
	}

}