import { listIsBlank, maxPortsOpen } from 'scripts/handler/general_handler.js';
import { DynamicServerData } from 'scripts/models/dynamic_server_model.js';
import { SCRIPT_RAM } from 'scripts/handler/general_handler.js';
import { _port_list } from 'scripts/enums/ports.js';
import { Action } from 'scripts/data/file_list.js';
import { crawl } from 'scripts/handler/server_crawl';

const home = "home";

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    let dynamicServers = getDynamicData(ns);   
    let unRooted = dynamicServers.filter((x) => !x.RootStatus 
        && ns.getServerNumPortsRequired(x.ServerName) <= maxPortsOpen(ns));
    if (!listIsBlank(unRooted))
        await root(ns, unRooted);
    
    let unCopied = dynamicServers.filter((x) => !x.FilesCopied && x.RootStatus);
    if (!listIsBlank(unCopied))
        await fileCopy(ns, unCopied);
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("getServerRequiredHackingLevel");
    ns.disableLog("getServerNumPortsRequired");
    ns.disableLog("serverExists");
    ns.disableLog("run");
}
/** @param {NS} ns */
function getDynamicData(ns){
    const playerLevel = ns.getHackingLevel();
    let dynamicDataList = [];
    let serverNames = crawl(ns);

    serverNames = serverNames.filter(x =>
        x !== home && playerLevel >= ns.getServerRequiredHackingLevel(x) && ns.serverExists(x)
    );

    serverNames.forEach((x) => {
        let maxThreads = Math.floor(ns.getServerMaxRam(x) / SCRIPT_RAM);
        let filesCopied = ns.fileExists(Action.Weak, x);
        let rootStatus = ns.hasRootAccess(x);
        let dynamicData = new DynamicServerData(x, maxThreads, filesCopied, rootStatus);

        dynamicDataList.push(dynamicData);
    });

    return dynamicDataList;
}
/** @param {NS} ns */
async function root(ns, dataList) {
    for (let i = 0; i < dataList.length; i++) {
        let x = dataList[i];
        ns.run(Action.Root, 1, ...[x.ServerName]);
    }
}
/** @param {NS} ns */
async function fileCopy(ns, dataList) {
    for (let i = 0; i < dataList.length; i++) {
        let x = dataList[i];
        let serverName = x.ServerName;
        ns.run(Action.Copy, 1, ...[serverName]);
    }
}