

// ============= متغيرات عامة =============
let currentUser = null;
let books = [];
let currentPage = 'home';
let currentBookId = null;
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let currentCategory = 'all';
let darkMode = localStorage.getItem('darkMode') === 'true';

// ============= تهيئة التطبيق =============
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadBooks();
    setupEventListeners();
    checkLoggedInStatus();
    initTheme();
    
    // محاكاة شاشة التحميل
    setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 300);
    }, 1500);
}

// تهيئة السمة
function initTheme() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// ============= إعداد المستمعين للأحداث =============
function setupEventListeners() {
    // مستمعو الصفحات
    document.querySelectorAll('[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    // زر القائمة للجوال
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);

    // مستمعو التبديل بين تسجيل الدخول وإنشاء حساب
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    // نماذج تسجيل الدخول وإنشاء الحساب
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // مستمعو الإعدادات
    document.getElementById('profileSettingsForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('addBookForm').addEventListener('submit', handleAddBook);
    document.getElementById('saveAppSettings').addEventListener('click', handleAppSettings);
    
    // مستمعو تبديل السمة الداكنة
    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
        darkMode = e.target.checked;
        updateTheme();
    });

    // مستمعو إعدادات السمة اللونية
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => changeTheme(option.dataset.theme));
    });

    // مستمعو الفلاتر والبحث
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => filterByCategory(btn.dataset.category));
    });
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // مستمعو قارئ الكتب
    document.getElementById('sidebarToggle').addEventListener('click', toggleReaderSidebar);
    document.getElementById('decreaseFontBtn').addEventListener('click', () => changeReaderFontSize(-1));
    document.getElementById('increaseFontBtn').addEventListener('click', () => changeReaderFontSize(1));
    document.getElementById('nightModeBtn').addEventListener('click', toggleReaderNightMode);
    document.getElementById('prevPageBtn').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPageBtn').addEventListener('click', () => changePage(1));
    document.getElementById('shareBtn').addEventListener('click', shareBook);
    document.getElementById('favBtn').addEventListener('click', toggleFavoriteBook);
    document.getElementById('searchTextBtn').addEventListener('click', searchInBook);

    // مستمعو الملف الشخصي
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => switchProfileTab(tab.dataset.tab));
    });

    // مستمع زر تسجيل الخروج
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // معاينة الصور
    document.getElementById('profileImage').addEventListener('change', handleImagePreview);
    document.getElementById('settingsProfileImage').addEventListener('change', handleImagePreview);
    document.getElementById('bookCover').addEventListener('change', handleImagePreview);
    document.getElementById('bookFile').addEventListener('change', handleFileSelect);
}

// ============= التنقل بين الصفحات =============
function navigateTo(page) {
    if (page === 'profile' || page === 'favorites' || page === 'settings') {
        if (!currentUser) {
            showToast('تنبيه', 'يجب تسجيل الدخول أولاً', 'warning');
            navigateTo('auth');
            return;
        }
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(`${page}Page`).classList.add('active-page');
    
    // تحديث محتوى الصفحة المتنقل إليها
    if (page === 'home') {
        renderBooks();
    } else if (page === 'profile') {
        updateProfilePage();
    } else if (page === 'favorites') {
        renderFavorites();
    } else if (page === 'settings') {
        updateSettingsPage();
    }
    
    currentPage = page;
    
    // إغلاق قائمة الجوال إن كانت مفتوحة
    document.getElementById('mobileMenu').classList.remove('active');
}

// ============= إدارة الحسابات =============
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // التحقق من صحة البيانات
    if (!email || !password) {
        showToast('خطأ', 'يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // محاكاة تسجيل الدخول
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUIAfterLogin();
        navigateTo('home');
        showToast('مرحباً', `مرحباً بعودتك ${user.name}!`, 'success');
    } else {
        showToast('خطأ', 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const age = document.getElementById('registerAge').value;
    const bio = document.getElementById('registerBio').value;
    
    // التحقق من صحة البيانات
    if (!name || !email || !password) {
        showToast('خطأ', 'يرجى ملء الحقول الإلزامية', 'error');
        return;
    }
    
    // التأكد من أن البريد الإلكتروني غير مستخدم
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.email === email)) {
        showToast('خطأ', 'البريد الإلكتروني مستخدم بالفعل', 'error');
        return;
    }
    
    // إنشاء المستخدم الجديد
    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        age,
        bio,
        profileImage: document.getElementById('profilePreview').src,
        favorites: [],
        reading: [],
        finished: [],
        myBooks: []
    };
    
    // حفظ المستخدم
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // تسجيل الدخول تلقائياً
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    updateUIAfterLogin();
    
    navigateTo('home');
    showToast('مرحباً', `مرحباً بك ${name}!`, 'success');
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUIAfterLogout();
    navigateTo('home');
    showToast('تم تسجيل الخروج', 'نراك قريباً!', 'success');
}

function checkLoggedInStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIAfterLogin();
    } else {
        updateUIAfterLogout();
    }
}

function updateUIAfterLogin() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('userMenu').style.display = 'block';
    document.getElementById('navProfileImage').src = currentUser.profileImage;
}

function updateUIAfterLogout() {
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('userMenu').style.display = 'none';
}

// ============= الكتب والمحتوى =============
function loadBooks() {
    // محاولة تحميل الكتب من التخزين المحلي
    const savedBooks = localStorage.getItem('books');
    
    if (savedBooks) {
        books = JSON.parse(savedBooks);
    } else {
        // إضافة الكتب الافتراضية إذا لم توجد
        books = [
            {
                id: 1,
                title: "ألف ليلة وليلة",
                author: "مؤلف تراثي مجهول",
                category: "novels",
                cover: "/api/placeholder/200/300",
                description: "مجموعة من القصص والحكايات الشعبية التي تعود أصولها إلى العصر الذهبي للحضارة الإسلامية.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 2,
                title: "الأمير",
                author: "نيكولو مكيافيلي",
                category: "philosophy",
                cover: "/api/placeholder/200/300",
                description: "كتاب في فن الحكم والسياسة، يعتبر من أهم الكتب السياسية في التاريخ.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 3,
                title: "فن الحرب",
                author: "سون تزو",
                category: "history",
                cover: "/api/placeholder/200/300",
                description: "كتاب صيني قديم يعد من أقدم وأهم الكتب العسكرية والاستراتيجية.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 4,
                title: "البخلاء",
                author: "الجاحظ",
                category: "novels",
                cover: "/api/placeholder/200/300",
                description: "كتاب أدبي ساخر يصور فيه الجاحظ نماذج من البخلاء بأسلوب أدبي مميز.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 5,
                title: "أساسيات البرمجة بلغة Python",
                author: "د. أحمد الشريف",
                category: "programming",
                cover: "/api/placeholder/200/300",
                description: "مقدمة شاملة للمبتدئين في عالم البرمجة باستخدام لغة Python.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 6,
                title: "تاريخ العلوم عند العرب",
                author: "د. قدري حافظ طوقان",
                category: "science",
                cover: "/api/placeholder/200/300",
                description: "كتاب يتناول إسهامات العلماء العرب والمسلمين في مختلف مجالات العلوم.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 7,
                title: "فن اللامبالاة",
                author: "مارك مانسون",
                category: "selfDev",
                cover: "/api/placeholder/200/300",
                description: "منهج جديد في التفكير الإيجابي يساعدك على التركيز على ما هو مهم فعلاً في حياتك.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 8,
                title: "وداعاً أيها الاكتئاب",
                author: "د. إبراهيم الفقي",
                category: "selfDev",
                cover: "/api/placeholder/200/300",
                description: "كتاب يساعدك على التخلص من الاكتئاب والحزن والوصول إلى السعادة والإيجابية.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 9,
                title: "كليلة ودمنة",
                author: "ابن المقفع",
                category: "novels",
                cover: "/api/placeholder/200/300",
                description: "مجموعة من القصص على ألسنة الحيوانات تحمل حكماً وعبراً.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 10,
                title: "مقدمة ابن خلدون",
                author: "ابن خلدون",
                category: "history",
                cover: "/api/placeholder/200/300",
                description: "من أهم الكتب في تاريخ الفكر الإنساني، يتناول التاريخ والعمران البشري.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 11,
                title: "فيزياء الكم للمبتدئين",
                author: "د. سامي عامر",
                category: "science",
                cover: "/api/placeholder/200/300",
                description: "شرح مبسط لنظرية الكم وتطبيقاتها في العلوم الحديثة.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 12,
                title: "خوارزميات البيانات المتقدمة",
                author: "م. عماد الحسيني",
                category: "programming",
                cover: "/api/placeholder/200/300",
                description: "كتاب متقدم في هياكل البيانات والخوارزميات للمبرمجين.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 13,
                title: "العادات السبع للناس الأكثر فعالية",
                author: "ستيفن كوفي",
                category: "selfDev",
                cover: "/api/placeholder/200/300",
                description: "كتاب يقدم سبع عادات أساسية للنجاح في الحياة المهنية والشخصية.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 14,
                title: "هجرة العقول العربية",
                author: "د. نادر فرجاني",
                category: "science",
                cover: "/api/placeholder/200/300",
                description: "دراسة تحليلية لظاهرة هجرة العقول العربية وأثرها على التنمية.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 15,
                title: "عقل جديد كامل",
                author: "دانييل بينك",
                category: "selfDev",
                cover: "/api/placeholder/200/300",
                description: "كتاب يتحدث عن أهمية التفكير الإبداعي والعاطفي في عصر المعلومات.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 16,
                title: "تاريخ الدولة العثمانية",
                author: "د. علي محمد الصلابي",
                category: "history",
                cover: "/api/placeholder/200/300",
                description: "كتاب يتناول تاريخ الدولة العثمانية منذ نشأتها وحتى سقوطها.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 17,
                title: "في ظلال القرآن",
                author: "سيد قطب",
                category: "philosophy",
                cover: "/api/placeholder/200/300",
                description: "تفسير أدبي للقرآن الكريم بأسلوب أدبي فريد.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 18,
                title: "تصميم واجهات المستخدم الحديثة",
                author: "م. سارة الجابري",
                category: "programming",
                cover: "/api/placeholder/200/300",
                description: "دليل شامل لتصميم واجهات المستخدم بأحدث التقنيات والمعايير.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 19,
                title: "أحببتك أكثر مما ينبغي",
                author: "أثير عبد الله",
                category: "novels",
                cover: "/api/placeholder/200/300",
                description: "رواية رومانسية عن قصة حب بين شخصيتين من خلفيات مختلفة.",
                addedBy: null,
                isFavorite: false
            },
            {
                id: 20,
                title: "علم النفس الإيجابي",
                author: "د. مارتن سليجمان",
                category: "selfDev",
                cover: "/api/placeholder/200/300",
                description: "كتاب يركز على نقاط القوة والإيجابية في الشخصية الإنسانية.",
                addedBy: null,
                isFavorite: false
            }
        ];
        
        localStorage.setItem('books', JSON.stringify(books));
    }
    
    renderBooks();
}

