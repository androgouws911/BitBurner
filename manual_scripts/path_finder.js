/** @param {NS} ns */
export async function main(ns) {
    if (ns.args[0] === undefined && ns.args[1] === undefined)
        printServerList(ns);
    else{
        if (ns.args[1] === undefined){
            ns.args[1] = ns.args[0];
            ns.args[0] = "home";
        }
        printConnectedPath(ns, ns.args[0], ns.args[1]);
  }
}

function printServerList(ns){
    ns.tprintf("-".repeat(50));
    let new_servers = []
    scanAndBuild("home", new_servers, ns);   
    ns.tprintf(formatScannedServers(ns, new_servers));
    ns.tprintf("-".repeat(50));
}

function printConnectedPath(ns, server1, server2){
    let new_servers = []
    scanAndBuild("home", new_servers, ns);
    ns.tprintf("-".repeat(50));
    let connection = findConnectionPath(server1, server2, new_servers);
    ns.tprintf(JSON.stringify(connection));
    let autoConnectString = connection.map(item => `connect ${item};`).join(' ');
    ns.tprintf(`${autoConnectString}`);
    navigator.clipboard.writeText(`${autoConnectString} nuke`);
    ns.tprintf("-".repeat(50));
}
/** @param {NS} ns */
function formatScannedServers(ns, scannedServers) {
  scannedServers.sort((a, b) => a[0].localeCompare(b[0]));

  let formattedOutput = [];
  let maxNameLength = Math.max(...scannedServers.map((x) => x[0].length));
  scannedServers.forEach((server) => {
    let serverName = server[0];
    let buffer = " ".repeat(maxNameLength-serverName.length+5);
    let maxRam = "ram: " + ns.getServerMaxRam(server[0]);
    let levelReq = "lvl: " + ns.getServerRequiredHackingLevel(server[0]);
    let connectedServers = server[1].sort((a, b) => a.localeCompare(b)).join(", ");
    formattedOutput.push(`${serverName}${buffer}${(levelReq).padEnd(15," ")}${(maxRam + "GB").padEnd(15," ")}[${connectedServers}]`);
  });

  return formattedOutput.join("\n");
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