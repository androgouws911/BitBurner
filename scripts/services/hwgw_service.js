import { getHWGWPostData_Mock } from 'scripts/helpers/thread_calc_helper.js';
import { writeToPort, readFromPort } from 'scripts/handler/port_handler.js';
import { SCRIPT_RAM } from 'scripts/handler/general_handler.js';
import { ThreadServer } from 'scripts/models/thread_models.js';
import { _port_list } from 'scripts/enums/ports.js';
import { Action, Services } from 'scripts/data/file_list.js';
import { getHWGWAllocation } from 'scripts/helpers/hwgw_wgw_server_alloc_helper';
import { handleTailState } from 'scripts/helpers/tail_helper';

const state = {
    Ready : 1,
    Prepped : 2,
    Hacked : 3
};

let serverObjects = [];
const QUARTER_SECOND = 250;
const HALF_SECOND = 500;
const ONE_SECOND = 1000;
const FIVE_SECONDS = 5000;
const TEN_SECONDS = 10000;
const ONE_MINUTE = 60000;
const home = "home";

let SPACING = TEN_SECONDS;
let DELAY = 20;
let instanceCount = 1;
let instanceID = 0;
let tailStateTime;

/** @param {NS} ns */
export async function main(ns) {
    tailStateTime = new Date().getTime();
    instanceID = ns.args[0];
    if (ns.args[0] === undefined){
        ns.atExit(() => {
            ns.closeTail();
            let hph = ns.getRunningScript(Services.HackHandler, home);
            if (hph)
                ns.kill(hph.pid);
        });
        instanceID = 1;
    }
    else {
        ns.atExit(() => {
            ns.closeTail();
        });
    }

    let sizeX = 300;
    let sizeY = 180;
    let posX = calculateTailXPosition(instanceID);
    let posY = calculateTailYPosition(instanceID);
    disableLogs(ns);
    await ns.sleep(TEN_SECONDS);
    while (true){
        handleTailState(ns, sizeX, sizeY, posX, posY);
        fetchThreads(ns);
        let maxThreads = getMaxThreads();
        SPACING = getSpacing(ns);
    
        let data = await readFromPort(ns, _port_list.HWGW_THREADS);
        if (data == null){
            await ns.sleep(HALF_SECOND);
            continue;
        }

        await postToHistoryPort(ns, data.name);
        updateThreads(ns);
        let currentTime = new Date().getTime();
        let endTime = new Date().getTime();        
        if (targetInIdealState(ns, data.name)){
            let player = ns.getPlayer();
            let server = ns.getServer(data.name);
            server.hackDifficulty = server.minDifficulty;
            server.moneyAvailable = server.moneyMax;
            let post = await getHWGWPostData_Mock(ns, server, player, DELAY);
            let threads = post.HThreads + post.W1Threads + post.GThreads + post.W2Threads;
            if (threads > maxThreads){
                data.state = state.Hacked;
                data.time = new Date().getTime() + ONE_MINUTE;
                await writeToPort(ns, _port_list.HANDLER_PORT, data);
                continue;
            }

            let weakT = ns.formulas.hacking.weakenTime(server, player);
            let safeWeakTiming = Math.ceil(weakT/1000);
            safeWeakTiming = safeWeakTiming * 0.95;
            safeWeakTiming = safeWeakTiming * 1000;
            let currentTime = new Date().getTime();
            let endLoopTime = new Date().setTime(currentTime + safeWeakTiming);
            let currentDate = new Date();
            let timeFormatted = currentDate.toLocaleTimeString(`sv`);
            let serverObjString = "";
            serverObjects.forEach((x) => serverObjString += `${x.ServerName} `);
            serverObjString = serverObjString.trimEnd();
            ns.printf(`AllocServers: ${serverObjString}`);
            ns.printf(`${"-".repeat(25)}`);
            ns.printf(`${timeFormatted}`);
            ns.printf(`Hacking ${data.name}`);
            while (currentTime <= endLoopTime){
                currentTime = new Date().getTime();                
                if (!targetInIdealState(ns, data.name)){
                    await ns.sleep(1);
                    continue;
                }
                updateThreads(ns);
                let availableThreads = getAvailableThreads();
                while (availableThreads < threads){
                    currentTime = new Date().getTime();
                    ns.printf(`${new Date(currentTime).toLocaleTimeString('sv')}`);
                    ns.printf(`Not enough threads to post`);
                    ns.printf(`(E:${ns.tFormat(endLoopTime-currentTime)})`);
                    updateThreads(ns);
                    availableThreads = getAvailableThreads();
                    await ns.sleep(SPACING);
                    
                    if (endLoopTime <= currentTime)
                        break;
                }

                if (endLoopTime <= currentTime)
                        break;
                
                let batchList = getBatchList(post);
                ns.printf(`Hacking ${data.name}: `);
                ns.printf(`${ns.tFormat(endLoopTime - currentTime)}`);
                let result = await executeThreadsToServers(ns, batchList, data.name);
                currentTime = new Date().getTime();
                if (result)
                    endTime = currentTime + weakT + TEN_SECONDS;
                else
                    ns.printf(`${ new Date().toLocaleTimeString('sv')} - No threads`);

                await ns.sleep(SPACING);
                ns.printf(`${"-".repeat(25)}`);
            }
        }
        else{    
            let secString = `S:${ns.formatNumber(ns.getServerSecurityLevel(data.name), 2)}/${ns.getServerMinSecurityLevel(data.name)}`;
            let monString = `$: ${ns.formatNumber(ns.getServerMoneyAvailable(data.name),2)}/${ns.formatNumber(ns.getServerMaxMoney(data.name),2)}`;
            ns.printf(`Not Ideal State: ${data.name} - ${secString} | M: ${monString}`);   
            endTime = currentTime;
        }

        data.state = state.Hacked;
        data.time = endTime;
        ns.printf(`Writing to Handler: `);
        ns.printf(`${data.name}`);
        ns.printf(`${ns.tFormat(data.time - new Date().getTime())}`);
        ns.printf(`${"-".repeat(25)}`);
        await writeToPort(ns, _port_list.HANDLER_PORT, data);
    }
}

