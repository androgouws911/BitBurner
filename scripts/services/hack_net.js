import {_timeout} from 'scripts/enums/timeout.js';

const MAX_TOTAL_NODES = 35;
const DEFAULT_LEVELS = 10;
const MAX_RAM = 64;
const MAX_CORE = 16;
const MAX_LEVEL = 200;

let _keepAlive = true;
/** @param {NS} ns */
export async function main(ns) {
    spamfilter(ns);
    _keepAlive = true;
    let currentCount = ns.hacknet.numNodes();
    if (currentCount === undefined || currentCount == null || currentCount < 1)
        purchaseNodes(ns, 1);

    await keepAliveCheck(ns);
    while (_keepAlive) {
        let levelsToBuy = DEFAULT_LEVELS;
        let nodeCount = ns.hacknet.numNodes();
        let lvlPrice = ns.hacknet.getLevelUpgradeCost(nodeCount - 1, levelsToBuy);
        let corePrice = ns.hacknet.getCoreUpgradeCost(nodeCount - 1);
        let ramPrice = ns.hacknet.getRamUpgradeCost(nodeCount - 1);
        let purPrice = ns.hacknet.getPurchaseNodeCost();
        let lowest = findLowestIndex(lvlPrice, corePrice, ramPrice, purPrice);

        switch (lowest) {
            case 0: await upLevels(ns, DEFAULT_LEVELS); break;
            case 1: await upCores(ns); break;
            case 2: await upRam(ns); break;
            case 3: let nodeMax = ns.hacknet.numNodes() + 1;
                await purchaseNodes(ns, nodeMax);
                break;
            default: upLevels(ns, DEFAULT_LEVELS);
        }

        await keepAliveCheck(ns);
        await ns.sleep(100);
    }
}
/** @param {NS} ns */
async function keepAliveCheck(ns) {
    let nodeCount = ns.hacknet.numNodes();
    if (nodeCount < 1)
        return;
    let lastNode = ns.hacknet.getNodeStats(nodeCount - 1);
    if (lastNode.level == MAX_LEVEL && lastNode.ram == MAX_RAM && lastNode.cores == MAX_CORE && nodeCount == MAX_TOTAL_NODES)
        _keepAlive = false;
    return;
}
/** @param {NS} ns */
async function upLevels(ns) {
    ns.printf("Upgrade Levels");
    await upgradeHacknet(ns, true, ns.hacknet.getLevelUpgradeCost, ns.hacknet.upgradeLevel, (i) => ns.hacknet.getNodeStats(i).level === MAX_LEVEL, "level");
}

/** @param {NS} ns */
async function upCores(ns) {
    ns.printf("Upgrade Cores");
    await upgradeHacknet(ns, false, ns.hacknet.getCoreUpgradeCost, ns.hacknet.upgradeCore, (i) => ns.hacknet.getNodeStats(i).cores === MAX_CORE, "cores");
}
/** @param {NS} ns */
async function upRam(ns) {
    ns.printf("Upgrade RAM");
    await upgradeHacknet(ns, false, ns.hacknet.getRamUpgradeCost, ns.hacknet.upgradeRam, (i) => ns.hacknet.getNodeStats(i).ram === MAX_RAM, "ram");
}
/** @param {NS} ns */
async function purchaseNodes(ns, max_purchase) {
    while (ns.hacknet.numNodes() < max_purchase) {
        let cost = ns.hacknet.getPurchaseNodeCost();
        await playerHasTheMoney(ns, cost);
        let purchaseIndex = ns.hacknet.purchaseNode();
        if (purchaseIndex == max_purchase || purchaseIndex == MAX_TOTAL_NODES)
            return;
    }
    return;
}
/** @param {NS} ns */
async function upgradeHacknet(ns, buyMulti, getUpgradeCost, upgradeFunction, maxReachedCondition, stat) {
    let buyAmount = buyMulti ? 10 : 1;
    let nodeCount = ns.hacknet.numNodes();
    let nodeListStats = [];
    if (nodeCount < 1)
        return;
    for (let i = 0; i < nodeCount; i++){
        let stats = ns.hacknet.getNodeStats(i);
        nodeListStats.push(stats);
    }

    let targetLevel  = nodeListStats[nodeCount-1][stat];
    targetLevel += buyAmount;
    for (let i = 0; i < nodeCount; i++) {
        let nodeStats = ns.hacknet.getNodeStats(i);
        let currentLvl = nodeListStats[i][stat];
        if (targetLevel > currentLvl){
            if (maxReachedCondition(i))
                continue;
        
            if (buyMulti) {                
                if (!isDivisibleBy10(nodeStats.level))
                buyAmount -= getRemainder(nodeStats.level);
            
                if (nodeStats.level + buyAmount > MAX_LEVEL)
                buyAmount = MAX_LEVEL - nodeStats.level;
            }

            let cost = getUpgradeCost(i, buyAmount);
            if (cost === Infinity || cost < 1)
                continue;

            await playerHasTheMoney(ns, cost, stat, i);
            let upgradeSuccess = upgradeFunction(i, buyAmount);
            await ns.sleep(100);
        }
    }
}

/** @param {NS} ns */
async function playerHasTheMoney(ns, amount, stat, index) {
    let recheck = true;
    while (recheck) {
        let currentMoney = ns.getServerMoneyAvailable("home");
        if (currentMoney >= amount)
            recheck = false;
        else {
            if (stat === undefined && index === undefined)
                ns.printf(`Purchasing new server: Waiting for $${ns.formatNumber(amount, 2, 4)} Currently:$${ns.formatNumber(currentMoney,2)}`);
            else
                ns.printf(`Upgrading ${stat}(PS: ${index}): Waiting for $${ns.formatNumber(amount, 2, 4)} Currently:$${ns.formatNumber(currentMoney,2)}`);

            await ns.sleep(_timeout.SECONDS_5);
        }
    }
    return;
}

function roundDownToNearestTen(number) {
    return Math.floor(number / 10) * 10;
  }

function isDivisibleBy10(number) {
    return number % 10 === 0;
}

function getRemainder(number) {
    return number % 10;
}

function findLowestIndex(...values) {
    if (values.length === 0) {
        return -1;
    }

    const numericValues = values.filter(value => typeof value === "number" && !isNaN(value));

    if (numericValues.length === 0) {
        return -1;
    }

    const minValue = Math.min(...numericValues);
    return values.indexOf(minValue);
}

function spamfilter(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("sleep");
}