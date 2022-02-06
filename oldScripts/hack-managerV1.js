/** @param {NS} ns **/
import * as funcs from "helper-functions.js"

export async function main(ns) {
	let primaryTarget = ns.args[0];
	const hackfile = "/hax/hack.js";
	const growfile = "/hax/grow.js";
	const weakenfile = "/hax/weaken.js";
	const growThresh = .95;
	const securityThresh = 1.1;
	const hackPct = .5;	// take 50% of available money with each hack

	// TODO: automate target and hosts to cycle through all
	let hosts = funcs.GetHosts(ns);
	let host = ns.getHostname();
	let targets = funcs.GetTargets(ns, true);	// exclude poor (cash = $0)
	targets.sort((a, b) => a.maxMoney < b.maxMoney ? 1 : -1);
	let target = new Object();


	// INFINITE HACK LOOP
	while (true) {
		host = hosts.pop();
		hosts.unshift(host);
		
		// 	Copy files to server if needed
		if (!ns.fileExists(hackfile, host.server))
			await ns.scp(hackfile, "home", host.server);
		if (!ns.fileExists(growfile, host.server))
			await ns.scp(growfile, "home", host.server);
		if (!ns.fileExists(weakenfile, host.server))
			await ns.scp(weakenfile, "home", host.server);

		if (primaryTarget == null) {
			target = targets.pop();
			targets.unshift(target);
		}
		else {
			target = targets.find(target => target.server == primaryTarget);
			if (!target)
				ns.tprint("Error: " + primaryTarget + " not found.");
		}

		target.completionTime = new Date();
		// ns.print(host.server + " is working on " + target.server);
		
		UpdateStatus();

		if (target.hackNeeded) {
			RunHack(1);
			// TODO: FIX THIS SO THAT GROW AND WEAKEN CALCULATE THREADS AFTER HACK DONE
			// RunGrow(target.hackTime + 10);
			// RunWeaken(target.hackTime + target.growTime + 20);
			target.completionTime = Date.now() + target.hackTime + target.growTime + target.weakenTime + 30;
			// await ns.sleep(target.hackTime + target.growTime + target.weakenTime + 30);
		}
		else if (target.weakenNeeded) {
			RunWeaken(1);
			target.completionTime = Date.now() + target.weakenTime + 10;
			// await ns.sleep(target.weakenTime + 10);
		}
		else if (target.growthNeeded) {
			// let prevHost = host;
			// host = new Object();
			// host.server = "home";	// force home to be the only server to run grow.  TODO: CHANGE LATER WHEN QUEUE WORKING
	
			RunGrow(1);
			target.completionTime = Date.now() + target.growTime + 10;
			// await ns.sleep(target.growTime + 10);
			// host = prevHost;
		}


		await ns.sleep(5);
	}

	function UpdateStatus() {
		if (target.maxMoney > 1) {
			target = AnalyzeTarget(ns, target, 100, 1, hackPct, growThresh, false);
			target.weakenNeeded = target.securityCurrent >= target.securityMin * securityThresh;
			target.growthNeeded = target.currentMoney <= target.maxMoney * growThresh;
			target.hackNeeded = (target.growthNeeded == false) && (target.weakenNeeded == false);	// only hack after growth and weaken done
		} else {
			// skip servers with no money
			target.weakenNeeded = false;
			target.growthNeeded = false;
			target.hackNeeded = false;
		}
	}

	function RunWeaken(delay) {
		let startTime = new Date(Date.now());
		startTime = startTime.toLocaleTimeString('en-US');
		let endTime = new Date(Date.now() + target.weakenTime);
		endTime = endTime.toLocaleTimeString('en-US');
		let weakenThreads = target.weakenThreadsReq;
		weakenThreads = Math.min(funcs.CalcMaxThreads(ns, weakenfile, host.server), weakenThreads);
		if (weakenThreads < 1) {
			ns.print(host.server + " can't weaken " + target.server + " with 0 threads.");
		}
		else {
			ns.print(startTime + ":  " + host.server + " is running WEAKEN on " + target.server + " using " + 
				weakenThreads + " out of " + target.weakenThreadsReq + " threads needed.  Estimated time: " + 
				(target.weakenTime/1000/60).toFixed(1) + " min, completing at " + endTime);
			ns.exec(weakenfile, host.server, weakenThreads, target.server, delay);
		}
	}

	function RunGrow(delay) {
		let startTime = new Date(Date.now());
		startTime = startTime.toLocaleTimeString('en-US');
		let endTime = new Date(Date.now() + target.growTime);
		endTime = endTime.toLocaleTimeString('en-US');
		let growthThreads = target.growthThreadsReq;
		growthThreads = Math.min(funcs.CalcMaxThreads(ns, growfile, host.server), growthThreads);
		// if (growthThreads < target.growthThreadsReq)
		// 	return;	// skip if host can't handle all threads
		if (growthThreads < 1) {
			ns.print(host.server + " can't grow " + target.server + " with 0 threads.");
		}
		else {
			ns.print(startTime + ":  " + host.server + " is running GROW on " + target.server + " using " + 
				growthThreads + " out of " + target.growthThreadsReq + " threads needed.  Estimated time: " + 
				(target.growthTime/1000/60).toFixed(1) + " min, completing at " + endTime);
			ns.exec(growfile, host.server, growthThreads, target.server, delay);
		}
	}

	function RunHack(delay) {
		let startTime = new Date(Date.now());
		startTime = startTime.toLocaleTimeString('en-US');
		let endTime = new Date(Date.now() + target.hackTime);
		endTime = endTime.toLocaleTimeString('en-US');
		let hackThreads = target.hackThreadsReq;
		hackThreads = Math.min(funcs.CalcMaxThreads(ns, hackfile, host.server), hackThreads);
		// if (hackThreads < target.hackThreads)
		// 	return;	// skip if host can't handle all threads
		if (hackThreads < 1) {
			ns.print(host.server + " can't hack " + target.server + " with 0 threads.");
		}
		else {
			ns.print(startTime + ":  " + host.server + " is running HACK on " + target.server + " using " + 
				hackThreads + " out of " + target.hackThreadsReq + " threads needed.  Estimated time: " + 
				(target.hackTime/1000/60).toFixed(1) + " min, completing at " + endTime);
			ns.exec(hackfile, host.server, hackThreads, target.server, delay);
		}
	}
}

