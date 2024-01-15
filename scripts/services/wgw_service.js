import { writeToPort, readFromPort } from 'scripts/handler/port_handler.js';
import { getWGWPostData } from 'scripts/helpers/thread_calc_helper.js';
import { SCRIPT_RAM } from 'scripts/handler/general_handler.js';
import { ThreadServer } from 'scripts/models/thread_models.js';
import { _port_list } from 'scripts/enums/ports.js';
import { Action, Services } from 'scripts/data/file_list.js';

const state = {
    Ready : 1,
    Prepped : 2,
    Hacked : 3
};

let serverObjects = [];
const home = "home";
const HALF_SECOND = 500;
const ONE_SECOND = 1000;
const TEN_SECONDS = 10000;
const ONE_MINUTE = 60000;

/** @param {NS} ns */
export async function main(ns) {
    ns.tail();
    ns.resizeTail(600,400);
    ns.moveTail(1750,185);
    ns.atExit(() => {
        ns.closeTail();
        let hwgw = ns.getRunningScript(Services.HWGW, home);
        if (hwgw)
            ns.kill(hwgw.pid);
    });
    disableLogs(ns);
    await ns.sleep(TEN_SECONDS);
    while (true){        
        getMaxthreads(ns);
        let cores = ns.getServer(home).cpuCores;
        let data = await readFromPort(ns, _port_list.WGW_THREADS);
        if (data == null){
            await ns.sleep(HALF_SECOND);
            continue;
        }
        updateThreads(ns);
        let endTime;        
        let currentTime = new Date().getTime();
        let post = await getWGWPostData(ns, data.name, cores);
        let threads = post.W1Threads + post.W2Threads + post.GThreads;
        let player = ns.getPlayer();
        let server = ns.getServer(data.name);
        let batchComplete = true;
        if (threads > 0){
            let batchList = getBatchList(post);
            batchComplete = await executeThreadsToServers(ns, batchList, data.name);
            let weakT = ns.formulas.hacking.weakenTime(server, player);
            currentTime = new Date().getTime();
            endTime = currentTime + weakT + TEN_SECONDS;
            if (!batchComplete){
                let ePost = await getWGWPostData(ns, data.name, 1);
                let eThreads = post.W1Threads + post.W2Threads + post.GThreads;
                let eBatchList = getBatchList(ePost);
                let purchasedServers = ns.getPurchasedServers();
                purchasedServers.splice(0, 15);
                let maxEThreads = purchasedServers.reduce(
                    (total, x) => { return total + ns.getServerMaxRam(x); }, 0
                );
                if (maxEThreads < eThreads){
                    ns.printf(`Failed to batch ${data.name} not enough threads (incl. emergency)`);
                    continue;
                }
                let result = await emergencyBatchToServers(ns, eBatchList, data.name, purchasedServers);
                let weakT = ns.formulas.hacking.weakenTime(server, player);
                currentTime = new Date().getTime();
                endTime = currentTime + weakT + TEN_SECONDS;
                if (!result){
                    data.state = state.Hacked;
                    data.time = endTime;
                    ns.printf(`Need more threads ${data.name} - ${ns.tFormat(data.time - new Date().getTime())}`);
                    await writeToPort(ns, _port_list.HANDLER_PORT,data);
                    continue;
                }
            }
        }
        else{
            ns.printf(`No prep required: ${data.name}`);
            endTime = currentTime;
        }
        let currentDate = new Date();
        let timeFormatted = currentDate.toLocaleTimeString(`sv`);
        data.state = state.Prepped;
        ns.printf(timeFormatted);
        data.time = endTime;
        ns.printf(`Writing to Handler: ${data.name} - ${ns.tFormat(data.time - new Date().getTime())}`);
        ns.printf(`${"-".repeat(50)}`);
        await writeToPort(ns, _port_list.HANDLER_PORT, data);
    }
}
/** @param {NS} ns */
async function executeThreadsToServers(ns, batchList, target) {
    let batchThreads = 0;
    let threadsUsed = 0;
    let execBuilder = [];
    for (let batch of batchList){
        let threadsNeeded = batch[1];
        batchThreads+=threadsNeeded;
        let currentLeft = threadsNeeded;
        let action = batch[0];
        let delay = batch[2];
        let counter = 0;
        while (counter < threadsNeeded) {
            if (getAvailableThreads() === 0)
                break;
            
            serverObjects.some((x) => {
                if (x.AvailableThreads < 1)
                    return false;
                
            let useThreads = currentLeft >= x.AvailableThreads ? x.AvailableThreads : currentLeft;
            currentLeft -= useThreads;
            let randomNumber = getRandomNumber();
            let execArgs = [target, delay, randomNumber];
            execBuilder.push([action, x.ServerName, useThreads, execArgs]);
            counter += useThreads;
            x.AvailableThreads -= useThreads;
            threadsUsed+=useThreads;
            if (currentLeft === 0 || getAvailableThreads() === 0)
                return true;
            });
        }
    }    

    if (threadsUsed < batchThreads)
        return false;
    
    execBuilder.forEach((x) => {
        if (x[2] === 0)
            return;
        
        let actionString = `${x[0].slice(x[0].length-7, x[0].length-3)}`;
        let paddedThreads = `${x[2]}`.padEnd(5, " ");
        ns.printf(`${target} - A:${actionString} - T:${paddedThreads} - D:${x[3][1]}`);
        ns.exec(x[0], x[1], x[2], ...x[3]);
    });
    return true;
}