function renderBooks(filteredBooks = null) {
    const booksContainer = document.getElementById('booksContainer');
    booksContainer.innerHTML = '';
    
    const booksToRender = filteredBooks || books;
    
    if (booksToRender.length === 0) {
        booksContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="empty-text">لم يتم العثور على كتب</div>
            </div>
        `;
        return;
    }
    
    booksToRender.forEach(book => {
        const isFavorite = currentUser && currentUser.favorites.includes(book.id);
        const card = document.createElement('div');
        card.className = 'book-card animate__animated animate__fadeIn';
        card.dataset.id = book.id;
        card.onclick = () => openBookReader(book.id);
        
        card.innerHTML = `
            <img src="${book.cover}" alt="${book.title}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <span class="book-category">${getCategoryName(book.category)}</span>
                <div class="book-actions">
                    <button class="book-btn favorite-btn" data-id="${book.id}" onclick="toggleFavorite(event, ${book.id})">
                        <i class="fa${isFavorite ? 's' : 'r'} fa-heart"></i>
                    </button>
                    <button class="book-btn" onclick="showBookDetails(event, ${book.id})">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        `;
        
        booksContainer.appendChild(card);
    });
}

function getCategoryName(categoryCode) {
    const categories = {
        'novels': 'روايات',
        'science': 'علوم',
        'history': 'تاريخ',
        'selfDev': 'تطوير ذاتي',
        'programming': 'برمجة',
        'philosophy': 'فلسفة'
    };
    
    return categories[categoryCode] || categoryCode;
}

function filterByCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.category-btn[data-category="${category}"]`).classList.add('active');
    
    currentCategory = category;
    
    if (category === 'all') {
        renderBooks();
    } else {
        const filteredBooks = books.filter(book => book.category === category);
        renderBooks(filteredBooks);
    }
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (query === '') {
        filterByCategory(currentCategory);
        return;
    }
    
    let filteredBooks = books;
    
    if (currentCategory !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.category === currentCategory);
    }
    
    filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(query) || 
        book.author.toLowerCase().includes(query) ||
        book.description.toLowerCase().includes(query)
    );
    
    renderBooks(filteredBooks);
}

