import os
from pathlib import Path

class FileManager:
    def __init__(self, roadmap_path="roadmap.md", achievements_path="achievements.md"):
        self.roadmap_path = Path(roadmap_path)
        self.achievements_path = Path(achievements_path)
    
    def read_roadmap(self):
        """Read roadmap.md, create empty if doesn't exist"""
        if not self.roadmap_path.exists():
            self.roadmap_path.write_text("")
        return self.roadmap_path.read_text()
    
    def read_achievements(self):
        """Read achievements.md, create empty if doesn't exist"""
        if not self.achievements_path.exists():
            self.achievements_path.write_text("")
        return self.achievements_path.read_text()
    
    def write_roadmap(self, content):
        """Write content to roadmap.md"""
        self.roadmap_path.write_text(content)
    
    def write_achievements(self, content):
        """Write content to achievements.md"""
        self.achievements_path.write_text(content)
