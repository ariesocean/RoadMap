from datetime import datetime
from skills.navigate.task_state_manager import TaskStateManager

def test_create_main_task():
    tsm = TaskStateManager()
    tsm.create_main_task("Build website", "Create a new website project")
    
    assert len(tsm.tasks) == 1
    assert tsm.tasks[0]["title"] == "Build website"
    assert tsm.tasks[0]["description"] == "Create a new website project"
    assert tsm.tasks[0]["status"] == "active"
    assert "created_at" in tsm.tasks[0]

def test_create_and_complete_subtask():
    tsm = TaskStateManager()
    tsm.create_main_task("Website project")
    main_task_id = tsm.tasks[0]["id"]
    
    tsm.create_subtask(main_task_id, "Add login feature")
    assert len(tsm.tasks[0]["subtasks"]) == 1
    assert tsm.tasks[0]["subtasks"][0]["title"] == "Add login feature"
    
    subtask_id = tsm.tasks[0]["subtasks"][0]["id"]
    tsm.mark_task_complete(subtask_id)
    assert tsm.tasks[0]["subtasks"][0]["completed"] == True
