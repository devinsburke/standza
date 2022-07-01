let AppConfig = null
let UserConfig = null

const getNow = () => new Date(Date.now())

window.addEventListener('DOMContentLoaded', async () => {
	AppConfig = await AppConfiguration.fromJson('./data/application.json', standzaAPI.writeFile)
	UserConfig = await UserConfiguration.fromJson('./data/user.json', standzaAPI.writeFile)
	
	const drawerComponent = new DrawerComponent(
		document.getElementById('drawer'),
		document.getElementById('content-container')
	)
	
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
