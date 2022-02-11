/** @param {NS} ns **/
import { GetAllServers } from "helper-functions.js"

export async function main(ns) {

	let servers = GetAllServers(ns);

	for (let i=0; i<servers.length; i++) {
		// TODO: NEED TO CONNECT TO PARENT BEFORE CONNECTING TO TARGET SERVER
		ns.connect(servers[i]);
		// TODO: MAKE SURE SUCCESSFULLY CONNECTED TO SERVER BEFORE DOING THE BELOW
		if (targets.find(target => target == servers[i])) {
			ns.tprint("Getting some backdoor action with " + servers[i] + ".");

			try {
				await ns.installBackdoor();
			}
			catch (err) {
				ns.tprint("Error: " + err)
			}

		}
	}
	ns.connect("home");

	ns.tprint("DONE!");
}

export function GetAllServers(ns) {
	let toSearch = ns.scan("home");
	let allServers = [];
	let nestedServers = [];
	let currentServer;
	while (toSearch.length > 0) {
		currentServer = toSearch.shift();
		allServers.push(currentServer);
		nestedServers = GetNestedServers(ns, currentServer);
		toSearch = toSearch.concat(nestedServers);	
	}
	// ns.tprint("FULL SERVER LIST: " + allServers);
	return allServers;
}