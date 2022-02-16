/** @param {NS} ns **/
import { GetAllServers } from "helper-functions.js"

export async function main(ns) {
	ns.tprint(`-------------------- CONTRACT LIST --------------------`);
	let allServers = GetAllServers(ns);
	let localFiles = [];
	let contracts = [];
	for (let i=0; i<allServers.length; i++) {
		let server = ns.getServer(allServers[i]);
		if (server.purchasedByPlayer)
			continue;	// skip purchased servers
		localFiles = ns.ls(server.hostname);
		localFiles.forEach(file => {
			let hostnamePadded = server.hostname.padEnd(25, ' ');
			if (file.slice(-3) == "cct")
				ns.tprint(`${hostnamePadded}${file}`);
		});
	}
}