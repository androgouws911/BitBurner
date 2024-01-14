/** @param {NS} ns */
export async function main(ns) {
    var target = "";
    if (ns.args[0] == undefined) {
      target = ns.getHostname();
    }
    else
      target = ns.args[0];
    const moneyThresh = ns.getServerMaxMoney(target) * 0.5;
    const securityThresh = ns.getServerMinSecurityLevel(target) * 1.5;
  
    while (true) {
      var securityLevel = ns.getServerSecurityLevel(target);
      var moneyAvail = ns.getServerMoneyAvailable(target);
  
      if (securityLevel > securityThresh) {
        await ns.weaken(target);
        continue;
      }
  
      if (moneyAvail < moneyThresh) {
        await ns.grow(target);
        continue;
      }
  
      await ns.hack(target);
    }
  }