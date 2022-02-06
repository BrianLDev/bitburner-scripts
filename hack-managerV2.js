/** @param {NS} ns **/
import { GetTargets, GetNextHost, CalcMaxThreads, } from "helper-functions.js"

/* OVERALL FLOW FOR HACK MANAGER V2: INTERMEDIATE
1) Iterate through all servers and root all possible	(TODO - integrate root-all.js. For now just do it manually.)
2) Purchase servers based on money made / money available	(TODO - integrate and automate purch-servers.js. For now just do it manually)
3) Get list of all rooted servers as 'targets'.	(DONE)
	3a) Skip over any targets that are busy (DONE)
4) Iterate through all targets:
	4a) determine job for target: grow, weaken, or hack.	(DONE)
	4b) calculate the # of threads needed to complete job.	(DONE)
	4c) get next host server to run the job.	(DONE)
	4d) calculate the completion time of the job.  Add to target's completion time. (DONE)
	4e) if host wasn't able to do the entire job itself, repeat 4c, 4d until job is fulfilled. (DONE)
*/

export async function main(ns) {
	let maxThreadsPerJob = ns.args[0];	// makes sure jobs/servers are not overly concentrated (DONE)
	let maxMinutes = ns.args[1];	// use this to ignore any jobs that take too damn long.  Helpful in BN5
	let verbose = ns.args[2];	// true = show output in terminal (DONE)

	// maxThreads: enter as args or manually enter here. 
	// can max it out for bitnode 1, but for harder bitnodes like BN5, it's best to scale up over time
	// In BN5, 50 threads is usually good for early game.  Later increase to 100-500.  Continue increasing 1k-10k.
	// Check active scripts to see if workload for each server is maximized but not overly concentrated by job.
	if (maxThreadsPerJob == null || maxThreadsPerJob == NaN)
		maxThreadsPerJob = 9999;	// <-- manually enter this in args for now. TODO: AUTOMATE SOMEHOW
	if (maxMinutes == null || maxThreadsPerJob == NaN)
		maxMinutes = 9999;	// <-- manually enter this in args for now. TODO: AUTOMATE SOMEHOW
	if (verbose == null || verbose == undefined)
		verbose = false;

	const hackfile = "/hax/hack.js";
	const growthfile = "/hax/grow.js";
	const weakenfile = "/hax/weaken.js";
	const growthThresh = .95;
	const securityThresh = 1.1;
	const hackPct = .50;	// take 50% of available money with each hack
	const JobType = {
		weaken: 'weaken',
		grow: 'grow',
		hack: 'hack',
		none: 'none'
	};
	let host;
	let targets, target;

	// INFINITE HACK LOOP
	while (true) {  
		// TODO: Iterate through all servers and root all possible.  For now just manually run root-all.js.
		// TODO: Purchase servers based on money made / money available.  For now just manually edit and run purch-servers.js.

		targets = GetTargets(ns, true);	// true = exclude poor (cash = $0)
		targets.sort((a, b) => a.maxMoney > b.maxMoney ? 1 : -1);	// sort by lowest money first to get low hanging fruit first

		// Iterate through all targets once, before returning to while loop
		for (let i=0; i<targets.length; i++) {
			target = targets[i];
			
			// Skip any targets that are "busy" (completion time in future).
			if (target.completionTime > Date.now() )
				continue;
			else
				target.completionTime = Date.now();	// reset completion time if not "busy"
			
			// add useful info to the target object and determine what job to perform next (hack, weaken, grow)
			target = AnalyzeTarget(target);

			let threadsNeeded = CalculateThreadsRequired(target, target.currentJob);
			threadsNeeded = Math.min(threadsNeeded, maxThreadsPerJob);

			if (target.jobTime/1000/60 > maxMinutes)
				continue;	// skip any that take longer than the maxMinutes arg

			if (verbose)
				ns.tprint("Working on " + target.server + ", job = " + target.currentJob + " with " + threadsNeeded + " threadsNeeded");

			// keep looping through hosts until job is complete
			while (threadsNeeded > 0) {
				// First: Get next host with most available ram
				host = null;
				while(host == null) {
					host = GetNextHost(ns);
					if (host.freeRam <= 1)
						host = null;
					await ns.sleep(1);
				}
				await CopyFilesToHost(ns, host);
				if (verbose)
					ns.print("Selected host " + host.server + " with " + host.freeRam + " free RAM.");

				// HACK, WEAKEN, GROW
				let threadsCompleted = 0;
				if (target.currentJob == JobType.weaken) {
					target.completionTime = Date.now() + target.weakenTime + 2;
					threadsCompleted = RunWeaken(1, threadsNeeded);
				}
				else if (target.currentJob == JobType.grow) {
					target.completionTime = Date.now() + target.growthTime + 2;
					threadsCompleted = RunGrow(1, threadsNeeded);
				}
				else if (target.currentJob == JobType.hack) {
					// TODO: for hack, schedule all 3 jobs at once for most efficiency
					target.completionTime = Date.now() + target.hackTime + 2;
					threadsCompleted = RunHack(1, threadsNeeded);
				}
				threadsNeeded -= threadsCompleted;
				if (verbose)
					ns.tprint("Threads remaining on " + target.server + "'s " + target.currentJob + " job: " + threadsNeeded);
				
				await ns.sleep(1);
			}
		}
		await ns.sleep(1);
	}

	function AnalyzeTarget(target) {
		target.securityCurrent = ns.getServerSecurityLevel(target.server);
		target.securityMin = ns.getServerMinSecurityLevel(target.server);
		target.currentMoney = ns.getServerMoneyAvailable(target.server);
		target.maxMoney = ns.getServerMaxMoney(target.server);
		target.hackTime = ns.getHackTime(target.server);	// in milliseconds. Extra threads/cores don't improve time.
		target.weakenTime = ns.getWeakenTime(target.server);	// in milliseconds. Extra threads/cores don't improve time.
		target.growthTime = ns.getGrowTime(target.server);	// in milliseconds. Extra threads/cores don't improve time.

		if (target.maxMoney > 1) {
			target.weakenNeeded = target.securityCurrent > target.securityMin * securityThresh;
			target.growthNeeded = target.currentMoney < target.maxMoney * growthThresh;
			target.hackNeeded = (target.growthNeeded == false) && (target.weakenNeeded == false);	// only hack after growth and weaken done
		} else {
			// skip servers with no money
			target.weakenNeeded = false;
			target.growthNeeded = false;
			target.hackNeeded = false;
		}

		target.currentJob = JobType.none;	// reset before assigning
		if (target.hackNeeded)
			target.currentJob = JobType.hack;
		else if (target.weakenNeeded)
			target.currentJob = JobType.weaken;
		else if (target.growthNeeded)
			target.currentJob = JobType.grow;

		return target;
	}

	function CalculateThreadsRequired(target, jobType) {
		let server = target.server;
		let threadsRequired = 0;

		if (jobType == JobType.hack) {
			target.hackThreadsReq = Math.ceil(ns.hackAnalyzeThreads(server, 
				target.currentMoney * hackPct)); // growThresh typically 95% cushion
			threadsRequired = target.hackThreadsReq;
			target.jobTime = target.hackTime;
		}
		else if (jobType == JobType.weaken) {
			target.weakenThreadsReq = Math.ceil((target.securityCurrent - target.securityMin) / 0.05);	// constant 0.05 per thread
			threadsRequired = target.weakenThreadsReq;
			target.jobTime = target.weakenTime;
		}
		else if (jobType == JobType.grow) {
			if (target.currentMoney > 0) {	// to avoid dividing by 0
				target.growthMultipleReq = (target.maxMoney / target.currentMoney) * growthThresh;
				target.growthMultipleReq = Math.min(4, Math.max(1, target.growthMultipleReq));	// clamp between 1x and 4x
			} else
				target.growthMultipleReq = 1;
			let cores = 1;	// TODO: GET CORES ON HOME SERVER IF POSSIBLE
			if (verbose)
				ns.tprint("Calculating threads on " + target.server + " with " + target.growthMultipleReq + 
					" growhMultiple required (" + target.maxMoney + " / " + target.currentMoney);
			
			target.growthThreadsReq = Math.ceil(ns.growthAnalyze(server, target.growthMultipleReq, cores));	// takes growth amount as a multiple
			threadsRequired = target.growthThreadsReq;
			target.jobTime = target.growthTime;
		}
		return threadsRequired;
	}

	function RunHack(delay, threadsNeeded) {
		let startTime = (new Date(Date.now())).toLocaleTimeString('en-US');
		let endTime = (new Date(Date.now() + target.hackTime)).toLocaleTimeString('en-US');
		// let endTime = new Date(target.completionTime).toLocaleTimeString('en-US');
		let hackThreads = CalcMaxThreads(ns, hackfile, host.server);
		hackThreads = Math.min(hackThreads, threadsNeeded);
		if (hackThreads < 1 && verbose)
			ns.tprint(host.server + " can't hack " + target.server + " with 0 threads.");
		else if (hackThreads >= 1) {
			if (verbose)
				ns.tprint(startTime + ":  " + host.server + " is running HACK on " + target.server + " using " + 
					hackThreads + " out of " + threadsNeeded + " threads needed.  Estimated time: " + 
					(target.hackTime/1000/60).toFixed(1) + " min, completing at " + endTime);
			ns.exec(hackfile, host.server, hackThreads, target.server, delay, verbose);
		}
		return hackThreads;
	}

	function RunWeaken(delay, threadsNeeded) {
		let startTime = (new Date(Date.now())).toLocaleTimeString('en-US');
		let endTime = (new Date(Date.now() + target.hackTime)).toLocaleTimeString('en-US');
		// let endTime = new Date(target.completionTime).toLocaleTimeString('en-US');
		let weakenThreads = CalcMaxThreads(ns, weakenfile, host.server);
		weakenThreads = Math.min(weakenThreads, threadsNeeded);
		if (weakenThreads < 1 && verbose)
			ns.tprint(host.server + " can't weaken " + target.server + " with 0 threads.");
		else if (weakenThreads >= 1) {
			if (verbose)
				ns.tprint(startTime + ":  " + host.server + " is running WEAKEN on " + target.server + " using " + 
					weakenThreads + " out of " + threadsNeeded + " threads needed.  Estimated time: " + 
					(target.weakenTime/1000/60).toFixed(1) + " min, completing at " + endTime);
			ns.exec(weakenfile, host.server, weakenThreads, target.server, delay);
		}
		return weakenThreads;
	}

	function RunGrow(delay, threadsNeeded) {
		let startTime = (new Date(Date.now())).toLocaleTimeString('en-US');
		let endTime = (new Date(Date.now() + target.hackTime)).toLocaleTimeString('en-US');
		// let endTime = new Date(target.completionTime).toLocaleTimeString('en-US');
		let growthThreads = CalcMaxThreads(ns, growthfile, host.server);
		growthThreads = Math.min(growthThreads, threadsNeeded);
		if (growthThreads < 1 && verbose)
			ns.tprint(host.server + " can't grow " + target.server + " with 0 threads.");
		else if (growthThreads >= 1) {
			if (verbose)
				ns.tprint(startTime + ":  " + host.server + " is running GROW on " + target.server + " using " + 
					growthThreads + " out of " + threadsNeeded + " threads needed.  Estimated time: " + 
					(target.growthTime/1000/60).toFixed(1) + " min, completing at " + endTime);
			ns.exec(growthfile, host.server, growthThreads, target.server, delay);
		}
		return growthThreads;
	}

	async function CopyFilesToHost(ns, host) {
		// Copy files to host server
		await ns.scp(hackfile, "home", host.server);
		await ns.scp(growthfile, "home", host.server);
		await ns.scp(weakenfile, "home", host.server);
	}

}