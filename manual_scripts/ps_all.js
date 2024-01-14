import { crawl } from 'scripts/handler/server_crawl.js';
import {Action } from 'scripts/data/file_list.js';
const actionList = [Action.Weak, Action.Grow, Action.Hack];
/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("getPlayer");
    ns.disableLog("getServer");
    ns.disableLog("scan");
    ns.disableLog("ps");

    let serverList = crawl(ns);
    let lengthBuffer = Math.max(...serverList.map((x) => x.length));
    let player = ns.getPlayer();
    serverList.forEach((x) => {
        let serverPS = ns.ps(x);
        if (serverPS.length < 1)
            return;
       
        let hasMatch = serverPS.some((f) => actionList.includes(f.filename));
        if (!hasMatch)
            return;

        ns.printf(`${x}:${" ".repeat(lengthBuffer-x.length-1)}\n`);    
        ns.printf(`${"-".repeat(lengthBuffer+5)}`);
        ns.tprintf(`${x}:${" ".repeat(lengthBuffer-x.length-1)}\n`);
        ns.tprintf(`${"-".repeat(lengthBuffer+5)}`);
        serverPS.forEach((y) => {
            if (!actionList.includes(y.filename))
                return;

            let fileName = y.filename;
            let fileString = fileName.substring(fileName.length-7, fileName.length-3);
            let target = y.args[0];
            let targetS = ns.getServer(x);
            let delay = y.args[1];
            let delayTime = 
                fileString === "weak" ? ns.formulas.hacking.weakenTime(targetS, player) :
                fileString === "hack" ? ns.formulas.hacking.hackTime(targetS, player) :
                fileString === "grow" ? ns.formulas.hacking.growTime(targetS, player) : "";
            let delayString = ns.tFormat(delayTime);
            let threads = `${y.threads}`.padEnd(8, " ");
            let targetBuffer = lengthBuffer - target.length;
            let argString = `Tgt: ${target}${" ".repeat(targetBuffer)}| ${delayString} | D: ${delay}`
            ns.tprintf(`${fileString} T:${threads} | ${argString}`);
            ns.printf(`${fileString} T:${threads} | ${argString}`);
        });
        ns.tprintf("-".repeat(lengthBuffer+5));     
        ns.printf("-".repeat(lengthBuffer+5));     
    });
}