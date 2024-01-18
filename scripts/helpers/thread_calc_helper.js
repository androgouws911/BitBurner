import { _timeout } from 'scripts/enums/timeout';
let singleDelay =  200;
let doubleDelay = 2*singleDelay;

export function getHWGWPostData(ns, serverName, delay=50){
    singleDelay = delay;
    let hwgwThreads = getHWGWThreads(ns, serverName);
    let hwgwTiming = hwgwTimings(ns, serverName);
    let postData = hwgwPostData(hwgwTiming, hwgwThreads, serverName);

    return postData;
}

export function getHWGWPostData_Mock(ns, server, player, delay=50){
    singleDelay = delay;
    let mockedThreads = getMockHWGWThreads(ns, server, player);
    let mockTimings = getMockHWGWTimings(ns, server, player);
    let postData = hwgwPostData(mockTimings, mockedThreads, server.hostname);

    return postData;
}

export function getWGWPostData(ns, serverName, cores){
    let wgwThreads = getWGWThreads(ns, serverName, cores);
    let wgwTiming = wgwTimings(ns, serverName);
    let postData = wgwPostData(wgwTiming, wgwThreads, serverName);

    return postData;
}

export function getWGWPostData_Mock(ns, server, player, cores){
    let wgwThreads = getMockWGWThreads(ns, server, cores);
    let wgwTiming = wgwMockTimings(ns, server, player);
    let postData = wgwPostData(wgwTiming, wgwThreads, server.hostname);

    return postData;
}

function hwgwPostData(timings, threads, serverName){
    let postData = {
        ServerName: serverName,
        HDelay: timings[0],
        W1Delay: timings[1],
        GDelay: timings[2],
        W2Delay: timings[3],
        HThreads: threads[0],
        W1Threads: threads[1],
        GThreads: threads[2],
        W2Threads: threads[3]
    };

    return postData;
}

function wgwPostData(timings, threads, serverName){
    let postData = {
        ServerName: serverName,
        W1Delay: timings[0],
        GDelay: timings[1],
        W2Delay: timings[2],
        W1Threads: threads[0],
        GThreads: threads[1],
        W2Threads: threads[2]
    };

    return postData;
}

function hwgwTimings(ns, target){
    let server = ns.getServer(target);
    let player = ns.getPlayer();
    let hackT = ns.formulas.hacking.hackTime(server, player);//Duration of Hack
    let growT = ns.formulas.hacking.growTime(server, player);//Duration of grow
    let weakT = ns.formulas.hacking.weakenTime(server, player);//Duration of weaken

    if (growT > weakT){
        let hackDelay = growT - hackT - doubleDelay;
        let weak1Delay = growT - weakT - singleDelay;
        let growDelay = 0;
        let weak2Delay = growT - weakT + singleDelay;

        return [hackDelay, weak1Delay, growDelay, weak2Delay];
    }

    if (weakT >= growT){
        let hackDelay = weakT - hackT - singleDelay;
        let weak1Delay = 0;
        let growDelay = weakT - growT + singleDelay;
        let weak2Delay = doubleDelay;

        return [hackDelay, weak1Delay, growDelay, weak2Delay];
    }
}

function getMockHWGWTimings(ns, server, player){
    let hackT = ns.formulas.hacking.hackTime(server, player);//Duration of Hack
    let growT = ns.formulas.hacking.growTime(server, player);//Duration of grow
    let weakT = ns.formulas.hacking.weakenTime(server, player);//Duration of weaken

    if (growT > weakT){
        let hackDelay = growT - hackT - doubleDelay;
        let weak1Delay = growT - weakT - singleDelay;
        let growDelay = 0;
        let weak2Delay = growT - weakT + singleDelay;

        return [hackDelay, weak1Delay, growDelay, weak2Delay];
    }

    if (weakT >= growT){
        let hackDelay = weakT - hackT - singleDelay;
        let weak1Delay = 0;
        let growDelay = weakT - growT + singleDelay;
        let weak2Delay = doubleDelay;

        return [hackDelay, weak1Delay, growDelay, weak2Delay];
    }
}

function wgwTimings(ns, target){
    let server = ns.getServer(target);
    let player = ns.getPlayer();
    let growT = ns.formulas.hacking.growTime(server, player);//Duration of grow
    let weakT = ns.formulas.hacking.weakenTime(server, player);//Duration of weaken

    if (growT > weakT){
        let weakDelay = growT - weakT - singleDelay;
        let weak2Delay = growT - weakT + singleDelay;

        return [weakDelay, 0, weak2Delay];
    }

    if (weakT >= growT){
        let growDelay = weakT - growT + singleDelay;
        let weak2Delay = doubleDelay;
                
        return [0, growDelay, weak2Delay];
    }
}

function wgwMockTimings(ns, server, player){
    let growT = ns.formulas.hacking.growTime(server, player);//Duration of grow
    let weakT = ns.formulas.hacking.weakenTime(server, player);//Duration of weaken

    if (growT > weakT){
        let weakDelay = growT - weakT - singleDelay;
        let weak2Delay = growT - weakT + singleDelay;

        return [weakDelay, 0, weak2Delay];
    }

    if (weakT >= growT){
        let growDelay = weakT - growT + singleDelay;
        let weak2Delay = doubleDelay;
                
        return [0, growDelay, weak2Delay];
    }
}