async function emergencyBatchToServers(ns, batchList, target, servers) {
    let threadsUsed = 0;
    let execBuilder = [];   
    let totalThreadsNeeded = 0; 
    let threadsAvailable = getAvailableEmergencyThreads(ns, servers);
    for (let batch of batchList){
        let threadsNeeded = batch[1];
        totalThreadsNeeded += threadsNeeded;
        let currentLeft = threadsNeeded;
        let action = batch[0];
        let delay = batch[2];
        let counter = 0;
        while (counter < threadsNeeded) {                
            if (threadsUsed >= threadsAvailable)
                break;        

            servers.some((x) => {
                if (currentLeft === 0)
                    return;

                let xRam = (ns.getServerMaxRam(x) - ns.getServerUsedRam(x));
                let xThreads = Math.floor(xRam / SCRIPT_RAM);
                if (xThreads < 5)
                    return;
                
                let useThreads = currentLeft >= xThreads ? xThreads : currentLeft;
                currentLeft -= useThreads;
                let randomNumber = getRandomNumber();
                let execArgs = [target, delay, randomNumber];
                execBuilder.push([action, x, useThreads, execArgs]);
                counter += useThreads;
                threadsUsed+=useThreads;
                if (currentLeft === 0)
                    return;
            });

            await ns.sleep(1000);
        }
    }    

    execBuilder.forEach((x) => {
        let actionString = `${x[0].slice(x[0].length-7, x[0].length-3)}`;
        let paddedThreads = `${x[2]}`.padEnd(5, " ");
        ns.printf(`${target} - A:${actionString} - T:${paddedThreads} - D:${x[3][1]}`);
        ns.exec(x[0], x[1], x[2], ...x[3]);
    });

    if (totalThreadsNeeded < threadsUsed)
        return false;
    return true;
}

function getBatchList(data){
    let resultList = [];

    let w1Batch = getBatchItem(data.W1Delay, data.W1Threads, Action.Weak);
    let gBatch = getBatchItem(data.GDelay, data.GThreads, Action.Grow);
    let w2Batch = getBatchItem(data.W2Delay, data.W2Threads, Action.Weak);

    resultList.push(w1Batch);
    resultList.push(gBatch);
    resultList.push(w2Batch);

    return resultList;
}

function getBatchItem(delay, threads, action){
    return [action, threads, delay]
}

function getAvailableThreads(){
    return serverObjects.reduce((total, server) => {
        return total + server.AvailableThreads; }, 0);
}

function getAvailableEmergencyThreads(ns, list){
    return list.reduce((total, server) => {
        return total + (ns.getServerMaxRam(server) - ns.getServerUsedRam(server)); }, 0)
}

function updateThreads(ns) {
    serverObjects.forEach((x) => {
        x.UsedThreads = calcHomeUsedThreads(ns)
        x.AvailableThreads = x.MaxThreads - x.UsedThreads;
    });
}
function getMaxthreads(ns) {
    serverObjects = [];
    let homeMaxRam = ns.getServerMaxRam(home);
    let reserved = calculateReserve(ns);
    let reservedExtra = calculateReserveExtra(homeMaxRam, reserved);
    let effectiveMax = homeMaxRam - reserved - reservedExtra;
    let maxThreads = Math.floor(effectiveMax / SCRIPT_RAM);

    serverObjects.push(new ThreadServer(home, maxThreads, 0));
}

function getRandomNumber() {
    let min = 1;
    let max = 150;
    let randomDecimal = Math.random();
    let randomNumber = min + randomDecimal * (max - min + 1);
    return Math.floor(randomNumber);
}

function calcHomeUsedThreads(ns) {
    let usedRam = ns.getServerUsedRam(home);
    let reservedRam = calculateReserve(ns);
    let serviceRam = usedRam - reservedRam;

    return Math.ceil(serviceRam / SCRIPT_RAM);
}

const ignoreList = [Action.Hack, Action.Grow, Action.Weak];
function calculateReserve(ns){
    let list  = ns.ps(home);
    let result = 0;
    for (let item of list){
        if (ignoreList.includes(item.filename))
            continue;

        result += ns.getScriptRam(item.filename);
    }

    return result;
}

function calculateReserveExtra(maxRam, reservedSpace) {
    let adaptedRam = maxRam - reservedSpace;
  
    for (const threshold of homeFreeSpaceThresholds) {
      if (adaptedRam <= threshold.maxRamThreshold) {
        return threshold.value;
      }
    }
  
    return 0; 
  }

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

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("ui.clearTerminal");
    ns.disableLog("exec");
    ns.disableLog("atExit");
    ns.disableLog("tail");
    ns.disableLog("moveTail");
    ns.disableLog("resizeTail");
    ns.disableLog("getPlayer");
    ns.disableLog("getServer");
}