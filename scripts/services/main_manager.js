import {clearNumPort, readFromPort} from 'scripts/handler/port_handler.js';
import { _port_list } from 'scripts/enums/ports.js';
import { Services } from 'scripts/data/file_list.js';
import { _timeout } from 'scripts/enums/timeout.js';

const serviceTasks = [//TODO: PurchaseService (DarkWeb / Augments / RAM / Cores / etc) - .singlularity needed
    { name: "KillServers", waitBusy: true },
    { name: "KillHome", waitBusy: true },
    { name: "HackHandler", waitBusy: true },
    { name: "WGW", waitBusy: false },
    { name: "HWGW", waitBusy: false },
    { name: "HWGW2", waitBusy: false },
    { name: "HWGW3", waitBusy: false },
    { name: "HWGW4", waitBusy: false },
    { name: "HWGW5", waitBusy: false },
    { name: "HackNet", waitBusy: false },
    { name: "PurchaseServer", waitBusy: false },
    { name: "Contract", waitBusy: false }
];
/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    clearNumPort(ns, _port_list.MAIN_SERVICE_PORT);

    for (const task of serviceTasks) {
        await executeServiceTask(ns, task);
    }
}

async function executeServiceTask(ns, task) {
    const { name, waitBusy: waitBusy } = task;
    await runScript(ns, Services[name]);
    if (waitBusy){
        ns.printf(`Waiting on response from: ${name}`);
        const result = await getPortResponse(ns);
        if (!result) 
            throw new Error(`${name} failed`);
    }
}
/** @param {NS} ns */
async function runScript(ns, scriptFile) {
    if (!ns.isRunning(scriptFile))
        ns.run(scriptFile, 1);
}

async function getPortResponse(ns){
    let response = null;
    while (response == null){
        response = await readFromPort(ns, _port_list.MAIN_SERVICE_PORT);
        if (response == null)
            await ns.sleep(_timeout.SECONDS_HALF);
    }
    return response;
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("sleep");
    ns.disableLog("run");
    ns.disableLog("isRunning");
    ns.disableLog("getHackingLevel");
    ns.disableLog("getServerMaxRam");
}