/** @param {NS} ns **/
import { GetAllServers, Vprint } from "helper-functions.js"
import * as c from "constants.js";

export async function main(ns) {
	let targets = ns.args[0];
	let verbose = ns.args[1];

	verbose = (verbose == "true" || verbose == true) ? true : false;	// defaults to false
	if (targets == null || targets == "")
		targets = PrimaryTargets;
	else if (targets == "all")
		targets = GetAllServers(ns);
	else if (targets == "corps" || targets == "megacorps" || targets == "corporations")
		targets = c.Corporations;
	else if (targets == "gyms")
		targets = c.Gyms;
	else if (targets == "universities" || targets == "unis" || targets == "uni")
		targets = c.Universities;
	else if (targets == "tech")
		targets = c.Tech;
	else if (targets == "sector12" || targets == "sector-12")
		targets = c.Sector12;
	else
		targets = PrimaryTargets;

	ns.tprint(`=============== BACKDOOR ===============`);
	let gotBackdoorAccess = [];
	gotBackdoorAccess = await BackdoorNestedServers(ns, targets, "home", "home", verbose);

	ns.connect("home");
	ns.tprint("DONE!");
	if (gotBackdoorAccess.length > 0)
		ns.tprint(`Got backdoor access on: ${gotBackdoorAccess}`);
	else
		ns.tprint(`No backdoor action this time.`);
}


export const PrimaryTargets = ['CSEC', 'avmnite-02h', 'I.I.I.I', 'run4theh111z', 'The-Cave'];


export async function BackdoorNestedServers(ns, targets=primaryTargets, parentName="home", grandparentName="home", verbose=true) {
	Vprint(ns, verbose, `~~ Checking out the backdoors nested inside ${parentName}`);
	let serversToBackdoor = ns.scan(parentName);
	serversToBackdoor = serversToBackdoor.filter(s => s != grandparentName);
	let gotBackdoorAccess = [];

	for (let i=0; i<serversToBackdoor.length; i++) {
		let so = ns.getServer(serversToBackdoor[i]);

		// Skip home, purchased servers, and grandparent
		if (so.hostname == "home" || so.purchasedByPlayer || so.hostname == grandparentName)
			continue;
		
		Vprint(ns, verbose, `~ Lookin at ${so.hostname}'s backdoor`);
		Vprint(ns, verbose, `- Attempting to connect from ${ns.getCurrentServer()} to: ${parentName}`);
		ns.connect(parentName);
		Vprint(ns, verbose, `- Attempting to connect from ${ns.getCurrentServer()} to: ${so.hostname}`);
		ns.connect(so.hostname);
		Vprint(ns, verbose, `Now connected to: ${ns.getCurrentServer()}`);

		// Run Backdoor
		let isTarget = targets.find(target => target == so.hostname);
		if (isTarget)
			Vprint(ns, verbose, `Target found: ${so.hostname}`);
		if (so.hasAdminRights && isTarget) {
			if (ns.getCurrentServer() != so.hostname)
				ns.tprint(`ERROR: not connected to ${so.hostname}, cannot backdoor.`)
			else if (so.backdoorInstalled)
				ns.tprint(`Backdoor already installed on: ${so.hostname}`);
			else {
				ns.tprint("Getting some backdoor action with " + so.hostname + ".");
				ns.tprint("... please be patient, it takes some time to get all up in there ...")
				try {
					await ns.installBackdoor();	// note: this is a singularity script
					gotBackdoorAccess.push(so.hostname);
				}
				catch (err) {
					ns.tprint("ERROR: " + err)
				}
			}
		}
		
		// Recursively backdoor nested servers
		let nestedServerNames = ns.scan(so.hostname);
		nestedServerNames = nestedServerNames.filter(s => s != parentName);		// remove parent
		nestedServerNames = nestedServerNames.filter(s => s != grandparentName);	// remove grandparent
		Vprint(ns, verbose, `${so.hostname}'s parent: ${parentName}, grandparent: ${grandparentName}, nested servers: ${nestedServerNames}`)
		if (nestedServerNames.length > 0) {
			Vprint(ns, verbose, `~~~ Going deeper, inside ${so.hostname}...`);
			gotBackdoorAccess = gotBackdoorAccess.concat(
				await BackdoorNestedServers(ns, targets, so.hostname, parentName, verbose)
			);
		}
		ns.connect(parentName);
		ns.connect(grandparentName);
	}
	return gotBackdoorAccess;
}