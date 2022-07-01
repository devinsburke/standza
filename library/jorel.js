function jor(parent, fn, container) {
    container ??= {}
    fn(tag => new JorEl(tag, container)).forEach(e => parent.appendChild(e.node))
	return container
}

class JorEl {
    static svgElements = ['svg', 'circle', 'text', 'line']

    constructor (tag, container) {
        this.node = JorEl.svgElements.includes(tag)
            ? document.createElementNS('http://www.w3.org/2000/svg', tag)
            : document.createElement(tag)
        this.container = container
    }

    class(cls, b) { this.node.classList.toggle(cls, b); return this }
    text(t, b=true) { if (b) this.node.textContent = t; return this }
    id(i, b=true) { if (b) this.node.id = i; return this }
    attr(k, v, b=true) { if (b) this.node.setAttribute(k, v); return this }
    set (k, v, b=true) { if (b) this.node[k] = v; return this }
    refer(id, b=true) { if (b) this.container[id] = this.node; return this }
    children(...c) { c.forEach(i => this.node.appendChild(i.node)); return this }
}