// TODO: STREAMLINE THIS AND CUT OUT ANYTHING THAT ISN'T NEEDED FOR HACKING
export function AnalyzeTarget(ns, target, threads=1, cores=1, hackPct=.5, growThresh=.95, print=true) {
	if (target.maxMoney < 1) {
		return;
	}
	let server = target.server;
	target.threads = threads;
	target.cores = cores;
	target.hackPct = hackPct;
	target.growThresh = growThresh;
	target.currentMoney = ns.getServerMoneyAvailable(server);
	target.maxMoney = ns.getServerMaxMoney(server);
	target.securityCurrent = ns.getServerSecurityLevel(server);
	target.securityMin = ns.getServerMinSecurityLevel(server);
	target.hackProfitPct = ns.hackAnalyze(server) / 100 * threads;	// orig value is per thread % of "total money" * 100
	target.hackProfit = target.hackProfitPct * target.currentMoney;
	target.hackChance = ns.hackAnalyzeChance(server);	// in decimal form
	target.hackThreadsReq = Math.ceil(ns.hackAnalyzeThreads(server, target.currentMoney * hackPct * .95)); // with 5% cushion for thresh
	target.hackSecurIncr = ns.hackAnalyzeSecurity(threads);
	target.hackTime = ns.getHackTime(server);	// in milliseconds. Extra threads/cores don't improve time.
	target.growthFactor = ns.getServerGrowth(server);
	if (target.currentMoney > 0) {	// to avoid dividing by 0
		target.growthMultipleReq = 1+((target.maxMoney - target.currentMoney) / target.currentMoney);
		target.growthMultipleReq = Math.min(999, Math.max(1, target.growthMultipleReq * growThresh));
	} else {
		target.growthMultipleReq = 1;
	}
	target.growthThreadsReq = Math.ceil(ns.growthAnalyze(server, target.growthMultipleReq, cores));	// takes growth amount as a multiple
	target.growthSecInc = ns.growthAnalyzeSecurity(threads);	// constant 0.002 per thread
	target.growthTime = ns.getGrowTime(server);	// in milliseconds. Extra threads/cores don't improve time.
	target.weakenSecDec = ns.weakenAnalyze(threads, cores);	// constant 0.05 per thread
	target.weakenThreadsReq = Math.ceil((target.securityCurrent - target.securityMin) / 0.05);
	target.weakenTime = ns.getWeakenTime(server);	// in milliseconds. Extra threads/cores don't improve time.

	if (print) {
		ns.tprint("___________________________________________________________");
		ns.tprint("ANALYZING SERVER: " + server);
		ns.tprint("Using " + threads + " threads, " + cores + " cores, " + hackPct*100 + "% hackPct, " + growThresh*100 + "% growth Threshold");
		ns.tprint("___________________________________________________________");
		ns.tprint("Money available/max:  " + funcs.FormatMoney(target.currentMoney, 2) + "/" + 
			funcs.FormatMoney(target.maxMoney, 2));
		ns.tprint("Security current/min:  " + target.securityCurrent.toFixed(1) + "/" + 
			target.securityMin.toFixed(1));
		ns.tprint("Hack profit at current security:  " + funcs.FormatMoney(target.hackProfit, 2));
		ns.tprint("Hack chance at current security:  " + (target.hackChance * 100).toFixed(1) + "%");
		ns.tprint("Hack Threads Required:  " + target.hackThreadsReq);
		ns.tprint("Hack Security Increase:  " + target.hackSecurIncr);
		ns.tprint("Hack time:  " + (target.hackTime / 1000 / 60).toFixed(2) + " min");
		ns.tprint("Growth Factor:  " + target.growthFactor);
		ns.tprint("Growth multiple required:  " + target.growthMultipleReq);
		ns.tprint("Growth Threads Required:  " + target.growthThreadsReq);
		ns.tprint("Growth Security Increase:  " + target.growthSecInc);
		ns.tprint("Growth time:  " + (target.growthTime / 1000 / 60).toFixed(2) + " min");
		ns.tprint("Weaken Security Decrease:  " + target.weakenSecDec);
		ns.tprint("Weaken Threads Required:  " + target.weakenThreadsReq);
		ns.tprint("Weaken time:  " + (target.weakenTime / 1000 / 60).toFixed(2) + " min");
	}
	return target;
}