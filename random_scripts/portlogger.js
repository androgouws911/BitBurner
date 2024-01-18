

/** @param {NS} ns */
export async function main(ns) {
    ns.tail();
    ns.disableLog("disableLog");
    ns.disableLog("sleep");
    ns.disableLog("readPort");
    while (true){
        let portRead = ns.readPort(6);
        if (portRead !== "NULL PORT DATA")
            ns.printf(portRead);

        await ns.sleep(1);
    }
}