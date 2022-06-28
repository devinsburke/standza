const keypadButtons = [
	[
		{text: 7, action: 'numberClick'},
		{text: 8, action: 'numberClick'},
		{text: 9, action: 'numberClick'},
	],
	[
		{text: 4, action: 'numberClick'},
		{text: 5, action: 'numberClick'},
		{text: 6, action: 'numberClick'},
	],
	[
		{text: 1, action: 'numberClick'},
		{text: 2, action: 'numberClick'},
		{text: 3, action: 'numberClick'},
	],
	[
		{text: 'AM', action: 'ampmClick'},
		{text: 0, action: 'numberClick'},
		{text: 'PM', action: 'ampmClick'},
	],
	[
		{text: 'hour', icon: 'arrow_left', action: 'arrowClick'},
		{text: 'done', icon: 'done'},
		{text: 'minute', icon: 'arrow_right', action: 'arrowClick'},
	]
]

class ScheduleComponent {
	constructor(container, schedule) {
		this.schedule = schedule
		this.keypad = new KeypadComponent()

		jor(container, el => this.schedule.Days.map(d =>
			el('li')
			.class('selected', d.Enabled)
			.set('onclick', e => {
				if (e.target == e.currentTarget) {
					d.Enabled = !d.Enabled
					e.target.classList.toggle('selected', d.Enabled)
					UserConfig.save() // TODO: Await
				}
			})
			.children(
				el('span').text(d.Name),
				el('time').text(d.StartTime).set('onclick', e => this.timeClick(e.target, d, 'StartTime')),
				el('time').text(d.EndTime).set('onclick', e => this.timeClick(e.target, d, 'EndTime'))
			)
		))
	}

	async timeClick(btn, day, dayAttribute) {
		const value = day[dayAttribute]
		const hour = value.split(':')[0]
		const minute = value.split(':')[1].split(' ')[0]
		const ampm = value.split(':')[1].split(' ')[1]

		const result = await this.keypad.prompt(hour, minute, ampm)
		const newTime = result.hour + ':' + result.minute + ' ' + result.ampm

		day[dayAttribute] = newTime
		btn.textContent = newTime
		UserConfig.save()
	}
}

class KeypadComponent {
	constructor() {
		this.elements = jor(document.body, el => [
			el('modal').refer('modal').class('hidden').children(
				el('time-entry').children(
					el('hour').refer('hour').set('onclick', () => this.arrowClick('hour')),
					el('span').text(':'),
					el('minute').refer('minute').set('onclick', () => this.arrowClick('minute')),
					el('time-type').refer('ampm').set('onclick', () => this.ampmClick())
				),
				el('key-pad').children(...keypadButtons.map(row =>
					el('row').children(...row.map(b =>
						el('key').text(b.icon || b.text)
							.class('material-icons', b.icon != null)
							.refer('done', b.text == 'done')
							.set('onclick', () => this[b.action](b.text), b.action)
					))
				))
			)
		])

		// if (btn.icon) {
		// 	const icon = document.createElement('i')
		// 	icon.classList.add('material-icons')
		// 	icon.textContent = btn.icon
		// 	buttonEl.appendChild(icon)
		// }
	}

	prompt(hour, minute, ampm) {
		this.elements.hour.textContent = hour
		this.elements.hour.classList.add('active')
		this.elements.minute.textContent = minute
		this.elements.minute.classList.remove('active')
		this.elements.ampm.textContent = ampm
		this.datepart = 'hour'
		this.elements.modal.classList.remove('hidden')

		return new Promise(resolve => {
			this.elements.done.onclick = () => {
				this.elements.modal.classList.add('hidden')
				resolve({
					hour: this.elements.hour.textContent,
					minute: this.elements.minute.textContent,
					ampm: this.elements.ampm.textContent
				})
			}
		})
	}

	ampmClick(value) {
		this.elements.ampm.textContent = value || (this.elements.ampm.textContent == 'AM' ? 'PM' : 'AM')
	}

	arrowClick(value) {
		if (this.datepart != value) {
			this.datepart = value
			this.elements.hour.classList.toggle('active', value == 'hour')
			this.elements.minute.classList.toggle('active', value == 'minute')
		}
	}

	numberClick(value) {
		const range = this.datepart == 'hour' ? [1, 12] : [0, 59]
		let num = parseInt(`${this.elements[this.datepart].textContent}${value}`)
		if (num < range[0] || num > range[1])
			num = value
		if (num < range[0] || num > range[1])
			return

		if (this.datepart == 'minute')
			num = num.toString().padStart(2, '0') 
		this.elements[this.datepart].textContent = num
		if (parseInt(num + '0') > range[1])
			this.arrowClick('minute')
	}
}