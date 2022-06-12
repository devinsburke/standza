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

	const stateManager = new StateManager(
		new ActivityLog(
			UserConfig.schedule,
			UserConfig.stateChangeTolerance
		),
		new CameraProcessor(
			'video',
			document.getElementById('capture-wrapper'),
			standzaAPI.estimatePose,
			standzaAPI.snapCameraImage
		),
		new RuleEngine(
			UserConfig.goals,
			AppConfig.Goals,
			AppConfig.Triggers,
			new AudioPlayer(
				document.getElementById('audio-container'),
				'./audio/${soundId}.mp3'
			)
		),
		new VisualizationManager(
			AppConfig.Visualizations
		),
		UserConfig.parameters,
		() => UserConfig.refreshRate
	)
	stateManager.ruleEngine.audioPlayer.buildChime('.chime')
	await stateManager.camera.setupCamera()
	await stateManager.run()
})
