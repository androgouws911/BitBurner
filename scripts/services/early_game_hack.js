import { filteredCrawl } from "scripts/handler/server_crawl";
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
        let serverList = getFilteredList(ns);
        await prepServers(ns, serverList);
        await ns.sleep(TEN_SECONDS);
    }
}

function getFilteredList(ns){
    let purchasedServers = ns.getPurchasedServers();
    let filterList = [home];
    purchasedServers.forEach((x) => {
        let index = filterList.findIndex(y => y === x);
        if (index === -1)
            filterList.push(x);
    });

    let serverList = filteredCrawl(ns, filterList);
    return serverList;
}

async function prepServers(ns, serverList){
    for (let server of serverList){
        if (!ns.serverExists(server))
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
        if (!ns.isRunning(Action.EarlyHack, server, ...[server])){
            ns.exec(Action.EarlyHack, server, maxThreads, ...[server]);
            ns.printf(`${server} - Rooted and working for us`);
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