function calculateTailXPosition(id) {
    if ((id % 7) - 1 < 0)
        return 250 + (((id - 1) % 7) * 305);

    return 250 + (((id % 7) - 1) * 305);
}

function calculateTailYPosition(id) {
    return (Math.floor((id - 1) / 7) * 185);
}

function targetInIdealState(ns, targetName){
    let minSec = ns.getServerMinSecurityLevel(targetName);
    let curSec = ns.getServerSecurityLevel(targetName);
    let availM = ns.getServerMoneyAvailable(targetName);
    let maxM = ns.getServerMaxMoney(targetName);

    if (minSec != curSec)
        return false;

    if (availM != maxM)
        return false;

    return true;
}
/** @param {NS} ns */
async function executeThreadsToServers(ns, batchList, target) {
    let execBuilder = [];
    let totalNeeded = 0;
    let totalUsed = 0;
    for (let batch of batchList){
        let threadsNeeded = batch[1];
        totalNeeded += threadsNeeded;
        let currentLeft = threadsNeeded;
        let action = batch[0];
        let delay = batch[2];
        let counter = 0;
        serverObjects.sort((a, b) => b.AvailableThreads - a.AvailableThreads);
        while (counter < threadsNeeded) {
            if (currentLeft === 0 || getAvailableThreads() <= 0)
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
            totalUsed +=useThreads;
            x.AvailableThreads -= useThreads;
            
            if (currentLeft === 0 || getAvailableThreads() <= 0)
                return true;
            });
        }
    }

    if (totalNeeded !== totalUsed)
        return false;

    for (let x of execBuilder){
        let actionString = `${x[0].slice(x[0].length-7, x[0].length-3)}`;
        let paddedThreads = `${x[2]}`.padEnd(5, " ");
        while(!targetInIdealState(ns, target)){
            await ns.sleep(1);
            continue;
        }
        
        await ns.exec(x[0], x[1], x[2], ...x[3]);
        ns.printf(`A:${actionString} - T:${paddedThreads} D:${ns.formatNumber(x[3][1],2)}`);
    }

    return true;
}

function getAvailableThreads(){
    return serverObjects.reduce((total, server) => {
        return total + server.AvailableThreads; }, 0);
}

