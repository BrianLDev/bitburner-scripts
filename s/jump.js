/** @param {NS} ns **/
import { GetPathToTarget } from "helper-functions.js"

export async function main(ns) {
	let target = ns.args[0];
	if (target == null || target == "") {
		ns.tprint(`ERROR: Missing target from args.`)
		ns.exit();
	}

	let path = GetPathToTarget(ns, target, "home")
	ns.tprint(`Connecting via path => ${path}`);
	ConnectByPath(ns, path);
}

export function ConnectByPath(ns, path) {
	// Note: requires singularity (BN5)
	let destination = path[path.length-1];
	for (let i=0; i<path.length; i++) {
		ns.connect(path[i]);
		if (ns.getCurrentServer() != path[i])
			ns.tprint(`ERROR: Was not able to connect from ${path[i-1]} to ${path[i]} using path: ${path}`);
	}
	if (ns.getCurrentServer() != destination)
		ns.tprint(`ERROR: Was not able to connect from to ${destination} using path: ${path}`);
	// else
	// 	ns.tprint(`Successfully connected to ${destination}`);

}