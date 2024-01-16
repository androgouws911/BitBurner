import { crawl } from "scripts/handler/server_crawl";
import { Action } from "scripts/data/file_list";
const home = "home";
const TEN_SECONDS = 10000;
const ONE_SECOND = 1000;
const TENTH_SECOND = 100;
let hackRam = 0;

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    hackRam = ns.getScriptRam(Action.EarlyHack);

    while (true){
        let serverList = getServerList(ns);
        await prepServers(ns, serverList);
        await ns.sleep(TEN_SECONDS);
    }
}

function getServerList(ns){
    let serverList = crawl(ns);
    return serverList;
}

async function prepServers(ns, serverList){
    for (let server of serverList){
        if (!ns.serverExists(server))
            continue;

        let playerLevel = ns.getHackingLevel();
        let reqLevel = ns.getServerRequiredHackingLevel(server);
        if (reqLevel > playerLevel)
            continue;

        let maxRam = ns.getServerMaxRam(server);
        if (maxRam < hackRam)
            continue;
        
        let maxMoney = ns.getServerMaxMoney(server);
        if (!maxMoney  || maxMoney < 1)
            continue;

        let rooted = await attemptOpenRoot(ns, server);
        if (!rooted)
            continue;

        if (!ns.fileExists(Action.EarlyHack, server))         
            ns.printf(`Hack script copied to ${server}`);
        
        ns.scp(Action.EarlyHack, server, home);

        await ns.sleep(ONE_SECOND);

        let maxThreads = Math.floor(ns.getServerMaxRam(server) / hackRam);
        let purchasedServers = ns.getPurchasedServers();
        if (server === home || purchasedServers.includes(server)){
            if (playerLevel < 5)
                continue;

            if (server === home)
                maxThreads = Math.floor((ns.getServerMaxRam(home) - ns.getServerUsedRam(home)) / hackRam);
            let target = "sigma-cosmetics ";
            if (!ns.isRunning(Action.EarlyHack, server, ...[target])){
                ns.exec(Action.EarlyHack, server, maxThreads, ...[target]);
                ns.printf(`${server} working on ${target}`);
            }
        }
        else{
            if (!ns.isRunning(Action.EarlyHack, server, ...[server])){
                ns.exec(Action.EarlyHack, server, maxThreads, ...[server]);
                ns.printf(`${server} - Rooted and working for us`);
            }
        }
            
        await ns.sleep(TENTH_SECOND);
    }
}

async function attemptOpenRoot(ns, target){
    ns.run(Action.Root, 1, ...[target]);
    while (ns.isRunning(Action.Root, ...[target])){
        await ns.sleep(TENTH_SECOND);
    }

    return ns.hasRootAccess(target);
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("scan");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("sleep");
    ns.disableLog("exec");
    ns.disableLog("run");
    ns.disableLog("scp");
}