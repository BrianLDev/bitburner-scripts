/** @param {NS} ns **/

export async function main(ns) {
	// KEEPING THIS SUPER SIMPLE FOR QUICKSTART, TO BE EXPANDED ON IN THE FUTURE
	// TODO: AUTOMATE ALL OF THE THINGS!
	
	// NOTE: SCRIPT AUTOMATION OF BB IS VERY TEDIOUS AND NOT EASY TO GENERALIZE
	// THE BUILT IN AUTOMATION IS FAR LESS TEDIOUS AND WORKS FIND SO STICK TO THAT FOR NOW

	const bb = ns.bladeburner;
	let sleeptime = 2000;

	// 1) BEFORE JOINING BLADEBURNER
	if (bb.getStamina == null || bb.getStamina <= 0) {
		// TODO: BUILD UP COMBAT STATS TO 100 THEN JOIN
	}
	// 2) AFTER JOINING BLADEBURNER
	else {
		bb.startAction(BBType.G, BBAction.G.Training);

		// TODO: AUTOMATE ALL THE THINGS!
	}
}

// function GetActionInfo(ns) {
// 	const bb = ns.bladeburner;
// 	let actions = {};
// 	let g = {}
// 	for (let aName of Object.values(BBAction.G)) {
// 		let a = {};
// 		a.level = bb.getActionCurrentLevel(BBType.G, aName);
// 		a.repGain = bb.getActionRepGain(BBType.G, aName, a.level);
// 		a.time = bb.getActionTime(BBType.G, aName);
// 		a.chance = bb.getActionEstimatedSuccessChance(BBType.G, aName);
// 		a.remain = bb.getActionCountRemaining(BBType.G, aName)

// 		g[aName] = a;
// 	}
// 	actions.g = g;

// 	let c = {}
// 	for (let aName of Object.values(BBAction.C)) {
// 		let a = {};
// 		a.level = bb.getActionCurrentLevel(BBType.C, aName);
// 		a.repGain = bb.getActionRepGain(BBType.C, aName, a.level);
// 		a.time = bb.getActionTime(BBType.C, aName);
// 		a.chance = bb.getActionEstimatedSuccessChance(BBType.C, aName);
// 		a.remain = bb.getActionCountRemaining(BBType.C, aName)

// 		c[aName] = a;
// 	}
// 	actions.c = c;

// 	let o = {}
// 	for (let aName of Object.values(BBAction.O)) {
// 		let a = {};
// 		a.level = bb.getActionCurrentLevel(BBType.O, aName);
// 		a.repGain = bb.getActionRepGain(BBType.O, aName, a.level);
// 		a.time = bb.getActionTime(BBType.O, aName);
// 		a.chance = bb.getActionEstimatedSuccessChance(BBType.O, aName);
// 		a.remain = bb.getActionCountRemaining(BBType.O, aName)

// 		o[aName] = a;
// 	}
// 	actions.o = o;

// 	ns.tprint(g);
// 	ns.tprint(c);
// 	ns.tprint(o);
// 	ns.exit();
	
// 	return actions;
// }

const BBType = {
	G: "General",
	C: "Contracts",
	O: "Operations",
	B: "BlackOps",
	S: "Skills"
}

const BBAction = {
	G: {
		Training: "Training",
		Field_Analysis: "Field Analysis",
		Recruitment: "Recruitment",
		Diplomacy: "Diplomacy",
		Hyp_Regen: "Hyperbolic Regeneration Chamber",
		Incite_Violance: "Incite Violence"
	},
	C: {
		Tracking: "Tracking",
		Bounty_Hunter: "Bounty Hunter",
		Retirement: "Retirement"
	},
	O: {
		Investigation: "Investigation",
		Undercover: "Undercover Operation",
		Sting: "Sting Operation",
		Raid: "Raid",
		Stealth_Retirement: "Stealth Retirement Operation",
		Assassination: "Assassination"
	},
	B: {
		Typhoon: "Operation Typhoon",
		// TODO: ADD THESE LATER OR SEE IF THEY CAN BE LOOKED UP DYNAMICALLY
	},
	S: {
		Blades_Intuition: "Blade's Intuition",
		Cloak: "Cloak",
		Short_Circuit: "Short-Circuit",
		Digital_Observer: "Digital Observer",
		Tracer: "Tracer",
		Overclock: "Overclock",
		Reaper: "Reaper",
		Evasive_System: "Evasive System",
		Datamancer: "Datamancer",
		Cybers_Edge: "Cyber's Edge",
		Hands_of_Midas: "Hands of Midas",
		Hyperdrive: "Hyperdrive",
	}
}