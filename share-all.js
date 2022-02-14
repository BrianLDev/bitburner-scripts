/** @param {NS} ns **/
import { GetHosts, CalcMaxThreads, Vprint } from "helper-functions.js"

export async function main(ns) {
	let verbose = ns.args[0];
	verbose = (verbose == "true" || verbose == true) ? true : false;

	const sharefile = "/hax/share.js"
	let hosts = GetHosts(ns);
	
	Vprint(ns, verbose, `Total share power boosted at start: ${ns.getSharePower()}`);

	while(true) {

		for (let i=0; i < hosts.length; i++) {
			let hostObj = hosts[i];
			await ns.scp(sharefile, "home", hostObj.hostname);
			let threads = CalcMaxThreads(ns, sharefile, hostObj.hostname);
			if (threads <= 0)
				continue;
			if (await ns.exec(sharefile, hostObj.hostname, threads) > 0) {
				Vprint(ns, verbose, `${hostObj.hostname} is sharing: ${threads}`);
			}
		}

		Vprint(ns, verbose, `Done!  Total share power boosted: ${ns.getSharePower()}`);

		// It runs for about 10 seconds, so sleep, then run a new batch
		await ns.sleep(10000);
	}
}