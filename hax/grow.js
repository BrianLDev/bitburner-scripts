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
		let startTime = new Date(Date.now());
		startTime = startTime.toLocaleTimeString('en-US');
		if (verbose)
			ns.tprint(`${startTime}: 🌱GROW🌱 schdeuled ${ns.getHostname()} => ${targetName}`);

		await ns.sleep(sleeptime);
		let multiple = await ns.grow(targetName);

		if (verbose == true) {
			let endTime = new Date(Date.now());
			endTime = endTime.toLocaleTimeString('en-US');
			if (multiple > 0)
				ns.tprint(`${endTime}: 🌳GROW🌳 completed ${ns.getHostname()} => ${targetName} with multiple: ${multiple}`);
			else
				ns.tprint(`${endTime}: 🍂GROW🍂 failed ${ns.getHostname()} => ${targetName}`);
		}
	}
}