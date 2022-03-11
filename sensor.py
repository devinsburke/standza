from dataclasses import dataclass


@dataclass
class CameraProcessor:
    target_labels = {}

    def start(self):
        pass

    def capture_all_labels(self):
        return []

    def capture_targeted_labels(self):
        labels = self.capture_all_labels()
        return [self.target_labels[l] for l in labels if l in self.target_labels]

