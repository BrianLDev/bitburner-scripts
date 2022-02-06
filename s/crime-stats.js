/** @param {NS} ns **/
export async function main(ns) {

	ns.tprint("CRIMMESSSSSS");
	ns.tprint("------------------------------------------------------------");
	
	for (let i=0; i<crimesArr.length; i++) {
		let crimeStats = ns.getCrimeStats(crimesArr[i]);
		let profit = crimeStats.money;
		let duration = crimeStats.time;
		let chance = ns.getCrimeChance(crimesArr[i]).toFixed(2);	// TODO: UNCOMMENT THIS WHEN SINGULARITY USES LESS RAM
		// let chance = 1;
		let roi = (profit / duration * chance).toFixed(2);
		// TODO: IMPROVE FORMATTING
		ns.tprint(crimesArr[i] + ":\t\t$" + profit + " / " + duration + " * " + chance + " =\t" + roi + " ROI");
	}
}

// enum of all crimes to avoid string recognition errors
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

// array of all crimes for easy iteration
export const crimesArr = [
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