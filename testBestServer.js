import { getHackTarget } from "scripts/handler/get_best_hack_server";
import { Services, Handler } from 'scripts/data/file_list.js';

/** @param {NS} ns */
export async function main(ns) {
    ns.run(Handler.GetAllData, 1);
    await ns.sleep(1000);
    ns.run(Handler.GetStaticData, 1);
    await ns.sleep(1000);
    ns.run(Handler.GetDynamicData, 1);
    await ns.sleep(1000);
    ns.run(Services.PrepHackServers, 1);
    await ns.sleep(5000);    
    let target = getHackTarget(ns);
    ns.tprintf(target);
}