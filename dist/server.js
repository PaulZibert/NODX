import Node, { Proto } from "./Node.js"
import {Inline,Page,e,Icons} from "./BaseGUI.js"
export async function get(url,params=null,json=false){
	if(params){url+='?'+ new URLSearchParams(params).toString()}
	const ret = await fetch(url)
	return json?ret.json():ret.text()
}
export class File{
	constructor(path,info){
		this.ext = path.split('.').last()
		this.size = info.size
		this.path = '/'+path
	}
	async text(){
		return await get(this.path)
	}
	getSize(){
		if(this.size>1024*1024){return `${(this.size/1024*1024).toFixed(2)}MB`}
		if(this.size>1024){return `${(this.size/1024).toFixed(2)}kB`}
		return `${this.size}B`
	}
}
export class Dir{
	constructor(path){this.path = path}
	async childs(){
		if(this._childs)return this._childs
		const jsonList = await get('/api/getDir',{path:this.path},true)
		const childs = {}
		for(const name in jsonList){
			const elPath = (this.path?this.path+'/':'')+name
			const info = jsonList[name]
			if(info.isFile){childs[name] = new File(elPath,info)
			}else{childs[name] = new Dir(elPath)}
		}
		this._childs = childs
		return childs
	}
}
Node.extends(Dir,{
	async childNames(){
		return Object.keys(await this.target.childs())
	},
	async get(name){
		const childs = await this.target.childs()
		return childs[name]
	}
})
Node.extends(File,{
	constructor(){
		if(Proto.has(this.target.ext)){
			const proto = Proto.get(this.target.ext)
			this.__proto__ = proto
			if(proto.hasOwnProperty('constructor')){proto.constructor.apply(this)}
		}
	},
	*getTypes(){yield this.target.ext;yield File;yield Object}
})
Icons.set(File,'icons/file.png')
Inline.set(File,function(){
	return e('span',{},`File {${this.target.getSize()}}`)
})
Node.extends("json",{	
	async childNames(){
		if(this.contnent==null){this.contnent = JSON.parse(await this.target.text())}
		return Object.keys( await this.contnent)
	},
	async get(name){
		if(this.contnent==null){this.contnent = JSON.parse(await this.target.text())}
		return await (this.contnent)[name]
	}
},File)
Icons.set('json','/icons/json.png')
Node.extends('js',{
	async childNames(){
		if(this.contnent==null){this.content = await import(this.target.path)}
		return Object.keys( await this.content)
	},
	async get(name){
		if(this.contnent==null){this.contnent = await import(this.target.path)}
		return await (this.contnent)[name]
	}
},File)
Icons.set('js','/icons/js.svg')