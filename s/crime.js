/** @param {NS} ns **/
export async function main(ns) {
	let crime = ns.args[0];
	if (crime == null || crime == "")
		crime = Crimes.homicide;
	
	while(true) {
		let runtime = ns.commitCrime(crime);
		await ns.sleep(runtime * 1.05);	// note: runtime not always accurate so add a little cushion
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