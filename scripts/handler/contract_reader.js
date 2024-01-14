import { listIsBlank } from 'scripts/handler/general_handler.js';
import { filteredCrawl } from 'scripts/handler/server_crawl.js';
import { _port_list} from 'scripts/enums/ports.js';
import { _timeout } from 'scripts/enums/timeout.js';

let serverList = [];
let crawl_filter = ["home"];

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    ns.clearPort(_port_list.CONTRACT_PORT);
    serverList = filteredCrawl(ns, crawl_filter);
    while (true) {
        let data = await getAllContracts(ns, serverList);
        if (listIsBlank(data))
            continue;

        await writeToPort(ns, _port_list.CONTRACT_PORT, data);
        data = [];
        await ns.sleep(_timeout.MINUTE_1);
    }
}

/** @param {NS} ns */
async function getAllContracts(ns, serverList) {
    let contractList = [];
    while (listIsBlank(contractList)) {
        serverList.forEach((x) => {
            let serverContracts = getContracts(ns, x);
            if (!listIsBlank(serverContracts)) {
                serverContracts.forEach((y) => {
                    contractList.push(y);
                });                
            }            
        });
        
        if (listIsBlank(contractList)){
            await ns.sleep(_timeout.SECONDS_10);
            continue;
        }

        return contractList;
    }
}
/** @param {NS} ns */
function getContracts(ns, server) {
    let contractList = [];
    let contracts = ns.ls(server, ".cct");
    
    if (listIsBlank(contracts))
        return null;
    
    contracts.forEach((x) => {
        contractList.push([server, x]);
    });
    
    if (!listIsBlank(contractList))
        return contractList;

    return null;
}

async function writeToPort(ns, portNum, writeData) {
    while(!ns.tryWritePort(portNum, JSON.stringify(writeData))){
        await ns.sleep(500);
    }
}

/** @params {NS} ns */
function disableLogs(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("tail");
    ns.disableLog("sleep");
    ns.disableLog("run");
    ns.disableLog("scan");
    ns.disableLog("clearPort");
}