/** @param {NS} ns **/
import { GetTargets, CalcMaxThreads, GetNextHost, GetHosts, CopyHackFilesToHost } from "helper-functions.js"

// NOTE: Date.now() is added at the end of all exec functions because for some reason the game requires all
// scripts to have unique arguments in order to run.  This will prevent hangups from running grow twice on a host

/* TODO IMPROVEMENTS:
- consolidate the separate weaken/grow/hack scripts so there's only 1 function for each.
- prepare all targets first before hack batching. set a flag to true when each target prepared.
- fix prepare weaken/grow functions so that it doesn't keep spamming the same weaken/grow over and over.
- calculate ROI after all targets prepared to find most profitable ones. Only hack the top 2-3 ROI targets
- make sure there is enough free RAM across all hosts to run a full hack batch, otherwise skip.
	(this will prevent partially executed batches that mess up the flow)
- hack and grow should maximize threads since each successful increases security and could cause other hacks to fail.
*/
export async function main(ns) {
	// VARIABLES
	let maxThreads = ns.args[0];	// limits max threads to ripen(grow/weaken) to focus on hacking (DONE)
	let maxMinutes = ns.args[1];	// limits max time per ripen job(grow/weaken) to focus on hacking (DONE)
	let verbose = ns.args[2];	// true = show output in terminal (DONE)

	// maxThreads: enter as args or manually enter here. 
	// can max it out for bitnode 1, but for harder bitnodes, it's best to scale up over time
	// e.g., 25-50 threads is usually good for early game.  Later increase to 100-500.  Continue increasing 1k-10k.
	// Check active scripts to see if workload for each server is maximized but not overly concentrated by job.
	if (maxThreads == null || maxThreads == NaN)
		maxThreads = 9999;	// <-- manually enter this in args for now. TODO: AUTOMATE SOMEHOW
	if (maxMinutes == null || maxThreads == NaN)
		maxMinutes = 9999;	// <-- manually enter this in args for now. TODO: AUTOMATE SOMEHOW
	if (verbose != "true")
		verbose = false;

	const h = ns.formulas.hacking;
	const growThresh = .95;
	const securityThresh = 1.05;
	const hackPct = .40;	// <-- manually adjust this if needed depending on workload and money gained


	// EXECUTE HACKING LOOP
	let targetName = "";
	let targetsList = GetTargets(ns, true);	// true = exclude poor
	while (targetsList.length > 0) {
		// TODO: ADD ROOTALL FUNCTION HERE
		await CopyHackFilesToAllHosts(ns);
		targetsList = GetTargets(ns, true);	// refresh list after each loop
		targetsList.sort((a, b) => (a.hackEarnRate < b.hackEarnRate) ? 1 : -1);	// sort list by hackEarnRate: max --> min
		targetsList = targetsList.slice(0, 1);	// gets the top server based on hackEarnRate

		for (let i=0; i<targetsList.length; i++) {
			targetName = targetsList[i].hostname;

			let nextJob = GetNextJob(ns, targetName, growThresh, securityThresh, verbose)

			if (nextJob == JobType.hack) {
				await HackBatch(ns, targetName, hackPct, verbose);
				if (verbose)
					ns.tprint("Running HackBatch on " + targetName + ".");
			}
			else if (nextJob == JobType.weaken) {
				let duration = h.weakenTime(ns.getServer(targetName), ns.getPlayer()) / 1000 / 60;
				if (duration < maxMinutes)	// skip any jobs > maxMinutes
					await WeakenTarget(ns, targetName, maxThreads, securityThresh, verbose);
			}
			else if (nextJob == JobType.grow) {
				let duration = h.growTime(ns.getServer(targetName), ns.getPlayer()) / 1000 / 60;
				if (duration < maxMinutes)		// skip any jobs > maxMinutes
					await GrowTarget(ns, targetName, maxThreads, growThresh, verbose);
			}
			else
				ns.tprint("Error.  No job for " + targetName);
			
			await ns.sleep(1);	// short sleep between targets
		}
		await ns.sleep(1);	// short sleep before starting loop over again
	}


	ns.tprint("Done!");
}

export const JobType = {
	weaken: 'weaken',
	grow: 'grow',
	hack: 'hack',
	none: 'none'
};

export async function CopyHackFilesToAllHosts(ns) {
	let hosts = GetHosts(ns);
	for (let i=0; i<hosts.length; i++) {
		await CopyHackFilesToHost(ns, hosts[i]);
	}
}

export function GetNextJob(ns, targetName, growThreshold, securityThreshold, verbose=false) {
	let weakened = ns.getServerSecurityLevel(targetName) <= ns.getServerMinSecurityLevel(targetName) * securityThreshold;
	let grown = ns.getServerMoneyAvailable(targetName) >= ns.getServerMaxMoney(targetName) * growThreshold;
	let nextJob = JobType.none;
	if (!weakened)
		nextJob = JobType.weaken;
	else if (!grown)
		nextJob = JobType.grow;
	else if (weakened && grown)
		nextJob = JobType.hack;
	else
		ns.tprint("Error: Unable to determine next job")	// failsafe. Code should never reach this point
	if (verbose) {
		ns.tprint("Security: " + (ns.getServerSecurityLevel(targetName)).toFixed(2) + " <= " + 
			(ns.getServerMinSecurityLevel(targetName) * securityThreshold).toFixed(2) + "?  " + weakened);
		ns.tprint("Money: " + (ns.getServerMoneyAvailable(targetName)).toFixed(2) + " >= " + 
			(ns.getServerMaxMoney(targetName) * growThreshold).toFixed(2) + "?  " + grown);
		ns.tprint("GetNextJob: " + nextJob);
	}
	return nextJob;
}

