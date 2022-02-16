/** @param {NS} ns **/

// HELPER FUNCTIONS
export function GetAllServers(ns) {
	let toSearch = ns.scan("home");
	let allServers = [];
	let nestedServers = [];
	let currentServer;
	while (toSearch.length > 0) {
		currentServer = toSearch.shift();
		allServers.push(currentServer);
		nestedServers = GetNestedServers(ns, currentServer);
		toSearch = toSearch.concat(nestedServers);	
	}
	return allServers;
}

export function GetNestedServers(ns, server) {
	let nestedServers = ns.scan(server);
	nestedServers.shift();	// get rid of reference to parent server
	return nestedServers;
}

export function GetServersToRoot(ns) {
	let allServers = GetAllServers(ns);
	let serversToRoot = [];
	for (let i=0; i<allServers.length; i++) {
		if (!ns.hasRootAccess(allServers[i]))
			serversToRoot.push(allServers[i])
	}
	return serversToRoot;
}

export function GetRootedServers(ns) {
	let allServers = GetAllServers(ns);
	let rootedServers = [];
	for (let i=0; i<allServers.length; i++) {
		if (ns.hasRootAccess(allServers[i]))
			rootedServers.push(allServers[i])
	}
	return rootedServers;
}

export function OpenPorts(ns, server) {
	let ports = ns.getServerNumPortsRequired(server);
	let portsOpened = 0;
	if (ports >= 1 && ns.fileExists("BruteSSH.exe")) { 
		ns.brutessh(server);
		portsOpened++;
	}
	if (ports >= 2 && ns.fileExists("FTPCrack.exe")) {
		ns.ftpcrack(server);
		portsOpened++;
	}
	if (ports >= 3 && ns.fileExists("RelaySMTP.exe")) {
		ns.relaysmtp(server);
		portsOpened++;
	}
	if (ports >= 4 && ns.fileExists("HTTPWorm.exe")) {
		ns.httpworm(server);
		portsOpened++;
	}
	if (ports >= 5 && ns.fileExists("SQLInject.exe")) {
		ns.sqlinject(server);
		portsOpened++;
	}
	if (portsOpened >= ports) {
		return true;
	}
	else {
		ns.tprint("WARNING: only able to open " + portsOpened + " out of " + ports + " required on " + server);
		return false;
	}
}

export function GainRootAccess(ns, server) {
	if (OpenPorts(ns, server)) {	// first open ports
		ns.nuke(server);			// then nuke
	}
	if (ns.hasRootAccess(server)) {
		// ns.tprint("Successfully gained root access on " + server);
		return true;
	}
	else {
		// ns.tprint("WARNING: didn't gain root access on " + server);
		return false;
	}
}

// export async function RunHackScript(ns, filename, server, hackTarget) {
// 	let threads = CalcMaxThreads(ns, filename, server);
// 	if (threads > 0) {
// 		ns.tprint("Running hack script on " + server);
// 		if (await ns.scp(filename, "home", server) == false) {
// 			ns.tprint("Error: couldn't copy file on " + server);
// 			return false;
// 		}
// 		ns.killall(server);
// 		if (await ns.exec(filename, server, threads, hackTarget) == false) {
// 			ns.tprint("Error: couldn't execute script on " + server);
// 			return false;
// 		}
// 		else {
// 			return true;
// 		}
// 	}
// }


export function CalcJobThreads(ns, target, jobType, hackPct=.50, moneyThresh=0.95, securityThresh=1.05) {
	const h = ns.formulas.hacking;
	const secWeakenPerThread = 0.05;	// constant per game docs
	let player = ns.getPlayer();
	let threads = 0;

	if (jobType == JobType.weaken) {
		let weakenAmt = Math.ceil(target.hackDifficulty - (target.minDifficulty * securityThresh));
		if (weakenAmt > 0)
			threads = Math.ceil(weakenAmt / secWeakenPerThread);
	}
	else if (jobType == JobType.grow) {
		let growMultiple = (target.moneyMax * moneyThresh) / target.moneyAvailable;
		if (growMultiple > 0)
			threads = Math.ceil(ns.growthAnalyze(target.hostname, growMultiple, 1));
	}
	else if (jobType == JobType.hack) {
		let hackPctPerThread = h.hackPercent(target, player);
		threads = Math.ceil(hackPct / hackPctPerThread);
	}
	return Math.ceil(threads);
}

export function CalcMaxThreads(ns, file, hostname) {
	let freeRam = GetFreeRam(ns, hostname);
	let threads = Math.floor(freeRam / ns.getScriptRam(file));
	// ns.tprint(`## CalcMaxThreads: ${hostname} has ${freeRam} free RAM and can execute ${threads} threads`)
	return threads;
}

export function CalcRamRequired(ns, file, threads) {
	const scriptRam = ns.getScriptRam(file);
	let ramRequired = Math.ceil(scriptRam * threads);
	return ramRequired;
}

