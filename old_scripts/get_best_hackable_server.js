/*Globals*/
var allScannedServers = [];
var hackableServers = [];
var serverObjects = [];
var pHackLevel = 0;
var homeServer = new Object();
const home = "home";
const ignoreList = [home];
import {HackableServer} from 'old_scripts/hackable_server_class.js';
import {HomeServer} from 'old_scripts/home_server_class.js';

/** @param {NS} ns */
export function bestServerArgs(ns) {
    pHackLevel = ns.getHackingLevel();
    var manageHackScript = ns.getScriptRam("old_scripts/ideal_manage.js", home);
    homeServer = new HomeServer(manageHackScript, ns);

    scanServers(home, ns);
    allScannedServers = filterList(allScannedServers, ignoreList);
    allScannedServers.forEach(function (sn){
        getHackableServers(sn, ns);
    });

    if (hackableServers.length < 1){
        ns.tprint(`HACKABLE ERROR: No hackable servers`);
        return;
    }

    hackableServers.forEach(function(serverName){
        serverObjects.push(new HackableServer(serverName, homeServer.MaxHackThreads, homeServer.Cores, ns));
    });
    
    //Calculate
    var bestServer = calculateBestServer(serverObjects);    
    if (bestServer == null)
        return;
    
    var maxHack = homeServer.MaxHackThreads;
    if (maxHack > bestServer.hack25)
        maxHack = bestServer.hack25;

    var maxGrow = homeServer.MaxGrowthThreads;
    if (maxGrow > bestServer.growth4x)
        maxGrow = bestServer.growth4x;
    
    var minSec = bestServer.minSecurityLevel + homeServer.WeakenAmount;
    var scriptArgs = [bestServer.serverName, maxHack, maxGrow, homeServer.MaxWeakenThreads, minSec, bestServer.maxMoney];
    return scriptArgs;    
}

function calculateBestServer (serverList){    
    let hackLevelDiv3 = pHackLevel / 1.5;
    if (hackLevelDiv3 < 1)
        hackLevelDiv3 = 1;

    let idealHackingLevel = Math.floor(hackLevelDiv3);
    let idealList = [];
    serverList.forEach(function (serverObject){
        if (serverObject.requiredHackingLevel <= idealHackingLevel)
            idealList.push(serverObject);
    });

    if (idealList.length === 0) {
        return null;
    }

    return idealList.reduce((highestObject, currentObject) => {
        return currentObject.maxMoney > highestObject.maxMoney ? currentObject : highestObject;
    }, idealList[0]);
}

function getHackableServers(target, ns) {
    if (ns.getServer(target) == undefined)
        return;

    var serverExists = ns.serverExists(target);
    if (!serverExists)
        return;
    
    var isHacked = ns.isRunning("old_scripts/hack.js", target);
    if (isHacked){
        addServerToList(target, hackableServers);
        return;
    }
    
    var serverRooted = ns.hasRootAccess(target);
    if (!serverRooted)
        return;

    var serverMaxmoney = ns.getServerMaxMoney(target);
    if (serverMaxmoney < 1)
        return;

    var serverHackLevel = ns.getServerRequiredHackingLevel(target);
    var canHack = pHackLevel >= serverHackLevel;
    if (!canHack)
        return;

    var requiredPorts = ns.getServerNumPortsRequired(target);
    var enoughPorts = getMaxPorts(ns) >= requiredPorts;
    if (!enoughPorts)
        return;

    addServerToList(target, hackableServers);
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