export async function WeakenTarget(ns, targetName, maxThreads=9999, securityThresh=1.05, verbose=false) {
	const h = ns.formulas.hacking;
	const weakenfile = "/hax/weaken.js";
	const weakenPerThread = 0.05;
	let securityDiff = ns.getServerSecurityLevel(targetName) - ns.getServerMinSecurityLevel(targetName) * securityThresh;
	let weakenThreadsReq = Math.ceil(securityDiff / weakenPerThread);
	weakenThreadsReq = Math.min(weakenThreadsReq, maxThreads);
	let weakenTime = h.weakenTime(ns.getServer(targetName), ns.getPlayer());
	let attackerName = "";

	if (verbose)
		ns.tprint("Weakening " + targetName);
	while (weakenThreadsReq > 0) {
		attackerName = GetNextHost(ns).server;
		let currentWeakenThreads = Math.min(weakenThreadsReq, CalcMaxThreads(ns, weakenfile, attackerName, .03));
		if (currentWeakenThreads > 0) {
			if (ns.exec(weakenfile, attackerName, currentWeakenThreads, targetName, 1, verbose, Date.now()) > 0) {
				if (verbose) {
					ns.tprint("Running weaken " + attackerName + " => " + targetName + " | " + currentWeakenThreads + 
					" of " + weakenThreadsReq + " threads, taking " + (weakenTime / 1000 / 60).toFixed(2) + " minutes.");
				}
				weakenThreadsReq -= currentWeakenThreads;
			}
			// else
			// 	ns.tprint("Error: Couldnt run Weaken " + attackerName + " => " + targetName + " for " + currentWeakenThreads);
		}
		await ns.sleep(1);
	}
}

export async function GrowTarget(ns, targetName, maxThreads=9999, growThresh=.95, verbose=false) {
	const h = ns.formulas.hacking;
	const growfile = "/hax/grow.js";
	let growMult = (Math.ceil(ns.getServerMaxMoney(targetName) * growThresh) / ns.getServerMoneyAvailable(targetName));
	let growThreadsReq = Math.ceil(ns.growthAnalyze(targetName, growMult, 1));
	growThreadsReq = Math.min(growThreadsReq, maxThreads);
	let growTime = h.growTime(ns.getServer(targetName), ns.getPlayer());
	let attackerName = "";

	if (verbose) {
		ns.tprint("Growing " + targetName);
		ns.tprint("growMult: " + growMult);
		ns.tprint("GrowThreadsReq: " + growThreadsReq);
	}
	while (growThreadsReq > 0) {
		attackerName = GetNextHost(ns).server;
		let currentGrowThreads = Math.min(growThreadsReq, CalcMaxThreads(ns, growfile, attackerName, .03));
		if (currentGrowThreads > 0) {
			if (ns.exec(growfile, attackerName, currentGrowThreads, targetName, 1, verbose, Date.now()) > 0) {
				if (verbose) {
					ns.tprint("Running grow " + attackerName + " => " + targetName + " | " + currentGrowThreads + 
					" of " + growThreadsReq + " threads taking " + (growTime / 1000 / 60).toFixed(2) + " minutes.");
				}
				growThreadsReq -= currentGrowThreads;
			}
			// else
			// 	ns.tprint("Error: Couldnt run Grow " + attackerName + " => " + targetName + " for " + currentGrowThreads);
		}
		await ns.sleep(1);
	}
}

