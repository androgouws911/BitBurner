import { filteredCrawl } from "scripts/handler/server_crawl";
import { Action } from "scripts/data/file_list";
const home = "home";
let hackRam = 0;
/** @param {NS} ns */
export async function main(ns) {
    hackRam = ns.getScriptRam(Action.EarlyHack);

    while (true){
        serverList = getFilteredList(ns);
        await prepServers(ns, serverList);
        await ns.sleep(10000);
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
        
        if (ns.hasRootAccess(server))
            continue;
        
        if (ns.getServerMaxRam(server) < hackRam)
            continue;
        
        if (ns.fileExists(Action.EarlyHack, server))
            continue;

        if (ns.getServerMaxMoney(server) < 1)
            continue;

        ns.scp(Action.EarlyHack, server, home);
        await ns.sleep(1000);
        let maxThreads = Math.floor(ns.getServerMaxRam(server) / hackRam);
        ns.exec(Action.EarlyHack, server, maxThreads, [server]);
    }
}