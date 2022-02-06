/** @param {NS} ns **/
export async function main(ns) {

	let serverToDelete = ns.args[0];
	if (!serverToDelete || serverToDelete == '')
		ns.tprint("Error: need to specify server name to delete in args");
	else
		DeletePurchServer(ns, serverToDelete);
}

export function DeletePurchServer(ns, serverToDelete) {
	let purchServers = ns.getPurchasedServers();

	for (let i = 0; i < purchServers.length; i++) {
		if (purchServers[i] === serverToDelete) {
			ns.killall(serverToDelete);
			if (!ns.deleteServer(serverToDelete)) {
				ns.tprint("Failed attempting to delete " + serverToDelete);
			} else {
				ns.tprint("Successfully deleted " + serverToDelete);
			}
		}
	}
}