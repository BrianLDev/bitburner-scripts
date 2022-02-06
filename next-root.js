import { GetServersToRoot } from "helper-functions.js";	// saves RAM!

export async function main(ns) {

	// EXECUTE
	GetNextRootTarget();

	// FUNCTIONS
	function GetNextRootTarget() {
		let serverList = ns.scan();	// list of 1st level servers
		let serversToRoot = GetServersToRoot(ns, serverList);
		let nextRootTarget = "";
		let minHackLevel = 9999;
		let serverHackLevel = 9999;
		let portsReq = 0;
		for (var i=0; i<serversToRoot.length; i++) {
			let server = serversToRoot[i];
			if (server == "darkweb")	// skip darkweb
				continue;
			serverHackLevel = ns.getServerRequiredHackingLevel(server);
			portsReq = ns.getServerNumPortsRequired(server);
			if (serverHackLevel < minHackLevel) {
				minHackLevel = serverHackLevel;
				nextRootTarget = server;
			}
		}
		ns.tprint("*** NEXT ROOT TARGET: " + nextRootTarget + " with " + minHackLevel + " hacking skill and " +
			ns.getServerNumPortsRequired(nextRootTarget) + " ports to open.");
		ns.alert("NEXT ROOT TARGET: " + nextRootTarget + " with " + minHackLevel + " hacking skill and " +
			ns.getServerNumPortsRequired(nextRootTarget) + " ports to open.");
	}


}