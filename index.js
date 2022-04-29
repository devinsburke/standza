var tabs = ['home','calendar','settings','preview'];

function changeTab(tabName) {
	var container = document.getElementById('content-container');
	document.querySelectorAll('.selected-tab').forEach(function(button) {
		button.classList.remove('selected-tab');
	});
	document.getElementById('tab-' + tabName).classList.add('selected-tab');
	container.classList.add(tabName);
	tabs.filter(t => t != tabName).forEach(t => {
		container.classList.remove(t);
	});
}