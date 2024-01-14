/** @param {NS} ns */
export async function main(ns) {
    hideSomeLogging(ns);
    await ns.sleep(1000);
    ns.tail();
    ns.moveTail(2170,0);
    ns.resizeTail(388,389);
    ns.atExit(() => {
        ns.closeTail();
    });
    let target = ns.args[0];
    let maxHackThreads = ns.args[1];
    let maxGrowthThreads = ns.args[2];
    let maxWeakenThreads = ns.args[3];
    let minSec = ns.args[4];
    let maxMoney = ns.args[5];
    let server = "home";

    let minSecurityLevel = ns.getServerMinSecurityLevel(target);
    while (true) {
        let securityLevel = ns.getServerSecurityLevel(target);
        let moneyAvail = ns.getServerMoneyAvailable(target);
        let script = "";
        let threads = 0;
        let sleepTime = 0;
        let actionText = "";
        let hTime = ns.getHackTime(target);
        let wTime = ns.getWeakenTime(target);
        let gTime = ns.getGrowTime(target);

        if (securityLevel > minSecurityLevel + 1) {
            script = "old_scripts/ideal_weaken.js";
            threads = maxWeakenThreads;
            sleepTime = wTime;
            actionText = `Weaken -----`;
        }
        else if (moneyAvail < maxMoney) {
            script = "old_scripts/ideal_grow.js";
            threads = maxGrowthThreads;
            sleepTime = gTime;
            actionText = `Grow -----`;
        }
        else {
            script = "old_scripts/ideal_hack.js";
            threads = maxHackThreads;
            sleepTime = hTime;
            actionText = `Hack -----`;
        }
        let today = new Date();
        let timeFormatted = today.toLocaleTimeString(`sv`); // HH:mm:ss
        ns.print(`
${actionText}${timeFormatted}
--------------------------------
$          : ${ns.formatNumber(moneyAvail, 2)} / ${ns.formatNumber(maxMoney, 2)}
money %    : (${(moneyAvail / maxMoney * 100).toFixed(2)}%)
security   : ${minSecurityLevel.toFixed(2)} / ${securityLevel.toFixed(2)}
threads    : ${threads}
hack time  : ${ns.tFormat(hTime)}
grow time  : ${ns.tFormat(gTime)}
weaken time: ${ns.tFormat(wTime)}
hackChance : ${(ns.hackAnalyzeChance(target) * 100).toFixed(2)}%
--------------------------------
PID:${pID} | Server:${server}
Threads:${threads} | Target:${target}
--------------------------------`);
        var pID = ns.exec(script, server, threads, target);
        await ns.sleep(sleepTime + 1000);

        if (ns.isRunning(pID))
            await ns.sleep(1000)
            if (ns.isRunning(pID))
                ns.kill(pID);
    }
}

function hideSomeLogging(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("exec");
    ns.disableLog("sleep");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMoneyAvailable");
}