import {Proto} from "./Node.js"
import Node from "./Node.js"
import {Icons,Inline,Page} from "./BaseGUI.js"
import {e} from "./GUICore.js"
Inline.set(Date,function(){
    const node = this
    /**@type {Date} */
    const date = this.target
    return e('input',{type:"date",value:date.toISOString().slice(0,10),
        onchange(){
            node.update(new Date(this.value))
        },
        nodeEvents:{
            changed(){
                console.log('chu')
            }
        }
    })
})