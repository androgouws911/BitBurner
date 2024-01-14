export class HackableServer{
    constructor(target, threads, cores, ns){
        //ServerDetails
        this.serverName = target;
        this.requiredHackingLevel = ns.getServerRequiredHackingLevel(target);
        
        //Money
        this.moneyAvailable = ns.getServerMoneyAvailable(target);
        this.maxMoney = ns.getServerMaxMoney(target);
        
        //Security
        this.securityLevel = ns.getServerSecurityLevel(target);
        this.baseSecurity = ns.getServerBaseSecurityLevel(target);
        this.minSecurityLevel = ns.getServerMinSecurityLevel(target);

        //Hack
        this.hackTime = ns.getHackTime(target);
        this.hackChance = (ns.hackAnalyzeChance(target) * 100).toFixed(0);
        this.hack10 = (.10 / ns.hackAnalyze(target)).toFixed(0);
        this.hack25 = (.25 / ns.hackAnalyze(target)).toFixed(0);
        this.hack50 = (.50 / ns.hackAnalyze(target)).toFixed(0);
        this.hackSecurity = ns.hackAnalyzeSecurity(threads, target);

        //Grow
        this.growTime = ns.getGrowTime(target);
        this.growSecurity = ns.growthAnalyzeSecurity(threads, target, cores);
        this.growthParam = ns.getServerGrowth(target);
        this.growth2x = (ns.growthAnalyze(target, 2, cores)).toFixed(0);
        this.growth3x = (ns.growthAnalyze(target, 3, cores)).toFixed(0);
        this.growth4x = (ns.growthAnalyze(target, 4, cores)).toFixed(0);

        //Weaken
        this.weakenTime = ns.getWeakenTime(target);
        this.weakenAffect = ns.weakenAnalyze(threads, cores);
    }
}    
