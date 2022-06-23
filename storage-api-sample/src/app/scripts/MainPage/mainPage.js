import formatDate from '../utils/date';
let listItemsCounter;
let tasksMapping;
let api;
let addInId;
let username;

const uploadTask = ({ task, done, addedDateTime, completedDateTime }) => new Promise((resolve, reject) => {
  api.call('Add', {
    typeName: 'AddInData',
    entity: {
      addInId,
      details: {
        type: 'task',
        username,
        addedDateTime: new Date().toISOString(),
        editedDateTime: new Date().toISOString(),
        active: true,
        task,
        done,
        addedDateTime,
        completedDateTime
      }
    }
  }, result => {
    console.log('Successfully uploaded AddInData', result);
    resolve(result);
  }, error => reject(error));
});

const updateDomTaskCompletion = (isCompleted, listContainer) => {
  const metaDataContainer = listContainer.querySelector('.storageApiSample-meta-data-container');
  if (isCompleted) {
    const completedDate = document.createElement('div');
    const { currentDate, currentTime } = formatDate(new Date().toISOString())
    completedDate.innerText = `${currentDate} ${currentTime} (completed)`;
    metaDataContainer.appendChild(completedDate);
    return;
  }
  const completedDate = metaDataContainer.lastChild;
  metaDataContainer.removeChild(completedDate);
}

const updateTask = (selectedItemId) => {
  const { id, username, task, done, completedDateTime, addedDateTime } = tasksMapping.get(parseInt(selectedItemId));
  api.call('Set', {
    typeName: 'AddInData',
    entity: {
      addInId,
      id,
      groups: [],
      details: {
        type: 'task',
        username,
        addedDateTime,
        editedDateTime: new Date().toISOString(),
        active: true,
        task,
        done,
        addedDateTime,
        completedDateTime
      }
    }
  }, result => console.log(`Successfully updated item ${id}`, result)
    , error => console.error(error));
}

const removeTask = (selectedItemId) => {
  const { id } = tasksMapping.get(parseInt(selectedItemId));
  api.call('Remove', {
    typeName: 'AddInData',
    entity: {
      addInId,
      id
    }
  }, result => console.log(`Successfully removed item ${id}`, result)
    , error => console.error(error));
}

const checkItemHandler = ({ target: itemCheck }) => {
  const { checked } = itemCheck;
  console.log('Checked item', {
    checked
  });
  const selectedItemId = itemCheck.getAttribute('data-item');
  const textList = document.querySelector(`#text-item-${selectedItemId}`);
  console.log('Selected textList element', textList);
  const taskData = tasksMapping.get(parseInt(selectedItemId));
  const newData = Object.assign({}, taskData);
  if (checked) {
    textList.className = 'storageApiSample-strike';
    newData.done = true;
    newData.completedDateTime = new Date().toISOString();
    tasksMapping.set(parseInt(selectedItemId), newData);
    updateTask(selectedItemId);
    // removeTask(selectedItemId);
    updateDomTaskCompletion(checked, textList.parentElement);
  }
  else {
    textList.className = 'storageApiSample-remove-strike'
    newData.done = false;
    newData.completedDateTime = '';
    tasksMapping.set(parseInt(selectedItemId), newData);
    updateTask(selectedItemId);
    updateDomTaskCompletion(checked, textList.parentElement);
  }
  console.log(tasksMapping);
}

const addListItemtoDom = (task, isCompleted, addedDateTime, completedDateTime) => {
  console.log(`Inserting ${task}`);

  const listContainer = document.querySelector('.storageApiSample-list-container');
  const itemContainer = document.createElement('div');
  itemContainer.className = 'storageApiSample-list-item';

  const itemCheck = document.createElement('input');
  itemCheck.setAttribute('type', 'checkbox');
  itemCheck.setAttribute('name', `check-item-${listItemsCounter}`);
  itemCheck.setAttribute('data-item', listItemsCounter);
  itemCheck.setAttribute('id', `check-item-${listItemsCounter}`);
  itemCheck.addEventListener('change', checkItemHandler);

  const itemText = document.createElement('span');
  itemText.innerText = task;
  itemText.setAttribute('id', `text-item-${listItemsCounter}`);
  if (isCompleted) {
    itemCheck.checked = true;
    itemText.className = 'storageApiSample-strike';
  }
  const metaDataContainer = document.createElement('div');
  metaDataContainer.className = 'storageApiSample-meta-data-container';

  if (addedDateTime) {
    const addedDate = document.createElement('div');
    const { currentDate, currentTime } = formatDate(addedDateTime)
    addedDate.innerText = `${currentDate} ${currentTime} (added)`;
    metaDataContainer.appendChild(addedDate);

  } if (completedDateTime) {
    const completedDate = document.createElement('div');
    const { currentDate, currentTime } = formatDate(completedDateTime)
    completedDate.innerText = `${currentDate} ${currentTime} (completed)`;
    metaDataContainer.appendChild(completedDate);
  }

  const separator = document.createElement('hr');

  itemContainer.appendChild(itemCheck);
  itemContainer.appendChild(itemText);
  listContainer.appendChild(itemContainer);
  itemContainer.appendChild(metaDataContainer);
  listContainer.appendChild(separator);
}

const clearItemsFromDom = () => {
  const listContainer = document.querySelector('.storageApiSample-list-container');
  listContainer.innerHTML = '';
}

const addItemHandler = (task) => {
  const taskData = {
    task,
    done: false,
    addedDateTime: new Date().toISOString(),
    completedDateTime: ''
  };


  uploadTask(taskData)
    .then(taskId => {
      taskData.id = taskId;
      tasksMapping.set(listItemsCounter, taskData);
      listItemsCounter += 1;
    })
    .catch(error => console.error(error));
}

const removeTodoListeners = () => new Promise((resolve) => {
  const input = document.querySelector('#todo-list-input');
  const addBtn = document.querySelector('#todo-list-button');

  var newInput = input.cloneNode(true);

  input.parentNode.replaceChild(newInput, input);

  var newBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newBtn, addBtn);

  resolve();
});

const addTodoListListeners = () => {
  const input = document.querySelector('#todo-list-input');
  const addBtn = document.querySelector('#todo-list-button');
  console.log('Adding change event listener to todo list input');

  addBtn.addEventListener('click', () => {
    const { value: task } = input;
    addListItemtoDom(task, false, new Date().toISOString(), null);
    addItemHandler(task)
    input.value = '';
  });
  input.addEventListener('keyup', ({ code }) => {
    const { value: task } = input;
    if (code === 'Enter') {
      addListItemtoDom(task, false, new Date().toISOString(), null);
      addItemHandler(task)
      input.value = '';
    }
  });
}

const loadConfigs = (addInConfigs) => new Promise((resolve) => {
  tasksMapping = new Map();
  if (addInConfigs.length === 0) {
    resolve();
  }
  console.log('Loading the following addInConfigs', addInConfigs);
  const input = document.querySelector('#todo-list-input');
  addInConfigs.forEach(({ details: { username, task, done, completedDateTime, addedDateTime }, id }, index) => {
    tasksMapping.set(index, { task, done, completedDateTime, addedDateTime, id, username, });
    addListItemtoDom(task, done, addedDateTime, completedDateTime);
    listItemsCounter += 1;
  });
  resolve();
})

const MainPage = (freshApi, addinID, addInConfigs, userName) => {
  listItemsCounter = 0;
  clearItemsFromDom();
  api = freshApi;
  addInId = addinID;
  username = userName;

  removeTodoListeners()
    .then(loadConfigs(addInConfigs))
    .then(addTodoListListeners);
}

export default MainPage;