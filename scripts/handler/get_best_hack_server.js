import { maxPortsOpen} from 'scripts/handler/general_handler.js';
import { crawl } from 'scripts/handler/server_crawl';
import { getMockHWGWThreads } from 'scripts/helpers/thread_calc_helper.js';
const minimumHackChance = 0.3;

export function getHackTarget(ns, excludeTarget = []) {
    let targetList = getHackTargetList(ns);    
    let maxScore = -Infinity;
    let bestTarget = {};
    if (ns.args[0] !== undefined)
        excludeTarget = ns.args[0];

    for (let target of targetList) {
        if (excludeTarget.length > 1){
            if (excludeTarget.includes(target))
                continue;
        }

        let result = getTargetScore(ns, target);
        let targetScore = result[0];
        let targetSuccess = result[1];
        let targetTime = result[2];
        let maxMoney = result[3];
        let targetThreads = result[4];

        if (targetScore > maxScore) {
            bestTarget = { name: target, score: targetScore, money: maxMoney, threads: targetThreads, successRate: targetSuccess, time: targetTime};
            maxScore = targetScore;
        } else if (targetScore === maxScore) {
            if (target.MaxMoney > bestTarget.money && targetTime < bestTarget.time) {
                bestTarget = { name: target, score: targetScore, money: maxMoney, threads: targetThreads, successRate: targetSuccess, time: targetTime};
                maxScore = targetScore;
            }
        }
    }
  
    return bestTarget.name;
}
/** @param {NS} ns */
export function getHackTargetList(ns) {
    let serverList = [];
    let targetList = getHackableServers(ns);    
    for (let target of targetList) {
        let result = getTargetScore(ns, target);
        let targetScore = result[0];
        let targetSuccess = result[1];
        let targetTime = result[2];
        let maxMoney = result[3];
        let targetThreads = result[4];

        let targetDetails = { name: target, score: targetScore, money: maxMoney, threads: targetThreads, successRate: targetSuccess, time: targetTime};
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
    let server = ns.getServer(target);
    server.hackDifficulty = server.minDifficulty;
    server.moneyAvailable = server.moneyMax;
    let targetTime = ns.formulas.hacking.weakenTime(server, player);
    let targetSuccess = ns.formulas.hacking.hackChance(server, player);
    let threads = getMockHWGWThreads(ns, server, player);
    let totalThreads = threads[0] + threads[1] + threads[2] + threads[3];
    let targetThreadTime = targetTime * totalThreads;

    if (targetSuccess < minimumHackChance)
        return 0;

    let weightedMoney = server.moneyMax * targetSuccess;
    let targetScore = weightedMoney / targetThreadTime;
    return [targetScore, targetSuccess, targetThreadTime, server.moneyMax, totalThreads];
}

/** @param {NS} ns */
export function getHackableServers(ns) {
    let data = crawl(ns);
    let filteredData = filterUnhackable(data, ns);
    return filteredData;
}

/** @param {NS} ns */
function filterUnhackable(data, ns) {
    let currentPorts = maxPortsOpen(ns);
    let playerHackLevel = ns.getHackingLevel();

    let filteredList = data.filter(server =>
        ns.getServerRequiredHackingLevel(server) <= playerHackLevel && ns.getServerNumPortsRequired(server) <= currentPorts
        && serverHasMoney(ns.getServerMaxMoney(server)) && ns.serverExists(server)
    );
    
    let pServers = ns.getPurchasedServers();
    filteredList.filter((x) => !pServers.includes(x));

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
