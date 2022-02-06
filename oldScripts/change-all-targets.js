/** @param {NS} ns **/
import * as funcs from "helper-functions.js";	// saves RAM!

export async function main(ns) {
	// GLOBAL VARIABLES
	let filename = ns.args[0];
	let targets = funcs.GetTargets(ns);
	let primaryTarget = targets[0].server;

	// EXECUTE
	if (!filename)
		ns.tprint("Error: no new hack script listed in arg[0]");
	else {
		await ChangeTargets(ns);
		ns.alert("Done!");
	}

	// FUNCTIONS
	async function ChangeTargets(ns) {
		let threads = 0;
		let hackedServers = funcs.GetHackedServers(ns);
		let maxTargets = Math.floor(hackedServers.length / 6);	// target the top 16.7% servers with highest MaxMoney
		ns.tprint("Max targets:" + maxTargets);
		let targetIndex = maxTargets-1;	// cycle through top targets
		
		for (let i=0; i<hackedServers.length; i++) {
			threads = funcs.CalcMaxThreads(ns, filename, hackedServers[i]);
			if (threads > 0) {
				ns.killall(hackedServers[i]);
				await ns.scp(filename, "home", hackedServers[i]);
				ns.tprint(hackedServers[i] + ": changing target to: " + targets[targetIndex].server);
				ns.exec(filename, hackedServers[i], threads, targets[targetIndex].server);
				targetIndex -= 1;
				if (targetIndex < 0)
					targetIndex = maxTargets-1;
			}
		}
		// now update home server's target
		// TODO: FIX THIS...IT ISN'T WORKING FOR SOME REASON
		if (await ns.prompt("Kill threads on home and hack new target?")) {
			ns.killall("home");
			threads = funcs.CalcMaxThreads(ns, filename, "home");
			// add a little thread cushion to run misc scripts.  Adjust as needed
			threads -= Math.round(ns.getScriptRam(filename) * 5);	
			threads = Math.max(threads, 0);	// no less than 0 threads
			ns.tprint("Changing home target to: " + primaryTarget);
			ns.exec(filename, "home", threads, primaryTarget);
		}
	}

}