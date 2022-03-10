from dataclasses import dataclass
from enum import Enum
import datetime

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
