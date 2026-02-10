from skills.navigate.semantic_analyzer import SemanticIntentAnalyzer

def test_analyze_create_main_task_intent():
    analyzer = SemanticIntentAnalyzer()
    result = analyzer.analyze_intent("Build a new website")
    
    assert result["action"] == "create_main_task"
    assert result["content"] == "Build a new website"
    assert result["confidence"] > 0.8

def test_analyze_completion_intent():
    analyzer = SemanticIntentAnalyzer()
    existing_tasks = [{"id": "task_0", "title": "Website project"}]
    result = analyzer.analyze_intent("Done with website project", existing_tasks)
    
    assert result["action"] == "mark_complete"
    assert result["target_task_id"] == "task_0"

def test_analyze_subtask_intent():
    analyzer = SemanticIntentAnalyzer()
    existing_tasks = [{"id": "task_0", "title": "Website project"}]
    result = analyzer.analyze_intent("Add login to website project", existing_tasks)
    
    assert result["action"] == "create_subtask"
    assert result["target_task_id"] == "task_0"
