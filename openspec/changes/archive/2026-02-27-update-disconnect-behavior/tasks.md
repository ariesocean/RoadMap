## 1. Implementation
- [x] 1.1 Remove writeRoadmapFile('# Roadmap\n\n') from App.tsx disconnect handler
- [x] 1.2 Add refreshTasks() call after disconnect to clear UI tasks
- [x] 1.3 Add isConnected check in taskStore refreshTasks function
- [x] 1.4 Remove unused writeRoadmapFile import from App.tsx

## 2. Auto-select Last Edited Map on Connect
- [x] 2.1 Add lastEditedMap storage in mapsStore using localStorage
- [x] 2.2 Update lastEditedMap when user selects a map from sidebar
- [x] 2.3 Add auto-select logic in App.tsx when isConnected becomes true
- [x] 2.4 Handle edge case when stored map no longer exists
