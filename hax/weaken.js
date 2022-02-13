/** @param {NS} ns **/
export async function main(ns) {
	let targetName = ns.args[0];
	let sleeptime = ns.args[1];
	let verbose = ns.args[2];
	let rest = ns.args[3];	// ignore any additional args
	verbose = (verbose == true || verbose == "true") ? true : false;
		
	if (!targetName)
		ns.tprint("Error: missing targetName.");
	else if (!sleeptime)
		ns.tprint("Error: missing sleeptime");
	else {
		await ns.sleep(sleeptime);
		let decrease = await ns.weaken(targetName);

		if (verbose == true) {
			if (decrease > 0)
				ns.tprint(ns.getHostname() + " WEAKENED=> " + targetName + "; decreased security by " + decrease)
			else
				ns.tprint(ns.getHostname() + " failed to weaken " + targetName + ".");
		}
	}
}