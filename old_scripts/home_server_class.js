const home = "home";
const spareRam = 500;

export class HomeServer{
    constructor(scriptRam, ns){
        this.Cores = ns.getServer(home).cpuCores;
        this.RAM =  ns.getServerMaxRam(home);
        this.AdaptedRAM = this.RAM - scriptRam - spareRam;
        this.MaxPorts = getMaxPorts(ns);
        this.MaxHackThreads = getMaxThreads("old_scripts/ideal_hack.js",this.AdaptedRAM, ns);
        this.MaxGrowthThreads = getMaxThreads("old_scripts/ideal_grow.js",this.AdaptedRAM, ns);
        this.MaxWeakenThreads = getMaxThreads("old_scripts/ideal_weaken.js",this.AdaptedRAM, ns);
        this.WeakenAmount = ns.weakenAnalyze(this.MaxWeakenThreads, this.Cores);
    }
}

function getMaxThreads(scriptName,adaptedRam, ns){    
    var scriptRam = ns.getScriptRam(scriptName, home);    
    return Math.floor(adaptedRam / scriptRam);
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