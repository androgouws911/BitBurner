import { Services, Handler } from 'scripts/data/file_list.js';
const home = "home";
const TEN_SECONDS = 10000;

/** @param {NS} ns */
export async function main(ns) {
    debugger;
    disableLogs(ns);
    let printCounter = 0;
    while (isEarlyGame(ns)){
        if (printCounter < 1){
            printCounter = 1;
            ns.printf("Early game");
        }

        runScript(ns, Services.EarlyHack);

        let homeGB = ns.getServerMaxRam(home);
        if (homeGB > 16){
            let purchasedServers = ns.getPurchasedServers();
            if (purchasedServers.length < 25 || !ns.isRunning(Services.UpgradeServer)){
                runScript(ns, Services.PurchaseServer);
            }

            runScript(ns, Services.HackNet);
        }

        if (homeGB > 256){
        
            runScript(ns, Handler.TorHandler);
            runScript(ns, Handler.AutoBackdoor);
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
    if (homeGB < 2000)
        return true;

    let hasFormulas = ns.fileExists('Formulas.exe');
    if (!hasFormulas)
        return true;

    let pServers = ns.getPurchasedServers();
    if (pServers.length < 25)
        return true;

    let lowestGB = getMinPurchasedRam(ns, pServers);
    if (lowestGB < 1000)
        return true;

    let playerLevel = ns.getHackingLevel();
    if (playerLevel < 100)
        return true;

    return false;
}

function getMinPurchasedRam(ns, serverNames) {
    if (serverNames.length < 1) {
        return null;
    }

    let serverRams = [];
    serverNames.forEach((x) => serverRams.push(ns.getServerMaxRam(x)));

    return serverRams.reduce((lowest, current) => {
        
        if (current < lowest) {
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