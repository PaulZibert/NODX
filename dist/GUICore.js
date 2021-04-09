//#region style
var cssEl = document.createElement('style')
var parsedStyle = {}
/**@type {Object.<string,CSSStyleDeclaration>} */
var style = {}
function parse(obj){
    const el = document.createElement('div')
    for(const attr in obj){
        el.style[attr] = obj[attr]
    }
    return el.style.cssText
}
export function updateStyle(){
    var code = ''
    for(const name in parsedStyle){
        code+=`${name}{${parsedStyle[name]}}\n`
    }
    cssEl.textContent = code;
}
export const css = new Proxy(style,{
    set(t,p,v){
        t[p]= new Proxy(v,{
            set(dec,p2,v2){
                dec[p2] = v2
                parsedStyle[p] = parse(dec)
                return true
            }
        })
        parsedStyle[p] = parse(v)
        return true
    }
})
document.head.append(cssEl)
//#endregion
//#region HTMLElement
function* iterTypes(obj){
    if(obj==null){return [obj]}
    while(obj!=null){
        yield obj.constructor;
        obj = obj.__proto__
    }
}
export function toEl(src,p){
    if(src instanceof HTMLElement)return src
    p.addChilds=false;
    if(typeof src=="function"){return toEl(src.apply(p.ctx,p.args),p)}
    for(const type of iterTypes(src)){
        if(toEl.types.has(type)){return toEl.types.get(type)(src,p)}
    }
    p.addChilds=true;
    return e('span',{},String(src))
}
toEl.types = new Map()
export const elConfig = {}
export function e(src,cfg={},...args){
	const props = {cfg,args,ctx:cfg.this||this||window,addChilds:true}
	const el = typeof src == "string"?document.createElement(src):src instanceof HTMLElement?src:toEl(src,props)
    props.el = el;props.src=src;
    for(const name in cfg){
		switch(name){
			case "class":
				const cls = cfg.class
				if(Array.isArray(cls)){
					for(const name of cls){el.classList.add(name)}
				}else{el.classList.add(cls)}
				break;
			case "style":
				const style = cfg.style;
				for(const attr in style){
					el.style[attr] = style[attr]}
				break;
			case "attr":
				const attrs = cfg.attr;
				for(const attr in attrs){
					el.setAttribute(attr,attrs[attr])
				}break;
			case "events":
				const evts = cfg.events;
				for(const ev in evts){
					el.addEventListener(ev,evts[ev])
				}break;
			case "this":continue;
            default:
                const handler = elConfig[name]
                if(handler){handler.apply(props.ctx,[cfg[name],props])}
                else{el[name] = cfg[name]}
				break;
		}
	}
	if(props.addChilds){
        if(args.length==1&& Array.isArray(args[0])){args = args[0]}
        for(const child of args){
            el.append(typeof child=="string"?child:e(child))
        }
    }
	return el
}
//#endregion