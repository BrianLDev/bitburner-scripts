/** @param {NS} ns */
export async function main(ns) {
	// This juices up the Intelligence stat by soft resetting a lot
	// Join as many factions (especially megacorp factions) first
	// Game will be locked in a loop until you reach 255 int, so make sure you are
	// prepared for that and do a save export first to be safe.

	const fileName = '/s/int-softReset.js';
	const player = ns.getPlayer();

	// join all available factions (megacorp factions on reset)
	await ns.sleep(1);
	let invites = ns.checkFactionInvitations();
	for (let invite of invites) {
		ns.joinFaction(invite);
	}

	// soft reset then immediately run this script again until 255 Int reached
	if (player.intelligence < 255) {		
		ns.softReset(fileName);
	}
}