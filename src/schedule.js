var time_settings = {
	current_time: '',
	current_element: 'hour',
	current_hour: '',
	current_minute: '',
	current_type: '',
	editing: false
};

var keypad_items = [
	[7,8,9],
	[4,5,6],
	[1,2,3],
	['AM',0,'PM']
];

var keypad_controls = [
	[
		{tag: 'direction', icon: 'arrow_left', action: 'left'},
		{tag: 'done', icon: 'done', action: 'done'},
		{tag: 'direction', icon: 'arrow_right', action: 'right'}
	]
];

function keyPadEmit(value) {
	if (value == 'AM' || value == 'PM') {
		time_settings.current_type = value;
		document.getElementsByTagName('time-type')[0].innerText = time_settings.current_type;
		return;
	}
	var currentValue = '';
	if (time_settings.editing) {
		if (time_settings.current_element == 'hour')
			currentValue = time_settings.current_hour;
		else if (time_settings.current_element == 'minute')
			currentValue = time_settings.current_minute;
	}
	else 
		time_settings.editing = true;
	if (currentValue == '' && value == '0' && time_settings.current_element != 'minute')
		return;
	currentValue += value;
	if (time_settings.current_element == 'hour') {
		if (parseInt(currentValue) > 12)
			currentValue = '12';
		time_settings.current_hour = currentValue;
		document.getElementsByTagName('hour')[0].innerText = time_settings.current_hour;
	}
	else if (time_settings.current_element == 'minute') {
		if (parseInt(currentValue) > 59)
			currentValue = '59';
		time_settings.current_minute = parseInt(currentValue).toString().padStart(2, '0');
		document.getElementsByTagName('minute')[0].innerText = time_settings.current_minute;
	}
	if (currentValue.length > 1 || time_settings.current_element == 'hour' && value != '1')
		keyPadControl('right');
}

async function keyPadControl(direction) {
	if (direction == 'left') {
		if (time_settings.current_element == 'hour')
			return;
		time_settings.current_element = 'hour';
		var minute = document.getElementsByTagName('minute')[0];
		minute.classList.remove('active');
		var hour = document.getElementsByTagName('hour')[0];
		time_settings.current_hour = '';
		hour.classList.add('active');
	}
	else if (direction == 'right') {
		if (time_settings.current_element == 'minute')
			return;
		time_settings.current_element = 'minute';
		var hour = document.getElementsByTagName('hour')[0];
		hour.classList.remove('active');
		var minute = document.getElementsByTagName('minute')[0];
		time_settings.current_minute = '';
		minute.classList.add('active');
	}
	else {
		var newTime = time_settings.current_hour + ':' + time_settings.current_minute.padStart(2, '0') + ' ' + time_settings.current_type;
		document.getElementById(time_settings.current_time).innerText = newTime;
		var modal = document.getElementsByTagName('modal')[0];
		
		var dayIndex = UserConfig.schedule.Days.findIndex(d => d.Name.toLowerCase() == time_settings.current_time.split('-')[0]);
		if (time_settings.current_time.split('-')[1] == 'start')
			UserConfig.schedule.Days[dayIndex].StartTime = newTime;
		else 
			UserConfig.schedule.Days[dayIndex].EndTime = newTime;
		await UserConfig.save();
		modal.remove();
	}
}

function createKeyPadButton(value) {
	var button = document.createElement('key');
	button.textContent = value;
	button.onclick = function(e) {
		keyPadEmit(e.target.textContent);
	}; 
	return button;
}

function createKeyPad() {
	var keyPad = document.createElement('key-pad');
	keypad_items.forEach(k => {
		var row = document.createElement('row');
		k.forEach(n => {
			var btn = createKeyPadButton(n.toString());
			if (n.toString() == 'AM' || n.toString() == 'PM')
				btn.classList.add('time-type');
			row.appendChild(btn);
		});
		keyPad.appendChild(row);
	});
	keypad_controls.forEach(k => {
		var row = document.createElement('row');
		k.forEach(n => {
			var btn = document.createElement(n.tag);
			var icon = document.createElement('i');
			icon.classList.add('material-icons');
			icon.textContent = n.icon;
			btn.appendChild(icon);
			btn.onclick = function(e) {
				keyPadControl(n.action);
			};
			row.appendChild(btn);
		});
		keyPad.appendChild(row);
	});
	return keyPad;
}

function changeTime(id, value) {
	var enabled = UserConfig.schedule.Days.find(s => s.Name.toLowerCase() == id.split('-')[0]).Enabled;
	if (!enabled)
		return;
		
	var body = document.getElementsByTagName('body')[0];
	var modal = document.createElement('modal');
	modal.classList.add('hidden');
		
	var hour = '';
	var minute = '';
	var type = 'AM';
	if (value != '' && value != null) {
		hour = value.split(':')[0];
		minute = value.split(':')[1].split(' ')[0];
		type = value.split(':')[1].split(' ')[1];
	}
	
	time_settings.current_time = id;
	time_settings.current_hour = hour;
	time_settings.current_minute = minute;
	time_settings.current_type = type;
	time_settings.editing = false;
	time_settings.current_element = 'hour';
	
	var valueElement = document.createElement('time-entry');
	var hourElement = document.createElement('hour');
	hourElement.textContent = hour;
	hourElement.classList.add('active');
	valueElement.appendChild(hourElement);
	var divisor = document.createElement('span');
	divisor.textContent = ':';
	valueElement.appendChild(divisor);
	var minuteElement = document.createElement('minute');
	minuteElement.textContent = minute;
	valueElement.appendChild(minuteElement);
	var typeElement = document.createElement('time-type');
	typeElement.textContent = type;
	valueElement.appendChild(typeElement);
	modal.appendChild(valueElement);
	modal.appendChild(createKeyPad());
	
	body.appendChild(modal);
	setTimeout(function(){ 
		document.getElementsByTagName('modal')[0].classList.remove('hidden');
	}, 200);
}

function createTimeElement(id, value) {
	var time = document.createElement('time');
	time.id = id;
	time.textContent = value;
	time.onclick = function(e) {
		changeTime(e.target.id, e.target.textContent);
	};
	return time;
}

async function toggleScheduleDay(day) {
	var index = UserConfig.schedule.Days.findIndex(s => s.Name == day);
	if (index < 0)
		return;
		UserConfig.schedule.Days[index].Enabled = !UserConfig.schedule.Days[index].Enabled;
	var element = document.getElementById('schedule-' + day.toLowerCase());
	if (UserConfig.schedule.Days[index].Enabled)
		element.classList.add('selected');
	else 
		element.classList.remove('selected');
	await UserConfig.save();
}

function setupSchedule() {
	var scheduleContainer = document.getElementById('schedule-list');
	UserConfig.schedule.Days.forEach(s => {
		var li = document.createElement('li');
		var span = document.createElement('span');
		span.textContent = s.Name;
		span.onclick = (_) => toggleScheduleDay(s.Name);
		li.appendChild(span);
		li.id = 'schedule-' + s.Name.toLowerCase();
		li.appendChild(document.createElement('flex'));
		var from = createTimeElement(s.Name.toLowerCase() + '-start', s.StartTime);
		var to = createTimeElement(s.Name.toLowerCase() + '-end', s.EndTime);
		if (s.Enabled)
			li.classList.add('selected');
		else {
			from.classList.add('disabled');
			to.classList.add('disabled');
		}
		li.appendChild(from);
		li.appendChild(to);
		scheduleContainer.appendChild(li);
	});
}
