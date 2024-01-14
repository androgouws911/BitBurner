export class StaticServerData{
    constructor(serverName, maxMoney, maxRam, ports, hackLevel, minSec){
        this.ServerName = serverName;
        this.MaxMoney = maxMoney;
        this.MaxRAM = maxRam;
        this.RequiredPorts = ports;
        this.RequiredHackLevel = hackLevel;
        this.MinimumSecurityLevel = minSec;
    }
}    
