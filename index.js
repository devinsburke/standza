let tabs = ['home','progress','calendar','settings','preview']
let AppConfig = null
let UserConfig = null

const getNow = () => new Date(Date.now())

function jor(parent, fn, container) {
	container ??= {}
	fn(tag => ({
		element: document.createElement(tag),
		container: container,
		class(c, b=true) { this.element.classList.toggle(c, b); return this },
		text(t, b=true) { if (b) this.element.textContent = t; return this },
		id(i, b=true) { if (b) this.element.id = i; return this },
		attr(k, v, b=true) { if (b) this.element.setAttribute(k, v); return this },
		set (k, v, b=true) { if (b) this.element[k] = v; return this },
		refer(id, b=true) { if (b) this.container[id] = this.element; return this },
		children(...c) { c.forEach(i => this.element.appendChild(i.element)); return this }
	})).forEach(e => parent.appendChild(e.element))
	return container
}

function changeTab(tabName) {
	document.querySelectorAll('.selected-tab').forEach(b => b.classList.remove('selected-tab'))
	document.getElementById('tab-' + tabName).classList.add('selected-tab')
	const container = document.getElementById('content-container')
	tabs.forEach(t => container.classList.remove(t))
	container.classList.add(tabName)
}

window.addEventListener('DOMContentLoaded', async () => {
	AppConfig = await AppConfiguration.fromJson('./data/application.json', standzaAPI.writeFile)
	UserConfig = await UserConfiguration.fromJson('./data/user.json', standzaAPI.writeFile)
	const scheduleComponent = new ScheduleComponent(
		document.getElementById('schedule-list'),
		UserConfig.schedule
	)
	
	setupSettings()

	const audioPlayer = new AudioPlayer(
		document.getElementById('audio-container'),
		'./audio/${soundId}.mp3'
	)
	audioPlayer.buildChime('.chime')

	const camera = new CameraProcessor(
		'video',
		document.getElementById('capture-wrapper'),
		standzaAPI.estimatePose,
		standzaAPI.snapCameraImage
	)
	await camera.setupCamera()

	const vizManager = new VisualizationManager(
		document.getElementById('visualization-container'),
		AppConfig.Visualizations
	)
	const rules = new RuleEngine(
		UserConfig.goals,
		AppConfig.Goals,
		AppConfig.Triggers,
		audioPlayer
	)

	const stateManager = new StateManager(
		camera,
		UserConfig.schedule,
		UserConfig.parameters,
		() => UserConfig.refreshRate,
		() => UserConfig.stateChangeTolerance
	)
	stateManager.hooks.push(s => rules.run(s))
	stateManager.hooks.push(s => vizManager.setData(s))
	await stateManager.run()
})
