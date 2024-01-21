const allPrograms = ["BruteSSH.exe","FTPCrack.exe","relaySMTP.exe","HTTPWorm.exe","SQLInject.exe","ServerProfiler.exe","DeepscanV1.exe","DeepscanV2.exe","AutoLink.exe","Formulas.exe"];
const home = "home";
/** @param {NS} ns */
export async function main(ns) {
    let count = 0;
    allPrograms.forEach((x) => {
        if (ns.fileExists(x, home))
            count++;
    });

    if (count === allPrograms.length)
        return;

    let money = ns.getServerMoneyAvailable(home);
    if (!ns.hasTorRouter() && money > 200000)
        ns.singularity.purchaseTor();

    if (!ns.hasTorRouter())
        return;

    allPrograms.forEach((x) => {
        let cost = ns.singularity.getDarkwebProgramCost(x);
        let alreadyBought = ns.fileExists(x, home);
        if (alreadyBought)
            return;
            
        money = ns.getServerMoneyAvailable(home);

        if (money > cost)
            ns.singularity.purchaseProgram(x);
    });
}