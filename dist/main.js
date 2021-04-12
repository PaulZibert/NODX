import Node from './Node.js'
import {Dir} from "./server.js"
import defEnv from "./Enviroment.js"
import "./SorageModule.js"
import {updateStyle} from "./GUICore.js"
import {initFn, listen} from "./CodeManager.js"
var root = {
    window,
    initFn,
    autor:{name:"Paul",age:20},
    arr:[1,2,'three'],
    storage:localStorage,
    IDB:indexedDB,
    server:new Dir(''),
    hello(pre = "Hello "){console.log(pre+this.autor.name);return this.autor.age}
}
Node.root = new Node('',null,root)
initFn.exe()
//listen(Node.root)
document.body.append(defEnv())
updateStyle()
window.Node = Node