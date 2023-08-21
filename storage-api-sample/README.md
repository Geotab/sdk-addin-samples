# Storage API Sample Add-in
The purpose of this add-in is to show an example on how to use the AddInData API Calls. It features a to-do list that allows a user in MyGeotab to add new tasks and mark them as complete.

## Features
- Allows users to add new tasks
- Loads pre-existing tasks by looking for any tasks that have been added by the logged in user
- Added tasks are saved using the AddInData API call
- Tasks can be marked as completed by clicking on the corresponding checkbox, doing so makes a Set call for the AddInData entry
- Username, name, completion status, added datetime, and completed datetime are added as metadata for the task entry.
