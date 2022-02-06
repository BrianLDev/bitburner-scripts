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
	// ns.tprint("FULL SERVER LIST: " + allServers);
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
		if (!ns.hasRootAccess(allServers[i])) {
			serversToRoot.push(allServers[i])
		}
	}
	return serversToRoot;
}

export function GetRootedServers(ns) {
	let allServers = GetAllServers(ns);
	let rootedServers = [];
	for (let i=0; i<allServers.length; i++) {
		if (ns.hasRootAccess(allServers[i])) {
			rootedServers.push(allServers[i])
		}
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
		ns.tprint("Error: only able to open " + portsOpened + " out of " + ports + " required on " + server);
		return false;
	}
}

export function GainRootAccess(ns, server) {
	if (OpenPorts(ns, server)) {	// first open ports
		ns.nuke(server);			// then nuke
		// NOTE: apparently automated backdoor comes later in the game. Uncomment at that point.
		// ns.installBackdoor(server);	// then backdoor
	}
	if (ns.hasRootAccess(server)) {
		ns.tprint("Successfully gained root access on " + server);
		return true;
	}
	else {
		ns.tprint("Error: didn't gain root access on " + server);
		return false;
	}
}

export async function RunHackScript(ns, filename, server, hackTarget) {
	let threads = CalcMaxThreads(ns, filename, server);
	if (threads > 0) {
		ns.tprint("Running hack script on " + server);
		if (await ns.scp(filename, "home", server) == false) {
			ns.tprint("Error: couldn't copy file on " + server);
			return false;
		}
		ns.killall(server);
		if (await ns.exec(filename, server, threads, hackTarget) == false) {
			ns.tprint("Error: couldn't execute script on " + server);
			return false;
		}
		else {
			return true;
		}
	}
}

export function CalcMaxThreads(ns, file, hostname, minPct=.03) {
	// minPct is the minimum % of total RAM to use towards a job to prevent millions of tiny 1 thread jobs
	// e.g. a 1024 GB server with minPct=.03 must have at least 30.7 GB free.
	// set minPct=0 to allow all jobs even the smallest amount of RAM
	let freeRam = GetFreeRam(ns, hostname);
	if (freeRam < ns.getServerMaxRam(hostname) * minPct)
		return 0
	else
		return Math.floor(freeRam / ns.getScriptRam(file));
}

export function GetTargets(ns, excludePoor=false) {
	let serverList = ns.scan();
	let rootedServers = GetRootedServers(ns, serverList);
	let targetList = []
	for (let i=0; i<rootedServers.length; i++) {
		let target = new Object();
		target.server = rootedServers[i];
		if (target.server.substring(0, 5) == "pserv")
			continue;	
		else {
			target.maxMoney = ns.getServerMaxMoney(target.server);
			target.currentMoney = ns.getServerMoneyAvailable(target.server)
			target.securityMin = ns.getServerMinSecurityLevel(target.server);
			target.securityCurrent = ns.getServerSecurityLevel(target.server).toFixed(1);
			target.maxRam = ns.getServerMaxRam(target.server);
			target.hackTime = ns.getHackTime(target.server);
			target.weakenTime = ns.getWeakenTime(target.server);
			target.growTime = ns.getGrowTime(target.server);
			target.roi = (target.maxMoney * 0.5) / (target.weakenTime + 200*3) * 100;
			// push on to targetList unless excluded by parameters
			if (excludePoor && target.maxMoney < 1)
				continue;
			else
				targetList.push(target);
		}
	}
	// sort list by maxMoney
	targetList.sort((a, b) => (a.maxMoney < b.maxMoney) ? 1 : -1);
	return targetList;
}

export function GetHosts(ns) {
	let serverList = ns.scan();
	let hackedServers = GetRootedServers(ns, serverList);
	let hostList = [];
	for (let i=0; i<hackedServers.length; i++) {
		let host = new Object();
		host.server = hackedServers[i];
		host.maxRam = ns.getServerMaxRam(host.server);
		host.usedRam = ns.getServerUsedRam(host.server);
		host.freeRam = GetFreeRam(ns, host.server);
		if (host.maxRam > 0)
			hostList.push(host);
		else
			continue;
	}
	// add home
	let home = new Object();
	home.server = "home";
	home.maxRam = ns.getServerMaxRam("home");
	home.usedRam = ns.getServerUsedRam("home");
	home.freeRam = GetFreeRam(ns, "home");
	// home.cores =	// Is there a way to get cores??
	hostList.push(home);
	// sort list by maxRam
	hostList.sort((a, b) => (a.freeRam < b.freeRam) ? 1 : -1);
	return hostList;
}

export function GetFreeRam(ns, hostname) {
	let freeRam = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
	let cushion = 0;
	// leave a little cushion of 10 GB on "home" for misc scripts if there's more than 256GB max
	if (hostname == "home" && ns.getServerMaxRam("home") >= 256)
		cushion = 10;
	return freeRam - cushion;
}

export function GetNextHost(ns) {
	let hosts = GetHosts(ns);
	hosts = hosts.sort((a, b) => a.freeRam < b.freeRam ? 1 : -1);
	return hosts[0];	// returns host with most available ram
}

export async function CopyHackFilesToHost(ns, host) {
	const hackfile = "/hax/hack.js";
	const growfile = "/hax/grow.js";
	const weakenfile = "/hax/weaken.js";
	await ns.scp(hackfile, "home", host.server);
	await ns.scp(growfile, "home", host.server);
	await ns.scp(weakenfile, "home", host.server);
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
		ns.tprint("Error: " + filename + " not found, unable to copy.");

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