import os
import tempfile
from skills.navigate.file_manager import FileManager

def test_read_roadmap_creates_empty_if_not_exists():
    with tempfile.TemporaryDirectory() as temp_dir:
        roadmap_path = os.path.join(temp_dir, "roadmap.md")
        fm = FileManager(roadmap_path)
        content = fm.read_roadmap()
        assert content == ""

def test_write_and_read_roadmap():
    with tempfile.TemporaryDirectory() as temp_dir:
        roadmap_path = os.path.join(temp_dir, "roadmap.md")
        fm = FileManager(roadmap_path)
        test_content = "# Test Task\n* [ ] Subtask"
        fm.write_roadmap(test_content)
        content = fm.read_roadmap()
        assert content == test_content
