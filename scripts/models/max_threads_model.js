export class MaxThreadsModel {
    constructor(htreads, cores, servers, purch) {
        this.HomeThreads = htreads;
        this.HomeCores = cores;
        this.ServerThreads = servers;
        this.PurchasedThreads = purch;
        this.TotalThreads = htreads + servers + purch;
    }
}