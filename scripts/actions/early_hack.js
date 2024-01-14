const MONEY_THRESHOLD = 0.75;
const SECURITY_THRESHOLD = 5;
const ONE_SECOND = 1000;

/** @param {NS} ns */
export async function main(ns) {
    let target = ns.args[0];
    var moneyThresh = ns.getServerMaxMoney(target) * MONEY_THRESHOLD;
    var securityThresh = ns.getServerMinSecurityLevel(target) + SECURITY_THRESHOLD;

    while(true) {
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }

        await ns.sleep(ONE_SECOND);
    }
}
