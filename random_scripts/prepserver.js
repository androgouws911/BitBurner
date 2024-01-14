/** @param {NS} ns */
export async function main(ns) {
  var rmList = ["early-hack-template.js", "hack.js", "analyze_server.js"];
  var target = ns.args[0];
  if (target == "home")
    return;
  var openPorts = 0;
  ns.killall(target);

  if (ns.fileExists("BruteSSH.exe", "home"))
  {
    ns.brutessh(target);
    openPorts++;
  }

  if (ns.fileExists("FTPCrack.exe", "home"))
  {
    ns.ftpcrack(target);
    openPorts++;
  }

  if (ns.fileExists("relaySMTP.exe", "home"))
  {
    ns.relaysmtp(target);
    openPorts++;
  }

  if (ns.fileExists("HTTPWorm.exe", "home"))
  {
    ns.httpworm(target);
    openPorts++;
  }
  
  if (ns.fileExists("SQLInject.exe", "home"))
  {
    ns.sqlinject(target);
    openPorts++;
  }

  ns.nuke(target);
  var playerHackLevel = ns.getHackingLevel();
  var serverHackLevel = ns.getServerRequiredHackingLevel(target);
  var canHack = playerHackLevel >= serverHackLevel;

  var requiredPorts = ns.getServerNumPortsRequired(target);
  var enoughPorts = openPorts >= requiredPorts;
  
  if (!enoughPorts || !canHack)
    return;

  ns.tprint(`${target} Nuked`);
  rmList.forEach(function(item) {
    ns.rm(item,target);
  });
  ns.scp("random_scripts/hack.js", target, "home");
  var targetRam = ns.getServerMaxRam(target);
  var scriptRam = ns.getScriptRam("random_scripts/hack.js");
  var targetThreads = Math.floor(targetRam / scriptRam);

  // ns.singularity.connect(target);
  // ns.print(`Backdooring: ${ns.getHostname()}`);
  // ns.singularity.installBackdoor();
  //Initialize hack script
  if (targetThreads >= 1){
    ns.exec("random_scripts/hack.js", target, targetThreads);
  }
}