const drawers = [
    {name: 'home', icon: 'home'},
    {name: 'progress', icon: 'check'},
    {name: 'calendar', icon: 'date_range'},
    {name: 'settings', icon: 'settings'},
    {name: 'preview', icon: 'camera'},
]

class DrawerComponent {
    constructor(container, contentContainer) {
        jor(container, el => drawers.map(d =>
            el('button')
            .text(d.icon)
            .class('material-icons')
            .class('selected-tab', d.name == 'home')
            .set('onclick', e => {
                for (const t of document.querySelectorAll('.selected-tab'))
                    t.classList.remove('selected-tab')
                e.target.classList.add('selected-tab')
                contentContainer.class = d.name
            })
        ))
    }
}