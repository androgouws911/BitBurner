/*Globals*/
var allScannedServers = [];
var maxPorts = 0;
var pHackLevel = 0;
const home = "home";
const ignoreList = [home];

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("scan");
    scanServers(home, ns);
    allScannedServers = filterList(allScannedServers, ignoreList);
    maxPorts = getMaxPorts(ns);   
    pHackLevel = ns.getHackingLevel();
    allScannedServers.forEach(function (sn){
        prepServers(sn, ns);
    });
}

function prepServers(target, ns) {
    var isHacked = ns.isRunning("random_scripts/hack.js", target);
    if (isHacked)
        return;
    
    var serverMaxmoney = ns.getServerMaxMoney(target);
    if (serverMaxmoney < 1)
        return;

    var serverHackLevel = ns.getServerRequiredHackingLevel(target);
    var canHack = pHackLevel >= serverHackLevel;
    if (!canHack)
        return;

    var requiredPorts = ns.getServerNumPortsRequired(target);
    var enoughPorts = maxPorts >= requiredPorts;
    if (!enoughPorts)
        return;

    ns.tprint(`${target} - Run Prep`);;
    ns.killall(target);
    ns.run("random_scripts/prepserver.js", 1, target);
}

function getMaxPorts(ns){
    var ports = 0;
    if (ns.fileExists("BruteSSH.exe", "home"))
        ports++;

    if (ns.fileExists("FTPCrack.exe", "home"))
        ports++;

    if (ns.fileExists("relaySMTP.exe", "home"))
        ports++;

    if (ns.fileExists("HTTPWorm.exe", "home"))
        ports++;

    if (ns.fileExists("SQLInject.exe", "home"))
        ports++;

    return ports;
}

function scanServers(serverName, ns) {
    addServerToList(serverName, allScannedServers);
    var linkedServers = ns.scan(serverName);
            
    linkedServers = filterList(linkedServers, ignoreList);
    linkedServers = filterList(linkedServers, allScannedServers);

    if (linkedServers.length < 1)
        return;

    for (const linkedServer of linkedServers) {
        scanServers(linkedServer, ns);
    }
}

function filterList(sourceList, removeList) {
    if (sourceList.length < 1)
        return sourceList;

    return sourceList.filter(function (rl) {
        return !removeList.includes(rl);
    });
}

function addServerToList(serverName, serverList) {
    if (!serverList.includes(serverName)) {
        serverList.push(serverName);
    }
}