function toggleFavorite(event, bookId) {
    event.stopPropagation();
    
    if (!currentUser) {
        showToast('تنبيه', 'يجب تسجيل الدخول أولاً', 'warning');
        navigateTo('auth');
        return;
    }
    
    const bookIndex = books.findIndex(b => b.id === bookId);
    
    if (bookIndex === -1) return;
    
    const favoriteIndex = currentUser.favorites.indexOf(bookId);
    
    if (favoriteIndex === -1) {
        // إضافة إلى المفضلة
        currentUser.favorites.push(bookId);
        event.currentTarget.innerHTML = '<i class="fas fa-heart"></i>';
        showToast('تمت الإضافة', 'تمت إضافة الكتاب إلى المفضلة', 'success');
    } else {
        // إزالة من المفضلة
        currentUser.favorites.splice(favoriteIndex, 1);
        event.currentTarget.innerHTML = '<i class="far fa-heart"></i>';
        showToast('تمت الإزالة', 'تمت إزالة الكتاب من المفضلة', 'success');
    }
    
    // تحديث بيانات المستخدم
    updateUser(currentUser);
    
    // تحديث صفحة المفضلة إذا كانت مفتوحة
    if (currentPage === 'favorites') {
        renderFavorites();
    }
}

function showBookDetails(event, bookId) {
    event.stopPropagation();
    
    const book = books.find(b => b.id === bookId);
    
    if (!book) return;
    
    // إنشاء نافذة منبثقة لعرض تفاصيل الكتاب
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content animate__animated animate__fadeInDown">
            <div class="modal-header">
                <h2>${book.title}</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="book-details">
                    <img src="${book.cover}" alt="${book.title}" class="book-details-cover">
                    <div class="book-details-info">
                        <p><strong>المؤلف:</strong> ${book.author}</p>
                        <p><strong>التصنيف:</strong> ${getCategoryName(book.category)}</p>
                        <p><strong>الوصف:</strong> ${book.description}</p>
                        ${book.addedBy ? `<p><strong>تمت الإضافة بواسطة:</strong> ${getUserName(book.addedBy)}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="openBookReader(${book.id})">قراءة الكتاب</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // إغلاق النافذة المنبثقة
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.classList.add('animate__animated', 'animate__fadeOut');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
    
    // إغلاق النافذة المنبثقة عند النقر خارجها
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('animate__animated', 'animate__fadeOut');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    });
}

function getUserName(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'مستخدم غير معروف';
}

function openBookReader(bookId) {
    currentBookId = bookId;
    const book = books.find(b => b.id === bookId);
    
    if (!book) return;
    
    // تحديث معلومات الكتاب في قارئ الكتب
    document.getElementById('readerBookCover').src = book.cover;
    document.getElementById('readerBookTitle').textContent = book.title;
    document.getElementById('readerBookAuthor').textContent = book.author;
    
    // في التطبيق الحقيقي، هنا ستقوم بتحميل ملف PDF الفعلي وعرضه
    // لأغراض العرض التوضيحي، سنستخدم نموذج بسيط
    loadPdf(book);
    
    // إضافة الكتاب إلى قائمة الكتب قيد القراءة إذا كان المستخدم مسجل دخول
    if (currentUser && !currentUser.reading.includes(bookId)) {
        currentUser.reading.push(bookId);
        updateUser(currentUser);
    }
    
    // التنقل إلى صفحة القارئ
    navigateTo('reader');
}

// ============= وظائف قارئ الكتب =============
function loadPdf(book) {
    // هذه هي نموذج توضيحي باستخدام PDF.js
    // في التطبيق الحقيقي، ستستبدل الرابط بمسار الملف الفعلي للكتاب
    
    // استخدام URL دمية للعرض التوضيحي
    const url = 'https://cdn.mozilla.net/pdfjs/tracemonkey.pdf';
    
    pdfjsLib.getDocument(url).promise.then(function(pdf) {
        pdfDoc = pdf;
        document.getElementById('totalPages').textContent = pdf.numPages;
        
        // عرض صفحة الغلاف (الصفحة 1)
        pageNum = 1;
        renderPage(pageNum);
        
        // إنشاء جدول المحتويات
        createTOC(pdf);
        
        // إضافة الكتاب إلى كتبي قيد القراءة إذا كان المستخدم مسجل الدخول
        if (currentUser && !currentUser.reading.includes(book.id)) {
            currentUser.reading.push(book.id);
            updateUser(currentUser);
        }
        
        // تحديث زر المفضلة
        updateFavButton(book.id);
    }).catch(function(error) {
        console.error('Error loading PDF:', error);
        document.getElementById('pdfViewer').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>فشل في تحميل الكتاب. يرجى المحاولة مرة أخرى لاحقاً.</p>
            </div>
        `;
    });
}

