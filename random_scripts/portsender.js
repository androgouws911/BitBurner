import * as port_handler from 'scripts/handler/port_handler.js';
const PORT = 1;
/** @param {NS} ns */
export async function main(ns) {
    let today = new Date();
    let dateFormatted = today.toLocaleDateString(`sv`); // YYYY-MM-DD
    let timeFormatted = today.toLocaleTimeString(`sv`);
    disableLogs(ns);
    ns.tail();
    ns.atExit(() => {
        ns.closeTail();
    });
    let counter = ns.args[0];
    if (ns.args[0] === undefined || typeof ns.args[0] !== "integer")
        counter = 0;
    else
         counter = ns.arg[0];

    if (counter === undefined || counter == null || counter < 10)
        counter= 100;

    ns.printf(`PORT-SENDER: ${dateFormatted} ${timeFormatted} - START`);
    port_handler.clearNumPort(ns, PORT);
    ns.printf(`PORT-SENDER: ${dateFormatted} ${timeFormatted} - PORT CLEARED`);
    for (let i = 0; i < counter; i++) {
        today = new Date();
        dateFormatted = today.toLocaleDateString(`sv`); // YYYY-MM-DD
        timeFormatted = today.toLocaleTimeString(`sv`);
        ns.printf(`PORT-SENDER: ${dateFormatted} ${timeFormatted} - LOOPING:${i}`);
        let testList = [i, i + 1, i + 2, i + 3, i + 4, i + 5];
        ns.printf(`PORT-SENDER: ${dateFormatted} ${timeFormatted} - POSTING`);
        await port_handler.writeToPort(ns, PORT, testList);
        ns.printf(`PORT-SENDER: ${dateFormatted} ${timeFormatted} - POSTED`);   
        await ns.sleep(500);
    }
    ns.printf(`PORT-SENDER: ${dateFormatted} ${timeFormatted} - LOOPEND`);

    ns.closeTail();
}

function disableLogs(ns){
    ns.disableLog("disableLog")
    ns.disableLog("sleep");
}