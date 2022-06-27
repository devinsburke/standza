const keypadButtons = [
	[
		{text: 7, action: 'number'},
		{text: 8, action: 'number'},
		{text: 9, action: 'number'},
	],
	[
		{text: 4, action: 'number'},
		{text: 5, action: 'number'},
		{text: 6, action: 'number'},
	],
	[
		{text: 1, action: 'number'},
		{text: 2, action: 'number'},
		{text: 3, action: 'number'},
	],
	[
		{text: 'AM', action: 'ampm'},
		{text: 0, action: 'number'},
		{text: 'PM', action: 'ampm'},
	],
	[
		{icon: 'arrow_left', action: 'hour'},
		{icon: 'done', action: 'done'},
		{icon: 'arrow_right', action: 'minute'},
	]
]

class ScheduleController {
	constructor(container, schedule) {
		this.schedule = schedule
		this.elements = {}
		this.time_settings = {
			current_time: '',
			current_element: 'hour'
		}

		jor(container, el => this.schedule.Days.map(s => {
			const name = s.Name.toLowerCase()
			return el('li').id('schedule-' + name).class('selected', s.Enabled).children(
				el('span').text(s.Name).set('onclick', _ => this.toggleScheduleDay(s.Name)),
				el('flex'),
				el('time').id(name + '-start').text(s.StartTime).set('onclick', e => this.changeTime(e.target.id, e.target.textContent)),
				el('time').id(name + '-end').text(s.EndTime).set('onclick', e => this.changeTime(e.target.id, e.target.textContent))
			)
		}))
	}

	async createKeyPad() {
		const keyPad = document.createElement('key-pad')

		for (const row of keypadButtons) {
			const rowEl = document.createElement('row')
			keyPad.appendChild(rowEl)
			for (const btn of row) {
				const buttonEl = document.createElement('key')
				rowEl.appendChild(buttonEl)
				buttonEl.textContent = btn.text
				if (btn.icon) {
					const icon = document.createElement('i')
					icon.classList.add('material-icons')
					icon.textContent = btn.icon
					buttonEl.appendChild(icon)
				}

				buttonEl.onclick = async _ => {
					const currentField = this.time_settings.current_element

					switch (btn.action) {
						case 'ampm':
							this.elements.timetype.textContent = btn.text
							break

						case 'number':
							const range = currentField == 'hour' ? [1, 12] : [0, 59]
							let value = parseInt(this.elements[currentField].textContent + btn.text)
							if (value < range[0] || value > range[1])
								value = btn.text
							if (value < range[0] || value > range[1])
								return

							this.elements[currentField].textContent = value.toString().padStart(2, '0')
							if (parseInt(value + '0') > range[1]) {
								this.time_settings.current_element = 'minute'
								this.elements.hour.classList.remove('active')
								this.elements.minute.classList.add('active')
							}
							break

						case 'hour':
						case 'minute':
							if (btn.action != currentField) {
								this.time_settings.current_element = btn.action
								this.elements.hour.classList.toggle('active')
								this.elements.minute.classList.toggle('active')
							}
							break

						case 'done':
							var newTime = this.elements.hour.textContent + ':' + this.elements.minute.textContent + ' ' + this.elements.timetype.textContent
							document.getElementById(this.time_settings.current_time).innerText = newTime
							
							var dayIndex = this.schedule.Days.findIndex(d => d.Name.toLowerCase() == this.time_settings.current_time.split('-')[0])
							if (this.time_settings.current_time.split('-')[1] == 'start')
								this.schedule.Days[dayIndex].StartTime = newTime
							else
								this.schedule.Days[dayIndex].EndTime = newTime
							await UserConfig.save()
							this.elements.modal.remove()
					}
				}
			}
		}

		return keyPad
	}

	async changeTime(id, value) {
		var enabled = this.schedule.Days.find(s => s.Name.toLowerCase() == id.split('-')[0]).Enabled;
		if (!enabled)
			return

		var hour = ''
		var minute = ''
		var type = 'AM'
		if (value) {
			hour = value.split(':')[0]
			minute = value.split(':')[1].split(' ')[0]
			type = value.split(':')[1].split(' ')[1]
		}
		
		this.time_settings.current_time = id
		this.time_settings.current_element = 'hour'

		jor(document.body, el => [
			el('modal').refer('modal').children(
				el('time-entry').children(
					el('hour').text(hour).refer('hour').class('active'),
					el('span').text(':'),
					el('minute').text(minute).refer('minute'),
					el('time-type').text(type).refer('timetype')
				)
			)
		], this.elements)

		this.elements.modal.appendChild(await this.createKeyPad())
	}

	async toggleScheduleDay(day) {
		var index = this.schedule.Days.findIndex(s => s.Name == day)
		if (index < 0)
			return
		this.schedule.Days[index].Enabled = !this.schedule.Days[index].Enabled
		var element = document.getElementById('schedule-' + day.toLowerCase())
		element.classList.toggle('selected', this.schedule.Days[index].Enabled)
		
		await UserConfig.save()
	}
}