/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    ns.tail();
    ns.atExit(() => {
        ns.closeTail();
    });
    while(true){
        ns.clearLog();
        const today = new Date();
        const dateFormatted = today.toLocaleDateString(`sv`); // YYYY-MM-DD
        const timeFormatted = today.toLocaleTimeString(`sv`); // HH:mm:ss

        ns.printf(`${dateFormatted} ${timeFormatted}`);
        await ns.sleep(500);
    }
}

/** @param {NS} ns */
function disableLogs(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("clearLog")
    ns.disableLog("tail");
    ns.disableLog("sleep");
    ns.disableLog("printf");
}