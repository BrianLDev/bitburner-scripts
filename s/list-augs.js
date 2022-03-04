/** @param {NS} ns **/
import { FormatMoney } from "helper-functions.js"

export async function main(ns) {
	// NOTE: this requires the singularity API
	// TODO: Separate into 2 sections: can buy, can't buy
	// TODO: fix some installed augs still showing up (Social Negotiation Assistant (S.N.A))
	// TODO: include Neuroflux Governor even if purchased since it has multiple levels

	let augs = GetAugs(ns, true);

	ns.tprint(`--------------------  AUGMENTATIONS --------------------`);
	ns.tprint(`${"NAME".padEnd(50)}${"PRICE".padEnd(12)}${"FACTION".padEnd(18)}` +
		`${"REP REQ".padEnd(10)}${"STATS".padEnd(10)}`)
	augs.forEach(aug => {
		let name = (aug.canBuy ? '✅' : '❌') + aug.name;
		let money = (aug.moneyOK ? '✅' : '❌') + FormatMoney(aug.price) ;
		let rep = (aug.repOK ? '✅' : '❌') + aug.repReq;
		ns.tprint(`${name.padEnd(50)}${money.padEnd(12)}` + 
			`${aug.factions[0].padEnd(18)}` +
			`${rep.padEnd(10)}` +
			`${aug.stats[0]}`);
	});

}

export function GetAugs(ns, excludeOwned=false) {
	// NOTE: this requires the singularity API
	// TODO: Add bool prereqOK (check that all prereq's met)
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
				// TODO: check if rep > repreq and update repOK, canBuy
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
				aug.prereq = ns.getAugmentationPrereq(augName);

				if (excludeOwned && aug.isOwned)
					return;	// skip (return == continue in forEach loops)
				else
					augs.push(aug);
			}
		})
	}
	// add some useful bools to determine if player can buy
	augs.forEach(aug => {
		aug.moneyOK = player.money >= aug.price;
		// sort factions by maxrep
		aug.factions.sort((a, b) => (ns.getFactionRep(a) < ns.getFactionRep(b)) ? 1 : -1)
		aug.repOK = ns.getFactionRep(aug.factions[0]) >= aug.repReq;
		// aug.prereqOK = TODO
		aug.canBuy = (aug.moneyOK && aug.repOK);	// TODO: add rereqOK
	});
	// sort augs by price
	augs.sort((a,b) => a.price < b.price ? 1 : -1);
	return augs;
}