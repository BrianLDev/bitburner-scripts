/** @param {NS} ns **/
import { FormatMoney } from "helper-functions.js"

export async function main(ns) {
	// NOTE: 2 GB=$110k, 4=$220k, 8=$440k, 16=$880k, 32=$1.760m, 64GB=$3.520m, 128=$7.040m, 256=$14.080, 
	// 512 GB=$28.16m, 1024=$56.32m, 2048=$112.64, 4096=$225.28, 8192=$450.56, 16384=$901.12, 32768=$1802.24, 
	// 65536 GB=$3604.48, 131072=$7208.96, 262144=$14417.92, 524288=$28835.84, 1048576=$??
	let ramTarget = 64;	// in GB.  Enter this in manually for now

	// TODO: CREATE A FUNCTION THAT CALCULATES SERVER RAM TARGET BASED ON RAM AT HOME AND TOTAL MONEY AVAILABLE/MADE


	// EXECUTE
	let moneyAvailable = ns.getServerMoneyAvailable("home");
	let pservCost = ns.getPurchasedServerCost(ramTarget);
	let serverLimitCount = ns.getPurchasedServerLimit();
	let canAffordCount = Math.floor(moneyAvailable / pservCost);
	let activeCount = 0, toReplaceCount = 0, purchasedCount = 0, replacedCount = 0;
	let pservList = [];
	let serversToReplace = [];
	CheckServers();
	let maxNewCount = Math.min(canAffordCount, serverLimitCount - pservList.length);

	ns.tprint("--------------");
	ns.tprint("Total servers owned with " + ramTarget + " GB ram: " + activeCount);
	ns.tprint("Total servers owned with less than " + ramTarget + " GB ram: " + serversToReplace.length);
	ns.tprint("Cost of a new server with " + ramTarget + " GB ram: " + FormatMoney(pservCost, 3) );
	ns.tprint("Can afford to buy/replace " + canAffordCount + " servers.");

	// New servers
	await ManageNewServers();

	// Replace old servers
	await ManagePurchServers();

	// Wrap up messages
	if (purchasedCount > 0) {
		ns.tprint("--------------");
		ns.tprint("DONE!");
		ns.tprint("Purchased " + purchasedCount + " total servers (" + 
			(purchasedCount - replacedCount) + " new / " + replacedCount + " replaced).")
		ns.tprint("Total cost: " + purchasedCount + " * " + FormatMoney(pservCost, 3) + " = " + 
			FormatMoney(purchasedCount * pservCost, 3) );
	} else {
		ns.tprint("--------------");
		ns.tprint("Done - no servers replaced at the " + ramTarget + " GB ram target.");
		ns.tprint("Edit the purch-servers.js script and change the ramTarget if needed.");
	}


	// FUNCTIONS
	function CheckServers() {
		pservList = ns.getPurchasedServers();
		// update counts of active servers at current RAM amt vs servers with less RAM to replace
		activeCount = 0, toReplaceCount = 0;
		for (let i = 0; i < pservList.length; i++) {
			let serverRam = ns.getServerMaxRam(pservList[i])
			if (serverRam < ramTarget) {
				serversToReplace.push(pservList[i]);
				toReplaceCount++;
			}
			if (serverRam === ramTarget)
				activeCount++;
		}
	}

	async function ManageNewServers() {
		if (maxNewCount > 0) {
			ns.tprint("Able to buy " + maxNewCount + " new servers out of " + 
				(serverLimitCount - pservList.length) + ".");
			ns.tprint("Total cost: " + FormatMoney(maxNewCount * pservCost, 3));
			if (await ns.prompt("Buy " + maxNewCount + " new servers?")) {
				for (let i=0; i<maxNewCount; i++) {
					if (PurchaseNewServer() ) {
						activeCount++;
						purchasedCount++;
					}
				}
			}
		}
	}

	function PurchaseNewServer() {
		let hostname = ns.purchaseServer("pserv-" + ramTarget.toString() + "-" + activeCount.toString(), ramTarget);
		ns.tprint("Purchased new server: " + hostname);
		return hostname;
	}

	async function ManagePurchServers() {
		moneyAvailable = ns.getServerMoneyAvailable("home");
		canAffordCount = Math.floor(moneyAvailable / pservCost);
		toReplaceCount = Math.min(canAffordCount, serversToReplace.length);
		
		if (toReplaceCount > 0) {
			ns.tprint("Total cost: " + FormatMoney(toReplaceCount * pservCost, 3));

			// Replace old servers with less RAM
			if (await ns.prompt("Replace old servers: " + toReplaceCount + "?")) {
				let serverToKill;
				for (let i = 0; i < toReplaceCount; i++) {
					serverToKill = serversToReplace.shift();	// kills the oldest one first
					ns.killall(serverToKill);
					if (!ns.deleteServer(serverToKill)) {
						ns.tprint("Failed attempting to delete " + serverToKill);
					}
					if (PurchaseNewServer() ) {
						activeCount++;
						purchasedCount++;
						replacedCount++;
					}
				}
			}
		}
	}

}