function renderPage(num) {
    pageRendering = true;
    document.getElementById('currentPage').textContent = num;

    pdfDoc.getPage(num).then(function(page) {
        const viewer = document.getElementById('pdfViewer');
        viewer.innerHTML = '<div class="text-layer"></div>';

        // الحصول على محتوى النص
        page.getTextContent().then(function(textContent) {
            const textLayer = viewer.querySelector('.text-layer');
            textLayer.style.position = 'absolute';
            textLayer.style.left = '0';
            textLayer.style.top = '0';
            textLayer.style.right = '0';
            textLayer.style.bottom = '0';

            // إنشاء عناصر النص
            pdfjsLib.renderTextLayer({
                textContent: textContent,
                container: textLayer,
                viewport: page.getViewport({ scale: scale }),
                textDivs: []
            });

            // عرض الصفحة كصورة في الخلفية للتدقيق البصري
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            page.render(renderContext).promise.then(() => {
                viewer.style.backgroundImage = `url(${canvas.toDataURL()})`;
                viewer.style.backgroundSize = 'cover';
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });
    });
}
function createTOC(pdf) {
    const tocList = document.getElementById('tocList');
    tocList.innerHTML = '';
    
    // في تطبيق حقيقي، يمكنك استخراج جدول المحتويات من ملف PDF
    // لهذا النموذج، سننشئ جدول محتويات وهمي
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const tocItem = document.createElement('li');
        tocItem.className = 'toc-item';
        
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = `الفصل ${i}`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            queueRenderPage(i);
        });
        
        tocItem.appendChild(link);
        tocList.appendChild(tocItem);
    }
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function changePage(offset) {
    const newPageNum = pageNum + offset;
    
    if (newPageNum >= 1 && newPageNum <= pdfDoc.numPages) {
        pageNum = newPageNum;
        queueRenderPage(pageNum);
    }
}

function changeReaderFontSize(change) {
    scale += change * 0.1;
    
    // التأكد من أن النطاق ضمن الحدود المعقولة
    if (scale < 0.5) scale = 0.5;
    if (scale > 2.5) scale = 2.5;
    
    renderPage(pageNum);
    showToast('تغيير الحجم', 'تم تغيير حجم العرض', 'info');
}

function toggleReaderSidebar() {
    const readerContainer = document.querySelector('.reader-container');
    readerContainer.classList.toggle('sidebar-collapsed');
}

