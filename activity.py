from dataclasses import dataclass
from enum import Enum
from sensor import CameraProcessor
from datetime import datetime, timedelta

State = Enum('STAND SIT AWAY UNKNOWN')


@dataclass
class Schedule:
    start: datetime
    end: datetime


@dataclass
class Moment:
    state: State
    timestamp: datetime
    working: bool
    significant: bool


class ActivityLog:
    def __init__(self):
        self.log: [Moment] = []

    def submit(self, *entries):
        self.log.extend(entries)

    def recent_with_index(self, ignore_insignificant=False):
        for i in reversed(range(len(self.log))):
            moment = self.log[i]
            if moment.significant or not ignore_insignificant:
                return moment, i
        return None, None

    def recent(self, ignore_insignificant=False):
        recent, i = self.recent_with_index(ignore_insignificant)
        return recent

    def start_of_recent(self, ignore_insignificant=False):
        recent, recent_index = self.recent_with_index(ignore_insignificant)
        if recent:
            for i in reversed(range(recent_index)):
                moment = self.log[i]
                if moment.state == recent.state:
                    if moment.significant or not ignore_insignificant:
                        return self.log[i+1]

            return self.log[0]


class StateManager:
    def __init__(self, ):
        self.camera = CameraProcessor()
        self.activity = ActivityLog()
        self.pending = ActivityLog()
        self.recent_moment: Moment = None
        self.significance_threshold: int = 300  # 5 minutes

    def timer_elapsed(self):
        true_state = self.camera.capture_targeted_labels()
        pending_state = self.pending.recent()

        if pending_state and pending_state != true_state:
            pass

    def get_state_from_camera(self):
        labels = self.camera.capture_targeted_labels()
        if 'stand' in labels:
            return State.STAND
        if 'person' in labels:
            return State.SIT
        return State.AWAY

    def is_pending_significant(self):
        start_of_recent = self.pending.start_of_recent()
        return start_of_recent and start_of_recent.timestamp < datetime.now() - timedelta(seconds=self.significance_threshold)

    def submit_pending(self):
        pass
