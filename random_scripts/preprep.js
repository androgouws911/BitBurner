export async function main(ns) {
  var rmList = ["early-hack-template.js", "hack.js", "analyze_server.js"];
  var target = ns.args[0];
  ns.killall(target);

  if (ns.fileExists("BruteSSH.exe", "home"))
    ns.brutessh(target);

  if (ns.fileExists("FTPCrack.exe", "home"))
    ns.ftpcrack(target);

  if (ns.fileExists("relaySMTP.exe", "home"))
    ns.relaysmtp(target);

  if (ns.fileExists("HTTPWorm.exe", "home"))
    ns.httpworm(target);
  
  if (ns.fileExists("SQLInject.exe", "home"))
    ns.sqlinject(target);
  
  ns.nuke(target);

  rmList.forEach(function(item) {
    ns.rm(item,target);
  });
  ns.scp("random_scripts/hack.js", target, "home");
}