import { Services } from 'scripts/data/file_list.js';
const home = "home";

/** @param {NS} ns */
export async function main(ns) {
    for (const task of dataManagementTasks) {
        await executeDataTask(ns, task);
    }
    while (isEarlyGame(ns)){
        runScript(ns, Services.EarlyHack);
        runScript(ns, Services.HackNet);
        runScript(ns, Services.PurchaseServer);
    }

    runScript(ns, Services.Manager);
}

/** @param {NS} ns */
function runScript(ns, scriptFile) {
    if (!ns.isRunning(scriptFile, home))
        ns.run(scriptFile, 1);
}

function isEarlyGame (ns){
    let homeGB = ns.getServerMaxRam(home);
    if (homeGB < 64)
        return true;

    let hasFormulas = ns.fileExists('Formulas.exe');
    if (!hasFormulas)
        return true;

    let pServers = ns.getPurchasedSerers();
    if (pServers.length < 25)
        return true;

    let lowestGB = getMinPurchasedRam(pServers).MaxRAM;
    if (lowestGB < 64)
        return true;

    return false;
}

function getMinPurchasedRam(servers) {
    if (servers.length < 1) {
        return null;
    }

    return servers.reduce((lowest, current) => {
        if (current.MaxRAM < lowest.MaxRAM) {
            return current;
        }
        return lowest;
    });
}