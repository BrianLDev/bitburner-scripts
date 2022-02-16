/** @param {NS} ns **/
import { GetTargets, GetHosts, HostsMaxRam, HostsFreeRam, CalcMaxThreads, CalcJobThreads } from "helper-functions.js"
import { AnalyzeTarget, CalcRamRequired, CopyHackFilesToHost, JobType, Vprint} from "helper-functions.js"

// NOTE: Date.now() is added at the end of all exec functions because for some reason the game requires all
// scripts to have unique arguments in order to run.  This will prevent hangups from running hack/grow/weaken
// more than once on a host

/* TODO IMPROVEMENTS:
- Makes some good money but has room for improvement.
- Timing seems to be off a bit and target money/security don't always restore after each batch.
	- batch overlap is a common problem according to others
	- probably need to log timestamps of when each script is scheduled and completed to see whats off
	- also double check the time calculator functions on the simulated server object
	- also need to watch out for gaining hack levels (which shortens up times). hard to handle this one.
- other misc TODOS (search)
*/
export async function main(ns) {
	// VARIABLES
	let specificTarget = ns.args[0];	// for a specific target if desired. Type _ to stick with max hackearnrate
	let hackPct = ns.args[1];		// the % of money Available to target in each hack
	let maxMinutes = ns.args[2];	// limits max total minutes per batch (TODO)
	let verbose = ns.args[3];		// true = show output in terminal (DONE)
	verbose = (verbose == true || verbose == "true") ? true : false;

	if (hackPct == null || hackPct == NaN)
		hackPct = .40;	// <-- manually enter this in args for now. TODO: AUTOMATE SOMEHOW
	if (maxMinutes == null || maxMinutes == NaN)
		maxMinutes = 4;	// <-- manually enter this in args for now. TODO: AUTOMATE SOMEHOW
	
	// verbose = true;	// TODO: REMOVE WHEN DONE TESTING
	// specificTarget = 'phantasy';	// TODO: REMOVE WHEN DONE TESTING

	const h = ns.formulas.hacking;
	const hackfile = "/hax/hack.js";
	const growfile = "/hax/grow.js";
	const weakenfile = "/hax/weaken.js";
	const moneyThresh = .99;
	const securityThresh = 1.01;
	const growMult = 1 / hackPct;
	const cushion = 150;	// buffer delay between jobs. Must be > 20ms, but can be less than 200ms (depending on computer)
	const secIncPerHackThread = 0.002;	// constant per game docs
	const secIncPerGrowThread = 0.004;	// constant per game docs
	const secWeakenPerThread = 0.05;	// constant per game docs


	// EXECUTE HACKING LOOP
	let batchesToRun = 100	// # of hack batches to run before checking for new target (auto updated)
	while(true) {
		// TODO: ADD ROOTALL SERVERS HERE
		// TODO: ADD PURCH NEW SERVERS FUNCTION HERE (AFTER IT'S AUTOMATED)

		// SELECT TARGET
		// TODO: CONSIDER TOP 2-3 TARGETS IN LATEGAME WITH MASSIVE RAM. WILL AVOID COLLISIONS.
		let target;
		if (specificTarget != null && specificTarget != "" && specificTarget != "_")
			target = ns.getServer(specificTarget);	// swap to user defined target if in args
		else {
			let targets = GetTargets(ns, true);		// get target sorted by max hackEarnRate
			let filteredTargets = targets.filter(target => target.weakenTime/1000/60 < maxMinutes);
			target = filteredTargets[0]
		}
		// AnalyzeTarget adds lots of useful data and properties to target object
		target = AnalyzeTarget(ns, target, hackPct, moneyThresh, securityThresh);

		// PREPARE TARGET FOR HACKBATCH (Get $ to moneyThresh, security to security Thresh if needed)
		let batchDelay = 0;
		batchDelay = await PrepareTarget(target);
		await ns.sleep(2000);

		let totalMaxRam = HostsMaxRam(ns);
		let totalFreeRam = HostsFreeRam(ns);
		// HACKBATCH LOOP
		while (batchesToRun > 0) {
			// HACKBATCH
			target = await HackBatch(target, batchDelay);	// Batch: Hack -> Weaken -> Grow -> Weaken
			batchesToRun--;

			// Check that there's enough total ram to run at least 1 full hack batch
			// TODO: MOVE THESE RAM CHECKS TO BEFORE 1ST BATCH IF POSSIBLE
			totalMaxRam = HostsMaxRam(ns);
			if (totalMaxRam < target.batchRamReq * 2) {
				ns.tprint(`ERROR: not enough total RAM to run 2 complete batches: ${totalMaxRam} vs ${target.batchRamReq}`);
				ns.tprint(`Change target to one with a lower time/thread requirement.`);
				await ns.exit();
			}
			// Check that there's enough free ram to run another batch, if not, wait.
			totalFreeRam = HostsFreeRam(ns);
			while (totalFreeRam < target.batchRamReq * 1.5) {
				let waitSeconds = 3;
				Vprint(ns, verbose, `!!!! Not enough free RAM to run full batch, waiting ${waitSeconds} seconds...`);
				await ns.sleep(waitSeconds * 1000);
				totalFreeRam = HostsFreeRam(ns);
				batchesToRun = 0;
			}
			await ns.sleep(cushion);
		}

		if (target.batchRamReq > 0) {
			batchesToRun = Math.max(Math.floor(totalMaxRam / target.batchRamReq), 1);
			Vprint(ns, verbose, `--- Updating Batch count to ${batchesToRun} (${target.batchRamReq} RAM req vs ${totalFreeRam} RAM avail.`);
		}	
		
		// // TODO: REMOVE BELOW WHEN DONE TESTING
		// ns.tprint("DONE!!");
		// await ns.exit();

		await ns.sleep(cushion * 2);
	}


	// FUNCTIONS
	async function PrepareTarget(target) {
		Vprint(ns, verbose, `~~ Checking if target: ${target.hostname} is prepared...`);
		Vprint(ns, verbose, `WEAKENED: ${target.isWeakened}`);
		Vprint(ns, verbose, `GROWN:\t ${target.isGrown}`);
		const h = ns.formulas.hacking;
		let player = ns.getPlayer();
		let delay = 1;
		let threads = 0;
		let prepDuration = 1;
		if (!target.isWeakened) {
			// Weaken 1
			delay = 1;
			threads = CalcJobThreads(ns, target, JobType.weaken, hackPct, moneyThresh, securityThresh);
			prepDuration = h.weakenTime(target, player) + (cushion * 2);
			target = await Weaken(target, threads, delay);
			// target.hackDifficulty = Math.floor(target.minDifficulty * securityThresh);	// assume successful
		}
		if (!target.isGrown) {
			// Grow
			delay = Math.ceil(h.weakenTime(target, player) - h.growTime(target, player) + cushion);
			threads = CalcJobThreads(ns, target, JobType.grow, hackPct, moneyThresh, securityThresh);
			target = await Grow(target, threads, delay);
			// Weaken 2
			delay = cushion * 2;
			threads = CalcJobThreads(ns, target, JobType.weaken, hackPct, moneyThresh, securityThresh);
			prepDuration = h.weakenTime(target, player) + (cushion * 3);
			target = await Weaken(target, threads, delay);
		}
		Vprint(ns, verbose, `~~ Done scheduling preparation jobs on: ${target.hostname}`)
		return Math.ceil(prepDuration);
	}

	async function HackBatch(target, batchDelay=1) {
		Vprint(`~~ BEGINNING HACK BATCH ON: ${target.hostname}`);
		// TODO: MAKE SURE THERE'S ENOUGH FREE RAM TO RUN A FULL BATCH, OTHERWISE DELAY
		// IF ITS NOT EVEN POSSIBLE TO RUN 1 FULL BATCH ON AVAILABLE HOSTS MAX RAM, QUIT WITH ERROR MESSAGE
		// OR POSSIBLY CHOOSE A DIFFERENT TARGET? (YEAH, THIS SHOULD BE PART OF THE TARGET SELECTION PROCESS)
		let player = ns.getPlayer();
		let delay = 0
		let threads = 0;
		let totalThreads = 0;

		// 1) SCHEDULE HACK (no cushion + (weakentime-hacktime): resolves 1st)
		target.hackTime = h.hackTime(target, player);
		target.weakenTime = h.weakenTime(target, player);
		delay = Math.ceil(target.weakenTime - target.hackTime + batchDelay);
		threads = CalcJobThreads(ns, target, JobType.hack, hackPct, moneyThresh, securityThresh);
		totalThreads += threads;
		target = await Hack(target, threads, delay);

		// 2) SCHDEULE WEAKEN FOR HACK (cushion * 1: resolves 2nd)
		delay = cushion + batchDelay;
		threads = CalcJobThreads(ns, target, JobType.weaken, hackPct, moneyThresh, securityThresh);
		totalThreads += threads;
		target = await Weaken(target, threads, delay);

		// 3) SCHEDULE GROW (cushion * 2 + (weakentime-growtime): resolves 3rd)
		target.growTime = h.growTime(target, player);
		target.weakenTime = h.weakenTime(target, player);
		delay = Math.ceil(target.weakenTime - target.growTime + (cushion*2) + batchDelay);
		threads = CalcJobThreads(ns, target, JobType.grow, hackPct, moneyThresh, securityThresh);
		totalThreads += threads;
		target = await Grow(target, threads, delay);

		// 4) SCHEDULE WEAKEN FOR GROW (cushion * 3: resolves last)
		delay = (cushion * 3) + batchDelay;
		threads = CalcJobThreads(ns, target, JobType.weaken, hackPct, moneyThresh, securityThresh);
		totalThreads += threads;
		target = await Weaken(target, threads, delay);

		// calculate total threads/ram, and return target
		Vprint(ns, verbose, `~~ Done scheduling hack batch on: ${target.hostname}`)
		target.batchThreadsReq = totalThreads;
		target.batchRamReq = CalcRamRequired(ns, weakenfile, totalThreads);
		Vprint(ns, verbose, `BATCH THREADS: ${target.batchThreadsReq}, BATCH RAM: ${target.batchRamReq}`);
		return target;
	}

	// WEAKEN
	async function Weaken(target, threadsReq, delay=1) {
		Vprint(ns, verbose, `~ Starting weaken job on ${target.hostname} for ${threadsReq} threads`)
		let hosts = GetHosts(ns);
		hosts.sort((a, b) => a.maxRam > b.maxRam ? 1 : -1);	// sort by lowest max ram first so lame hosts do weaken
		while(threadsReq > 0) {
			for (let i=0; i<hosts.length; i++) {			
				let host = hosts[i];
				// TODO: ADD OPTION TO ALLOW HACKNET SERVERS IF WANTED
				if (host.hostname.slice(0, 7) == 'hacknet')
					continue;	// skip hacknet server nodes
				let maxThreads = CalcMaxThreads(ns, weakenfile, host.hostname);
				maxThreads = Math.min(threadsReq, maxThreads);
				if (maxThreads <= 0) {
					continue;	// skip host if they can't run weaken
				}
				Vprint(ns, verbose, `Trying to run weaken ${host.hostname} => ${target.hostname} with ${maxThreads} threads`);
				await CopyHackFilesToHost(ns, host.hostname);
				let id = Date.now();
				if (ns.exec(weakenfile, host.hostname, maxThreads, target.hostname, delay, verbose, id) > 0) {
					Vprint(ns, verbose, `Running weaken ${host.hostname} => ${target.hostname} ` + 
						`| ${maxThreads} of ${threadsReq} threads with ` + 
						`${delay} delay, taking ${(target.weakenTime / 1000 / 60).toFixed(2)} minutes.`);
					threadsReq -= maxThreads;
				}
				else {
					Vprint(ns, verbose, `WARNING: Couldnt run Weaken ${host.hostname} => ${target.hostname} ` + 
						`with ${maxThreads} threads`);
				}
				if (threadsReq <= 0)
					break;
			}	// end of for loop
			await ns.sleep(1);
		}	// end of while loop

		// Return target object assuming that Weaken was successful
		target.isWeakened = true;
		target.hackDifficulty = Math.floor(target.minDifficulty * securityThresh);
		return target;
	}

	// GROW
	async function Grow(target, threadsReq, delay=1) {
		Vprint(ns, verbose, `~ Starting Grow job on ${target.hostname} for ${threadsReq} threads`)
		let hosts = GetHosts(ns);
		hosts.sort((a, b) => a.freeRam < b.freeRam ? 1 : -1);	// sort by highest free ram first
		const threadsReqOrig = threadsReq;	// to calc security increase after job complete
		let minThreadsPct = .20;	// the min % of original threads per job. Avoids messy spreads
		// TODO: MAKE SURE MINTHREADSPCT STILL WORKS IN EARLY GAME WHEN RAM IS TINY
		while(threadsReq > 0) {
			for (let i=0; i<hosts.length; i++) {			
				let host = hosts[i];
				// TODO: ADD OPTION TO ALLOW HACKNET SERVERS IF WANTED
				if (host.hostname.slice(0, 7) == 'hacknet')
					continue;	// skip hacknet server nodes
				let maxThreads = CalcMaxThreads(ns, growfile, host.hostname);
				maxThreads = Math.min(threadsReq, maxThreads);
				if (maxThreads <= 0) {
					continue;	// skip host if they can't run weaken
				}
				else if (maxThreads < threadsReq * minThreadsPct) {
					continue;	// skip if they can't do at least the min amt of threads
				}
				Vprint(ns, verbose, `Trying to run Grow ${host.hostname} => ${target.hostname} with ${maxThreads} threads`);
				await CopyHackFilesToHost(ns, host.hostname);
				let id = Date.now();
				if (ns.exec(growfile, host.hostname, maxThreads, target.hostname, delay, verbose, id) > 0) {
					Vprint(ns, verbose, `Running grow ${host.hostname} => ${target.hostname} ` + 
						`| ${maxThreads} of ${threadsReq} threads with ` + 
						`${delay} delay, taking ${(target.growTime / 1000 / 60).toFixed(2)} minutes.`);
					threadsReq -= maxThreads;
				}
				else {
					Vprint(ns, verbose, `WARNING: Couldnt run Grow ${host.hostname} => ${target.hostname} ` + 
						`with ${maxThreads} threads`);
				}
				if (threadsReq <= 0)
					break;
			}	// end of for loop
			await ns.sleep(1);
		}	// end of while loop

		// Return target object assuming that Grow was successful
		target.isGrown = true;
		target.moneyAvailable = Math.ceil(target.moneyMax * moneyThresh);
		target.hackDifficulty += threadsReqOrig * secIncPerGrowThread;
		return target;
	}

	// HACK
	async function Hack(target, threadsReq, delay=1) {
		Vprint(ns, verbose, `~ Starting Hack job on ${target.hostname} for ${threadsReq} threads`)
		let hosts = GetHosts(ns);
		hosts.sort((a, b) => a.freeRam < b.freeRam ? 1 : -1);	// sort by highest free ram first
		const threadsReqOrig = threadsReq;	// to calc security increase after job complete
		let minThreadsPct = .40;	// the min % of original threads per job. Avoids messy spreads
		// TODO: MAKE SURE MINTHREADSPCT STILL WORKS IN EARLY GAME WHEN RAM IS TINY
		while(threadsReq > 0) {
			for (let i=0; i<hosts.length; i++) {			
				let host = hosts[i];
				// TODO: ADD OPTION TO ALLOW HACKNET SERVERS IF WANTED
				if (host.hostname.slice(0, 7) == 'hacknet')
					continue;	// skip hacknet server nodes
				let maxThreads = CalcMaxThreads(ns, hackfile, host.hostname);
				maxThreads = Math.min(threadsReq, maxThreads);
				if (maxThreads <= 0) {
					// Vprint(ns, verbose, `@@ Hack: SKIPPING ${host.hostname}: not enough maxThreads: ${maxThreads}`);
					continue;	// skip host if they can't run weaken
				}
				else if (maxThreads < threadsReq * minThreadsPct) {
					Vprint(ns, verbose, `@@ Hack: SKIPPING ${host.hostname}: maxThreads: ${maxThreads} < ${threadsReqOrig * minThreadsPct}`);
					continue;	// skip if they can't do at least the min amt of threads
				}
				Vprint(ns, verbose, `Trying to run Hack ${host.hostname} => ${target.hostname} with ${maxThreads} threads`);
				await CopyHackFilesToHost(ns, host.hostname);
				let id = Date.now();
				if (ns.exec(hackfile, host.hostname, maxThreads, target.hostname, delay, verbose, id) > 0) {
					Vprint(ns, verbose, `Running Hack ${host.hostname} => ${target.hostname} ` + 
						`| ${maxThreads} of ${threadsReq} threads with ` + 
						`${delay} delay, taking ${(target.growTime / 1000 / 60).toFixed(2)} minutes.`);
					threadsReq -= maxThreads;
				}
				else {
					Vprint(ns, verbose, `WARNING: Couldnt run Grow ${host.hostname} => ${target.hostname} ` + 
						`with ${maxThreads} threads`);
				}
				if (threadsReq <= 0)
					break;
			}	// end of for loop
			await ns.sleep(1);
		}	// end of while loop

		// Return target object assuming that Hack was successful
		target.isGrown = false;
		target.moneyAvailable = target.moneyAvailable - (target.moneyMax * hackPct);
		target.hackDifficulty += threadsReqOrig * secIncPerHackThread;
		return target;
	}

}