export function HostsFreeRam(ns) {
	const hosts = GetHosts(ns);
	let totalFreeRam = 0;
	for (let i=0; i<hosts.length; i++) {
		hosts[i].freeRam = GetFreeRam(ns, hosts[i].hostname);
		totalFreeRam += hosts[i].freeRam;
	}
	return totalFreeRam;
}

export function HostsMaxRam(ns) {
	const hosts = GetHosts(ns);
	let totalMaxRam = 0;
	for (let i=0; i<hosts.length; i++) {
		totalMaxRam += hosts[i].maxRam;
	}
	return totalMaxRam;
}

export function GetTargets(ns, excludePoor=false) {
	// NOTE: THIS RETURNS AN ARRAY OF SERVER OBJECTS, NOT JUST THE SERVER HOSTNAME STRINGS
	let serverList = ns.scan();
	let rootedServers = GetRootedServers(ns, serverList);
	let targetList = []
	for (let i=0; i<rootedServers.length; i++) {
		let target = ns.getServer(rootedServers[i]);
		if (target.hostname.substring(0, 5) == "pserv")
			continue;	
		else {
			// push on to targetList unless excluded by parameters
			if (excludePoor && target.moneyMax < 1)
				continue;
			else {
				target = AnalyzeTarget(ns, target);	// Adds useful stats and properties
				targetList.push(target);
			}
		}
	}
	targetList.sort((a, b) => (a.hackEarnRate < b.hackEarnRate) ? 1 : -1);	// sort list by hackEarnRate: max --> min
	return targetList;
}

export function GetHosts(ns) {
	// NOTE: THIS RETURNS AN ARRAY OF SERVER OBJECTS, NOT JUST THE SERVER HOSTNAME STRINGS
	let serverList = ns.scan();
	let rootedServers = GetRootedServers(ns, serverList);
	let hostList = [];
	for (let i=0; i<rootedServers.length; i++) {
		let host = ns.getServer(rootedServers[i]);
		host.freeRam = GetFreeRam(ns, host.hostname);
		if (host.maxRam > 0)
			hostList.push(host);
		else
			continue;
	}
	// add home
	let home = ns.getServer("home");
	home.freeRam = GetFreeRam(ns, "home");
	hostList.push(home);
	// sort list by maxRam then return
	hostList.sort((a, b) => (a.maxRam < b.maxRam) ? 1 : -1);
	return hostList;
}

export function GetFreeRam(ns, hostname) {
	let freeRam = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
	let cushion = 0;
	// leave a cushion of 10 GB on "home" for misc scripts if max ram >= 128 GB
	if (hostname == "home" && ns.getServerMaxRam("home") >= 128)
		cushion = 10;
	return freeRam - cushion;
}

export function GetNextHost(ns) {
	let hosts = GetHosts(ns);
	hosts = hosts.sort((a, b) => a.freeRam < b.freeRam ? 1 : -1);
	return hosts[0];	// returns host with most available ram
}

export function AnalyzeTarget(ns, target, hackPct=.50, moneyThresh=.99, securityThresh=1.01) {
	// note 1: this takes and returns a Server object
	// note 2: this requires Formulas.exe
	// hackEarnRate is $1 per ms
	const h = ns.formulas.hacking;
	let player = ns.getPlayer();
	let simtarget = ns.getServer(target.hostname);	// to use for simulated situations

	target.isWeakened = target.hackDifficulty <= target.minDifficulty * securityThresh;
	target.isGrown = target.moneyAvailable >= target.moneyMax * moneyThresh;
	// Hack stats: set security and $ to levels prepared for hack
	simtarget.hackDifficulty = simtarget.minDifficulty * securityThresh;
	simtarget.moneyAvailable = simtarget.moneyMax * moneyThresh;
	target.hackChance = h.hackChance(simtarget, player);
	target.hackTime = Math.ceil(h.hackTime(simtarget, player));
	target.hackPctPerThread = h.hackPercent(simtarget, player);
	target.hackExp = h.hackExp(simtarget, player);
	target.expectedValue = Math.round((simtarget.moneyMax * hackPct * target.hackChance));
	// Grow stats: assume min security and 50% money
	simtarget.hackDifficulty = simtarget.minDifficulty * securityThresh;
	simtarget.moneyAvailable = simtarget.moneyMax * (1-hackPct);
	target.growTime = Math.ceil(h.growTime(simtarget, player));
	// Weaken stats: set security and $ to level after grow x 2
	let secIncGrow = ns.growthAnalyze(simtarget.hostname, 1/hackPct, 1) * .004; // each thread increases sec by .004
	simtarget.hackDifficulty = (simtarget.minDifficulty * securityThresh) + secIncGrow;
	simtarget.moneyAvailable = simtarget.moneyMax * moneyThresh;
	target.weakenTime = Math.ceil(h.weakenTime(simtarget, player));	
	// calculate hackEarnRate
	target.hackEarnRate = Math.round(target.expectedValue / target.weakenTime);	// weaken time is the longest of the 3
	return target;
}

