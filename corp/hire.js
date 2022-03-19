/** @param {NS} ns **/
import * as c from "constants.js";
import { Vprint, FormatMoney } from "helper-functions.js";

export async function main(ns) {
	ns.disableLog("ALL");
	
	let divisionName = ns.args[0];
	let hireCount = ns.args[1];
	let verbose = ns.args[2];
	verbose = (verbose == true || verbose == "true") ? true : false;

	const corp = ns.corporation;
	let corpData = corp.getCorporation();
	let divisionData = corp.getDivision(divisionName)

	if (!divisionData) {
		ns.tprint("ERROR: incorrect division name specified in arg[0].  Exiting...");
		ns.exit();
	}
	if (hireCount == null || hireCount <= 0) {
		ns.tprint("ERROR: need to specify num employees > 0 in arg[1].  Exiting...");
		ns.exit();
	}


	Vprint(ns, true, `Beginning hiring process for ${divisionName}.  Please be patient as this can take a while to run depending on hire count.`);
	let citiesArr = Object.values(c.City);	// convert City enum to array for iteration

	// 1) Hire employees
	for (let i=0; i<hireCount; i++) {
		for (const cityName of citiesArr) {
			// make sure corp expanded into city first
			let division = corpData.divisions.find(div => div.type === divisionData.type)
			if (division.cities.find(city => city === cityName) === undefined) {
				Vprint(ns, verbose, `${divisionName} has not expanded into ${cityName}, skipping to next city...`);
				continue;
			}

			// get office data
			let office = corp.getOffice(divisionName, cityName);
			if (office !== undefined && office != null) {
				Vprint(ns, verbose, `Hiring employee ${i+1} of ${hireCount} for ${divisionName} in ${cityName}`);					
				// expand size if needed
				if (office.employees.length == office.size) {
					let upgCost = corp.getOfficeSizeUpgradeCost(divisionName, cityName, 1);
					let moneyAvailable = corp.getCorporation().funds;
					if (moneyAvailable < upgCost){
						ns.tprint(`ERROR: Not enough money to upgrade office size for ${divisionName} in ${cityName}: ${FormatMoney(moneyAvailable)} available vs ${FormatMoney(upgCost)} cost.  Exiting...`);
						await ns.exit();
					}
					else
						corp.upgradeOfficeSize(divisionName, cityName, 1);
				}
				// hire employee and assign to training
				// sometimes corp.hireEmployee fails, so loop until it hires someone
				let empl = undefined;
				while (empl === undefined) {
					empl = corp.hireEmployee(divisionName, cityName);
					await ns.sleep(500);
				}
				await corp.assignJob(divisionName, cityName, empl.name, 'Training');
			}
		}
	}
	// 2) Assign jobs
	for (const cityName of citiesArr) {
		// make sure corp expanded into city first
		let division = corpData.divisions.find(div => div.type === divisionData.type)
		if (division.cities.find(city => city === cityName) === undefined) {
			Vprint(ns, verbose, `${divisionName} has not expanded into ${cityName}, skipping to next city...`);
			continue;
		}
		// get office data
		let office = corp.getOffice(divisionName, cityName);
		if (office !== undefined && office != null) {
			// get all employees that are in training or unassigned
			const emplTraining = GetEmployeesDoingJob(ns, divisionName, cityName, 'Training');
			const emplUnassigned = GetEmployeesDoingJob(ns, divisionName, cityName, 'Unassigned');
			const emplToAssign = emplTraining.concat(emplUnassigned);
			Vprint(ns, verbose, `Assigning jobs to ${emplTraining.length} in training and ${emplUnassigned.length} unassigned for ${divisionName} in ${cityName}`);
			for (const empl of emplToAssign) {
				// determine next job to assign
				let job = '';
				office.jobCount = GetEmployeeJobCount(ns, divisionName, cityName);
				if (office.jobCount["Research & Development"] < 1)
					job = "Research & Development";
				else if (office.jobCount.Management < office.jobCount.Business)
					job = 'Management';
				else if (office.jobCount.Business < office.jobCount.Engineer)
					job = 'Business';
				else if (office.jobCount.Engineer < office.jobCount.Operations)
					job = 'Engineer';
				else
					job = 'Operations';	// default to operations

				// assign employee to job
				if (empl !== undefined && empl !== null)
					await corp.assignJob(divisionName, cityName, empl.name, job);
			}
		}
	}
	Vprint(ns, true, `Done!`);
}

export function GetEmployeeJobCount(ns, divisionName, cityName) {
	const corp = ns.corporation;
	let office = corp.getOffice(divisionName, cityName);
	let jobCount = {
		// using the same format as "EmployeeJobs" even though it uses magic strings...
		Operations: 0,
		Engineer: 0,
		Business: 0,
		Management: 0,
		"Research & Development": 0,
		Training: 0,
		Unassigned: 0
	}
	if (office !== undefined && office !== null) {
		for (const employeeName of office.employees) {
			let employee = corp.getEmployee(divisionName, cityName, employeeName);
			jobCount[employee.pos] += 1;					
		}
	}
	return jobCount;
}

export function GetEmployeesDoingJob(ns, divisionName, cityName, jobName) {
	const corp = ns.corporation;
	let office = corp.getOffice(divisionName, cityName);
	let jobEmployees = [];

	if (office !== undefined && office !== null) {
		for (const employeeName of office.employees) {
			let employee = corp.getEmployee(divisionName, cityName, employeeName);
			if (employee.pos === jobName)
				jobEmployees.push(employee);					
		}
	}
	return jobEmployees;
}