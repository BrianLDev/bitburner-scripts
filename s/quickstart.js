/** @param {NS} ns **/
import * as c from "constants.js"

export async function main(ns) {
	// NOTE: ASSUMES LATEGAME WITH LOTS OF MONEY COMING IN AFTER REBOOT (GANGS/CORPS)
	// TODO: CODE ALTERNATE PATH FOR EARLY GAME WITH NO MONEY
	// TODO: MAKE SURE ENOUGH MONEY AVAILABLE TO PURCHASE TOR AND PROGRAMS

	await QuickstartEndGame(ns);
}

export async function QuickstartEarlyGame(ns) {
	// TODO
}

export async function QuickstartEndGame(ns) {
	// NOTE: ASSUMES LATEGAME WITH LOTS OF MONEY COMING IN AFTER REBOOT (GANGS/CORPS)
	// TODO: MAKE SURE ENOUGH MONEY AVAILABLE TO PURCHASE TOR AND PROGRAMS

	const ProgramsArr = Object.values(c.Program);	// convert enum to Array for iteration
	const F_RootAll = "root-all.js";
	const F_HackMgr = "hack-mgrV4.js";
	const F_Bkdr = "s/bkdr.js";
	const F_HnsMgr = "hn/hns-mgr.js";
	const F_BbMgr = "bb-mgr.js";
	const U_Rothman = "Rothman University";
	const C_Algorithms = "Algorithms";
	const C_Leadership = "Leadership";

	ns.universityCourse(U_Rothman, C_Algorithms, false);
	ns.purchaseTor();
	ns.connect("darkweb");
	await ns.sleep(100);
	let boughtPrograms = 0;
	while (boughtPrograms < ProgramsArr.length) {
		boughtPrograms = 0;
		ProgramsArr.forEach(prgm => {
			if (ns.fileExists(prgm))
				boughtPrograms++;
			else {
				ns.purchaseProgram(prgm);
				boughtPrograms++;
				ns.tprint(`Bought: ${prgm}`)
			}
		})
		await ns.sleep(10);
		ns.tprint(`Program count: ${boughtPrograms} vs ${ProgramsArr.length}`);
	}

	ns.connect("home");
	// Start BladeBurner training if available
	ns.exec(F_BbMgr, "home", 1);
	// wait 1 second to build up a bit of hacking power then rootall
	await ns.sleep(1000);
	ns.exec(F_RootAll, "home", 1);
	// slight delay then start hacking
	await ns.sleep(500);
	ns.exec(F_HackMgr, "home", 1);
	// slight delay then run backdoor
	await ns.sleep(500);
	ns.exec(F_Bkdr, "home", 1);
	// start hashnet server manager
	ns.exec(F_HnsMgr, "home", 1);
	// put sleeves to work
	// TODO: PUT SLEEVES TO WORK 
	// NOTE: SLEEVES MAY BE DEPRECATED IN FUTURE SO MAKE A SEPARATE SLEEVE MANAGER SCRIPT
}