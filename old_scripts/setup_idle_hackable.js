import {bestServerArgs} from 'old_scripts/get_best_hackable_server.js';

/** @param {NS} ns */
export async function main(ns) {
    var scriptArgs = await bestServerArgs(ns);
    var scriptPID = ns.run("old_scripts/ideal_manage.js", 1, ...scriptArgs);
    return scriptPID;
}