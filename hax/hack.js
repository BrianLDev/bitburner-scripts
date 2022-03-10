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
		let startTime = new Date(Date.now()).toLocaleTimeString('en-US');
		if (verbose)
			ns.tprint(`[${startTime}] 💻HACK💻 schdeuled ${ns.getHostname()} => ${targetName}`);
		
		await ns.sleep(sleeptime);
		let profit = await ns.hack(targetName);

		if (verbose == true) {
			let endTime = new Date(Date.now()).toLocaleTimeString('en-US');
			if (profit > 0)
				ns.tprint(`[${endTime}] 💰HACK💰 successful ${ns.getHostname()} => ${targetName} for \$${(profit/1000000).toFixed(2)}m`);
			else
				ns.tprint(`[${endTime}] ❌HACK❌ failed ${ns.getHostname()} => ${targetName}`);
		}
	}
}