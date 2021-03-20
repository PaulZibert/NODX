import Node from './Node.js'
import {Dir} from "./server.js"
import defEnv from "./Enviroment.js"
import "./SorageModule.js"
import "./advancedGUI.js"
import {update as styleUpdate} from "./StyleManager.js"
var root = {
    window,
    autor:{name:"Paul",age:20},
    arr:[1,2,'three'],
    storage:localStorage,
    IDB:indexedDB,
    server:new Dir(''),
    hello(pre = "Hello "){console.log(pre+this.autor.name);return this.autor.age}
}
Node.root = new Node('',null,root)
document.body.append(defEnv())
styleUpdate()
window.Node = Node