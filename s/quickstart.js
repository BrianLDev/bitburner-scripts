/** @param {NS} ns **/
import * as c from "constants.js"

export async function main(ns) {
	// NOTE: ASSUMES LATEGAME WITH LOTS OF MONEY COMING IN AFTER REBOOT (GANGS/CORPS)
	// TODO: CODE ALTERNATE PATH FOR EARLY GAME WITH NO MONEY
	// TODO: MAKE SURE ENOUGH MONEY AVAILABLE TO PURCHASE TOR AND PROGRAMS

}

export async function QuickstartEarlyGame(ns) {
	
}

export async function QuickstartEndGame(ns) {
	// NOTE: ASSUMES LATEGAME WITH LOTS OF MONEY COMING IN AFTER REBOOT (GANGS/CORPS)
	// TODO: MAKE SURE ENOUGH MONEY AVAILABLE TO PURCHASE TOR AND PROGRAMS
	ns.universityCourse("Rothman University", "Algorithms", false);
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
	ns.exec("root-all.js", "home", 1);
	await ns.sleep(500);
	ns.exec("hack-mgrV4.js", "home", 1);
}

export const Programs = {
	ssh: "BruteSSH.exe",
	ftp: "FTPCrack.exe",
	smtp: "relaySMTP.exe",
	http: "HTTPWorm.exe",
	sql: "SQLInject.exe",
	serverProfiler: "ServerProfiler.exe",
	autolink: "AutoLink.exe",
	deepscan1: "DeepscanV1.exe",
	deepscan2: "DeepscanV2.exe",
	formulas: "Formulas.exe"
}

export const ProgramsArr = [
	Programs.ssh,
	Programs.ftp,
	Programs.smtp,
	Programs.http,
	Programs.sql,
	Programs.serverProfiler,
	Programs.autolink,
	Programs.deepscan1,
	Programs.deepscan2,
	Programs.formulas
]