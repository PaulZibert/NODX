import * as code from "./CodeManager.js"
export const Proto = new Map()
export function $(str,...args){
    var path = ''
    for(let i = 0;i<args.length;i++){
        path += str[i]+args[i]
    }
    path+=str[args.length]
    console.log()
    return Node.fromPath(path)
}
window.$ = $
Function.prototype.mixin = function(mx){Object.assign(this.prototype,mx)}
var idscounter = 0
const Primitives = ['string','boolean','number']
export class EventEmitter{
    on(name,owner,fn){
        if(!this._events){this._events = {}}
        if(!this._events[name]){this._events[name] = new Map()}
        if(owner instanceof HTMLElement && !owner.isConnected){
            document.body.append(owner)
        }
        this._events[name].set(owner,fn)
    }
    emit(name,...args){
        /**@type {Map} */
        const map = this._events?.[name]
        if(!map){return}
        const owners = Array.from(map.keys())
        for(const owner of owners){
            if(owner instanceof HTMLElement && !owner.isConnected){
                map.delete(owner);
                continue
            }
            map.get(owner).apply(owner,args)
        }
    }
    removeListener(name,owner){
        const arr = this._events?.[name]
        if(!arr){return}
        arr.delete(owner)
    }
}
export class MouseBufer extends EventEmitter{
    mouseNode = new Node('mouse_val')
    input=""
    /**@type {Array<(mb:MouseBufer)=>null>}*/
    static handlers = []
    index = 0
    setInput(val){this.input = val;this.changed();this.index=0}
    setValue(value,name){this.input = name||"";this.variants.push({value});this.emit('changed',this,this)}
    getValue(){
        const val = this.selected?.value
        return val instanceof Node?val.target:val
    }
    get selected(){
        if(!this.variants)return
        this.index = Math.max(0,Math.min(this.index,this.variants.length-1))
        return this.variants[this.index]
    }
    get node(){
        const val = this.selected?.value
        if(val===undefined||val instanceof Node){return val}
        this.mouseNode.target = val
        return this.mouseNode
    }
    async changed(){
        this.variants = []
        if(this.input){
            for(const handler of MouseBufer.handlers){
                await handler(this)
            }
        }
        this.variants.sort((a,b)=>(b.order||0)-(a.order||0))
        this.emit('changed',this,this)
    }
    constructor(){
        super()
        this.variants = []
        addEventListener('keydown',(ev)=>{
            const isINPUT = ["INPUT","TEXTAREA"].includes(ev.target.tagName.toUpperCase())
            const isEDITABLE = ev.target.hasAttribute('contenteditable')
            if(isINPUT||isEDITABLE){return}
            ev.preventDefault()
            if(ev.key.length==1){
                this.setInput(this.input+ev.key);
            }else if(ev.key=="Backspace" && this.input.length){
                this.setInput(this.input.substr(0,this.input.length-1))
            }else if(ev.key=="ArrowUp"){
                this.index-=1;
                if(this.index<0){this.index = this.variants.length}
                this.emit('changed',this,this)
            }else if(ev.key=="ArrowDown"){
                this.index =(this.index+1)%this.variants.length
                this.emit('changed',this,this)
            }
            else if(ev.key=="Tab"){
                if(this.input)
                this.setInput(this.input+this.selected.sufix||'');
            }else if(ev.key=="Delete"){
                this.setInput('')
            }else{console.log(ev.key)}
        })
    }variants
}
export default class Node extends EventEmitter{
    static count = 0
    constructor(name,par,target){
        super()
        this._id = idscounter++
        Node.count++;
        this.parent = par;
        this.name = name;
        if(target!=null){this.target = target}
        const proto = this.find(Proto)
        if(proto){
            this.__proto__ = proto
            if(proto.hasOwnProperty('constructor')){proto.constructor.apply(this)}
        } 
    }
    /**@param {Node} proto */
    static extends(type,proto,ext = Object){
        const proto2 = Proto.get(ext)
        if(proto2){
            for(const prop in proto2){
                if(!(prop in proto)){
                    proto[prop] = proto2[prop]
                }
            }
        }
        proto.__proto__ = Node.prototype
        Proto.set(type,proto)
    }
    childs={}
    /**@returns {Node} */
    static fromPath(path){
        var node = Node.root
        if(path.startsWith('/')){path = path.substr(1)}
        if(path){
            if(path.includes('/')){
                const keys = path.split('/')
                for(const key of keys){
                    if(node==null)break
                    node = node.getChild(key)
                }
            }else{node = node.getChild(path)}
            
        }
        return node
    }
    get path(){
        const names = []
        var node = this;
        while(node){
            names.unshift(node.name);
            node = node.parent
        }
        return names.length>1?names.join('/'):'/'
    }
    *getTypes(){
        let obj = this.target
        if(obj==null)return obj;
        while(obj!=null){
            yield obj.constructor
            obj = obj.__proto__
        }
    }
    /**@param {Map} map */
    find(map,...args){
        for(const type of this.getTypes()){
            if(map.has(type)){
                const ret = map.get(type)
                if(typeof ret =="function"&&!map.canBeFn){
                    return ret.apply(this,args)
                }else{return ret}   
            }
        }
    }
    get(name){}
    childNames(){
        return Object.getOwnPropertyNames(this.childs)
    }
    get self(){
        const value = new Node('~',this,this)
        Object.defineProperty(this,'self',{value});
        return value; 
    }
    getChild(name){
        if(name=="~"){return this.self}
        if(Object.hasOwnProperty.apply(this.childs,[name])){
            const savedNode = this.childs[name]
            if(Primitives.includes(typeof savedNode.target)){
                const updatedVal = this.get(name)
                if(updatedVal instanceof Promise){
                    updatedVal.then((vl)=>savedNode.target = vl)
                }else{savedNode.target = updatedVal}
            }
            return savedNode
        }
        const childNode = new Node(name,this,this.get(name))
        this.childs[name] = childNode
        return childNode;
    }
    changed(){this.parent?.changed(this)}
    update(val,caller){
        this.target = val;
        code.initFn.push(new code.Set(this.parent,this.name,this))
        this.emit('changed',caller)
        this.changed()
    }
    set(name,node){// TODO dont create new Node
        const newNode = new Node(name,this,node.target)
        code.initFn.push(new code.Set(this,name,node))
        this.childs[name] = newNode
        this.changed()
        this.emit('childChanged',name)
        return newNode
    }
    add(name,val=null){
        this.changed()
        this.emit('childChanged',name)
        this.emit('changed',null)
        code.initFn.push(new code.Add(this,name,val))
    }
    del(name){// TODO delete child
        delete this.childs[name]
        this.changed()
        this.emit('childRemoved',name)
        this.emit('changed')
        code.initFn.push(new code.Del(this,name))
    }
}
MouseBufer.handlers.push(async (m)=>{
    if(!m.input.startsWith('/'))return
    const names = m.input.split('/')
    names.shift()
    const last = names.pop()
    var node = Node.root
    for(const name of names){
        node = node.getChild(name)
        if(node.target==null){console.log("no target")
            return}
    }
    console.log
    const childNames = await node.childNames()
    for(const childName of childNames){
        if(childName.startsWith(last)||childName==last)
        m.variants.push({
            order:4,
            sufix:childName.substr(last.length),
            value:node.getChild(childName)
        })
    }
})
export const mouseBufer = new MouseBufer()
window.Node=Node
window.mouse = mouseBufer
Node.mixin(EventEmitter)
Node.extends(Object,{
    childNames(){return [...Object.getOwnPropertyNames(this.target),'__proto__']},
    update(val,caller){
        if(this.parent?.target){
            this.parent.target[this.name] = val}
        super.update(val,caller)
    },
    set(name,node){this.target[name] = node.target;super.set(name,node)},
    add(name,val){this.target[name] = val;super.add(name,val)},
    del(name){delete this.target[name];super.del(name)},
    get(name){try{return this.target[name]}catch(e){return e}},
})
Node.extends(Array,{
    childNames(){const names = Object.getOwnPropertyNames(this.target);names.pop();return names},
    del(name){this.target.splice(parseInt(name),1);super.del(name)}
})