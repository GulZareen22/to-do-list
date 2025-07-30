document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const welcomeScreen = document.querySelector('.welcome-screen');
    const container = document.querySelector('.container');
    const themeToggle = document.getElementById('theme-toggle');
    const addTaskBtn = document.getElementById('add-task');
    const taskTitle = document.getElementById('task-title');
    const taskDescription = document.getElementById('task-description');
    const taskDate = document.getElementById('task-date');
    const taskTime = document.getElementById('task-time');
    const taskCategory = document.getElementById('task-category');
    const taskPriority = document.getElementById('task-priority');
    const navItems = document.querySelectorAll('.sidebar-nav li');
    const sections = document.querySelectorAll('.section');
    const searchInput = document.getElementById('search-tasks');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthEl = document.getElementById('current-month');
    const calendarGrid = document.getElementById('calendar-grid');
    
    // Stats elements
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    
    // Task containers
    const allTasksContainer = document.getElementById('all-tasks-container');
    const deadlineContainer = document.getElementById('deadline-container');
    const upcomingContainer = document.getElementById('upcoming-container');
    const completedContainer = document.getElementById('completed-container');
    
    // Initialize variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    
    // Set today's date as default
    const today = new Date();
    taskDate.valueAsDate = today;
    taskTime.value = '12:00';
    
    // Initialize clock
    initClock();
    
    // Initialize calendar
    renderCalendar(currentYear, currentMonth);
    
    // Render tasks
    renderAllTasks();
    updateStats();
    
    // Event Listeners
    themeToggle.addEventListener('change', toggleTheme);
    
    addTaskBtn.addEventListener('click', addTask);
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            const sectionId = item.dataset.section;
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                    
                    // Render specific tasks if needed
                    if (sectionId === 'deadline') {
                        renderDeadlineTasks();
                    } else if (sectionId === 'upcoming') {
                        renderUpcomingTasks();
                    } else if (sectionId === 'completed') {
                        renderCompletedTasks();
                    }
                }
            });
        });
    });
    
    searchInput.addEventListener('input', filterTasks);
    
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentYear, currentMonth);
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentYear, currentMonth);
    });
    
    // Functions
    function initClock() {
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    function updateClock() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        // Analog clock
        const hourHand = document.querySelector('.hour-hand');
        const minuteHand = document.querySelector('.minute-hand');
        const secondHand = document.querySelector('.second-hand');
        
        const hourDeg = (hours % 12) * 30 + minutes * 0.5;
        const minuteDeg = minutes * 6 + seconds * 0.1;
        const secondDeg = seconds * 6;
        
        hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
        minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
        secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;
        
        // Digital clock
        const digitalTime = document.querySelector('.digital-time');
        digitalTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        saveThemePreference();
    }
    
    function saveThemePreference() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
    
    function loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
    }
    
    function addTask() {
        const title = taskTitle.value.trim();
        const description = taskDescription.value.trim();
        const date = taskDate.value;
        const time = taskTime.value;
        const category = taskCategory.value;
        const priority = taskPriority.value;
        
        if (!title) {
            alert('Please enter a task title');
            return;
        }
        
        const task = {
            id: Date.now(),
            title: title,
            description: description,
            date: date,
            time: time,
            category: category,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(task);
        saveTasks();
        renderTask(task, allTasksContainer);
        updateStats();
        
        // Reset form
        taskTitle.value = '';
        taskDescription.value = '';
        taskDate.valueAsDate = new Date();
        taskTime.value = '12:00';
        taskCategory.value = 'work';
        taskPriority.value = 'medium';
        
        // Show success animation
        addTaskBtn.classList.add('pulse');
        setTimeout(() => {
            addTaskBtn.classList.remove('pulse');
        }, 500);
    }
    
    function renderTask(task, container) {
        const taskElement = document.createElement('div');
        taskElement.className = `task ${task.completed ? 'completed' : ''} priority-${task.priority}`;
        taskElement.dataset.id = task.id;
        
        const dueDate = new Date(task.date);
        const formattedDate = dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-actions">
                    <button class="complete-btn">
                        <i class="fas ${task.completed ? 'fa-redo' : 'fa-check'}"></i>
                    </button>
                    <button class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="task-description">${task.description || 'No description'}</div>
            <div class="task-meta">
                <div class="task-due">
                    <i class="far fa-calendar"></i>
                    ${formattedDate} at ${task.time || 'No time'}
                </div>
                <div class="task-category">${task.category}</div>
            </div>
        `;
        
        // Add animation
        taskElement.style.animation = 'fadeIn 0.5s';
        container.prepend(taskElement);
        
        // Add event listeners
        const completeBtn = taskElement.querySelector('.complete-btn');
        completeBtn.addEventListener('click', () => toggleTaskComplete(task.id));
        
        const deleteBtn = taskElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
    }
    
    function renderAllTasks() {
        allTasksContainer.innerHTML = '';
        
        if (tasks.length === 0) {
            allTasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks yet</h3>
                    <p>Add your first task to get started!</p>
                </div>
            `;
            return;
        }
        
        // Sort tasks by date (newest first)
        const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        sortedTasks.forEach(task => {
            renderTask(task, allTasksContainer);
        });
    }
    
    function renderDeadlineTasks() {
        deadlineContainer.innerHTML = '';
        
        const now = new Date();
        const deadlineTasks = tasks.filter(task => {
            if (task.completed) return false;
            
            const taskDate = new Date(task.date);
            const timeDiff = taskDate - now;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            return daysDiff <= 3 && daysDiff >= 0;
        });
        
        if (deadlineTasks.length === 0) {
            deadlineContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>No upcoming deadlines</h3>
                    <p>You're all caught up for now!</p>
                </div>
            `;
            return;
        }
        
        deadlineTasks.forEach(task => {
            renderTask(task, deadlineContainer);
        });
    }
    
    function renderUpcomingTasks() {
        upcomingContainer.innerHTML = '';
        
        const now = new Date();
        const upcomingTasks = tasks.filter(task => {
            if (task.completed) return false;
            
            const taskDate = new Date(task.date);
            const timeDiff = taskDate - now;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            return daysDiff <= 7 && daysDiff >= 0;
        });
        
        if (upcomingTasks.length === 0) {
            upcomingContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-week"></i>
                    <h3>No upcoming tasks</h3>
                    <p>You have no tasks scheduled for this week.</p>
                </div>
            `;
            return;
        }
        
        upcomingTasks.forEach(task => {
            renderTask(task, upcomingContainer);
        });
    }
    
    function renderCompletedTasks() {
        completedContainer.innerHTML = '';
        
        const completedTasks = tasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            completedContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>No completed tasks</h3>
                    <p>Complete some tasks to see them here.</p>
                </div>
            `;
            return;
        }
        
        completedTasks.forEach(task => {
            renderTask(task, completedContainer);
        });
    }
    
    function toggleTaskComplete(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) return;
        
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        
        // Update all views
        renderAllTasks();
        renderDeadlineTasks();
        renderUpcomingTasks();
        renderCompletedTasks();
        updateStats();
        renderCalendar(currentYear, currentMonth);
    }
    
    function deleteTask(id) {
        const taskElement = document.querySelector(`.task[data-id="${id}"]`);
        if (taskElement) {
            // Add animation
            taskElement.classList.add('slide-out');
            
            // Remove from DOM after animation
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                taskElement.remove();
                
                // Update all views
                renderAllTasks();
                renderDeadlineTasks();
                renderUpcomingTasks();
                renderCompletedTasks();
                updateStats();
                renderCalendar(currentYear, currentMonth);
            }, 400);
        }
    }
    
    function filterTasks() {
        const searchTerm = searchInput.value.toLowerCase();
        
        if (!searchTerm) {
            renderAllTasks();
            return;
        }
        
        const filteredTasks = tasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) || 
            (task.description && task.description.toLowerCase().includes(searchTerm)) ||
            task.category.toLowerCase().includes(searchTerm)
        );
        
        allTasksContainer.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            allTasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No tasks found</h3>
                    <p>Try a different search term.</p>
                </div>
            `;
            return;
        }
        
        filteredTasks.forEach(task => {
            renderTask(task, allTasksContainer);
        });
    }
    
    function renderCalendar(year, month) {
        // Update month header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        // Clear calendar
        calendarGrid.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Add empty cells for days before the first
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-date';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Add date cells
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentDate = today.getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'calendar-date';
            
            // Check if this date has tasks
            const hasTasks = tasks.some(task => {
                if (task.completed) return false;
                
                const taskDate = new Date(task.date);
                return taskDate.getDate() === day && 
                       taskDate.getMonth() === month && 
                       taskDate.getFullYear() === year;
            });
            
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            
            if (day === currentDate && month === currentMonth && year === currentYear) {
                dateCell.classList.add('today');
            }
            
            if (hasTasks) {
                dateCell.classList.add('has-tasks');
            }
            
            dateCell.appendChild(dateNumber);
            
            // Add tasks for this date
            const dateTasks = tasks.filter(task => {
                if (task.completed) return false;
                
                const taskDate = new Date(task.date);
                return taskDate.getDate() === day && 
                       taskDate.getMonth() === month && 
                       taskDate.getFullYear() === year;
            });
            
            if (dateTasks.length > 0) {
                const tasksList = document.createElement('div');
                tasksList.className = 'date-tasks';
                
                dateTasks.slice(0, 3).forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.className = `date-task priority-${task.priority}`;
                    taskItem.textContent = task.title;
                    tasksList.appendChild(taskItem);
                });
                
                if (dateTasks.length > 3) {
                    const moreItem = document.createElement('div');
                    moreItem.className = 'date-task-more';
                    moreItem.textContent = `+${dateTasks.length - 3} more`;
                    tasksList.appendChild(moreItem);
                }
                
                dateCell.appendChild(tasksList);
            }
            
            // Add click event
            dateCell.addEventListener('click', () => {
                // Set the date in the form
                const selectedDate = new Date(year, month, day);
                taskDate.valueAsDate = selectedDate;
                
                // Show all tasks section
                navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelector('[data-section="all-tasks"]').classList.add('active');
                
                sections.forEach(section => section.classList.remove('active'));
                document.getElementById('all-tasks').classList.add('active');
                
                // Scroll to add task form
                document.querySelector('.add-task').scrollIntoView({ behavior: 'smooth' });
            });
            
            calendarGrid.appendChild(dateCell);
        }
    }
    
    function updateStats() {
        totalTasksEl.textContent = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = tasks.length - completed;
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Initialize theme preference
    loadThemePreference();
});