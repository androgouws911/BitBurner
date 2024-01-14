const apps = [
    { name: "BruteSSH.exe", action: (ns, target) => ns.brutessh(target) },
    { name: "FTPCrack.exe", action: (ns, target) => ns.ftpcrack(target) },
    { name: "relaySMTP.exe", action: (ns, target) => ns.relaysmtp(target) },
    { name: "HTTPWorm.exe", action: (ns, target) => ns.httpworm(target) },
    { name: "SQLInject.exe", action: (ns, target) => ns.sqlinject(target) }
];
const home = "home";

/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];

    for (const app of apps) {
        if (ns.fileExists(app.name, home)) {
            app.action(ns, target);
        }
    }
    let portsReq = ns.getServerNumPortsRequired(target);
    let portsOpen = ns.getServer(target).openPortCount;
    if (portsReq <= portsOpen)
        ns.nuke(target);
}