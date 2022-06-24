var tabs = ['home','progress','calendar','settings','preview']
var AppConfig = null
var UserConfig = null

const getNow = () => new Date(Date.now())

function changeTab(tabName) {
	document.querySelectorAll('.selected-tab').forEach(b => b.classList.remove('selected-tab'))
	document.getElementById('tab-' + tabName).classList.add('selected-tab')
	const container = document.getElementById('content-container')
	tabs.forEach(t => container.classList.remove(t))
	container.classList.add(tabName)
}

window.addEventListener('DOMContentLoaded', async () => {
	AppConfig = await AppConfiguration.fromJson("./data/application.json")
	UserConfig = await UserConfiguration.fromJson("./data/user.json")
	setupSchedule(UserConfig.schedule)
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

	const vizManager = new VisualizationManager(AppConfig.Visualizations)
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