function toggleReaderNightMode() {
    const readerPage = document.getElementById('readerPage');
    readerPage.classList.toggle('reader-night-mode');
    
    const nightModeBtn = document.getElementById('nightModeBtn');
    
    if (readerPage.classList.contains('reader-night-mode')) {
        nightModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        nightModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function updateFavButton(bookId) {
    const favBtn = document.getElementById('favBtn');
    const isFavorite = currentUser && currentUser.favorites.includes(bookId);
    
    if (isFavorite) {
        favBtn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        favBtn.innerHTML = '<i class="far fa-heart"></i>';
    }
}

function toggleFavoriteBook() {
    if (!currentUser) {
        showToast('تنبيه', 'يجب تسجيل الدخول أولاً', 'warning');
        navigateTo('auth');
        return;
    }
    
    const bookId = currentBookId;
    const favoriteIndex = currentUser.favorites.indexOf(bookId);
    
    if (favoriteIndex === -1) {
        // إضافة إلى المفضلة
        currentUser.favorites.push(bookId);
        document.getElementById('favBtn').innerHTML = '<i class="fas fa-heart"></i>';
        showToast('تمت الإضافة', 'تمت إضافة الكتاب إلى المفضلة', 'success');
    } else {
        // إزالة من المفضلة
        currentUser.favorites.splice(favoriteIndex, 1);
        document.getElementById('favBtn').innerHTML = '<i class="far fa-heart"></i>';
        showToast('تمت الإزالة', 'تمت إزالة الكتاب من المفضلة', 'success');
    }
    
    // تحديث بيانات المستخدم
    updateUser(currentUser);
}

function shareBook() {
    if (!navigator.share) {
        showToast('غير مدعوم', 'مشاركة الروابط غير مدعومة في متصفحك', 'warning');
        return;
    }
    
    const book = books.find(b => b.id === currentBookId);
    
    if (!book) return;
    
    navigator.share({
        title: book.title,
        text: `أقرأ الآن: ${book.title} بواسطة ${book.author}`,
        url: window.location.href
    })
    .then(() => showToast('تمت المشاركة', 'تم مشاركة الكتاب بنجاح', 'success'))
    .catch(error => {
        console.error('Error sharing:', error);
        showToast('خطأ', 'فشلت عملية المشاركة', 'error');
    });
}

function searchInBook() {
    // إنشاء نافذة بحث منبثقة
    const searchDialog = document.createElement('div');
    searchDialog.className = 'search-dialog animate__animated animate__fadeIn';
    searchDialog.innerHTML = `
        <div class="search-dialog-content">
            <h3>البحث في الكتاب</h3>
            <div class="search-input-container">
                <input type="text" id="bookSearchInput" placeholder="أدخل نص البحث..." class="search-input">
                <button id="bookSearchBtn" class="search-dialog-btn">بحث</button>
            </div>
            <div id="searchResults" class="search-results"></div>
            <button class="close-dialog-btn">إغلاق</button>
        </div>
    `;
    
    document.body.appendChild(searchDialog);
    
    // التركيز على حقل البحث
    setTimeout(() => {
        document.getElementById('bookSearchInput').focus();
    }, 100);
    
    // إضافة مستمعي الأحداث
    document.getElementById('bookSearchBtn').addEventListener('click', performBookSearch);
    document.getElementById('bookSearchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performBookSearch();
    });
    
    document.querySelector('.close-dialog-btn').addEventListener('click', () => {
        searchDialog.classList.add('animate__fadeOut');
        setTimeout(() => {
            document.body.removeChild(searchDialog);
        }, 300);
    });
}

function performBookSearch() {
    const query = document.getElementById('bookSearchInput').value.trim();
    
    if (!query) {
        showToast('تنبيه', 'الرجاء إدخال نص للبحث', 'warning');
        return;
    }
    
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="searching">جاري البحث...</div>';
    
    // في تطبيق حقيقي، هنا يمكنك البحث في محتوى PDF
    // لأغراض العرض التوضيحي، سننشئ نتائج وهمية بعد تأخير قصير
    
    setTimeout(() => {
        // عرض نتائج وهمية للعرض التوضيحي
        const results = [
            { page: 3, text: `... ${query} هو مفهوم أساسي في هذا الفصل ...` },
            { page: 7, text: `... يمكننا فهم ${query} من خلال ...` },
            { page: 12, text: `... وهكذا نستنتج أن ${query} يعتبر ...` }
        ];
        
        if (results.length > 0) {
            searchResults.innerHTML = '';
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <p class="result-text">${result.text}</p>
                    <button class="go-to-page-btn" data-page="${result.page}">انتقال للصفحة ${result.page}</button>
                `;
                searchResults.appendChild(resultItem);
            });
            
            // إضافة مستمعي الأحداث للأزرار
            document.querySelectorAll('.go-to-page-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pageToGo = parseInt(btn.dataset.page);
                    queueRenderPage(pageToGo);
                    
                    // إغلاق نافذة البحث
                    const searchDialog = document.querySelector('.search-dialog');
                    searchDialog.classList.add('animate__fadeOut');
                    setTimeout(() => {
                        document.body.removeChild(searchDialog);
                    }, 300);
                });
            });
        } else {
            searchResults.innerHTML = '<div class="no-results">لم يتم العثور على نتائج</div>';
        }
    }, 1000);
}

// ============= وظائف الملف الشخصي =============
function updateProfilePage() {
    if (!currentUser) return;
    
    // تحديث معلومات الملف الشخصي
    document.getElementById('profilePageImage').src = currentUser.profileImage;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileInfo').textContent = `العمر: ${currentUser.age || 'غير محدد'} | البريد: ${currentUser.email}`;
    document.getElementById('profileBio').textContent = currentUser.bio || 'لا توجد نبذة تعريفية';
    
    // تحديث الإحصائيات
    document.getElementById('booksCount').textContent = currentUser.myBooks.length;
    document.getElementById('favoritesCount').textContent = currentUser.favorites.length;
    document.getElementById('readCount').textContent = currentUser.finished.length;
    
    // تحديث قوائم الكتب
    renderMyBooks();
    renderReadingBooks();
    renderFinishedBooks();
}

function renderMyBooks() {
    const container = document.getElementById('myBooksContainer');
    container.innerHTML = '';
    
    if (!currentUser || currentUser.myBooks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="empty-text">لا يوجد كتب قمت بإضافتها</div>
                <button class="btn" data-page="settings">إضافة كتاب</button>
            </div>
        `;
        return;
    }
    
    currentUser.myBooks.forEach(bookId => {
        const book = books.find(b => b.id === bookId);
        if (book) {
            const card = createBookCard(book);
            container.appendChild(card);
        }
    });
}

function renderReadingBooks() {
    const container = document.getElementById('readingBooksContainer');
    container.innerHTML = '';
    
    if (!currentUser || currentUser.reading.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-book-reader"></i>
                </div>
                <div class="empty-text">لا يوجد كتب قيد القراءة</div>
                <button class="btn" data-page="home">استعرض الكتب</button>
            </div>
        `;
        return;
    }
    
    currentUser.reading.forEach(bookId => {
        const book = books.find(b => b.id === bookId);
        if (book) {
            const card = createBookCard(book, true);
            container.appendChild(card);
        }
    });
}

function renderFinishedBooks() {
    const container = document.getElementById('finishedBooksContainer');
    container.innerHTML = '';
    
    if (!currentUser || currentUser.finished.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="empty-text">لم تنتهِ من قراءة أي كتاب بعد</div>
            </div>
        `;
        return;
    }
    
    currentUser.finished.forEach(bookId => {
        const book = books.find(b => b.id === bookId);
        if (book) {
            const card = createBookCard(book);
            container.appendChild(card);
        }
    });
}

function createBookCard(book, showMarkAsFinished = false) {
    const card = document.createElement('div');
    card.className = 'book-card animate__animated animate__fadeIn';
    card.dataset.id = book.id;
    
    const isFavorite = currentUser && currentUser.favorites.includes(book.id);
    
    let additionalButtons = '';
    if (showMarkAsFinished) {
        additionalButtons = `
            <button class="book-btn" onclick="markAsFinished(event, ${book.id})">
                <i class="fas fa-check"></i>
            </button>
        `;
    }
    
    card.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" class="book-cover">
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">${book.author}</p>
            <span class="book-category">${getCategoryName(book.category)}</span>
            <div class="book-actions">
                <button class="book-btn favorite-btn" onclick="toggleFavorite(event, ${book.id})">
                    <i class="fa${isFavorite ? 's' : 'r'} fa-heart"></i>
                </button>
                <button class="book-btn" onclick="showBookDetails(event, ${book.id})">
                    <i class="fas fa-info-circle"></i>
                </button>
                ${additionalButtons}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => openBookReader(book.id));
    
    return card;
}

function switchProfileTab(tab) {
    document.querySelectorAll('.profile-tab').forEach(t => {
        t.classList.remove('active');
    });
    document.querySelector(`.profile-tab[data-tab="${tab}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`).classList.add('active');
}

function markAsFinished(event, bookId) {
    event.stopPropagation();
    
    if (!currentUser) return;
    
    // إزالة من قيد القراءة
    const readingIndex = currentUser.reading.indexOf(bookId);
    if (readingIndex !== -1) {
        currentUser.reading.splice(readingIndex, 1);
    }
    
    // إضافة إلى المنتهية إن لم تكن موجودة
    if (!currentUser.finished.includes(bookId)) {
        currentUser.finished.push(bookId);
    }
    
    // تحديث بيانات المستخدم
    updateUser(currentUser);
    
    // تحديث عرض الكتب
    renderReadingBooks();
    renderFinishedBooks();
    
    showToast('تم الانتهاء', 'تم نقل الكتاب إلى قائمة الكتب المنتهية', 'success');
}

// ============= وظائف المفضلة =============
function renderFavorites() {
    const container = document.getElementById('favoritesContainer');
    const emptyState = document.getElementById('emptyFavorites');
    
    container.innerHTML = '';
    
    if (!currentUser || currentUser.favorites.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    currentUser.favorites.forEach(bookId => {
        const book = books.find(b => b.id === bookId);
        if (book) {
            const card = createBookCard(book);
            container.appendChild(card);
        }
    });
}

// ============= وظائف الإعدادات =============
function updateSettingsPage() {
    if (!currentUser) return;
    
    // تعبئة نموذج إعدادات الملف الشخصي
    document.getElementById('settingsProfilePreview').src = currentUser.profileImage;
    document.getElementById('settingsName').value = currentUser.name;
    document.getElementById('settingsEmail').value = currentUser.email;
    document.getElementById('settingsAge').value = currentUser.age || '';
    document.getElementById('settingsBio').value = currentUser.bio || '';
    
    // تعبئة إعدادات التطبيق
    document.getElementById('darkModeToggle').checked = darkMode;
}

function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    // تحديث بيانات المستخدم
    currentUser.name = document.getElementById('settingsName').value;
    currentUser.age = document.getElementById('settingsAge').value;
    currentUser.bio = document.getElementById('settingsBio').value;
    currentUser.profileImage = document.getElementById('settingsProfilePreview').src;
    
    // حفظ البيانات
    updateUser(currentUser);
    
    showToast('تم التحديث', 'تم تحديث بيانات الملف الشخصي بنجاح', 'success');
}

function handleAddBook(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const category = document.getElementById('bookCategory').value;
    const description = document.getElementById('bookDescription').value;
    const cover = document.getElementById('bookCoverPreview').src;
    
    // التحقق من صحة البيانات
    if (!title || !author || !category) {
        showToast('خطأ', 'يرجى ملء الحقول الإلزامية', 'error');
        return;
    }
    
    // إنشاء كتاب جديد
    const newBook = {
        id: Date.now(),
        title,
        author,
        category,
        description,
        cover,
        addedBy: currentUser.id,
        isFavorite: false
    };
    
    // إضافة الكتاب إلى القائمة
    books.push(newBook);
    localStorage.setItem('books', JSON.stringify(books));
    
    // إضافة الكتاب إلى قائمة كتبي
    currentUser.myBooks.push(newBook.id);
    updateUser(currentUser);
    
    // إعادة تعيين النموذج
    document.getElementById('addBookForm').reset();
    document.getElementById('bookCoverPreview').src = "/api/placeholder/100/100";
    document.getElementById('selectedFile').textContent = "";
    
    showToast('تمت الإضافة', 'تم إضافة الكتاب بنجاح', 'success');
}

function handleAppSettings() {
    // حفظ إعدادات التطبيق
    darkMode = document.getElementById('darkModeToggle').checked;
    const language = document.getElementById('languageSelect').value;
    
    // حفظ الإعدادات في التخزين المحلي
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('language', language);
    
    // تطبيق الإعدادات
    updateTheme();
    
    showToast('تم الحفظ', 'تم حفظ إعدادات التطبيق بنجاح', 'success');
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        // تحديد العنصر المناسب بناءً على هوية الحقل
        let previewElement;
        if (e.target.id === 'profileImage') {
            previewElement = document.getElementById('profilePreview');
        } else if (e.target.id === 'settingsProfileImage') {
            previewElement = document.getElementById('settingsProfilePreview');
        } else if (e.target.id === 'bookCover') {
            previewElement = document.getElementById('bookCoverPreview');
        }
        
        if (previewElement) {
            previewElement.src = event.target.result;
        }
    };
    reader.readAsDataURL(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    document.getElementById('selectedFile').textContent = file.name;
}

// ============= وظائف عامة =============
function updateUser(user) {
    // تحديث المستخدم في قائمة المستخدمين
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id === user.id);
    
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // تحديث المستخدم الحالي في التخزين المحلي
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
}

function toggleDarkMode() {
    darkMode = !darkMode;
    updateTheme();
}

function updateTheme() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // تحديث حالة مفتاح التبديل في الإعدادات
    document.getElementById('darkModeToggle').checked = darkMode;
}

function changeTheme(theme) {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.theme-option[data-theme="${theme}"]`).classList.add('active');
    
    // إزالة جميع فئات السمات
    document.body.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-pink', 'theme-teal');
    
    // إضافة فئة السمة المحددة
    document.body.classList.add(`theme-${theme}`);
    
    // حفظ السمة في التخزين المحلي
    localStorage.setItem('theme', theme);
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active');
    }
}

function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate__animated animate__fadeInUp`;
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${getToastIcon(type)}"></i>
        </div>
        <div class="toast-content">
            <h4 class="toast-title">${title}</h4>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // إضافة مستمع لزر الإغلاق
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.replace('animate__fadeInUp', 'animate__fadeOutDown');
        setTimeout(() => toastContainer.removeChild(toast), 300);
    });
    
    // إزالة تلقائية بعد 5 ثوان
    setTimeout(() => {
        if (toastContainer.contains(toast)) {
            toast.classList.replace('animate__fadeInUp', 'animate__fadeOutDown');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-times-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}