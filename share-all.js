/** @param {NS} ns **/
import { GetHosts, CalcMaxThreads, Vprint } from "helper-functions.js"

export async function main(ns) {
	let maxSharePower = ns.args[0];
	maxSharePower = (maxSharePower == null || maxSharePower == NaN) ? maxSharePower = 1.25 : maxSharePower;
	let verbose = ns.args[0];
	verbose = (verbose == "true" || verbose == true) ? true : false;

	const sharefile = "/hax/share.js"
	let hosts = GetHosts(ns);
	let sharePower = ns.getSharePower();

	Vprint(ns, verbose, `Total share power boosted at start: ${sharePower}`);

	while(true) {

		for (let i=0; i < hosts.length; i++) {
			sharePower = ns.getSharePower();
			if (sharePower > maxSharePower)
				Vprint(ns, verbose, `Reached maximum sharePower of ${maxSharePower}. Waiting.`);
			else {
				let hostObj = hosts[i];
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