/** @param {NS} ns **/
export async function main(ns) {
	let targetName = ns.args[0];
	let sleeptime = ns.args[1];
	let verbose = ns.args[2];

	if (verbose != true || verbose != "true")
		verbose = false;
		
	if (!targetName)
		ns.tprint("Error: missing targetName.");
	else if (!sleeptime)
		ns.tprint("Error: missing sleeptime");
	else {
		await ns.sleep(sleeptime);
		let decrease = await ns.weaken(targetName);

		if (verbose == true) {
			if (multiple > 0)
				ns.tprint(ns.getHostname() + " WEAKENED=> " + targetName + " decreased security by " + decrease)
			else
				ns.tprint(ns.getHostname() + " failed to weaken " + targetName + ".");
		}
	}
}