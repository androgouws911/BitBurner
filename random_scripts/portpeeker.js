let PORT = 10;
/** @param {NS} ns */
export async function main(ns) {
    if (ns.args[0] !== undefined)
        PORT = ns.args[0];
    let today = new Date();
    let timeFormatted = today.toLocaleTimeString(`sv`);
    disableLogs(ns);
    ns.tail();
    ns.atExit(() => {
        ns.closeTail();
    });
    while (true){
        today = new Date();
        timeFormatted = today.toLocaleTimeString(`sv`);
        ns.printf(`PORT-PEEKER:${timeFormatted} ${ns.peek(PORT)}`);   
        await ns.sleep(1000);

    }
}

function disableLogs(ns){
    ns.disableLog("disableLog")
    ns.disableLog("sleep");
}