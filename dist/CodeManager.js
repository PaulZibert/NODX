import Node from "./Node.js"
Array.prototype.last = {last(){return this[this.length-1]}}.last
export const AsyncFn = (async ()=>{}).constructor
const saveJS = new Map()
saveJS.set(Object,function(){return JSON.stringify(this.target)})
saveJS.set(Array,function(){
    const arr = this.target
    return `[${arr.map((e,i)=>this.getChild(i).find(saveJS))}]`
})
export class Executable{
    exe(){}
}
saveJS.set(Executable,function(){
    const obj = this.target
    const args = []
    for(const name of Object.getOwnPropertyNames(obj)){
        const child = this.getChild(name)
        args.push(child.find(saveJS))
    }
    return `new ${obj.constructor.name}(${args.join(',')})`
})
export class Link extends Executable{
    constructor(path){super();this.path = path}
    exe(){return Node.fromPath(this.path)}
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
export class Function extends Executable{
    constructor(cmds = []){super();this.cmds = cmds}
    exe(){
        for(const cmd of this.cmds){
            cmd.exe()
        }
    }
    push(cls,...args){
        args = args.map(e=>e instanceof Node?new Link(e.path):e)
        const cmd = new cls(...args)
        if(cls == Set){
            const lastCMD = this.cmds.last()
            if(lastCMD instanceof Set && lastCMD.name==cmd.name&&lastCMD.obj==cmd.obj){
                this.cmds.pop()
            }
        }
        this.cmds.push(cmd)
    }
}
export const initFn = new Function()
function genFn(){
    const fnNode = new Node('',null,initFn)
    return fnNode.find(saveJS)
}
Object.assign(window,{initFn,genFn})
