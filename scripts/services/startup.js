import { Services } from 'scripts/data/file_list.js';
const home = "home";
const TEN_SECONDS = 10000;

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    let printCounter = 0;
    while (isEarlyGame(ns)){
        if (printCounter < 1){
            printCounter = 1;
            ns.printf("Early game");
        }

        runScript(ns, Services.EarlyHack);

        let homeGB = ns.getServerMaxRam(home);
        if (homeGB > 16)
            runScript(ns, Services.HackNet);
        if (homeGB > 64){
            if (!ns.isRunning(Services.UpgradeServer))
                runScript(ns, Services.PurchaseServer);
        }
            
        await ns.sleep(TEN_SECONDS);
    }
    ns.printf("Mid/Late game entered");
    runScript(ns, Services.Manager);
}

/** @param {NS} ns */
function runScript(ns, scriptFile) {
    if (!ns.isRunning(scriptFile, home))
        ns.run(scriptFile, 1);
}

function isEarlyGame (ns){
    let homeGB = ns.getServerMaxRam(home);
    if (homeGB < 8000)
        return true;

    let hasFormulas = ns.fileExists('Formulas.exe');
    if (!hasFormulas)
        return true;

    let pServers = ns.getPurchasedServers();
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

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("scan");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("sleep");
    ns.disableLog("exec");
    ns.disableLog("run");
}