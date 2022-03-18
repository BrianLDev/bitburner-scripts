/** @param {NS} ns **/
export async function main(ns) {
	// KEEPING THIS SUPER SIMPLE FOR QUICKSTART, TO BE EXPANDED ON IN THE FUTURE
	// TODO: AUTOMATE ALL OF THE THINGS!

	const bb = ns.bladeburner;

	// 1) BEFORE JOINING BLADEBURNER
	if (bb.getStamina == null || bb.getStamina <= 0) {
		// TODO: BUILD UP STATS TO 100 THEN JOIN
	}
	// 2) AFTER JOINING BLADEBURNER
	else {
		bb.startAction("General", "Training");
		// TODO: AUTOMATE ALL OF THE THINGS!
	}
}