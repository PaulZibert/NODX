import Node, { EventEmitter,mouseBufer,MouseBufer, Proto } from "./Node.js"
import {css,e,toEl} from "./GUICore.js"
export const Page = new Map()
export const Inline = new Map()
export const Icons = new Map()
export const Block = new Map()
export const ToolButtons = new Map()
export const borderStyle = "solid 2px black"
//#region utils
toEl.types.set(Node,(src,{args})=>src.find(args[0]||Inline))
export function vport(els){
	const subEl = Array.isArray(els)?e('div',{},els):els
	return e('div',{class:"v-port"},subEl)
}
css['.v-port']={position:"relative"}
css['.v-port>div']={position:"absolute",overflow: "auto",top:0,bottom:0,left:0,right:0,}
css['.v-port>div::-webkit-scrollbar']={display:"none"}
export function ico(path){
	return e(vport,{class:"ico-box"},[e('img',{class:"ico",attr:{src:path}})])
}
css['.ico-box'] = {display:"inline",paddingLeft:"1.16em"}
css['.ico'] = {width:"100%",height:"100%"}
//#endregion
//#region object
Icons.set(Object,'/icons/object.svg')
function SearchLine(){
	function filter(){
		const name = $inp.value.toLowerCase()
		const list = $inp.parentNode.parentNode.querySelectorAll('.attr')
		for(const el of list){
			const show = !name||el.name.toLowerCase().includes(name)
			el.style.display = show?null:"none"
		}
	}
	const $inp = e('input',{onkeyup:filter,style:{width:"100%",},attr:{placeholder:"Filter/Add"}})
	this.on('changed',$inp,filter)
	const addBtn = e('div',{style:{marginLeft:5},class:"sqr-btn",
		onmouseup:(ev)=>{
			const mNode = mouseBufer.node
			const name = $inp.value||mNode?.name
			const val = mNode?.target
			if(name){
				mouseBufer.setInput('')
				this.add(name,val)
			}
		},
		ondragover(e){e.preventDefault()},
		ondrop:(ev)=>{
			const path = ev.dataTransfer.getData('node')
			if(path){
				const dropNode = Node.fromPath(path)
				const attr = $inp.value||dropNode.name
				const val = dropNode.target
				if(attr){this.add(attr,val)}
			}
		}
	},'+')
	return e('div',{class:"tool-line"},
		$inp,
		addBtn
	)
}
css['.tool-line'] = {display:"flex",marginBottom:5}
css['.tool-line>*'] = {border:borderStyle,fontSize:"1em"}
css['.tool-line>.sqr-btn'] = {width:"1.3em",textAlign:"center"}
const foldingBtn = {
	ico:"ᐊ",
	/**@param {HTMLElement} line,@param {HTMLElement} btn */
	click(btn,line){
		if(!line.hasSubView){
			const $block = this.e(Block,{
				class:"block",
				thisArg:this.parent?.target,
				style:{borderRight:"2px solid #333",borderLeft:"4px solid black"}
			})
			line.after($block)
			line.expanded = true
			line.hasSubView = true
		}else{line.expanded = !line.expanded}
		line.nextSibling.style.display = line.expanded?null:"none"
		btn.textContent = line.expanded?"ᐁ":"ᐊ"
	}
} 
function AttrLineView(node,attr,showName=true){
	const child = node.getChild(attr)
	const nameProps = {
		attr:{title:attr},
		onclick(){
			const ev = new CustomEvent('go',{bubbles:true,detail:child})
			this.dispatchEvent(ev)
		},
		oncontextmenu(ev){
			if(mouseBufer.input){
				node.set(attr,mouseBufer.node)
				mouseBufer.setInput('')
			}else{mouseBufer.setInput(child.path)}
			ev.preventDefault()
		}
	}
	//#region toolbar
	const $toolBtns = []
	const toolBtns = [...(child.find(ToolButtons)||[]),foldingBtn]
	for(const btn of toolBtns){
		$toolBtns.push(e('div',{
			onclick(){btn.click.apply(child,[this,this.parentNode.parentNode])},
			...(btn.config||{})
		},btn.ico))
	}
	const toolBar = e('div',{class:"tool-bar"},$toolBtns)   
	//#endregion
	const name = e('span',nameProps,showName?attr+' : ':"")
	const icon = e(ico,nameProps,child.find(Icons))
	const lineProps = {
		class:"attr",
		name:attr,
		attr:{draggable:true},
		events:{
			dragstart(e){
				e.dataTransfer.setData('node',child.path)
			},
			drop(e){
				const path  = e.dataTransfer.getData('node')
				const dragNode = Node.fromPath(path)
				node.set(attr,dragNode)
			},
			dragover(e){e.preventDefault()}
		}
	}
	return e('div',lineProps,[icon,name,child,toolBar])
}
css['.attr'] = {
	padding:3,
	borderBottom:borderStyle,
	lineHeight:"25px",
	whiteSpace:"nowrap",
	overflowX:"hidden",
	position:"relative",
}
css['.attr>.tool-bar'] = {position:"absolute",
	right:0,top:0,bottom:0,fontWeight:"bold"
	}
	css['.attr>.tool-bar>*'] = {
		color:"white",
		backgroundColor:"black",
		height:"100%",
		width:30,
		display:"inline-block",
		textAlign:"center",
		lineHeight:"30px"
	}
