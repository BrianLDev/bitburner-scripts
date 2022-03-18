/** @param {NS} ns **/
import { GetHosts, CalcMaxThreads, Vprint } from "helper-functions.js"

export async function main(ns) {
	let maxSharePower = ns.args[0];
	let verbose = ns.args[1];

	maxSharePower = (maxSharePower == '_' || maxSharePower == null || 
		maxSharePower == NaN) ? maxSharePower = 1.50 : maxSharePower;
	verbose = (verbose == "true" || verbose == true) ? true : false;

	const sharefile = "/hax/share.js"
	let sharePower = ns.getSharePower();
	Vprint(ns, verbose, `Total share power boosted at start: ${sharePower}`);
	let hosts = GetHosts(ns);
	// sort by lowest max ram first to put weak servers to work
	hosts.sort((a, b) => a.maxRam > b.maxRam ? 1 : -1);

	while(true) {
		for (let i=0; i < hosts.length; i++) {
			sharePower = ns.getSharePower();
			if (sharePower > maxSharePower)
				Vprint(ns, verbose, `Reached maximum sharePower of ${maxSharePower}. Waiting.`);
			else {
				let hostObj = hosts[i];
				if (hostObj.hostname.slice(0, 7) == 'hacknet')
					continue;	// skip hacknet server nodes
				if (hostObj.hostname == 'home')
					continue;	// skip home  to allow extre cores to grow/weaken
				await ns.scp(sharefile, "home", hostObj.hostname);
				let threads = CalcMaxThreads(ns, sharefile, hostObj.hostname);
				if (threads <= 0)
					continue;
				if (await ns.exec(sharefile, hostObj.hostname, threads) > 0) {
					Vprint(ns, verbose, `${hostObj.hostname} is sharing: ${threads}`);
				}
			}
		}

		Vprint(ns, verbose, `Done!  Total share power boosted for 10 seconds: ${ns.getSharePower()}`);

		// It runs for about 10 seconds. Sleep, then run a new batch
		await ns.sleep(10500);
	}
}