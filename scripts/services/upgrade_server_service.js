import { PurchasedServerModel } from 'scripts/models/purchased_server.js';
import { _timeout } from 'scripts/enums/timeout.js';

const ramBase = 2;
const moneyMultiplier = 10;
let purchasedServers = [];

/** @param {NS} ns */
export async function main(ns) {
    ns.tail();
    ns.atExit(() => {
        ns.closeTail();
    });
    purchasedServers = [];
    const maxRamPossible = sizeFromExponent(20);
    let purchasedServerNames = ns.getPurchasedServers();
    if (purchasedServerNames.length < 1)
        return;
    disableLogs(ns);
    getPurchasedServerObjects(ns, purchasedServerNames);
    let serversNotMaxed = true;
    while (serversNotMaxed){
        let lowestRam = getMinPurchasedRam().MaxRAM;
        for (let server of purchasedServers)
        {
            let ram =server.MaxRAM;
            let name = server.ServerName;

            if (ram > lowestRam)
                continue;
            
            let curRamIndex = exponentFromSize(ram);
            let nextRam = sizeFromExponent(curRamIndex+1);
            let nextCost = ns.getPurchasedServerUpgradeCost(name, nextRam);
            if (nextCost === Infinity)
            continue;
        
            ns.printf(`Next cost: ${ns.formatNumber(nextCost)} (${ns.formatRam(nextRam)}) (PS: ${server.ServerName} | ${server.MaxRAM}) (P: $${ns.formatNumber(ns.getServerMoneyAvailable("home"))} | N: ${ns.formatNumber(nextCost * moneyMultiplier)})`);
            await playerHasTheMoney(ns, nextCost);
            let purchased = ns.upgradePurchasedServer(name, nextRam);
            if (purchased){
                updatePurchasedServerRAM(name, nextRam);
            }
            await ns.sleep(_timeout.SECONDS_TENTH);
        }        
        serversNotMaxed = purchasedServers.some((x) => x.MaxRAM < maxRamPossible);
        if (serversNotMaxed)
            await ns.sleep(_timeout.SECONDS_10);
    }
}
/** @param {NS} ns */
async function playerHasTheMoney(ns, cost) {
    let recheck = true;
    while (recheck) {       
        let money = ns.getServerMoneyAvailable("home");
        let effectiveMoney = money / moneyMultiplier;
        if (effectiveMoney >= cost)
            recheck = false;
        else 
            await ns.sleep(_timeout.SECONDS_5);
    }
    return;
}
/** @param {NS} ns */
function getPurchasedServerObjects(ns, nameList) {
    nameList.forEach((x) => {
        let existsInList = purchasedServers.some((y) => {
            return y.ServerName === x;
        });
        if (!existsInList){
            let ram = ns.getServerMaxRam(x);
            purchasedServers.push(new PurchasedServerModel(x, ram));
        }
    });
}

function updatePurchasedServerRAM(name, ram) {
    const itemToUpdateIndex = purchasedServers.findIndex(item => item.ServerName === name);

    if (itemToUpdateIndex !== -1)
        purchasedServers[itemToUpdateIndex].MaxRAM = ram;
}

function getMinPurchasedRam() {
    if (purchasedServers.length < 1) {
        return null;
    }

    return purchasedServers.reduce((lowest, current) => {
        if (current.MaxRAM < lowest.MaxRAM) {
            return current;
        }
        return lowest;
    });
}

function sizeFromExponent(num) {
    return Math.pow(2, num);
}

function exponentFromSize(ram) {
    return Math.log(ram) / Math.log(ramBase);
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("sleep");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getPurchasedServers");
}