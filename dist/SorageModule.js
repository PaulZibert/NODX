import Node from "./Node.js"
import {Icons,Inline,Page} from "./BaseGUI.js"
import {e,toEl} from "./GUICore.js"
import { initFn } from "./CodeManager.js"
//#region localStorage
Node.extends(Storage,{
    get(name){
        if(name!="length"&&name!='__proto__'){
            try{
                return JSON.parse(this.target[name])
            }catch(er){
                return this.target[name]
            }
        }else{return this.target[name]}
    },
    on_changed(ev){
        if(ev.target==this){return}
        console.log(ev)
        this.target[ev.child.name] = JSON.stringify(ev.child.target)
    },
    set(name,node){
        this.target[name] = JSON.stringify(node.target)
        super.set(name,node)
    }
})
async function getDBVersion(name){
    const dbs = await indexedDB.databases()
    for(const db of dbs){
        if(db.name==name){return db.version}
    }
}
Node.extends(IDBFactory,{
    async childNames(){
        const dbs = await indexedDB.databases()
        return dbs.map(d=>d.name)
    },
    get(name,updFunc){
        return new Promise(async (ok)=>{
            let version = await getDBVersion(name)
            if(!version){ok(null);return}
            if(updFunc){version+=1}
            const req = indexedDB.open(name,version)
            req.onsuccess = ()=>{
                ok(req.result)
            }
            if(updFunc){
                req.onupgradeneeded = updFunc
            }
        })
        
    },
    add(key,val){
        const req = indexedDB.open(key,1)
        req.onsuccess = ()=>{super.add(key,val)}
    },
    del(key){
        indexedDB.deleteDatabase(key);
        super.del(key)     
    }
})
Node.extends(IDBDatabase,{
    childNames(){
        return this.target.objectStoreNames
    },
    async add(name,val){
        this.target.close()
        this.target = await this.parent.get(this.name,(ev)=>{
            /**@type {IDBDatabase} */
            const db = ev.target.result
            db.createObjectStore(name)
        })
        super.add(name,val)
    },
    async del(name){
        this.target.close()
        this.target = await this.parent.get(this.name,(e)=>{
            e.target.result.deleteObjectStore(name)
        })
        super.del(name)
    },
    get(name){
        return this.target.transaction(name,'readwrite').objectStore(name)
    }
})
Node.extends(IDBObjectStore,{
    childNames(){
        return new Promise((ok)=>{
            /**@type {IDBDatabase} */
            const db = this.target.transaction.db
            const store = db.transaction(this.name,'readonly').objectStore(this.name)
            const req = store.getAllKeys()
            req.onsuccess = ()=>{
                ok(req.result)
            }
        })
    },
    add(key,val,){
        /**@type {IDBDatabase} */
        const db = this.target.transaction.db
        const store = db.transaction(this.name,'readwrite').objectStore(this.name)
        const res = store.put(val,key)
        res.onsuccess = ()=>{
            this.emit('childChanged',key)
            this.emit('changed')
        }
    },
    get(key){
        return new Promise((ok)=>{
            /**@type {IDBDatabase} */
            const db = this.target.transaction.db
            const store = db.transaction(this.name,'readonly').objectStore(this.name)
            const req = store.get(key)
            req.onsuccess = ()=>{ok(req.result)}
        })
    },
    del(key){
        /**@type {IDBDatabase} */
        const db = this.target.transaction.db
        const store = db.transaction(this.name,'readwrite').objectStore(this.name)
        store.delete(key)
        delete this.childs[key]
        this.emit('childRemoved',key)
        this.emit('changed')
    },
    on_changed(ev){
        const name = ev.child?ev.child.name:ev.args[0]
        const val = ev.child?ev.child.target:ev.args[1]
        /**@type {IDBDatabase} */
        const db = this.target.transaction.db
        const store = db.transaction(this.name,'readwrite').objectStore(this.name)
        store.put(val,name)
    }
})
Node.extends(Promise,{
    async constructor(){
        this.target = await this.target
        this.setupProto()
        this.parent.emit('changed',[],{pretend:true,child:this})
        this.emit('replaced',[this],{type:"single"})
        // const replaceNode = new Node(this.name,this.parent,result)
        // for(const child of Object.values(this.childs)){
        //     replaceNode.childs[child.name]=child;
        //     child.parent=replaceNode}
        // this.parent.childs[this.name] = replaceNode
        // this.emit('changed',[],{pretend:true})
        // this.emit('replaced',[replaceNode],{type:"single"})
    },
    async get(name){
        const result = await this.target;
        const newNode = this.parent.getChild(this.name)
        return newNode.get(name)       
    }
})
Inline.set(Promise,function(){
    return e('span',{},'wait')
})
Page.set(Promise,()=>e('div',{},'loading page...'))
toEl.types.set(Promise,(prom,{cfg,ctx,args})=>{
	const tempEl = Node.find(prom,Inline);cfg.this=ctx;
	prom.then((res)=>{tempEl.replaceWith(e(res,cfg,...args))})
	return tempEl
})

