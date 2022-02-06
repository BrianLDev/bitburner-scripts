/** @param {NS} ns **/
import { RemoveFileRemoteServers } from "helper-functions.js"

export async function main(ns) {
	// VARAIBLES
	let filename = ns.args[0];
	let rootedOnly = ns.args[1];

	// EXECUTE
	if (!filename)
		ns.tprint("Error: Missing filename to delete from script args")
	else
		RemoveFileRemoteServers(ns, filename, rootedOnly);
}