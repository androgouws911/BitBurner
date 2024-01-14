/** @param {NS} ns **/
export async function main(ns) {
    const sleep = ns.args[1] || 1;
    await ns.sleep(sleep);
    await ns.weaken(ns.args[0]);
}