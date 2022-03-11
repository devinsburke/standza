from dataclasses import dataclass
from enum import Enum
import datetime
from sensor import CameraProcessor

State = Enum('STAND SIT AWAY UNKNOWN')


@dataclass
class Schedule:
    start: datetime
    end: datetime


@dataclass
class Moment:
    state: State
    time: datetime
    working: bool


class ActivityLog:
    _log: [Moment]
    Interval: int = 1


class StandzaProcessor:
    camera = CameraProcessor()
    pending = []

    def timer_elapsed(self):
        pass
