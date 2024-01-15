import { Services } from 'scripts/data/file_list.js';
import { _port_list } from 'scripts/enums/ports.js';
import { _timeout } from 'scripts/enums/timeout.js';

const serverNamePrefix = "p_server-";
const ramBase = 2;
let purchasedServers = [];

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    ns.tail();
    ns.atExit(() => {
        ns.closeTail();
    });
    purchasedServers = [];
    let maxServers = ns.getPurchasedServerLimit();
    let player = ns.getPlayer();

    let ramCostItem = getCheapestServer(ns);
    purchasedServers = ns.getPurchasedServers();
    let purchasedCount = purchasedServers.length;
    while(purchasedCount < maxServers){
        let currentMoney = ns.getPlayer().money;
        if (currentMoney > ramCostItem[1]*5){
            let purchase = ns.purchaseServer(`${serverNamePrefix}${purchasedCount}`,ramCostItem[0]);
            if (purchase !== undefined && purchase !== null && purchase !== ""){
                purchasedServers.push(purchase);
                purchasedCount++;
            }
        }
        await ns.sleep(_timeout.SECONDS_1);
    }

    startUpgradeService(ns);
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("sleep");
}

/** @params {NS} ns */
function startUpgradeService(ns){
    ns.run(Services.UpgradeServer, 1);
}

function getCheapestServer(ns, size) {
    let ram = 2;
    if (size !== undefined && size !== null && size !== 0)
        ram = Math.log(size) / Math.log(ramBase);

    let cost = ns.getPurchasedServerCost(ram);
    return [ram, cost];
}
