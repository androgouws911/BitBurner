/** @param {NS} ns */
export async function main(ns) {
    let list = ns.infiltration.getPossibleLocations();
    
    let maxLength = Math.max(...list.map((z) => z.name.length));
    list.sort((a, b) => b.reward.tradeRep - a.reward.tradeRep);
    list.forEach((x) => {
        let infiltr = ns.infiltration.getInfiltration(x.name);
        ns.tprintf(`${x.name}${" ".repeat(maxLength -x.name.length)} ${ns.formatNumber(infiltr.reward.tradeRep, 2).padEnd(8," ")} - $${ns.formatNumber(infiltr.reward.sellCash, 2)}`);
    });
}
