/** @param {NS} ns **/
import * as c from "constants.js"
import { Vprint } from "helper-functions.js"

// REQUIRES WAREHOUSE AND OFFICE API'S TO WORK

export async function main(ns) {
	let industryType = ns.args[0];
	let divisionName = ns.args[1];	// TODO: AUTOMATE INDUSTRY NAMING WITH AN ENUM (CONST OBJ)
	let hireCount = ns.args[2];
	let verbose = true;				// TODO: MAKE THIS AN ARG

	const corp = ns.corporation;
	const hireFile = 'corp/hire.js'
	let corpData = corp.getCorporation();

	let industries = Object.values(c.CorpIndustry)
	if (industries.find(ind => ind === industryType) === undefined) {
		Vprint(ns, true, `ERROR: Industry type from arg[0]not found in list of industry types. Exiting...`);
		ns.exit();
	}
	if (corpData.divisions.find(div => div.type === industryType) !== undefined) {
		Vprint(ns, true, `ERROR: Already expanded into ${industryType}, can't expand any more!  Exiting...`);
		ns.exit();
	}

	if (ns.getServerMoneyAvailable('home') > corp.getExpandIndustryCost(industryType)) {
		Vprint(ns, verbose, `Expanding corp into ${industryType} industry, named ${divisionName}`);
		corp.expandIndustry(industryType, divisionName)

		let cityCost = corp.getExpandCityCost();
		let warehouseCost = corp.getPurchaseWarehouseCost();

		let cities = Object.values(c.City);
		for (let city of cities) {
			// expand into city
			if (ns.getServerMoneyAvailable('home') > cityCost) {
				Vprint(ns, verbose, `Expanding ${divisionName} into ${city} city...`);
				corp.expandCity(divisionName, city);

				// buy warehouse
				if (ns.getServerMoneyAvailable('home') > warehouseCost && !corp.hasWarehouse(divisionName, city)) {
					Vprint(ns, verbose, `Buying warehouse for ${divisionName} in ${city}...`);
					corp.purchaseWarehouse(divisionName, city);
				}
			}
		}
		// hire employees (need to expand into all cities first)
		if (hireCount === undefined || hireCount === null || hireCount === NaN || hireCount < 1)
			hireCount = 3;
		Vprint(ns, verbose, `Hiring ${hireCount} employees for ${divisionName} in all cities...`);
		ns.exec(hireFile, 'home', 1, divisionName, hireCount);		

	}

}