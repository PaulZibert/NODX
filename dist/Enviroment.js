import {Page,ico,vport,borderStyle,Icons,Inline} from "./BaseGUI.js"
import "./advancedGUI.js"
import {e,css} from "./GUICore.js" 
import Node,{ mouseBufer} from "./Node.js"
export const WindowBrowser = {
    el:null,
    node:new Node('node'),
    open(node,save=true){
        this.node.update(node);
        /**@type {HTMLElement} */
        const page = node.find(Page)
        if(this.el){this.el.replaceWith(page);}
        this.el = page;
        if(save){history.pushState(null,node.name,node.path)}
        node.on(['replaced','deleted'],this.el,(ev)=>{
            this.open(ev.args[0]||ev.target.parent,false)
        },true)
        page.addEventListener('go',(e)=>{this.open(e.detail)})
    },
    init(){
        if(this.el){return this.el}
        this.open(Node.fromPath(decodeURI(location.pathname)))
        window.addEventListener('popstate',async ()=>{
            const node = await Node.fromPath(decodeURI(location.pathname))
            this.open(node,false)// TODO push states
        })
        return this.el
    }
}
export class Browser{
    hist = []
    el=e('div');
    node = new Node('node',null,null)
    open(node,save=true){
        if(this.node.target&&save){this.hist.push(this.node.target)}
        this.node.update(node)
        const page = node.find(Page)
        this.el.replaceWith(page);
        this.el = page;
        node.on(['replaced','deleted'],this.el,(ev)=>{
            this.open(ev.args[0]||ev.target.parent,false)
        },true)
        page.addEventListener('go',(e)=>{this.open(e.detail)})
    }
    back(){
        const node = this.hist.pop()
        if(node){this.open(node,false)}
    }
}
function MouseBuferView(mb){
    const mouseEl = e('div',{class:"mouse-bufer"})
    function contentView(){
        const selected = this.selected
        var node = this.node
        mouseEl.style.display = selected?null:"none"
        if(!selected||!node){return e('span')}
        const name = e('header',{},[this.input,e('span',{},selected.sufix)])
        const inline = node.find(Inline)
        return e('div',{},[name,inline])
    }
    window.addEventListener('mousemove',function(ev){
        mouseEl.style.left = ev.x+10
        mouseEl.style.top = ev.y+10
    })
    return e(mouseEl,{},[mb.e(contentView,{upd_evt:'changed'})])
}
css['.mouse-bufer'] = {
    position:"fixed",
    backgroundColor:"white",
    zIndex:10,
    padding:5,
    border:borderStyle,
    whiteSpace:"nowrap"
}
css['.mouse-bufer>div>header']={fontWeight:"bold",fontSize:12}
css['.mouse-bufer>div>header>span']={opacity:0.5}
function ToolBar(node){
    function nodeInfo(){return e('span',{},[
        e(ico,{style:{marginRight:5}},this.target.find(Icons)),
        this.target.name
    ])}
    const tools = e('div',{class:"right-side"},[
        e(ico('/icons/trash.svg'),{
            ondragover(e){e.preventDefault()},
            ondrop(ev){
                const path = ev.dataTransfer.getData('node')
                const node = Node.fromPath(path)
                node.parent?.del(node.name)
            },
            onclick(){
                if(mouseBufer.input){mouseBufer.setInput('');return}
                if(node.parent&&confirm(`delete ${node.target.path}`)){
                    node.parent.del(node.name)
                }
            }
        })
    ])
    return e('div',{class:"top-bar"},[node.e(nodeInfo,{upd_evt:'update'}),tools])
}
css['.top-bar'] = {fontSize:30,
    borderBottom:borderStyle,
    marginBottom:4,
}
css['.right-side'] = {float:"right"}
export default function env(){
    const sideBrowser = new Browser()
    const Bufer = MouseBuferView(mouseBufer)
    // setup topnav
    const path = e('div',{style:{width:"100%",marginLeft:5}})
    const backBtn = e('button',{onclick(){sideBrowser.back()},class:"sqr-btn"},['b'])
    const sidenav = e('div',{class:"tool-line"},[backBtn,path])
    sideBrowser.node.on('update',sidenav,function(){path.textContent = sideBrowser.node.target.path})
    //setup sidePage
    sideBrowser.open(Node.root)
    const sidePage = e('div',{class:"sidepage"},[sidenav,sideBrowser.el])
    const Content = e('main',{},[WindowBrowser.init(),sidePage])
    return e('div',{class:"env",spage:sideBrowser},Bufer,ToolBar(WindowBrowser.node),e(vport,{style:{height:"100%"}},[Content]))
}
css['.env'] = {display:"flex",flexDirection:"column",height:"100%",maxWidth:800,width:800}
css['.env main'] = {display:"flex",height:"100%"}
css['.env main>*'] = {width:"100%"}
css['.env main>.sidepage'] = Object.assign({marginLeft:5},css['.object-page'])