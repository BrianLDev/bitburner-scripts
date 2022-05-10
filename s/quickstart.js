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
	const F_Sleeves = "s/sleeves.js"
	const F_Stanek = "s/stanek.js"
	const U_Rothman = "Rothman University";
	const C_Algorithms = "Algorithms";
	const C_Leadership = "Leadership";

	// START TRAINING
	ns.universityCourse(U_Rothman, C_Algorithms, false);
	ns.exec(F_Sleeves, "home", 1, "quickstart");	// put sleeves to work making money
	// BUY PROGRAMS
	let torPurchased = false;
	for (let i=0; i<10; i++) {
		torPurchased = ns.purchaseTor();
		if (torPurchased)
			break;
		else
			await ns.sleep(500);
	}
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

	// RUN ALL QUICKSTART PROGRAMS
	ns.exec(F_BbMgr, "home", 1);	// start BladeBurner training if available
	ns.exec(F_HnsMgr, "home", 1);	// start hashnet server manager
	// wait 1 sec to build a bit of hacking power then rootall
	await ns.sleep(1000);			
	ns.exec(F_RootAll, "home", 1);
	// slight delay then run backdoor
	await ns.sleep(500);
	ns.exec(F_Bkdr, "home", 1);
	// slight delay then start hacking
	await ns.sleep(500);
	ns.exec(F_HackMgr, "home", 1);
	// start stanek (wait until end since it hogs RAM)
	ns.exec(F_Stanek, "home", 1);	
}