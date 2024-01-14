import { Data } from 'scripts/data/file_list.js';
import { readDataFromFile } from 'scripts/handler/data_file_handler.js';
import { writeToPort } from 'scripts/handler/port_handler.js';
import { _port_list } from 'scripts/enums/ports.js';

/** @param {NS} ns */
export async function main(ns) {
    let dataList = getRootedAndCopiedData(ns);
    if (dataList == null)
        return;

    dataList.forEach((x) => {
        if (!ns.serverExists(x) || !ns.hasRootAccess(x))
            return;
        ns.killall(x);
    });

    ns.tprintf("KillServers Completed.");
    writeToPort(ns, _port_list.MAIN_SERVICE_PORT, true);
}

function getRootedAndCopiedData(ns) {
    let serveNames = [];
    let data = readDataFromFile(Data.Dynamic, ns);
    let filteredList = data.filter(function (x) {
        return x.RootStatus === true && x.FilesCopied === true;
    });
    filteredList = filteredList.filter((x) => x.ServerName !== "home");
    filteredList = filteredList.filter((x) => x.ServerName !== "darkweb");
    filteredList = filteredList.filter((x) => x.ServerName !== "w0r1d_d43m0n");

    filteredList.forEach((x) => {
        serveNames.push(x.ServerName);
    })

    return serveNames;
}