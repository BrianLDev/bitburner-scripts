/** @param {NS} ns */
export async function main(ns) {
	// This juices up the Intelligence stat by traveling a lot
	// Make sure you have a LOT of money available before doing this
	// Note: the int-softReset script is much better for juicing Int.  It's free and faster
	
	while(true) {
		ns.singularity.travelToCity('Chongqing');
		ns.singularity.travelToCity('New Tokyo');
		ns.singularity.travelToCity('Ishima');
		ns.singularity.travelToCity('Aevum');
		ns.singularity.travelToCity('Sector-12');
		await ns.sleep(1);
	}
}