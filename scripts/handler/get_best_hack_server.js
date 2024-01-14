import { maxPortsOpen} from 'scripts/handler/general_handler.js';
import { readDataFromFile } from 'scripts/handler/data_file_handler.js';
import { Data } from 'scripts/data/file_list.js';
//import { getMockHWGWThreads } from 'scripts/helpers/thread_calc_helper.js';
const minimumHackChance = 0.3;

export function getHackTarget(ns, excludeTarget = []) {
    let targetList = fetchOrderedHackableServers(ns);    
    let maxScore = -Infinity;
    let bestTarget = {};
    if (ns.args[0] !== undefined)
        excludeTarget = ns.args[0];

    for (let target of targetList) {
        if (excludeTarget.length > 1){
            if (excludeTarget.includes(target.ServerName))
                continue;
        }

        let result = getTargetScore(ns, target);
        let targetScore = result[0];
        let targetSuccess = result[1];
        let targetTime = result[2];

        if (targetScore > maxScore) {
            bestTarget = { name: target.ServerName, score: targetScore, money: target.MaxMoney, successRate: targetSuccess, time: targetTime};
            maxScore = targetScore;
        } else if (targetScore === maxScore) {
            if (target.MaxMoney > bestTarget.money && targetTime < bestTarget.time) {
                bestTarget = { name: target.ServerName, score: targetScore, money: target.MaxMoney, successRate: targetSuccess, time: targetTime};
                maxScore = targetScore;
            }
        }
    }
  
    return bestTarget.name;
}
/** @param {NS} ns */
export function getHackTargetList(ns) {
    let serverList = [];
    let targetList = fetchOrderedHackableServers(ns);    
    for (let target of targetList) {
        let result = getTargetScore(ns, target);
        let targetScore = result[0];
        let targetSuccess = result[1];
        let targetTime = result[2];

        let targetDetails = { name: target.ServerName, score: targetScore, money: target.MaxMoney, successRate: targetSuccess, time: targetTime};
        serverList.push(targetDetails);
    }
    let resultList = serverList.filter((x) => {
        return ns.hasRootAccess(x.name) && ns.serverExists(x.name);
    });
    
    let sortedList = resultList.sort((a, b) => {
        return b.score - a.score;
      });
    return sortedList;
}

function getTargetScore(ns, target){
    let player = ns.getPlayer();
    let server = ns.getServer(target.ServerName);
    server.hackDifficulty = server.minDifficulty;
    server.moneyAvailable = server.moneyMax;
    let targetTime = ns.formulas.hacking.weakenTime(server, player);
    let targetSuccess = ns.formulas.hacking.hackChance(server, player);
    //let threads = getMockHWGWThreads(ns, server, player);
    //let totalThreads = threads[0] + threads[1] + threads[2] + threads[3];
    let targetThreadTime = targetTime;// * totalThreads;

    if (targetSuccess < minimumHackChance)
        return 0;

    let weightedMoney = target.MaxMoney * targetSuccess;
    let targetScore = weightedMoney / targetThreadTime;
    return [targetScore, targetSuccess, targetTime]
}

/** @param {NS} ns */
export function fetchOrderedHackableServers(ns) {
    let data = readDataFromFile(Data.Static, ns);
    let filteredData = filterUnhackable(data, ns);
    let orderedData = orderByMaxMoneyToLevelDecending(filteredData);
    return orderedData;
}
/** @param {NS} ns */
function orderByMaxMoneyToLevelDecending(data) {
    return data.sort(maxMoneyToLevelRatio);
}

function maxMoneyToLevelRatio(serverA, serverB) {
  let ratioA = serverA.MaxMoney / serverA.RequiredLevel;
  let ratioB = serverB.MaxMoney / serverB.RequiredLevel;

  if (ratioA < ratioB) {
    return 1;
  } else if (ratioA > ratioB) {
    return -1;
  } else {
    return 0;
  }
}
/** @param {NS} ns */
function filterUnhackable(data, ns) {
    let currentPorts = maxPortsOpen(ns);
    let playerHackLevel = ns.getHackingLevel();

    let filteredList = data.filter(server =>
        server.RequiredHackLevel <= playerHackLevel && server.RequiredPorts <= currentPorts
        && serverHasMoney(server.MaxMoney) && ns.serverExists(server.ServerName)
    );

    if (filteredList.length === 0)
        return null;

    return filteredList;
}

function serverHasMoney(maxMoney){
    if (maxMoney === undefined || maxMoney === null || isNaN(maxMoney))
        return false;
    
    if (maxMoney < 1)
        return false;

    return true;    
}
