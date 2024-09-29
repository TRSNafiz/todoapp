document.getElementById('add-task-btn').addEventListener('click', addTask);
document.getElementById('sort-date-btn').addEventListener('click', () => sortTasks('date'));
document.getElementById('sort-priority-btn').addEventListener('click', () => sortTasks('priority'));
document.getElementById('filter-completed-btn').addEventListener('click', filterCompletedTasks);
document.getElementById('theme-switch').addEventListener('change', toggleTheme);

document.addEventListener('DOMContentLoaded', loadTasks);

function addTask() {
    const taskInput = document.getElementById('new-task');
    const taskText = taskInput.value.trim();
    const taskCategory = document.getElementById('task-category').value;
    const taskPriority = document.getElementById('task-priority').value;
    const taskDueDate = document.getElementById('due-date').value;
    const taskAlarmTime = document.getElementById('alarm-time').value; // Get the alarm time

    if (taskText === '') {
        alert('Please enter a task.');
        return;
    }

    const taskItem = createTaskElement(taskText, taskCategory, taskPriority, taskDueDate, false);
    document.getElementById('task-list').appendChild(taskItem);
    
    saveTasks();
    setAlarm(taskText, taskAlarmTime); // Set the alarm for the task

    // Reset input fields after adding a task
    taskInput.value = '';
    document.getElementById('due-date').value = '';
    document.getElementById('alarm-time').value = ''; // Reset alarm time
}

// Function to set the alarm
function setAlarm(taskText, alarmTime) {
    const alarmDate = new Date(alarmTime); // Create a date object from the input

    if (alarmDate.getTime() > Date.now()) {
        const timeToAlarm = alarmDate.getTime() - Date.now(); // Calculate time until alarm

        setTimeout(() => {
            // Notify user
            if (Notification.permission === "granted") {
                new Notification("Task Reminder", { body: `It's time for: ${taskText}` });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification("Task Reminder", { body: `It's time for: ${taskText}` });
                    }
                });
            }
        }, timeToAlarm);
    } else {
        alert('Please select a future time for the alarm.');
    }
}

function createTaskElement(taskText, taskCategory, taskPriority, taskDueDate, completed) {
    const taskItem = document.createElement('li');
    taskItem.classList.add(taskCategory, taskPriority);
    taskItem.setAttribute('draggable', true); // Make the task item draggable

    const taskContent = document.createElement('span');
    taskContent.textContent = `${taskText} (Due: ${taskDueDate})`;
    taskItem.appendChild(taskContent);

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the modal
        if (confirm('Are you sure you want to delete this task?')) {
            taskItem.remove();
            saveTasks(); // Update local storage
        }
    });
    taskItem.appendChild(deleteButton);

    taskItem.addEventListener('click', () => openTaskModal(taskContent.textContent));

    if (completed) {
        taskItem.classList.add('completed');
    }

    // Drag and Drop Event Listeners
    taskItem.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', taskItem.innerHTML); // Store the dragged element's inner HTML
        taskItem.classList.add('dragging');
    });

    taskItem.addEventListener('dragend', () => {
        taskItem.classList.remove('dragging');
    });

    document.getElementById('task-list').addEventListener('dragover', (e) => {
        e.preventDefault(); // Prevent default to allow drop
        const afterElement = getDragAfterElement(document.getElementById('task-list'), e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            document.getElementById('task-list').appendChild(dragging);
        } else {
            document.getElementById('task-list').insertBefore(dragging, afterElement);
        }
    });

    return taskItem;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2; // Calculate offset
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function sortTasks(criterion) {
    const tasks = Array.from(document.querySelectorAll('#task-list li'));

    if (criterion === 'date') {
        tasks.sort((a, b) => {
            const dateA = new Date(a.textContent.match(/\(Due: (\d{4}-\d{2}-\d{2})\)/)[1]);
            const dateB = new Date(b.textContent.match(/\(Due: (\d{4}-\d{2}-\d{2})\)/)[1]);
            return dateA - dateB;
        });
    } else if (criterion === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        tasks.sort((a, b) => priorityOrder[b.classList[1]] - priorityOrder[a.classList[1]]);
    }

    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; // Clear the existing tasks
    tasks.forEach(task => taskList.appendChild(task)); // Append sorted tasks
    saveTasks(); // Update local storage
}

function filterCompletedTasks() {
    const tasks = Array.from(document.querySelectorAll('#task-list li'));
    const completedTasks = tasks.filter(task => task.classList.contains('completed'));
    
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; // Clear the existing tasks
    completedTasks.forEach(task => taskList.appendChild(task)); // Append only completed tasks
}

function toggleTheme() {
    document.body.classList.toggle('dark');
}

// Task Modal Functions
const modal = document.getElementById('task-modal');
const closeBtn = document.querySelector('.close-btn');
const taskDetailsDiv = document.getElementById('task-details');

function openTaskModal(taskContent) {
    taskDetailsDiv.textContent = taskContent;
    modal.style.display = 'block';
}

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Local Storage Functions
function saveTasks() {
    const tasks = Array.from(document.querySelectorAll('#task-list li')).map(task => {
        return {
            text: task.firstChild.textContent.split(' (Due: ')[0],
            category: task.classList[0],
            priority: task.classList[1],
            completed: task.classList.contains('completed'),
            dueDate: task.firstChild.textContent.match(/\(Due: (\d{4}-\d{2}-\d{2})\)/)[1]
        };
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        const taskItem = createTaskElement(task.text, task.category, task.priority, task.dueDate, task.completed);
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        document.getElementById('task-list').appendChild(taskItem);
    });
}
