import Node, { MouseBufer } from "./Node.js"
Array.prototype.last = {last(){return this[this.length-1]}}.last
export const AsyncFn = (async ()=>{}).constructor
const Evaluable = new Map()
Evaluable.set(Object,function(){return JSON.stringify(this.target)})
Evaluable.set(Array,function(){
    const arr = this.target
    return `[${arr.map((e,i)=>Node.find(e,Evaluable))}]`
})
export class Executable{
    exe(){}
}
Evaluable.set(Executable,function(){
    const obj = this.target
    const args = []
    for(const name of Object.getOwnPropertyNames(obj)){
        args.push(Node.find(obj[name],Evaluable))
    }
    return `new ${obj.constructor.name}(${args.join(',')})`
})
export class Link extends Executable{
    constructor(path){super();this.path = path}
    exe(){return Node.fromPath(this.path)}
}
export class Set extends Executable{
    constructor(path,name,val){super()
        this.nodePath = path;
        this.name = name
        this.val = val;
    }
    exe(){
        const node = Node.fromPath(this.nodePath)
        let val = this.val
        val = val instanceof Link?val.exe():Node.temp(val)
        node.set(this.name,val)
    }
}
export class AddAttr extends Executable{
    constructor(path,name,val){super()
        this.nodePath = path;
        this.name = name
        this.val = val;
    }
    exe(){
        const node = Node.fromPath(this.nodePath)
        let val = this.val
        if(val instanceof Link){val = val.exe()}
        node.add(this.name,val)
    }
}
export class Del extends Executable{
    constructor(obj,name){super()
        this.nodePath = obj;
        this.name = name;
    }
    exe(){Node.fromPath(this.nodePath).del(this.name)}
}
const events = {'del':Del,'add':AddAttr,'set':Set}
export class Function extends Executable{
    constructor(cmds = []){super();this.cmds = cmds}
    exe(){
        for(const cmd of this.cmds){
            cmd.exe()
        }
    }
    push(cls,...args){
        args = args.map(e=>e instanceof Node?e==Node.tmp?e.target:new Link(e.path):e)
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
const evalFn = (code)=>{try{return eval(code)}catch{}}
export var initFn = evalFn(localStorage.initFn||'')
if(!(initFn instanceof Function)){initFn = new Function}
Object.assign(window,{initFn,evalFn,saveJS: Evaluable})
export function listen(node){
    node.on('changed',initFn,(ev)=>{
        if(ev.name=='changed')return
        if(ev.child.name!="initFn"){
            initFn.push(events[ev.name],ev.target.path,...ev.args)
        }
        localStorage.initFn =  Node.find(initFn,Evaluable)
    },true)
}
MouseBufer.handlers.push((m)=>{
    try{
        const value = eval(m.input)
        if(value===undefined)return
        m.variants.push({
            sufix:"",
            order:3,
            value
        })
    }catch(e){}
})