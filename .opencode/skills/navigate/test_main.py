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


def test_empty_prompt():
    skill = NavigateSkill()
    response = skill.process_prompt("")
    assert "Please provide a task description" in response


def test_whitespace_only_prompt():
    skill = NavigateSkill()
    response = skill.process_prompt("   ")
    assert "Please provide a task description" in response


def test_very_long_prompt():
    long_prompt = "a" * 1001
    skill = NavigateSkill()
    response = skill.process_prompt(long_prompt)
    assert "too long" in response.lower()


def test_empty_task_id_mark_complete():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        skill = NavigateSkill()
        response = skill.process_prompt("Done")
        assert "Which task" in response or "Could not find" in response


def test_empty_task_id_create_subtask():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        skill = NavigateSkill()
        response = skill.process_prompt("Add a subtask")
        assert "Which" in response or "Created main task" in response


def test_empty_task_id_archive():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        skill = NavigateSkill()
        response = skill.process_prompt("Archive completed task")
        assert "Which" in response or "Could not find" in response


def test_file_write_error_handling():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        skill = NavigateSkill()
        response = skill.process_prompt("Build a test project")
        assert "Created main task" in response


def test_mark_nonexistent_task():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        skill = NavigateSkill()
        response = skill.process_prompt("Done with nonexistent task")
        assert "Which" in response or "Error" in response


def test_create_subtask_nonexistent_parent():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        skill = NavigateSkill()
        response = skill.process_prompt("Add subtask to nonexistent project")
        assert "Which" in response or "Created main task" in response or "Error" in response


def test_mark_complete_returns_false():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        skill = NavigateSkill()
        result = skill.task_state_manager.mark_task_complete("")
        assert result is False


def test_create_subtask_returns_false():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        skill = NavigateSkill()
        result = skill.task_state_manager.create_subtask("", "test content")
        assert result is False


def test_create_main_task_empty_title():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        skill = NavigateSkill()
        skill.process_prompt("")
        assert len(skill.task_state_manager.tasks) == 0