export async function CopyHackFilesToHost(ns, hostname) {
	const hackfile = "/hax/hack.js";
	const growfile = "/hax/grow.js";
	const weakenfile = "/hax/weaken.js";
	await ns.scp(hackfile, "home", hostname);
	await ns.scp(growfile, "home", hostname);
	await ns.scp(weakenfile, "home", hostname);
}

export function RemoveFileRemoteServers(ns, filename, rootedOnly=true) {
	let servers;
	if (rootedOnly)
		servers = GetRootedServers(ns)
	else
		servers = GetAllServers(ns);

	let deleteCount = 0;
	for (let i=0; i<servers.length; i++) {
		if (servers[i] == "home")	// don't delete file on home server
			continue;
		else if (ns.fileExists(filename, servers[i])) {
			ns.rm(filename, servers[i]);
			// confirm it was deleted
			if (!ns.fileExists(filename, servers[i]))
				deleteCount++;
		}
	}
	ns.tprint("Done. Deleted " + deleteCount + " copies of " + filename + " from remote servers.");
	ns.alert("Done. Deleted " + deleteCount + " copies of " + filename + " from remote servers.");
}

export async function CopyFileToRemoteServers(ns, filename, rootedOnly=true) {
	if (!ns.fileExists(filename))
		ns.tprint("ERROR: " + filename + " not found, unable to copy.");

	let servers;
	if (rootedOnly)
		servers = GetRootedServers(ns);
	else
		servers = GetAllServers(ns);

	let copyCount = 0;
	for (let i=0; i<servers.length; i++) {
		if (servers[i] == "home")	// don't copy file to home server
			continue;
		await ns.scp(filename, "home", servers[i]);
		// confirm it was copied
		if (ns.fileExists(filename, servers[i]))
			copyCount++;
	}
	ns.tprint("Done. Copied " + filename + " to " + copyCount + " remote servers.");
	ns.alert("Done. Copied " + filename + " to " + copyCount + " remote servers.");
}

export function KillAllRemote(ns) {
	const hostNames = GetRootedServers(ns);
	let killed = 0;
	for (let i=0; i<hostNames.length; i++) {
		let hostname = hostNames[i];
		ns.killall(hostname);
		if (ns.getServerUsedRam(hostname) == 0)
			killed++;
	}
	ns.tprint("Done. Killed " + killed  + " scripts on remote servers.");
}

export const Corporations = ['4sigma', 'b-and-a', 'blade', 'clarkinc', 'ecorp', 'fulcrumtech', 'fulcrumassets', 
	'kuai-gong', 'megacorp', 'nwo', 'omnitek'];
export const Gyms = ['crush-fitness', 'iron-gym', 'millenium-fitness', 'powerhouse-fitness', 'snap-fitness'];
export const Universities = ['rothman-uni', 'zb-institute', 'summit-uni'];
export const Tech = ['alpha-ent', 'blade', 'comptek', 'galactic-cyber', 'microdyne', 'fulcrumtech', 'stormtech', 'omnitek']
export const Sector12 = ['foodnstuff', 'joesguns', '4sigma', 'CSEC', 'rothman-uni', 'deltaone', 'univ-energy', 
	'icarus', 'iron-gym', 'alpha-ent', 'powerhouse-fitness', 'megacorp', 'blade']

export const JobType = {
	weaken: 'weaken',
	grow: 'grow',
	hack: 'hack',
	none: 'none'
};

export function Vprint(ns, verbose, string) {
	if (verbose) {
		ns.tprint(string);
		ns.print(string);
	}
	else
		ns.print(string);
}

export function FormatTabs(str, breakpoint1=7, breakpoint2=14) {
	// determine tabs based on string str length
	let tabs = str.length < breakpoint1 ? "\t\t\t" : 
		str.length > breakpoint2 ? "\t" : "\t\t";
	return tabs;
}

export function FormatMoney(money, decimalPlaces=3) {
	decimalPlaces = Math.max(decimalPlaces, 0);
	if (money < 1000)
		return "$" + money.toFixed(decimalPlaces);
	else if (money < 1000000)
		return "$" + (money/1000).toFixed(decimalPlaces) + "k";
	else if (money < 1000000000)
		return "$" + (money/1000000).toFixed(decimalPlaces) + "m";
	else if (money < 1000000000000)
		return "$" + (money/1000000000).toFixed(decimalPlaces) + "b";
	else if (money < 1000000000000000)
		return "$" + (money/1000000000000).toFixed(decimalPlaces) + "t";
	else
		return "$" + (money/1000000000000).toFixed(decimalPlaces) + "t";	// TODO: REPLACE WITH HIGHER DENOMINATION AS NEEDED
}