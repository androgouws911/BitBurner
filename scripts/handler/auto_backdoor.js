import { maxPortsOpen } from "scripts/handler/general_handler.js";
import { Handler } from 'scripts/data/file_list.js';

const backdoorList = ["CSEC", "I.I.I.I", "run4theh111z", "avmnite-02h", "The-Cave", "w0r1d_d43m0n" ];
const apps = [
    { name: "BruteSSH.exe", action: (ns, target) => ns.brutessh(target) },
    { name: "FTPCrack.exe", action: (ns, target) => ns.ftpcrack(target) },
    { name: "relaySMTP.exe", action: (ns, target) => ns.relaysmtp(target) },
    { name: "HTTPWorm.exe", action: (ns, target) => ns.httpworm(target) },
    { name: "SQLInject.exe", action: (ns, target) => ns.sqlinject(target) }
];

/** @param {NS} ns */
export async function main(ns) {
    let hackingLevel = ns.getHackingLevel();
    let maxPorts = maxPortsOpen(ns);
    for (let target of backdoorList){
        if (!ns.serverExists(target))
            continue;

        let server = ns.getServer(target);
        if (server.backdoorInstalled)
            continue;

        if (hackingLevel < server.requiredHackingSkill)
            continue;

        if (maxPorts < server.numOpenPortsRequired)
            continue;

        if (server.openPortCount < server.numOpenPortsRequired){
            for (let app of apps) {
                if (ns.fileExists(app.name, home)) {
                    app.action(ns, target);
                }
            }
        }

        if (!server.hasAdminRights){
            ns.nuke(target);
        }
        
        let currentServer = ns.singularity.getCurrentServer();
        let path = getConnectionPath(ns, currentServer, target);
        path.forEach((x) => ns.singularity.connect(x));
        await ns.singularity.installBackdoor();
    }

    ns.singularity.connect("home");
    ns.ui.clearTerminal();
    await ns.sleep(2000);
    ns.run(Handler.FactionJoiner, 1);
}

function getConnectionPath(ns, server1, server2){
    let new_servers = []
    scanAndBuild("home", new_servers, ns);
    let connection = findConnectionPath(server1, server2, new_servers);
    return connection;
}


function scanAndBuild(serverName, scannedServers, ns) {
    let existingServer = scannedServers.find((server) => server[0] === serverName);
  
    if (!existingServer) {
      let connectedServers = ns.scan(serverName);
      let newServer = [serverName, connectedServers];
      scannedServers.push(newServer);
  
      connectedServers.forEach((connectedServer) => {
        scanAndBuild(connectedServer, scannedServers, ns);
      });
    }
  }
  
  function findConnectionPath(startServer, endServer, scannedServers) {
    let visited = new Set();
    let path = [];
  
    function dfs(serverName) {
      visited.add(serverName);
  
      for (let server of scannedServers) {
        if (server[0] === serverName) {
          path.push(serverName);
  
          if (serverName === endServer) {
            return true; 
          }
  
          for (let connectedServer of server[1]) {
            if (!visited.has(connectedServer) && dfs(connectedServer)) {
              return true;
            }
          }
  
          path.pop();
        }
      }
  
      return false; 
    }
  
    if (dfs(startServer)) {
      return path;
    } else {
      return null;
    }
  }