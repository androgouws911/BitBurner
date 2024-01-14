import { writeToPort } from 'scripts/handler/port_handler.js';
import { _port_list } from 'scripts/enums/ports.js';
import { crawl } from 'scripts/handler/server_crawl.js';

/** @param {NS} ns */
export async function main(ns) {
    let dataList = getServers(ns);
    if (dataList == null)
        return;

    dataList.forEach((x) => {
        ns.killall(x);
    });

    ns.tprintf("KillServers Completed.");
    writeToPort(ns, _port_list.MAIN_SERVICE_PORT, true);
}

function getServers(ns) {
    let serverNames = crawl(ns);
    let filteredList = serverNames.filter((x) => x !== "home");
    filteredList = filteredList.filter((x) => {
        let exists = ns.serverExists(x);
        let rooted = ns.hasRootAccess(x);
        return exists && rooted;
    })

    filteredList.forEach((x) => {
        serverNames.push(x.ServerName);
    })

    return filteredList;
}