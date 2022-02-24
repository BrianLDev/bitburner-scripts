/** @param {NS} ns **/
import { FormatMoney } from "helper-functions.js"

export async function main(ns) {
	// NOTE: this requires the singularity API

	let augs = GetAugs(ns, true);

	ns.tprint(`--------------------  AUGMENTATIONS --------------------`);
	ns.tprint(`${"NAME".padEnd(50)}${"PRICE".padEnd(12)}${"FACTIONS".padEnd(18)}${"STATS".padEnd(10)}`)
	augs.forEach(aug => {
		ns.tprint(`${aug.name.padEnd(50)}${FormatMoney(aug.price).padEnd(12)}` + 
			`${aug.factions[0].padEnd(18)}` +
			`${aug.stats[0]}`);
	});

}

export function GetAugs(ns, excludeOwned=false) {
	// NOTE: this requires the singularity API
	let player = ns.getPlayer();
	let ownedAugs = ns.getOwnedAugmentations(true);	// true = includes purchased but not yet installed augs
	let augs = [];
	for (let i=0; i<player.factions.length; i++) {
		let faction = player.factions[i];
		let tempAugs = ns.getAugmentationsFromFaction(faction);
		tempAugs.forEach(augName => {
			// first check if this aug is already on the list of augs, and add faction if it is
			let foundAug = augs.find(aug => aug.name == augName);
			if (foundAug != undefined) {
				foundAug.factions.push(faction);
			}
			// otherwise get new aug stats and add to list
			else {
				let aug = {};
				aug.name = augName;
				aug.factions = [];
				aug.factions.push(faction);
				aug.isOwned = (ownedAugs.indexOf(augName) > 0) ? true : false;
				aug.stats = Object.entries(ns.getAugmentationStats(augName));
				if (!aug.stats || aug.stats == undefined || aug.stats == [])
					aug.stats = [["n/a", 0]];
				aug.price = ns.getAugmentationPrice(augName);
				aug.repReq = ns.getAugmentationRepReq(augName);
				aug.preReq = ns.getAugmentationPrereq(augName);

				if (excludeOwned && aug.isOwned)
					return;	// skip (return == continue in forEach loops)
				else
					augs.push(aug);
			}
		})
	}
	augs.sort((a,b) => a.price < b.price ? 1 : -1);
	return augs;
}