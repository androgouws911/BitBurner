import { Handler, Services } from 'scripts/data/file_list.js';
import {_timeout } from 'scripts/enums/timeout.js';

export const portOpenExecuteables = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
export const SCRIPT_RAM = 2;

const homeReserveScripts = [Services.HWGW, Handler.ContractReader,
    Handler.ContractSolver, Handler.ContractPortHandler, Services.PurchaseServer,
    Services.UpgradeServer, Services.HackNet];

const home = "home";
const homeFreeSpaceThresholds = [
    { maxRamThreshold: 0, value: 0 },
    { maxRamThreshold: 10, value: 2 },
    { maxRamThreshold: 50, value: 10 },
    { maxRamThreshold: 100, value: 50 },
    { maxRamThreshold: 500, value: 100 },
    { maxRamThreshold: 1000, value: 200 },
    { maxRamThreshold: 2000, value: 300 },
    { maxRamThreshold: 4000, value: 400 },
    { maxRamThreshold: 8000, value: 500 },
    { maxRamThreshold: Infinity, value: 1024 },
  ];


export function listIsBlank(list){
    if (list === undefined || list === null || list.length < 1)
        return true;

    return false;
}

/** @param {NS} ns */
export async function waitWhileBusy(fileNameOrPID, ns) {
    let bBusy = ns.isRunning(fileNameOrPID);
    while (bBusy) {
        bBusy = ns.isRunning(fileNameOrPID);
        await ns.sleep(_timeout.SECONDS_1);
    }
}

export function calculateReserveExtra(maxRam, reservedSpace) {
  let adaptedRam = maxRam - reservedSpace;

  for (const threshold of homeFreeSpaceThresholds) {
    if (adaptedRam < threshold.maxRamThreshold) {
      return threshold.value;
    }
  }

  return 0; 
}

export function calculateReserve(ns){
    let list  = homeReserveScripts;
    let total = 0;
    list.forEach((x) => {
        total+= ns.getScriptRam(x);
    })

    return total;
}

/** @param {NS} ns */
export function maxPortsOpen(ns) {
    let ports = 0;
    portOpenExecuteables.forEach((x) => {
        if (ns.fileExists(x, home))
            return ports++;
    });

    return ports;
}