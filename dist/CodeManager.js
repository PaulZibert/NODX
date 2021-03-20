Array.prototype.last = {last(){return this[this.length-1]}}.last
export class Executable{
    exe(){}
    save(){}
    load(obj){}
}
export class Function extends Executable{
    commands = []
    exe(){
        for(const cmd of this.commands){
            cmd.exe()
        }
    }
    push(cmd){
        if(cmd instanceof Set){
            const lastCMD = this.commands.last()
            if(lastCMD instanceof Set && lastCMD.name==cmd.name&&lastCMD.obj==cmd.obj){
                this.commands.pop()
            }
        }
        this.commands.push(cmd)
    }
}
export class Set extends Executable{
    constructor(obj,name,val){super()
        this.obj = obj;
        this.name = name
        this.val = val;
    }
    exe(){
        this.obj.setChild(this.name,this.val)
    }
}
export class Add extends Executable{
    constructor(obj,name,val){super()
        this.obj = obj;
        this.name = name
        this.val = val;
    }
    exe(){
        this.obj.add(this.name,this.val)
    }
}
export class Del extends Executable{
    constructor(obj,name){super()
        this.obj = obj;
        this.name = name;
    }
    exe(){this.obj.del(this.name)}
}
export const initFn = new Function()
window.initFn = initFn