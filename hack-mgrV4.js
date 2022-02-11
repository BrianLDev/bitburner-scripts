/** @param {NS} ns **/
import { GetTargets, GetNextHost, GetHosts, HostsMaxRam, CalcMaxThreads } from "helper-functions.js"
import { AnalyzeTarget, CalcRamRequired, CopyHackFilesToHost} from "helper-functions.js"

// NOTE: Date.now() is added at the end of all exec functions because for some reason the game requires all
// scripts to have unique arguments in order to run.  This will prevent hangups from running hack/grow/weaken
// more than once on a host

/* TODO IMPROVEMENTS:
- consolidate the separate weaken/grow/hack scripts so there's only 1 function for each.
- make a function to prepare primary target (min sec, max $) before starting hack batch
	- first weaken, then grow, then weaken again
	- calculate times and threads needed for each at the beginning by manually editing server object values
- fix prepare weaken/grow functions so that it doesn't keep spamming the same weaken/grow over and over.
- have weaken function utilize all the crappy hosts with low max ram first (lookin at you n00dles)
- hack and grow should maximize threads since each successful increases security and could cause other hacks to fail.
- make sure there is enough free RAM across all hosts to run a full hack batch (calculate batch ram).
	this will prevent partially executed batches that mess up the flow
	may need to dynamically calculate hackPct, maxThreads for each function, etc
*/
export async function main(ns) {
	// VARIABLES
	let hackPct = ns.args[0];		// the % of money Available to target in each hack
	let maxMinutes = ns.args[1];	// limits max total minutes per batch (TODO)
	let verbose = ns.args[2];		// true = show output in terminal (DONE)

	if (hackPct == null || hackPct == NaN)
		maxThreads = .30;	// <-- manually enter this in args for now. TODO: AUTOMATE SOMEHOW
	if (maxMinutes == null || maxThreads == NaN)
		maxMinutes = 9999;	// <-- manually enter this in args for now. TODO: AUTOMATE SOMEHOW
	if (verbose != true || verbose != "true")
		verbose = false;

	const h = ns.formulas.hacking;
	const moneyThresh = .95;
	const securityThresh = 1.05;


	// EXECUTE HACKING LOOP
	while(true) {
		// TODO: ADD ROOTALL FUNCTION HERE
		// TODO: ADD PURCH NEW SERVERS FUNCTION HERE (AFTER IT'S AUTOMATED)

		// Get primary hack target based on hackEarnRate
		// note: target is a Server object. Use target.hostname to get name
		let target = GetTargets(ns, true)[0];	// true = exclude $0
		// add lots of useful info and properties to target object
		target = AnalyzeTarget(ns, target, hackPct, moneyThresh, securityThresh);

		PrepareTarget(target);	// Get $ to moneyThresh, security to security Thresh (if needed)
		HackBatch(target);		// Batch: Hack, Weaken, Grow, Weaken 

		// TODO: REMOVE THIS WHEN DONE TESTING
		ns.tprint(target);
		ns.exit();	

		await ns.sleep(1);
	}


	// FUNCTIONS
	function PrepareTarget(target) {
		if (!target.isWeakened) {
			// TODO: WEAKEN --> GROW --> WEAKEN
		}
		else if (!target.isGrown) {
			// TODO: GROW --> WEAKEN
		}

	}

	function HackBatch(target) {

	}

	function Weaken(target) {

	}

	function Grow(target) {

	}

	function Hack(target) {

	}

}