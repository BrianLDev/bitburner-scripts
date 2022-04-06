/** @param {NS} ns **/
import { GetNextHost, Vprint } from 'helper-functions.js'


export async function main(ns) {
	ns.disableLog("ALL");
	const chargeFile = '/stanek/charge.js'
	let verbose = false;	// TODO: CHANGE THIS WHEN DONE DEBUGGING
	// let width = ns.stanek.width;
	// let height = ns.stanek.height;
	// let fragTypes = ns.stanek.fragmentDefinitions();
	// fragTypes.forEach(frag => ns.tprint(frag));

	while (true) {
		let fragments = ns.stanek.activeFragments();
		for (let frag of fragments) {
			// skip booster fragments that can't be charged (id 100-107)
			if (frag.id > 99)
				continue;
			
			let charged = false;
			while (!charged){
				let host = GetNextHost(ns);
				let fileRam = ns.getScriptRam(chargeFile, 'home');
				let threads = Math.floor(host.freeRam / fileRam);
				if (!ns.fileExists(chargeFile, host.hostname))
					await ns.scp(chargeFile, 'home', host.hostname);
				if (threads >= frag.highestCharge * .75) {
					let numChargePrev = frag.numCharge;
					ns.exec(chargeFile, host.hostname, threads, frag.x, frag.y);
					charged = true;
					Vprint(ns, verbose, `⚡ ${host.hostname} charged stanek frag ${frag.id} at [${frag.x},${frag.y}] with ${threads} threads.  Charges ${numChargePrev} --> ${frag.numCharge}`)
				}

				await ns.sleep(1100);
			}
		}

		await ns.sleep(100);
	}
}