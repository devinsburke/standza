from dataclasses import dataclass


@dataclass
class Parameter:
    @dataclass
    class Duration:
        value: int
        unitOfMeasure: str
    id: str
    label: str
    datatype: str
    default: Duration
    goals: []


@dataclass
class Trigger:
    @dataclass
    class Condition:
        function: str
        arguments: [str]
        operator: str
        comparison: str
    id: str
    conditions: [Condition]
    alert: str
    targets: [str]


@dataclass
class Goal:
    id: str
    label: str
    description: str
    sort: int
    triggers: [Trigger]
