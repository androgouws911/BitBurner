import { writeToPort, readFromPort } from 'scripts/handler/port_handler.js';
import { getWGWPostData_Mock } from 'scripts/helpers/thread_calc_helper.js';
import { ThreadServer } from 'scripts/models/thread_models.js';
import { _port_list } from 'scripts/enums/ports.js';
import { Action } from 'scripts/data/file_list.js';

let serverObjects = [];
const home = "home";
const HALF_SECOND = 500;
const ONE_SECOND = 1000;
const TEN_SECONDS = 10000;
const actionList = [ Action.Hack, Action.Grow, Action.Weak];
let SCRIPT_RAM =  0;

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    ns.atExit(() => {
        ns.closeTail();
    });

    SCRIPT_RAM = ns.getScriptRam(Action.Weak);
    await ns.sleep(TEN_SECONDS);

    while (true){        
        let data = await readFromPort(ns, _port_list.WGW_THREADS);
        if (data === null){
            await ns.sleep(HALF_SECOND);
            continue;
        }
        
        fetchThreads(ns);
        let currentTime = new Date().getTime();
        let endTime = currentTime;
        let player = ns.getPlayer();
        let server = ns.getServer(data.name);
        let homeServer = ns.getServer(home);
        let post = await getWGWPostData_Mock(ns, server, player, homeServer.cpuCores);
        let threads = post.W1Threads + post.W2Threads + post.GThreads;
        let weakT = ns.formulas.hacking.weakenTime(server, player);
        if (threads > 0){
            ns.printf(`${"-".repeat(50)}`);
            ns.printf(`Mending ${data.name}`);
            let batchList = getBatchList(post);
            let toBePosted = true;
            updateThreads(ns);
            while (toBePosted){
                let result = await executeThreadsToServers(ns, batchList, data.name);
                toBePosted = result !== null;
                
                if (result){
                    post = calculateRemaingPostData(result, post);
                    batchList = getBatchList(post);
                    threads = post.W1Threads + post.W2Threads + post.GThreads;
                    updateThreads(ns);
                    let availableThreads = getAvailableThreads();
                    let minThread = threads*0.2;
                    while (availableThreads < minThread){
                        await ns.sleep(ONE_SECOND);
                        updateThreads(ns);
                        availableThreads = getAvailableThreads();
                    }
                }
                
                await ns.sleep(ONE_SECOND);
            }
            
            currentTime = new Date().getTime();
            endTime = currentTime + weakT;
        }
        data.time = endTime;
        ns.printf(`${data.name} removed and submitted to handler`);
        await writeToPort(ns, _port_list.HANDLER_PORT, data);
        await ns.sleep(ONE_SECOND);
    }
}
/** @param {NS} ns */
async function executeThreadsToServers(ns, batchList, target) {
    let totalNeeded = 0;
    let threadsUsed = 0;
    let execBuilder = [];
    for (let batch of batchList){
        let threadsNeeded = batch[1];
        totalNeeded+=threadsNeeded;
        let currentLeft = threadsNeeded;
        let action = batch[0];
        let delay = batch[2];
        let counter = 0;
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
            x.AvailableThreads -= useThreads;
            threadsUsed+=useThreads;
            if (currentLeft === 0 || getAvailableThreads() <= 0)
                return true;
            });
        }
    }    
    execBuilder.forEach((x) => {
        if (x[2] === 0)
            return;

        ns.exec(x[0], x[1], x[2], ...x[3]);
    });

    if (threadsUsed !== totalNeeded)
        return execBuilder;

    return null;
}

function calculateRemaingPostData(execBuilder, postData){
    let execValues = getExecBuilderValues(execBuilder);

    let w1ExecutedItem = findItemByActionTypeAndSecondElement(Action.Weak, postData.W1Delay, execValues);
    if (w1ExecutedItem === undefined)
        w1ExecutedItem = { action: Action.Weak, threads: 0 };
    let gExecutedItem = findItemByActionTypeAndSecondElement(Action.Grow, postData.GDelay, execValues);
    if (gExecutedItem === undefined)
        gExecutedItem = { action: Action.Grow, threads: 0 };
    let w2ExecutedItem = findItemByActionTypeAndSecondElement(Action.Weak, postData.W2Delay, execValues);
    if (w2ExecutedItem === undefined)
        w2ExecutedItem = { action: Action.Weak, threads: 0 };
    let result = {
        ServerName: postData.ServerName,
        W1Delay: postData.W1Delay,
        GDelay: postData.GDelay,
        W2Delay: postData.W2Delay,
        W1Threads: postData.W1Threads - w1ExecutedItem.threads,
        GThreads: postData.GThreads - gExecutedItem.threads,
        W2Threads: postData.W2Threads - w2ExecutedItem.threads,
    };

    return result;
}

function getExecBuilderValues(execBuilderList){
    const result = [];  
    for (const item of execBuilderList) {
        const action = item[0];
        const delay = item[3][1];
    
        const existingResult = result.find((entry) => entry.action === action && entry.delay === delay);
  
        if (existingResult) {
            existingResult.threads += item[2];
        } else {
            const newResult = {
                action,
                threads: item[2],
                delay: delay,
            };
            result.push(newResult);
        }
    }

    return result;
}

function findItemByActionTypeAndSecondElement(action, delay, resultList) {
    return resultList.find((item) => item.action === action && item.delay === delay);
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

function updateThreads(ns) {
    serverObjects.forEach((x) => {
        x.UsedThreads = calcHomeUsedThreads(ns);
        x.AvailableThreads = x.MaxThreads - x.UsedThreads;
    });
}

function calcHomeUsedThreads(ns){
    let used = ns.getServerUsedRam(home);
    let reserve = getHomeReservedRam(ns);

    let ram = used - reserve;
    if (ram === 0) return 0;

    return Math.ceil(ram / SCRIPT_RAM);
}

function fetchThreads(ns) {
    serverObjects = [];
    let homeRam = (ns.getServerMaxRam(home) - getHomeReservedRam(ns)) * 0.8;
    let homeThreads = Math.floor(homeRam / SCRIPT_RAM);
    serverObjects.push(new ThreadServer(home, homeThreads));
}

function getHomeReservedRam(ns){
    let list = ns.ps(home);
    if (list === undefined || list.length < 1)
        return 0;

    let scriptReserve = list.reduce((total, script) => { 
        if (actionList.includes(script.filename))
            return 0;

        return total + ns.getScriptRam(script.filename); 
    }, 0);

    return scriptReserve;
}

function getRandomNumber() {
    let min = 1;
    let max = 150;
    let randomDecimal = Math.random();
    let randomNumber = min + randomDecimal * (max - min + 1);
    return Math.floor(randomNumber);
}

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
    ns.disableLog("getHackingLevel");
    ns.disableLog("getPlayer");
    ns.disableLog("getServer");
}