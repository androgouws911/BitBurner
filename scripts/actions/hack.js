/** @param {NS} ns **/
export async function main(ns) {
    const sleep = ns.args[1] || 1;
    await ns.sleep(sleep);
    await ns.hack(ns.args[0]);
}