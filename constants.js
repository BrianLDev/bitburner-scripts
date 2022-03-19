/** @param {NS} ns **/
export async function main(ns) {
}

// Arrays of various server groups
export const Corporations = ['4sigma', 'b-and-a', 'blade', 'clarkinc', 'ecorp', 'fulcrumtech', 'fulcrumassets', 'kuai-gong', 'megacorp', 'nwo', 'omnitek'];
export const Gyms = ['crush-fitness', 'iron-gym', 'millenium-fitness', 'powerhouse-fitness', 'snap-fitness'];
export const Universities = ['rothman-uni', 'zb-institute', 'summit-uni'];
export const Tech = ['alpha-ent', 'blade', 'comptek', 'galactic-cyber', 'microdyne', 'fulcrumtech', 'stormtech', 'omnitek']
export const Sector12 = ['foodnstuff', 'joesguns', '4sigma', 'CSEC', 'rothman-uni', 'deltaone', 'univ-energy', 'icarus', 'iron-gym', 'alpha-ent', 'powerhouse-fitness', 'megacorp', 'blade']

/////////////////////////////////////// ENUMS ///////////////////////////////////////
// NOTE: JS DOESN'T ALLOW ITERATION THROUGH ENUMS, SO IF YOU NEED TO ITERATE AN ENUM,
// SIMPLY CONVERT TO AN ARRAY WITH CODE SIMILAR TO THIS TO YOUR SCRIPT:
// let citiesArr = Object.values(City);
// for (let city of citiesArr) { ... }

// enum of Hacking JobType enum to avoid "magic strings" in hacking function parameters
export const JobType = {
	weaken: 'weaken',
	grow: 'grow',
	hack: 'hack',
	none: 'none'
};

// Enum of Cities
export const City = {
	sector_12: 'Sector-12',
	aevum: 'Aevum',
	chongqing: 'Chongqing',
	new_Tokyo: 'New Tokyo',
	ishima: 'Ishima',
	volhaven: 'Volhaven'
}

// enum of all crimes
export const Crime = {
	shoplift: "shoplift",
	rob: "rob store",
	mug: "mug someone",
	larceny: "larceny",
	dealDrugs: "deal drugs",
	bondForgery: "bond forgery",
	traffickIllegalArms: "traffick illegal arms",
	homicide: "homicide",
	grandTheftAuto: "grand theft auto",
	kidnap: "kidnap",
	assassination: "assassination",
	heist: "heist",
};

// enum of programs
export const Program = {
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

// enum of corp industries
export const CorpIndustry = {
	agriculture: "Agriculture",
	chemical: "Chemical",
	computer: "Computer",
	energy: "Energy",
	fishing: "Fishing",
	food: "Food",
	healthcare: "Healthcare",
	mining: "Mining",
	pharma: "Pharmaceutical",
	realEstate: "Real Estate",
	robotics: "Robotics",
	software: "Software",
	tobacco: "Tobacco",
	utilities: "Utilities"
}


/////////////////////////////////// WARNING: SPOILERS BELOW ///////////////////////////////////






// enum of factions
export const Faction = {
	// hacking
	csec: "CyberSec",
	nitesec: "NiteSec",
	blackHand: "The Black Hand",
	bitrunners: "BitRunners",
	// hacknet
	netburners: "Netburners",
	// location
	sector12: "Sector-12",
	tian: "Tian Di Hui",
	chongqing: "Chongqing",
	newTokyo: "New Tokyo",
	ishima: "Ishima",
	aevum: "Aevum",
	volhaven: "Volhaven",
	// corporations
	ecorp: "ECorp",
	megacorp: "MegaCorp",
	kuaiGong: "KuaiGong International",
	fourSigma: "Four Sigma",
	nwo: "NWO",
	blade: "Blade Industries",
	omnitek: "OmniTek Incorporated",
	bachman: "Bachman & Associates",
	clarke: "Clarke Incorporated",
	fulcrum: "Fulcrum Secret Technologies",
	// criminal
	slumSnakes: "Slum Snakes",
	tetrads: "Tetrads",
	silhouette: "Silhouette",
	speakers: "Speakers for the Dead",
	darkArmy: "The Dark Army",
	syndicate: "The Syndicate",
	// endgame
	covenant: "The Covenant",
	daedalus: "Daedalus",
	illuminati: "Illuminati",
	// special
	bladeburners: "Bladeburners",
}