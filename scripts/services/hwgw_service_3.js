import { getHWGWPostData_Mock } from 'scripts/helpers/thread_calc_helper.js';
import { writeToPort, readFromPort } from 'scripts/handler/port_handler.js';
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
const DESYNC_DELAY = 30;
const QUARTER_SECOND = 250;
const HALF_SECOND = 500;
const ONE_SECOND = 1000;
const TEN_SECONDS = 10000;
const ONE_MINUTE = 60000;
const home = "home";

let SPACING = TEN_SECONDS;
let DELAY = SPACING / 5;

/** @param {NS} ns */
export async function main(ns) {
    ns.tail();
    ns.resizeTail(600,180);
    ns.moveTail(1750,360);
    ns.atExit(() => {
        ns.closeTail();
        let hwgw4 = ns.getRunningScript(Services.HWGW4, home);
        if (hwgw4)
            ns.kill(hwgw4.pid);
    });
    disableLogs(ns);
    await ns.sleep(TEN_SECONDS);
    await ns.sleep(DESYNC_DELAY);
    while (true){
        getMaxthreads(ns);
        let maxThreads = getAvailableThreads();
        SPACING = getSpacing(maxThreads);
        DELAY = SPACING / 5;
    
        let data = await readFromPort(ns, _port_list.HWGW_THREADS);
        if (data == null){
            await ns.sleep(HALF_SECOND);
            continue;
        }

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
            let safeWeakTiming = weakT * 0.95;
            let currentTime = new Date().getTime();
            let endLoopTime = new Date().setTime(currentTime + safeWeakTiming);
            let currentDate = new Date();
            let timeFormatted = currentDate.toLocaleTimeString(`sv`);
            ns.printf(`${timeFormatted} - Hacking ${data.name}`);
            while (currentTime <= endLoopTime){
                currentTime = new Date().getTime();
                if (!targetInIdealState(ns, data.name)){
                    await ns.sleep(1);
                    continue;
                }
                updateThreads(ns);
                let availableThreads = getAvailableThreads();
                while (availableThreads < threads){
                    updateThreads(ns);
                    availableThreads = getAvailableThreads();
                    await ns.sleep(SPACING);
                    
                    if (endLoopTime <= currentTime)
                        break;
                }

                if (endLoopTime <= currentTime)
                        break;
                
                let batchList = getBatchList(post);
                ns.printf(`Hacking ${data.name}: ${ns.tFormat(endLoopTime - currentTime)}`);
                await executeThreadsToServers(ns, batchList, data.name);
                currentTime = new Date().getTime();
                endTime = currentTime + weakT + TEN_SECONDS;
                await ns.sleep(SPACING);
                ns.printf(`${"-".repeat(25)}`);
            }
        }
        else{    
            ns.printf(`Not Ready to Hack: ${data.name}`);   
            endTime = currentTime;
        }

        data.state = state.Hacked;
        data.time = endTime;
        ns.printf(`Writing to Handler: ${data.name} - ${ns.tFormat(data.time - new Date().getTime())}`);
        ns.printf(`${"-".repeat(50)}`);
        await writeToPort(ns, _port_list.HANDLER_PORT, data);
    }
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
    for (let batch of batchList){
        let threadsNeeded = batch[1]
        let currentLeft = threadsNeeded;
        let action = batch[0];
        let delay = batch[2];
        let counter = 0;
        serverObjects.sort((a, b) => b.AvailableThreads - a.AvailableThreads);
        while (counter < threadsNeeded) {
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
            
            if (currentLeft == 0)
                return true;
            });
        }
    }

    for (let x of execBuilder){
        let actionString = `${x[0].slice(x[0].length-7, x[0].length-3)}`;
        let paddedThreads = `${x[2]}`.padEnd(5, " ");
        while(!targetInIdealState(ns, target)){
            await ns.sleep(1);
            continue;
        }
        
        await ns.exec(x[0], x[1], x[2], ...x[3]);
        ns.printf(`${x[2]} - A:${actionString} - T:${paddedThreads} - D:${x[3][1]}`);
    }
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

function getAvailableThreads(){
    return serverObjects.reduce((total, server) => {
        return total + server.AvailableThreads; }, 0);
}

function updateThreads(ns) {
    serverObjects.forEach((x) => {
        x.UsedThreads = calcServerUsedThreads(ns, x.ServerName);
        x.AvailableThreads = x.MaxThreads - x.UsedThreads;
    });
}

function getMaxthreads(ns) {
    serverObjects = [];
    let purchasedServers = ns.getPurchasedServers(ns);    
    if (purchasedServers.length == 25)
        purchasedServers = purchasedServers.slice(10,15);
    purchasedServers.forEach((x) => {
        let maxRam = ns.getServerMaxRam(x);
        let maxThreads = Math.floor(maxRam / SCRIPT_RAM);
        serverObjects.push(new ThreadServer(x, maxThreads, 0));
    });
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

function getSpacing(maxThreads) {
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
    { threads: Infinity, value: QUARTER_SECOND },
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