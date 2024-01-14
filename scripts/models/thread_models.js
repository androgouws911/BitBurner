export class ThreadServer {
    constructor(name, maxThreads, usedThreads) {
        this.ServerName = name;
        this.MaxThreads = maxThreads;
        this.UsedThreads = usedThreads;
        this.AvailableThreads = maxThreads - usedThreads;
    }
}