function getMaxThreads(){
    return serverObjects.reduce((total, server) => {
        return total + server.MaxThreads; }, 0);
}

function getBatchList(data){
    let resultList = [];

    let hBatch = getBatchItem(data.HDelay, data.W1Threads, Action.Hack);
    let w1Batch = getBatchItem(data.W1Delay, data.W1Threads, Action.Weak);
    let gBatch = getBatchItem(data.GDelay, data.GThreads, Action.Grow);
    let w2Batch = getBatchItem(data.W2Delay, data.W2Threads, Action.Weak);

    resultList.push(hBatch);
    resultList.push(w1Batch);
    resultList.push(gBatch);
    resultList.push(w2Batch);

    return resultList;
}

function getBatchItem(delay, threads, action){
    return [action, threads, delay]
}

function updateThreads(ns) {
    fetchThreads(ns);
    serverObjects.forEach((x) => {
        x.UsedThreads = calcServerUsedThreads(ns, x.ServerName);
        x.AvailableThreads = x.MaxThreads - x.UsedThreads;
    });
}

function fetchThreads(ns) {
    getInstanceCount(ns);
    serverObjects = []; 
    let serversAllowed = [];
    let allocate = getHWGWAllocation(ns);
    
    if (instanceCount === 1)
        serversAllowed = allocate;
    else{
        let totalServers = allocate.length;
        let serversPerInstance = Math.floor(totalServers / instanceCount);
        let extraServers = totalServers % instanceCount;

        if (instanceID > totalServers)
            instanceID = instanceID % totalServers === 0 ? totalServers : instanceID % totalServers;

        let startIdx = (instanceID - 1) * serversPerInstance;
        let endIdx = startIdx + serversPerInstance;
    
        if (extraServers > 0)
        {
            if (instanceID <= extraServers) {
                startIdx += instanceID - 1;
                endIdx += instanceID;
            }
            else{
                startIdx += extraServers;
                endIdx += extraServers;
            }
        }

        serversAllowed = allocate.slice(startIdx, endIdx);
    }    

    serversAllowed.forEach((x) => {
        let maxRam = ns.getServerMaxRam(x);
        let maxThreads = Math.floor(maxRam / SCRIPT_RAM);
        serverObjects.push(new ThreadServer(x, maxThreads, 0));
    });
}

function getInstanceCount(ns){
    let homePs = ns.ps(home);
    if (homePs.length < 1)
        return 0;
    
    let count = homePs.reduce((acc, obj) => {
        if (obj.filename === Services.HWGW) {
          return acc + 1;
        }
        return acc;
      }, 0);

    return count;
}

function calcServerUsedThreads(ns, name) {
    let ram = ns.getServerUsedRam(name);
    if (ram === 0) return 0;

    return Math.ceil(ram / SCRIPT_RAM);
}

function getRandomNumber() {
    let min = 1;
    let max = 150;
    let randomDecimal = Math.random();
    let randomNumber = min + randomDecimal * (max - min + 1);
    return Math.floor(randomNumber);
}

async function postToHistoryPort(ns, targetName){
    let historyPacket = { id: instanceID, target: targetName };
    await writeToPort(ns, _port_list.HISTORY_PORT, historyPacket);
    ns.printf(`Waiting for target safety`);
    await ns.sleep(FIVE_SECONDS);
}

function getSpacing(ns) {
    let pServers = ns.getPurchasedServers();
    let maxThreads = pServers.reduce((total, server) =>{ return total + ns.getServerMaxRam(server);});
    for (const threshold of threads_threshold) {
        if (maxThreads < threshold.threads) {
            return threshold.value;
        }
    }

    return 0; 
}

const threads_threshold = [
    { threads: 100, value: TEN_SECONDS },
    { threads: 10000, value: ONE_SECOND },
    { threads: 100000, value: HALF_SECOND },
    { threads: 1000000, value: QUARTER_SECOND }
];



function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("ui.clearTerminal");
    ns.disableLog("getHackingLevel");
    ns.disableLog("resizeTail");
    ns.disableLog("getPlayer");
    ns.disableLog("getServer");
    ns.disableLog("moveTail");
    ns.disableLog("atExit");
    ns.disableLog("sleep");
    ns.disableLog("exec");
    ns.disableLog("tail");
}