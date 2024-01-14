import { Data, Action, Handler } from 'scripts/data/file_list.js';
import { readDataFromFile } from 'scripts/handler/data_file_handler.js';
import { listIsBlank, waitWhileBusy, maxPortsOpen } from 'scripts/handler/general_handler.js';
import { writeToPort } from 'scripts/handler/port_handler.js';
import { _port_list } from 'scripts/enums/ports.js';

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

    await writeToPort(ns, _port_list.MAIN_SERVICE_PORT, true);
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
    let allServers = readDataFromFile(Data.Dynamic, ns);

    allServers = allServers.filter(x =>
        x.ServerName !== home 
        && playerLevel >= ns.getServerRequiredHackingLevel(x.ServerName) 
        && ns.serverExists(x.ServerName)
    );

    if (listIsBlank(allServers)) {
        return [];
    }

    return allServers;
}
/** @param {NS} ns */
async function root(ns, dataList) {
    for (let i = 0; i < dataList.length; i++) {
        let x = dataList[i];
        ns.run(Action.Root, 1, ...[x.ServerName]);
        await waitWhileBusy(Action.Root, ns);
    }

    await updateDynamicData(ns);
    return;
}
/** @param {NS} ns */
async function fileCopy(ns, dataList) {
    for (let i = 0; i < dataList.length; i++) {
        let x = dataList[i];
        let serverName = x.ServerName;
        ns.run(Action.Copy, 1, ...[serverName]);
        await waitWhileBusy(Action.Copy, ns);
    }

    await updateDynamicData(ns);
    return;
}

/** @param {NS} ns */
async function updateDynamicData(ns) {
    ns.run(Handler.GetDynamicData, 1);
    await waitWhileBusy(Handler.GetDynamicData, ns)
}