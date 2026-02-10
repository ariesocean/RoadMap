import os
import tempfile
from skills.navigate.main import NavigateSkill

def test_end_to_end_workflow():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)

        skill = NavigateSkill()

        # Create main task
        skill.process_prompt("Build a new website")

        # Add subtask
        skill.process_prompt("Add user authentication to the website project")

        # Complete subtask
        skill.process_prompt("Done with user authentication")

        # Verify roadmap.md content
        with open("roadmap.md", "r") as f:
            content = f.read()

        assert "# Build a new website" in content
        assert "* [x] Add user authentication" in content


def test_create_main_task():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)

        skill = NavigateSkill()
        response = skill.process_prompt("Create a new API project")

        assert "Created main task" in response
        assert os.path.exists("roadmap.md")

        with open("roadmap.md", "r") as f:
            content = f.read()
        assert "# Create a new API project" in content


def test_create_subtask():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)

        skill = NavigateSkill()

        # Create main task first
        skill.process_prompt("Build a mobile app")

        # Add subtask referencing the main task
        response = skill.process_prompt("Add push notifications to the mobile app project")

        assert "Added subtask" in response

        with open("roadmap.md", "r") as f:
            content = f.read()
        assert "Add push notifications" in content


def test_mark_task_complete():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)

        skill = NavigateSkill()

        # Create main task with subtask
        skill.process_prompt("Build a dashboard")
        skill.process_prompt("Add charts to the dashboard project")

        # Complete the subtask
        response = skill.process_prompt("Done with charts feature")

        assert "Marked task as complete" in response

        with open("roadmap.md", "r") as f:
            content = f.read()
        assert "* [x] Add charts" in content
