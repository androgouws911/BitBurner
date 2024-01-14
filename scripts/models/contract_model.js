export class ContractModel {
    constructor(ctype, data, desc, remain, file, target) {
        if (ctype === undefined){
            this.Type = null;
            this.Data = null;
            this.Description = null;
            this.Remaining = null;
            this.ContractFile = null;
            this.Target = null;
        }
        else if (data === undefined || data === null) {
            this.Type = ctype.Type;
            this.Data = ctype.Data;
            this.Description = ctype.Description;
            this.Remaining = ctype.Remaining;
            this.ContractFile = ctype.ContractFile;
            this.Target = ctype.Target;
        } else {
            this.Type = ctype;
            this.Data = data;
            this.Description = desc;
            this.Remaining = remain;
            this.ContractFile = file;
            this.Target = target;
        }
    }
}