export async function HackBatch(ns, targetName, hackPct, verbose) {
	const h = ns.formulas.hacking;
	const hackfile = "/hax/hack.js";
	const growfile = "/hax/grow.js";
	const weakenfile = "/hax/weaken.js";
	const growMult = 1 / hackPct;
	const delayTime = 200;	// buffer delay between jobs. Must be > 20ms, but can be less than 200ms (depending on computer)
	const hackSecIncPerThread = 0.002;
	const growSecIncPerThread = 0.004;
	const weakenPerThread = 0.05;

	let targetServer = ns.getServer(targetName);
	let player = ns.getPlayer();
	let attackerName = "";
	let hackPctPerThread = h.hackPercent(targetServer, player);
	let hackThreadsReq = Math.max(Math.ceil(hackPct / hackPctPerThread), 1);
	let weakenHackThreadsReq = Math.max(Math.ceil((hackThreadsReq * hackSecIncPerThread) / weakenPerThread), 1);
	let growThreadsReq = Math.ceil(ns.growthAnalyze(targetName, growMult, 1));
	let weakenGrowThreadsReq = Math.max(Math.ceil((growThreadsReq * growSecIncPerThread) / weakenPerThread), 1);
	let totalThreadsReq = hackThreadsReq + weakenHackThreadsReq + growThreadsReq + weakenGrowThreadsReq;
	// let totalRamReq = 	// TODO: CALCULATE TOTAL RAM REQUIRED
	let startNextBatch = delayTime * 3;

	let hackTime = h.hackTime(targetServer, player);
	let growTime = h.growTime(targetServer, player);
	let weakenTime = h.weakenTime(targetServer, player);
	let delay = 1;	// note that delay can't be 0 or it causes error on exec script.  Min of 1.

	// 1) SCHEDULE HACK (delay * -1 + (weakentime-hacktime): resolves 1st)
	delay = Math.ceil(weakenTime - hackTime - delayTime);
	while (hackThreadsReq > 0) {
		attackerName = GetNextHost(ns).server;
		let currentHackThreads = Math.min(hackThreadsReq, CalcMaxThreads(ns, hackfile, attackerName, .03));
		if (currentHackThreads > 0) {
			if (ns.exec(hackfile, attackerName, currentHackThreads, targetName, delay, verbose, Date.now()) > 0) {
				if (verbose) {
					ns.tprint("Running hack " + attackerName + " => " + targetName + " | " + currentHackThreads + 
					" of " + hackThreadsReq + " threads with " + delay + " delay, taking " + 
					(hackTime / 1000 / 60).toFixed(2) + " minutes.");
				}
				hackThreadsReq -= currentHackThreads;
			}
			// else
			// 	ns.tprint("Error: Couldnt run Hack " + attackerName + " => " + targetName + " for " + currentHackThreads);
		}
		await ns.sleep(1);
	}

	// 2) SCHDEULE WEAKEN FOR HACK (no delay: resolves 2nd)
	delay = 1;
	while (weakenHackThreadsReq > 0) {
		attackerName = GetNextHost(ns).server;
		let currentWeakenThreads = Math.min(weakenHackThreadsReq, CalcMaxThreads(ns, weakenfile, attackerName, .03));
		if (currentWeakenThreads > 0) {
			if (ns.exec(weakenfile, attackerName, currentWeakenThreads, targetName, delay, verbose, Date.now()) > 0) {
				if (verbose) {
					ns.tprint("Running weaken " + attackerName + " => " + targetName + " | " + currentWeakenThreads + 
					" of " + weakenHackThreadsReq + " threads with " + delay + " delay, taking " + 
					(weakenTime / 1000 / 60).toFixed(2) + " minutes.");
				}
				weakenHackThreadsReq -= currentWeakenThreads;
			}
			// else
			// 	ns.tprint("Error: Couldnt run Weaken " + attackerName + " => " + targetName + " for " + currentWeakenThreads);
		}
		await ns.sleep(1);
	}

	// 3) SCHEDULE GROW (delay * 1 + (weakentime-growtime): resolves 3rd)
	delay = Math.ceil(weakenTime - growTime + delayTime);
	while (growThreadsReq > 0) {
		attackerName = GetNextHost(ns).server;
		let currentGrowThreads = Math.min(growThreadsReq, CalcMaxThreads(ns, growfile, attackerName, .03));
		if (currentGrowThreads > 0) {
			if (ns.exec(growfile, attackerName, currentGrowThreads, targetName, delay, verbose, Date.now()) > 0) {
				if (verbose) {
					ns.tprint("Running grow " + attackerName + " => " + targetName + " | " + currentGrowThreads + 
					" of " + growThreadsReq + " threads with " + delay + " delay, taking " + 
					(growTime / 1000 / 60).toFixed(2) + " minutes.");
				}
				growThreadsReq -= currentGrowThreads;
			}
			// else
			// 	ns.tprint("Error: Couldnt run Grow " + attackerName + " => " + targetName + " for " + currentGrowThreads);
		}
		await ns.sleep(1);
	}

	// 4) SCHEDULE WEAKEN FOR GROW (delay * 2: resolves last)
	delay = delayTime * 2;
	while (weakenGrowThreadsReq > 0) {
		attackerName = GetNextHost(ns).server;
		let currentWeakenThreads = Math.min(weakenGrowThreadsReq, CalcMaxThreads(ns, weakenfile, attackerName, .03));
		if (currentWeakenThreads > 0) {
			if (ns.exec(weakenfile, attackerName, currentWeakenThreads, targetName, delay, verbose, Date.now()) > 0) {
				if (verbose) {
					ns.tprint("Running weaken " + attackerName + " => " + targetName + " | " + currentWeakenThreads + 
					" of " + weakenGrowThreadsReq + " threads with " + delay + " delay, taking " + 
					(weakenTime / 1000 / 60).toFixed(2) + " minutes.");
				}
				weakenGrowThreadsReq -= currentWeakenThreads;
			}
			// else
			// 	ns.tprint("Error: Couldnt run Weaken " + attackerName + " => " + targetName + " for " + currentWeakenThreads);
		}
		await ns.sleep(1);
	}

}