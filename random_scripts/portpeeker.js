import { _port_list } from 'scripts/enums/ports.js';
/** @param {NS} ns */
export async function main(ns) {
    let inList = [];
    let port = _port_list.HWGW_THREADS;
    let today = new Date();
    let timeFormatted = today.toLocaleTimeString(`sv`);
    disableLogs(ns);
    ns.tail();
    ns.atExit(() => {
        for (let item of inList){
            ns.tprintf(`${item.name} ${item.timestamp}`);
        }
        ns.closeTail();
    });
    let currentPeek = "";
    let lastPeek = "";
    while (true){
        today = new Date();
        timeFormatted = today.toLocaleTimeString(`sv`);
        while (ns.peek(port) === "NULL PORT DATA"){
            if (lastPeek !== ""){
                if (inList.length > 0 && inList.includes(lastPeek)){
                    index = inList.findIndex(item => item.name === lastPeek);
                    if (index !== -1){
                        ns.printf(`${lastPeek} removed from list`);
                        ns.printf("-".repeat(20));
                        inList.splice(index, 1);
                    }
                }
                lastPeek = "";
            }
            await ns.sleep(100);
        }

        currentPeek = ns.peek(port);
        if (lastPeek !== currentPeek.name){
            ns.printf(`${timeFormatted} ${currentPeek}`);   
            ns.printf(`Last peak: ${lastPeek}`);  
            ns.printf("-".repeat(20));          
            lastPeek = currentPeek.name;
            if (currentPeek !== ""){
                ns.printf(`${currentPeek} added to list`);
                ns.printf("-".repeat(20));
                inList.push({name: currentPeek.name, timestamp: new Date().getTime()});
            }
        }

        await ns.sleep(100);
    }
}

function disableLogs(ns){
    ns.disableLog("disableLog")
    ns.disableLog("sleep");
}