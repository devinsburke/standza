class DrawerComponent {
    constructor(container, tabs) {
        jor(container, el => [
            el('drawer').children(
                ...tabs.map(d =>
                    el('button')
                    .text(d.icon)
                    .class('material-icons')
                    .class('selected-tab', d.name == tabs[0].name)
                    .set('onclick', e => {
                        for (const t of document.querySelectorAll('.selected-tab'))
                            t.classList.remove('selected-tab')
                        e.target.classList.add('selected-tab')
                        container.setAttribute('data-tab', d.name)
                    })
                )
            )
        ])
    }
}