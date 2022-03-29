/** @param {NS} ns **/
export async function main(ns) {
	let x = ns.args[0];
	let y = ns.args[1];

	if (x === NaN || y === NaN) {
		ns.tprint(`ERROR: need to specify x and y location of fragment in args`);
		ns.exit();
	}
	else {
		await ns.stanek.chargeFragment(x, y);
	}
	

}