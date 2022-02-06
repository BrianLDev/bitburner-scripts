/** @param {NS} ns **/
import { GetAllServers } from "helper-functions.js"

export async function main(ns) {
	let serverList = ns.scan();
	let allServers = GetAllServers(ns, serverList);
	let localFiles = [];
	let output = [];
	for (let i=0; i<allServers.length; i++) {
		if (allServers[i].substring(0, 5) == "pserv")
			continue;	// skip purchased servers
		localFiles = ns.ls(allServers[i]);
		if (localFiles.length > 0)
			output.push("\n" + allServers[i] + ":\t\t\t" + localFiles);
	}
	ns.tprint("\n" + output);
}