/** @param {NS} ns **/
import { GetAllServers } from "helper-functions.js"

export async function main(ns) {
	let allServers = GetAllServers(ns);
	let localFiles = [];
	let output = [];
	for (let i=0; i<allServers.length; i++) {
		let server = ns.getServer(allServers[i]);
		if (server.purchasedByPlayer)
			continue;	// skip purchased servers
		localFiles = ns.ls(server.hostname);
		if (localFiles.length > 0)
			output.push("\n" + server.hostname + ":\t\t\t" + localFiles);
	}
	ns.tprint("\n" + output);
}