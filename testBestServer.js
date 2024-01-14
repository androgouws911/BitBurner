import { getHackTarget } from "scripts/handler/get_best_hack_server";

/** @param {NS} ns */
export async function main(ns) {
    await ns.sleep(5000);    
    let target = await getHackTarget(ns);
    ns.tprintf(target);
}