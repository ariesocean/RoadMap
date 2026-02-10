import os
from pathlib import Path

class FileManager:
    def __init__(self, roadmap_path="roadmap.md", achievements_path="achievements.md"):
        self.roadmap_path = Path(roadmap_path)
        self.achievements_path = Path(achievements_path)
    
    def read_roadmap(self):
        """Read roadmap.md with error handling"""
        try:
            if not self.roadmap_path.exists():
                self.roadmap_path.write_text("")
            return self.roadmap_path.read_text()
        except Exception as e:
            print(f"Error reading roadmap: {e}")
            return ""
    
    def read_achievements(self):
        """Read achievements.md with error handling"""
        try:
            if not self.achievements_path.exists():
                self.achievements_path.write_text("")
            return self.achievements_path.read_text()
        except Exception as e:
            print(f"Error reading achievements: {e}")
            return ""
    
    def write_roadmap(self, content):
        """Write content to roadmap.md with error handling"""
        try:
            if self.roadmap_path.exists():
                backup_path = self.roadmap_path.with_suffix('.md.bak')
                backup_path.write_text(self.roadmap_path.read_text())
            
            self.roadmap_path.write_text(content)
            return True
        except Exception as e:
            print(f"Error writing roadmap: {e}")
            return False
    
    def write_achievements(self, content):
        """Write content to achievements.md with error handling"""
        try:
            self.achievements_path.write_text(content)
            return True
        except Exception as e:
            print(f"Error writing achievements: {e}")
            return False
