// بيانات المستخدمين (مدير + مستخدم واحد)
const users = {
    admin: {
        username: "admin",
        password: "admin123",
        name: "فرغل ",
        role: "admin"
    },
    user: {
        username: "user",
        password: "user123",
        name: "عصام ",
        role: "user"
    }
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // إخفاء شاشة التحميل بعد ثانيتين
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            
            // التحقق من وجود مستخدم مسجل
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                showAppScreen(currentUser);
            } else {
                document.getElementById('login-screen').classList.add('active');
            }
        }, 500);
    }, 1000);
    
    // تعيين تاريخ افتراضي (غداً)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('task-due').valueAsDate = tomorrow;
});

// تسجيل الدخول
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showToast('الرجاء إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }
    
    const user = Object.values(users).find(u => 
        u.username === username && u.password === password
    );
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        showAppScreen(user);
        showToast(`مرحباً ${user.name}`, 'success');
    } else {
        showToast('بيانات الدخول غير صحيحة', 'error');
    }
}

// عرض واجهة التطبيق
function showAppScreen(user) {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    document.getElementById('welcome-message').textContent = `مرحباً ${user.name}`;
    document.getElementById('user-role').textContent = user.role === 'admin' ? 'مدير' : 'مستخدم';
    
    // إخفاء نموذج إضافة المهام إذا كان مستخدم عادي
    if (user.role !== 'admin') {
        document.getElementById('task-form-section').style.display = 'none';
    } else {
        document.getElementById('task-form-section').style.display = 'block';
    }
    
    loadTasks();
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('currentUser');
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showToast('تم تسجيل الخروج بنجاح', 'success');
}

// إضافة مهمة جديدة (للمدير فقط)
function addTask() {
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
        showToast('الرجاء إدخال عنوان للمهمة', 'error');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    const newTask = {
        id: Date.now(),
        title,
        type: document.getElementById('task-type').value,
        cost: parseInt(document.getElementById('task-cost').value) || 0,
        priority: parseInt(document.getElementById('task-priority').value) || 5,
        dueDate: document.getElementById('task-due').value,
        description: document.getElementById('task-desc').value,
        createdAt: new Date().toISOString(),
        status: 'pending', // pending, in_progress, completed
        createdBy: currentUser.username,
        assignedTo: 'user' // يتم تعيينها للمستخدم الوحيد تلقائياً
    };
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.unshift(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // مسح الحقول
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    
    loadTasks();
    showToast('تم إضافة المهمة بنجاح', 'success');
}

// تحميل المهام
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const filter = document.getElementById('filter-tasks').value;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    let filteredTasks = tasks.filter(task => {
        // المدير يرى كل المهام
        if (currentUser.role === 'admin') return true;
        
        // المستخدم يرى المهام المخصصة له فقط
        return task.assignedTo === currentUser.username;
    });
    
    // تطبيق الفلتر
    if (filter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.status === filter);
    }
    
    const tasksContainer = document.getElementById('tasks-container');
    tasksContainer.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <i class="far fa-folder-open"></i>
                <p>لا توجد مهام لعرضها</p>
            </div>
        `;
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card ${task.status === 'completed' ? 'completed' : ''}`;
        
        // تنسيق حالة المهمة
        let statusText = '';
        if (task.status === 'pending') statusText = 'قيد الانتظار';
        else if (task.status === 'in_progress') statusText = 'قيد التنفيذ';
        else if (task.status === 'completed') statusText = 'مكتملة';
        
        taskEl.innerHTML = `
            <h3 class="task-title">${task.title}</h3>
            <div class="task-details">
                <span><i class="fas fa-tag"></i> ${task.type}</span>
                <span><i class="fas fa-coins"></i> ${task.cost} ج.م</span>
                <span><i class="fas fa-star"></i> ${task.priority}/10</span>
                ${task.dueDate ? `<span><i class="far fa-calendar-alt"></i> ${formatDate(task.dueDate)}</span>` : ''}
                <span class="task-status status-${task.status}">${statusText}</span>
            </div>
            ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
            <div class="task-actions">
                <select class="status-select" onchange="updateTaskStatus(${task.id}, this.value)" ${currentUser.role !== 'admin' ? '' : 'disabled'}>
                    <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                    <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>قيد التنفيذ</option>
                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>مكتملة</option>
                </select>
                ${currentUser.role === 'admin' ? `
                <button class="btn btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
                ` : ''}
            </div>
        `;
        tasksContainer.appendChild(taskEl);
    });
}

// تحديث حالة المهمة (للمستخدم فقط)
function updateTaskStatus(taskId, status) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser.role === 'admin') {
        showToast('المدير لا يمكنه تعديل حالة المهام', 'error');
        return;
    }
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, status };
        }
        return task;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
    showToast('تم تحديث حالة المهمة', 'success');
}

// حذف المهمة (للمدير فقط)
function deleteTask(taskId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser.role !== 'admin') {
        showToast('غير مسموح لك بحذف المهام', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
    showToast('تم حذف المهمة', 'success');
}

// تصفية المهام
function filterTasks() {
    loadTasks();
}

// تنسيق التاريخ
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
}

// عرض رسائل التنبيه
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}