export function getHWGWThreads(ns, target){ 
    let weakenPerThread = ns.weakenAnalyze(1, 1);
    let server = ns.getServer(target);
    let player = ns.getPlayer();
    let hackPercPerThread = ns.formulas.hacking.hackPercent(server, player);   
    let minSec = ns.getServerMinSecurityLevel(target);
    let maxMoney = ns.getServerMaxMoney(target);
    let percentageHacked = 0.90;
    let hwgwThreads = [];

    let curSec = minSec;
    let threadH = Math.floor(percentageHacked / hackPercPerThread);
    let hSecImpact = ns.hackAnalyzeSecurity(threadH, target);
    curSec += hSecImpact;
    let threadW1 = calcRequiredWeakenThreads(curSec, minSec, weakenPerThread);
    curSec = minSec;
    let threadG = calcRequiredGrowthThreads(ns, target, percentageHacked, maxMoney);
    let gSecImpact = ns.growthAnalyzeSecurity(threadG);
    curSec += gSecImpact;
    let threadW2 = calcRequiredWeakenThreads(curSec, minSec, weakenPerThread);
        
    hwgwThreads = [threadH, threadW1, threadG, threadW2];   
           
    return hwgwThreads;
}

export function getMockHWGWThreads(ns, server, player){ 
    let target = server.hostname;
    let weakenPerThread = ns.weakenAnalyze(1, 1);
    let hackPercPerThread = ns.formulas.hacking.hackPercent(server, player);   
    let minSec = ns.getServerMinSecurityLevel(target);
    let maxMoney = ns.getServerMaxMoney(target);
    let percentageHacked = 0.90;
    let hwgwThreads = [];
    let curSec = minSec;
    let threadH = Math.floor(percentageHacked / hackPercPerThread);
    let hSecImpact = ns.hackAnalyzeSecurity(threadH, target);
    curSec += hSecImpact;
    let threadW1 = calcRequiredWeakenThreads(curSec, minSec, weakenPerThread);
    curSec = minSec;
    let threadG = calcRequiredGrowthThreads(ns, target, percentageHacked, maxMoney);
    let gSecImpact = ns.growthAnalyzeSecurity(threadG);
    curSec += gSecImpact;
    let threadW2 = calcRequiredWeakenThreads(curSec, minSec, weakenPerThread);
        
    hwgwThreads = [threadH, threadW1, threadG, threadW2];   
           
    return hwgwThreads;
}

function getWGWThreads(ns, target, cores){    
    let weakenPerThread = ns.weakenAnalyze(1, cores);
    let minSec = ns.getServerMinSecurityLevel(target);
    let maxMoney = ns.getServerMaxMoney(target);
    let curSec = ns.getServerSecurityLevel(target);
    let availMoney = ns.getServerMoneyAvailable(target);
    if (minSec === curSec && availMoney === maxMoney)
        return [0,0,0];

    let threadW1 = calcRequiredWeakenThreads(curSec, minSec, weakenPerThread);
    curSec = minSec;
    let threadG = calcWGWGrowthThreads(ns, target, availMoney, maxMoney, cores);
    let gSecImpact = ns.growthAnalyzeSecurity(threadG, undefined, cores);
    curSec += gSecImpact;
    let threadW2 = calcRequiredWeakenThreads(curSec, minSec, weakenPerThread);

    return [threadW1, threadG, threadW2];
}

export function getMockWGWThreads(ns, server, cores){    
    let weakenPerThread = ns.weakenAnalyze(1, cores);
    if (server.minDifficulty === server.hackDifficulty 
        && server.moneyAvailable === server.moneyMax)
        return [0,0,0];

    let threadW1 = calcRequiredWeakenThreads(server.hackDifficulty, server.minDifficulty, weakenPerThread);
    server.hackDifficulty = server.minDifficulty;
    let threadG = calcWGWGrowthThreads(ns, server.hostname, server.moneyAvailable, server.moneyMax, cores);
    let gSecImpact = ns.growthAnalyzeSecurity(threadG, undefined, cores);
    server.hackDifficulty += gSecImpact;
    let threadW2 = calcRequiredWeakenThreads(server.hackDifficulty, server.minDifficulty, weakenPerThread);

    return [threadW1, threadG, threadW2];
}

function calcRequiredWeakenThreads(currentSec, minSec, weakenPerThread) {
    let toReduce = currentSec - minSec;
    let threadsNeeded = Math.ceil(toReduce / weakenPerThread);
    if (toReduce % weakenPerThread !== 0) {
        threadsNeeded++;
    }
    return threadsNeeded;
}
  
function calcWGWGrowthThreads(ns, target, availMoney, maxMoney, cores) {
    if (availMoney < 1) 
        availMoney = 1;
    return Math.ceil(ns.growthAnalyze(target, maxMoney / availMoney, cores));
}

function calcRequiredGrowthThreads(ns, target, percHack, maxMoney) {
    const hacked = maxMoney * percHack;
    let available = maxMoney - hacked;
    if (available <= 0)
        available = 1;
    let threadsNeeded = Math.ceil(ns.growthAnalyze(target, maxMoney / available));
    return threadsNeeded;
}
