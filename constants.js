/** @param {NS} ns **/
export async function main(ns) {
}

// Hacking JobType enum to avoid "magic strings" in hacking function parameters
export const JobType = {
	weaken: 'weaken',
	grow: 'grow',
	hack: 'hack',
	none: 'none'
};

// Lists of various server groups
export const Corporations = ['4sigma', 'b-and-a', 'blade', 'clarkinc', 'ecorp', 'fulcrumtech', 'fulcrumassets', 
	'kuai-gong', 'megacorp', 'nwo', 'omnitek'];
export const Gyms = ['crush-fitness', 'iron-gym', 'millenium-fitness', 'powerhouse-fitness', 'snap-fitness'];
export const Universities = ['rothman-uni', 'zb-institute', 'summit-uni'];
export const Tech = ['alpha-ent', 'blade', 'comptek', 'galactic-cyber', 'microdyne', 'fulcrumtech', 'stormtech', 'omnitek']
export const Sector12 = ['foodnstuff', 'joesguns', '4sigma', 'CSEC', 'rothman-uni', 'deltaone', 'univ-energy', 
	'icarus', 'iron-gym', 'alpha-ent', 'powerhouse-fitness', 'megacorp', 'blade']

// enum list of all crimes to avoid "magic string" problems
export const Crimes = {
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
	none: "none"
};

// array of all crimes (allows iteration)
export const CrimesArr = [
	Crimes.shoplift,
	Crimes.rob,
	Crimes.mug,
	Crimes.larceny,
	Crimes.dealDrugs,
	Crimes.bondForgery,
	Crimes.traffickIllegalArms,
	Crimes.homicide,
	Crimes.grandTheftAuto,
	Crimes.kidnap,
	Crimes.assassination,
	Crimes.heist
];


// ----------    WARNING: SPOILERS BELOW      --------------





// enum list of factions to avoid "magic string" problems
export const Factions = {
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

// array of all factions (allows iteration)
export const FactionsArr = [
	// hacking
	Factions.csec,
	Factions.nitesec,
	Factions.blackHand,
	Factions.bitrunners,
	// hacknet
	Factions.netburners,
	// location
	Factions.sector12,
	Factions.tian,
	Factions.chongqing,
	Factions.newTokyo,
	Factions.ishima,
	Factions.aevum,
	Factions.volhaven,
	// corporations
	Factions.ecorp,
	Factions.megacorp,
	Factions.kuaiGong,
	Factions.fourSigma,
	Factions.nwo,
	Factions.blade,
	Factions.omnitek,
	Factions.bachman,
	Factions.clarke,
	Factions.fulcrum,
	// criminal
	Factions.slumSnakes,
	Factions.tetrads,
	Factions.silhouette,
	Factions.speakers,
	Factions.darkArmy,
	Factions.syndicate,
	// endgame
	Factions.covenant,
	Factions.daedalus,
	Factions.illuminati,
	// special
	Factions.bladeburners,
]