css['.attr>.ico-box'] = {marginRight:3}
/**@param {HTMLElement} $el */
function addChangeEvents(node,$el,showName=true){
	node.on('changed',$el,async (ev)=>{
		if(ev.target!=node||(ev.args[2]&&ev.name=="set")){return}// update event
		const deletion = ev.name=="del"&&!ev.child
		const attr = ev.child?ev.child.name:ev.args[0]
		const newEl = !deletion&&AttrLineView(node,attr,showName)
		for(const el of $el.children){
			if(el.name==attr){
				if(deletion){$el.removeChild(el)}
				else{el.replaceWith(newEl)}	return
			}
		}
		if($el.lastChild){$el.lastChild.before(newEl)}
		else{$el.append(newEl)}
	},true)
}
async function BlockObject(){
	const $attrs = []
	const attrs = await this.childNames()
	for(const attr of attrs){
		$attrs.push(AttrLineView(this,attr))
	}
	const $el = e('div',{},$attrs)
	addChangeEvents(this,$el)
	return $el
		
}
function PageObject(){
	if(!this.target){return "null"}
	return e("div",{class:"object-page"},[
		this.e(SearchLine),
		e(vport,{class:'attrs'},this.e(Block))
	])
	
}
function InlineObject(){
	if(this.target==null){return e('span',{},["null"])}
	return e('span',{},[`${this.target.constructor?.name||"Object"} {${Object.getOwnPropertyNames(this.target).length}}`])
}
css['.object-page'] = {
	height:"100%",
	display:"flex",
	flexDirection:"column",
	boxSizing:"border-box"
}
css['.object-page>.attrs'] = {
	height:"100%",
	border:borderStyle
}
Page.set(Object,PageObject)
Inline.set(Object,InlineObject)
Block.set(Object,BlockObject)
//#endregion
//#region string
function InlineString(){
	const node = this
	const onkeyup = function(){
		node.update(this.textContent,this)
	}
	const field = e('span',{onkeyup,attr:{contenteditable:true}},[this.target])
	const nodeEvents = {
		update(caller){
			if(caller==field)return
			field.textContent = node.target
		}
	}
	return e('span',{},['"',this.e(field,{nodeEvents}),'"'])
}
Block.set(String,function(){
	const node = this
	return this.e('textarea',{//TODO ERR doesnt update ERROR 
		class:"str-inline",
		nodeEvents:{update(cl){if(cl!=this){this.value = node.target}}},
		value:this.target,
		onkeyup(){
			node.update(this.value,this)
		}
	})
})
css['.str-inline'] = {fontSize:"1em"}
Icons.set(String,'/icons/string.svg')
Inline.set(String,InlineString)
MouseBufer.handlers.push((m)=>{
	m.variants.push({
		sufix:"",
		order:2,
		value:m.input
	})
})
//#endregion
//#region number
function InlineNumber(){
	const node = this
	const $ret = e('span')
	const num = e('span',{
		onkeyup(){
			node.update(parseFloat(this.textContent)||0,$ret)
		},
		attr:{contenteditable:true}
	},[`${this.target}`])
	this.on('update',$ret,(caller)=>{
		if(caller==$ret)return
		num.textContent = `${this.target}`
	})
	return e($ret,{},[num])
}
Icons.set(Number,'/icons/number.svg')
Inline.set(Number,InlineNumber)
ToolButtons.set(Number,[
	{ico:"-",click(b){this.update(this.target-1,b)}},
	{ico:"+",click(b){this.update(this.target+1,b)}},
])
MouseBufer.handlers.push((m)=>{
	const number = parseFloat(m.input)
	const isNum = m.input.match(/^\d+\.?\d*$/)
	if(isNum){
		m.variants.push({
			sufix:"",
			order:4,
			value:number
		})
	}
})
//#endregion
//#region func
Icons.set(Function,function(){return "/icons/"+(this.target.prototype?"class.svg":"function.svg")})
Inline.set(Function,function(){return e('span',{},[`${this.target.name}(${this.target.length})`])})
function exeFn(btn,line) {
	var caller = this.parent.target
	while(line){
		if(line.thisArg){caller = line.thisArg;break}
		line = line.parentNode
	}
	const fn = this.target
	var result
	console.log(this.args)
	const args = this.args||(mouseBufer.input?[mouseBufer.getValue()]:[])
	if(fn.prototype){//is Class
		result = new fn(...args)
	}else{result = this.target.apply(caller,args)}
	mouseBufer.setValue(result,'function Result')
}
Block.set(Function,function(){
	if(!this.args){this.args = []}
	const $args = this.self.getChild('args')
	const $exe = e('button',{onclick:exeFn.bind(this)},['EXE'])
	return e('div',{},[$args.e($args.find(Block)),$exe])
})
ToolButtons.set(Function,[
	{ico:"▶",click:exeFn},
])
Icons.set(Error,'/icons/error.svg')
//#endregion
//#region bool
Icons.set(Boolean,'/icons/boolean.svg')
Inline.set(Boolean,function(){
	const node = this
	return this.e('span',{onclick(){
		node.update(!node.target)
		this.textContent = node.target?'🗹':'☐'
		},nodeEvents:{
			changed(){this.textContent = node.target?'🗹':'☐'}
		}},[this.target?'🗹':'☐'])
})
//#endregion
//#region array
Icons.set(Array,'/icons/array.svg')
Inline.set(Array,function(){
	const els = []
	const arr = this.target
	for(const i in arr){
		if(i>4)break;
		els.push(this.getChild(i).find(Inline))
	}
	return e('div',{class:"arr-inline"},els)
})
Block.set(Array,function BlockArray(){
	const $items = [];const node = this
	for(const i of this.childNames()){
		$items.push(AttrLineView(this,i,false))
	}
	$items.push(e('div',{
		class:["attr",'t-center'],
		onclick(){
			node.add(node.target.length,mouseBufer.node?.target)
			mouseBufer.setInput('')
		},
		ondragover(e){e.preventDefault()},
		ondrop(e){
			const path = e.dataTransfer.getData('node')
			const dropNode  = Node.fromPath(path)
			node.add(node.target.length,dropNode.target)
		}
	},"Add"))
	const $el = e('div',{},$items)
	addChangeEvents(this,$el,false)
	return $el
})
Page.set(Array,function PageArray(){
	return e("div",{class:"object-page"},[
		e(vport,{class:'attrs'},this.e(Block))
	])
})
css['.t-center'] = {textAlign:"center"}
css['.arr-inline'] = {display:"inline"}
css['.arr-inline>*'] = {
	borderRight:borderStyle,
	paddingLeft:5,
	paddingRight:5}
//#endregion