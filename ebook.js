
// Bootstrap JS Bundle with Popper
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const body = document.body;
    console.log(body);
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const themeSwitcher = document.getElementById('themeSwitcher');
    const searchToggle = document.getElementById('searchToggle');
    const searchContainer = document.getElementById('searchContainer');
    const closeSearch = document.getElementById('closeSearch');
    console.log(searchContainer);
    const searchInput = document.getElementById('searchInput');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentPageNum = document.getElementById('currentPageNum');
    const totalPages = document.getElementById('totalPages');
    const progressBar = document.getElementById('progressBar');
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const bookmarkButtons = document.querySelectorAll('[id^="bookmarkPage"]');
    const tocLinks = document.querySelectorAll('.toc-link');
    const playVoice = document.getElementById('playVoice');
    const pauseVoice = document.getElementById('pauseVoice');
    const stopVoice = document.getElementById('stopVoice');
    const voiceSpeed = document.getElementById('voiceSpeed');
    const emptyBookmarks = document.getElementById('emptyBookmarks');
    const bookmarksList = document.getElementById('bookmarksList');
    const emptyNotes = document.getElementById('emptyNotes');
    const notesList = document.getElementById('notesList');

    // Bootstrap components
    const ebookModal = new bootstrap.Modal(document.getElementById('ebookModal'));
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const cancelModal = document.getElementById('cancelModal');
    const confirmModal = document.getElementById('confirmModal');

    // State
    const chapters = Array.from(document.querySelectorAll('.chapter'));
    let currentChapterIndex = 0;
    const bookmarks = [];
    const notes = [];
    let speechSynthesis = window.speechSynthesis;
    let speechUtterance = null;

    // Initialize
    updatePageIndicator();
    totalPages.textContent = chapters.length;

    // Apply stored theme if any
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        themeSwitcher.innerHTML = '<i class="bi bi-sun"></i>';
    }

    // Event Listeners
    // Sidebar Toggle
    toggleSidebar.addEventListener('click', function () {
        body.classList.toggle('sidebar-visible');
        body.classList.toggle('sidebar-hidden');
    });

    // Theme Switcher
    themeSwitcher.addEventListener('click', function () {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            this.innerHTML = '<i class="bi bi-moon"></i>';
            localStorage.setItem('darkMode', 'false');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            this.innerHTML = '<i class="bi bi-sun"></i>';
            localStorage.setItem('darkMode', 'true');
        }
    });

    // Sidebar Tabs
    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // Update active tab
            sidebarTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
            });

            document.getElementById(tabId).classList.add('active');
        });
    });

    // Search Toggle
    searchToggle.addEventListener('click', function () {
        searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
        if (searchContainer.style.display === 'block') {
            searchInput.focus();
        }
    });

    closeSearch.addEventListener('click', function () {
        searchContainer.style.display = 'none';
    });

    // Search functionality
    searchInput.addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            performSearch(this.value);
        }
    });

    // Page Navigation
    prevBtn.addEventListener('click', function () {
        if (currentChapterIndex > 0) {
            navigateToChapter(currentChapterIndex - 1);
        }
    });

    nextBtn.addEventListener('click', function () {
        if (currentChapterIndex < chapters.length - 1) {
            navigateToChapter(currentChapterIndex + 1);
        }
    });

    // TOC Navigation
    tocLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all links
            tocLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Navigate to the target section
            const targetId = this.getAttribute('href').substring(1);
            navigateToChapterById(targetId);

            // Hide sidebar on mobile
            if (window.innerWidth < 992) {
                body.classList.remove('sidebar-visible');
            }
        });
    });

    // Bookmarking
    bookmarkButtons.forEach(button => {
        button.addEventListener('click', function () {
            const pageId = this.id.replace('bookmarkPage', '');
            const chapter = document.getElementById('chapter' + pageId);
            const chapterTitle = chapter.querySelector('h2').textContent;
            const icon = this.querySelector('i');

            if (icon.classList.contains('bi-bookmark-fill')) {
                // Remove bookmark
                icon.classList.remove('bi-bookmark-fill');
                icon.classList.add('bi-bookmark');
                const index = bookmarks.findIndex(b => b.id === pageId);
                if (index > -1) {
                    bookmarks.splice(index, 1);
                }
            } else {
                // Add bookmark
                icon.classList.remove('bi-bookmark');
                icon.classList.add('bi-bookmark-fill');

                bookmarks.push({
                    id: pageId,
                    title: chapterTitle,
                    date: new Date().toLocaleDateString()
                });

                // Show toast notification
                showToast('Page bookmarked', 'success');
            }

            // Update bookmarks list
            updateBookmarksList();
            // Save to localStorage
            saveBookmarks();
        });
    });

    // Voice narration
    playVoice.addEventListener('click', function () {
        const currentChapterContent = document.querySelector('#chapter' + (currentChapterIndex + 1) + ' .chapter-content').textContent;

        if (speechSynthesis) {
            if (speechUtterance) {
                speechSynthesis.cancel();
            }

            speechUtterance = new SpeechSynthesisUtterance(currentChapterContent);
            speechUtterance.rate = parseFloat(voiceSpeed.value);

            speechSynthesis.speak(speechUtterance);

            // Update button styles
            this.classList.add('btn-success');
            this.classList.remove('btn-primary');
            pauseVoice.classList.add('btn-primary');
            pauseVoice.classList.remove('btn-secondary');
            stopVoice.classList.add('btn-primary');
            stopVoice.classList.remove('btn-secondary');

            speechUtterance.onend = function () {
                playVoice.classList.remove('btn-success');
                playVoice.classList.add('btn-primary');
                pauseVoice.classList.remove('btn-primary');
                pauseVoice.classList.add('btn-secondary');
                stopVoice.classList.remove('btn-primary');
                stopVoice.classList.add('btn-secondary');
            };
        }
    });

    pauseVoice.addEventListener('click', function () {
        if (speechSynthesis && speechSynthesis.speaking) {
            if (speechSynthesis.paused) {
                speechSynthesis.resume();
                this.innerHTML = '<i class="bi bi-pause-fill"></i>';
            } else {
                speechSynthesis.pause();
                this.innerHTML = '<i class="bi bi-play-fill"></i>';
            }
        }
    });

    stopVoice.addEventListener('click', function () {
        if (speechSynthesis) {
            speechSynthesis.cancel();
            playVoice.classList.remove('btn-success');
            playVoice.classList.add('btn-primary');
            pauseVoice.classList.remove('btn-primary');
            pauseVoice.classList.add('btn-secondary');
            stopVoice.classList.remove('btn-primary');
            stopVoice.classList.add('btn-secondary');
            pauseVoice.innerHTML = '<i class="bi bi-pause-fill"></i>';
        }
    });

    voiceSpeed.addEventListener('change', function () {
        if (speechUtterance) {
            speechUtterance.rate = parseFloat(this.value);
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        // Left arrow
        if (e.key === 'ArrowLeft') {
            prevBtn.click();
        }
        // Right arrow
        else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
        // Search
        else if ((e.key === 'f' || e.key === 'F') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            searchToggle.click();
        }
    });

    // Text selection for notes and highlighting
    document.addEventListener('mouseup', function () {
        const selection = window.getSelection();
        if (selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            if (rect.width > 0) {
                showSelectionToolbar(rect, selection);
            }
        }
    });

    // Additional UI interactions
    document.getElementById('downloadBtn').addEventListener('click', function () {
        showDownloadModal();
    });

    document.getElementById('shareBtn').addEventListener('click', function () {
        showShareModal();
    });

    document.getElementById('bookmarksBtn').addEventListener('click', function () {
        // Find bookmarks tab and click it
        document.querySelector('.sidebar-tab[data-tab="bookmarks"]').click();
        // Show sidebar if it's hidden
        if (!body.classList.contains('sidebar-visible')) {
            toggleSidebar.click();
        }
    });

    document.getElementById('notesBtn').addEventListener('click', function () {
        // Find notes tab and click it
        document.querySelector('.sidebar-tab[data-tab="notes"]').click();
        // Show sidebar if it's hidden
        if (!body.classList.contains('sidebar-visible')) {
            toggleSidebar.click();
        }
    });

    document.getElementById('accessibilitySettingsBtn')?.addEventListener('click', function () {
        showAccessibilityModal();
    });

    // Functions
    function navigateToChapter(index) {
        if (index >= 0 && index < chapters.length) {
            currentChapterIndex = index;

            // Scroll to the chapter
            const targetChapter = chapters[index];
            targetChapter.scrollIntoView({ behavior: 'smooth' });

            // Update UI state
            updatePageIndicator();
            updateTocHighlighting();

            // Apply animations for chapter elements
            animateChapterElements(targetChapter);

            // Stop any ongoing narration
            if (speechSynthesis && speechSynthesis.speaking) {
                speechSynthesis.cancel();
                playVoice.classList.remove('btn-success');
                playVoice.classList.add('btn-primary');
                pauseVoice.classList.remove('btn-primary');
                pauseVoice.classList.add('btn-secondary');
                stopVoice.classList.remove('btn-primary');
                stopVoice.classList.add('btn-secondary');
            }

            // Save current position to localStorage
            saveReadingPosition();
        }
    }

    function navigateToChapterById(id) {
        const index = chapters.findIndex(chapter => chapter.id === id);
        if (index !== -1) {
            navigateToChapter(index);
        }
    }

    function updatePageIndicator() {
        currentPageNum.textContent = currentChapterIndex + 1;

        // Update buttons state
        prevBtn.disabled = currentChapterIndex === 0;
        nextBtn.disabled = currentChapterIndex === chapters.length - 1;

        // Update progress bar
        const progress = ((currentChapterIndex + 1) / chapters.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function updateTocHighlighting() {
        const currentChapterId = chapters[currentChapterIndex].id;

        tocLinks.forEach(link => {
            const linkTarget = link.getAttribute('href').substring(1);
            if (linkTarget === currentChapterId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function animateChapterElements(chapter) {
        // Remove and re-add animation classes
        if (!chapter) return;

        const animatedElements = chapter.querySelectorAll('[class*="fade-in"], [class*="slide-up"]');
        animatedElements.forEach(el => {
            // Get current animation classes
            const animations = [];
            if (el.classList.contains('fade-in')) animations.push('fade-in');
            if (el.classList.contains('slide-up')) animations.push('slide-up');

            // Get delay classes
            const delays = [];
            if (el.classList.contains('delay-100')) delays.push('delay-100');
            if (el.classList.contains('delay-200')) delays.push('delay-200');
            if (el.classList.contains('delay-300')) delays.push('delay-300');
            if (el.classList.contains('delay-400')) delays.push('delay-400');
            if (el.classList.contains('delay-500')) delays.push('delay-500');

            // Remove classes
            animations.forEach(cls => el.classList.remove(cls));
            delays.forEach(cls => el.classList.remove(cls));

            // Force reflow
            void el.offsetWidth;

            // Add classes back
            animations.forEach(cls => el.classList.add(cls));
            delays.forEach(cls => el.classList.add(cls));
        });
    }

    function performSearch(query) {
        if (!query.trim()) return;

        query = query.toLowerCase();
        let results = [];

        // Search in all chapters
        chapters.forEach((chapter, index) => {
            const content = chapter.textContent.toLowerCase();
            if (content.includes(query)) {
                // Get the chapter title
                const chapterTitle = chapter.querySelector('h2')?.textContent || `Chapter ${index + 1}`;

                // Find context for the match (text surrounding the match)
                const contentStr = chapter.textContent;
                const queryIndex = contentStr.toLowerCase().indexOf(query);
                let contextStart = Math.max(0, queryIndex - 30);
                let contextEnd = Math.min(contentStr.length, queryIndex + query.length + 30);
                let context = contentStr.substring(contextStart, contextEnd);

                // Add ellipses if needed
                if (contextStart > 0) context = '...' + context;
                if (contextEnd < contentStr.length) context += '...';

                results.push({
                    id: chapter.id,
                    title: chapterTitle,
                    index: index,
                    context: context
                });
            }
        });

        // Display results
        if (results.length > 0) {
            showSearchResults(query, results);
        } else {
            showToast(`No results found for "${query}"`, 'warning');
        }
    }

    function showSearchResults(query, results) {
        modalTitle.textContent = `Search Results: ${results.length} found`;

        let resultsHtml = `
            <p>Results for: <strong>${query}</strong></p>
            <div class="search-results">
        `;

        results.forEach(result => {
            // Highlight the query in context
            const highlightedContext = result.context.replace(
                new RegExp(query, 'gi'),
                match => `<mark>${match}</mark>`
            );

            resultsHtml += `
                <div class="card mb-3 search-result-item" data-chapter-id="${result.id}">
                    <div class="card-body py-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${result.title}</h6>
                            <span class="badge bg-primary">Chapter ${result.index + 1}</span>
                        </div>
                        <p class="card-text small mb-0">${highlightedContext}</p>
                    </div>
                </div>
            `;
        });

        resultsHtml += `</div>`;
        modalBody.innerHTML = resultsHtml;

        // Update modal buttons
        cancelModal.style.display = 'none';
        confirmModal.textContent = 'Close';
        confirmModal.className = 'btn btn-primary';

        confirmModal.onclick = function () {
            ebookModal.hide();
        };

        // Add click event to results
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function () {
                const chapterId = this.dataset.chapterId;
                navigateToChapterById(chapterId);
                ebookModal.hide();
                searchContainer.style.display = 'none';
            });
        });

        ebookModal.show();
    }

    function showSelectionToolbar(rect, selection) {
        // Remove any existing toolbar
        const existingToolbar = document.querySelector('.selection-toolbar');
        if (existingToolbar) {
            existingToolbar.remove();
        }

        // Clone the toolbar template
        const template = document.getElementById('selectionToolbarTemplate');
        const toolbar = template.content.cloneNode(true).querySelector('.selection-toolbar');

        // Position the toolbar
        toolbar.style.top = `${window.scrollY + rect.top - 45}px`;
        toolbar.style.left = `${rect.left + rect.width / 2 - 75}px`;

        document.body.appendChild(toolbar);

        // Add event listeners to buttons
        toolbar.querySelector('.highlight-btn').addEventListener('click', function () {
            highlightSelection(selection);
            toolbar.remove();
        });

        toolbar.querySelector('.add-note-btn').addEventListener('click', function () {
            addNoteToSelection(selection);
            toolbar.remove();
        });

        // Close toolbar when clicking elsewhere
        document.addEventListener('mousedown', function closeToolbar(e) {
            if (!toolbar.contains(e.target)) {
                toolbar.remove();
                document.removeEventListener('mousedown', closeToolbar);
            }
        });
    }

    function highlightSelection(selection) {
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();

        // Create highlight span
        const highlight = document.createElement('span');
        highlight.className = 'highlight';
        highlight.textContent = selectedText;

        try {
            range.deleteContents();
            range.insertNode(highlight);

            showToast('Text highlighted', 'success');
        } catch (e) {
            console.error('Could not highlight selection:', e);
            showToast('Error highlighting text', 'danger');
        }

        // Clear selection
        selection.removeAllRanges();
    }

    function addNoteToSelection(selection) {
        if (selection.rangeCount === 0) return;

        const selectedText = selection.toString();

        // Get current chapter
        const currentChapter = chapters[currentChapterIndex];
        const chapterTitle = currentChapter.querySelector('h2').textContent;

        // Prepare modal for note
        modalTitle.textContent = 'Add Note';
        modalBody.innerHTML = `
            <div class="alert alert-light">
                <strong>Selected text:</strong> "${selectedText}"
            </div>
            <div class="mb-3">
                <label for="note-text" class="form-label">Your Note:</label>
                <textarea id="note-text" class="form-control" rows="4" placeholder="Enter your note here..."></textarea>
            </div>
        `;

        // Show cancel button
        cancelModal.style.display = 'block';

        // Set up confirm button
        confirmModal.textContent = 'Save Note';
        confirmModal.className = 'btn btn-primary';

        confirmModal.onclick = function () {
            const noteText = document.getElementById('note-text').value.trim();
            if (noteText) {
                // First highlight the selection
                highlightSelection(selection);

                // Then save the note
                const note = {
                    id: 'note_' + Date.now(),
                    text: noteText,
                    reference: selectedText,
                    chapterTitle: chapterTitle,
                    date: new Date().toLocaleDateString(),
                    chapterIndex: currentChapterIndex
                };

                notes.push(note);
                saveNotes();
                updateNotesList();

                showToast('Note saved', 'success');
            }

            ebookModal.hide();
        };

        // Show modal and focus textarea
        ebookModal.show();
        setTimeout(() => {
            document.getElementById('note-text').focus();
        }, 500);
    }

    function updateBookmarksList() {
        if (bookmarks.length === 0) {
            emptyBookmarks.style.display = 'flex';
            bookmarksList.innerHTML = '';
            return;
        }

        emptyBookmarks.style.display = 'none';

        let html = '';
        bookmarks.forEach(bookmark => {
            html += `
                <div class="p-3 border-bottom bookmark-item d-flex justify-content-between align-items-start" data-chapter-id="chapter${bookmark.id}">
                    <div>
                        <div class="fw-medium mb-1">${bookmark.title}</div>
                        <div class="small text-muted">Added: ${bookmark.date}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger rounded-circle remove-bookmark" data-id="${bookmark.id}">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
        });

        bookmarksList.innerHTML = html;

        // Add click events
        document.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', function (e) {
                if (!e.target.closest('.remove-bookmark')) {
                    const chapterId = this.dataset.chapterId;
                    navigateToChapterById(chapterId);

                    if (window.innerWidth < 992) {
                        body.classList.remove('sidebar-visible');
                    }
                }
            });
        });

        // Add remove bookmark handler
        document.querySelectorAll('.remove-bookmark').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const id = this.dataset.id;
                const index = bookmarks.findIndex(b => b.id === id);

                if (index > -1) {
                    bookmarks.splice(index, 1);
                    saveBookmarks();
                    updateBookmarksList();

                    // Update button state
                    const bookmarkButton = document.getElementById(`bookmarkPage${id}`);
                    if (bookmarkButton) {
                        const icon = bookmarkButton.querySelector('i');
                        icon.classList.remove('bi-bookmark-fill');
                        icon.classList.add('bi-bookmark');
                    }

                    showToast('Bookmark removed', 'info');
                }
            });
        });
    }

    function updateNotesList() {
        if (notes.length === 0) {
            emptyNotes.style.display = 'flex';
            notesList.innerHTML = '';
            return;
        }

        emptyNotes.style.display = 'none';

        let html = '';
        notes.forEach(note => {
            html += `
                <div class="p-3 border-bottom note-item" data-chapter-index="${note.chapterIndex}">
                    <div class="fw-medium mb-2">${note.text}</div>
                    <div class="small fst-italic text-muted mb-2">"${note.reference.substring(0, 50)}${note.reference.length > 50 ? '...' : ''}"</div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-primary">${note.chapterTitle}</span>
                        <span class="small text-muted">${note.date}</span>
                    </div>
                </div>
            `;
        });

        notesList.innerHTML = html;

        // Add click event to notes
        document.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', function () {
                const chapterIndex = parseInt(this.dataset.chapterIndex);
                navigateToChapter(chapterIndex);

                if (window.innerWidth < 992) {
                    body.classList.remove('sidebar-visible');
                }
            });
        });
    }

    function saveBookmarks() {
        localStorage.setItem('ebook_bookmarks', JSON.stringify(bookmarks));
    }

    function saveNotes() {
        localStorage.setItem('ebook_notes', JSON.stringify(notes));
    }

    function saveReadingPosition() {
        localStorage.setItem('ebook_position', currentChapterIndex);
    }

    function loadBookmarks() {
        const saved = localStorage.getItem('ebook_bookmarks');
        if (saved) {
            const savedBookmarks = JSON.parse(saved);
            bookmarks.push(...savedBookmarks);

            // Update bookmark button states
            savedBookmarks.forEach(bookmark => {
                const button = document.getElementById(`bookmarkPage${bookmark.id}`);
                if (button) {
                    const icon = button.querySelector('i');
                    icon.classList.remove('bi-bookmark');
                    icon.classList.add('bi-bookmark-fill');
                }
            });

            updateBookmarksList();
        }
    }

    function loadNotes() {
        const saved = localStorage.getItem('ebook_notes');
        if (saved) {
            notes.push(...JSON.parse(saved));
            updateNotesList();
        }
    }

    function loadReadingPosition() {
        const position = localStorage.getItem('ebook_position');
        if (position !== null) {
            navigateToChapter(parseInt(position));
        }
    }

    function showToast(message, type = 'primary') {
        const toastContainer = document.querySelector('.toast-container');

        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');

        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.appendChild(toastEl);

        const toast = new bootstrap.Toast(toastEl, {
            animation: true,
            autohide: true,
            delay: 3000
        });

        toast.show();

        // Remove the toast element after it's hidden
        toastEl.addEventListener('hidden.bs.toast', function () {
            toastEl.remove();
        });
    }

    function showShareModal() {
        modalTitle.textContent = 'Share This eBook';
        modalBody.innerHTML = `
            <div class="row g-3 mb-3">
                <div class="col-md-3 col-6">
                    <button class="btn btn-outline-secondary w-100 h-100 d-flex flex-column align-items-center p-3">
                        <i class="bi bi-envelope fs-3 mb-2"></i>
                        <span>Email</span>
                    </button>
                </div>
                <div class="col-md-3 col-6">
                    <button class="btn btn-outline-secondary w-100 h-100 d-flex flex-column align-items-center p-3">
                        <i class="bi bi-twitter fs-3 mb-2"></i>
                        <span>Twitter</span>
                    </button>
                </div>
                <div class="col-md-3 col-6">
                    <button class="btn btn-outline-secondary w-100 h-100 d-flex flex-column align-items-center p-3">
                        <i class="bi bi-facebook fs-3 mb-2"></i>
                        <span>Facebook</span>
                    </button>
                </div>
                <div class="col-md-3 col-6">
                    <button class="btn btn-outline-secondary w-100 h-100 d-flex flex-column align-items-center p-3">
                        <i class="bi bi-linkedin fs-3 mb-2"></i>
                        <span>LinkedIn</span>
                    </button>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Share link:</label>
                <div class="input-group">
                    <input type="text" class="form-control" value="https://example.com/elegant-ebook" readonly id="shareLink">
                    <button class="btn btn-primary" id="copyLinkBtn">
                        <i class="bi bi-clipboard"></i> Copy
                    </button>
                </div>
            </div>
        `;

        // Set up modal buttons
        cancelModal.style.display = 'none';
        confirmModal.textContent = 'Close';
        confirmModal.className = 'btn btn-primary';

        confirmModal.onclick = function () {
            ebookModal.hide();
        };

        // Add functionality to copy button
        ebookModal.show();

        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', function () {
                const linkInput = document.getElementById('shareLink');
                linkInput.select();
                document.execCommand('copy');

                this.innerHTML = '<i class="bi bi-check2"></i> Copied!';
                setTimeout(() => {
                    this.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
                }, 2000);

                showToast('Link copied to clipboard', 'success');
            });
        }

        // Add click events to share buttons
        modalBody.querySelectorAll('.btn-outline-secondary').forEach(btn => {
            btn.addEventListener('click', function () {
                const platform = this.querySelector('span').textContent;
                showToast(`Sharing via ${platform}`, 'info');
                ebookModal.hide();
            });
        });
    }

    function showDownloadModal() {
        modalTitle.textContent = 'Download Options';
        modalBody.innerHTML = `
            <div class="row g-4 mb-3">
                <div class="col-md-6">
                    <div class="card h-100 border-primary-subtle">
                        <div class="card-body text-center p-4">
                            <i class="bi bi-file-pdf fs-1 text-primary mb-3"></i>
                            <h5 class="card-title">PDF Format</h5>
                            <p class="card-text small mb-3">High-quality formatting with embedded fonts and images. Best for printing or reading on larger screens.</p>
                            <button class="btn btn-primary download-option" data-type="pdf">
                                <i class="bi bi-download me-2"></i>Download PDF
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100 border-primary-subtle">
                        <div class="card-body text-center p-4">
                            <i class="bi bi-book fs-1 text-primary mb-3"></i>
                            <h5 class="card-title">EPUB Format</h5>
                            <p class="card-text small mb-3">Optimized for e-readers and mobile devices. Adjustable text and reflowable content.</p>
                            <button class="btn btn-primary download-option" data-type="epub">
                                <i class="bi bi-download me-2"></i>Download EPUB
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body text-center p-4">
                            <i class="bi bi-kindle fs-1 text-secondary mb-3"></i>
                            <h5 class="card-title">MOBI Format</h5>
                            <p class="card-text small mb-3">Compatible with Amazon Kindle devices and apps. Includes table of contents.</p>
                            <button class="btn btn-secondary download-option" data-type="mobi">
                                <i class="bi bi-download me-2"></i>Download MOBI
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body text-center p-4">
                            <i class="bi bi-filetype-html fs-1 text-secondary mb-3"></i>
                            <h5 class="card-title">HTML Archive</h5>
                            <p class="card-text small mb-3">Complete HTML package with all styling and interactive features.</p>
                            <button class="btn btn-secondary download-option" data-type="html">
                                <i class="bi bi-download me-2"></i>Download HTML
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Set up modal buttons
        cancelModal.textContent = 'Cancel';
        cancelModal.style.display = 'block';
        confirmModal.style.display = 'none';

        // Add click events to download buttons
        modalBody.querySelectorAll('.download-option').forEach(btn => {
            btn.addEventListener('click', function () {
                const format = this.dataset.type;
                ebookModal.hide();
                simulateDownload(format);
            });
        });

        ebookModal.show();
    }

    function simulateDownload(format) {
        // Show initial toast
        showToast(`Preparing ${format.toUpperCase()} file...`, 'info');

        // After a delay, show download started toast
        setTimeout(() => {
            showToast(`${format.toUpperCase()} download started`, 'primary');

            // After another delay, show download complete toast
            setTimeout(() => {
                showToast(`${format.toUpperCase()} downloaded successfully`, 'success');
            }, 2000);
        }, 1500);
    }

    function showAccessibilityModal() {
        modalTitle.textContent = 'Accessibility Settings';
        modalBody.innerHTML = `
            <div class="mb-4">
                <h5 class="mb-3"><i class="bi bi-type me-2"></i>Text Settings</h5>
                <div class="mb-3">
                    <label for="fontSize" class="form-label d-flex justify-content-between">
                        <span>Font Size</span>
                        <span class="text-muted" id="fontSizeValue">100%</span>
                    </label>
                    <input type="range" class="form-range" min="80" max="200" step="10" id="fontSize" value="100">
                </div>
                <div class="mb-3">
                    <label for="fontFamily" class="form-label">Font Family</label>
                    <select class="form-select" id="fontFamily">
                        <option value="'Source Sans Pro', sans-serif" selected>Source Sans Pro (Default)</option>
                        <option value="'Open Sans', sans-serif">Open Sans</option>
                        <option value="'Merriweather', serif">Merriweather</option>
                        <option value="'Roboto', sans-serif">Roboto</option>
                        <option value="'Lora', serif">Lora</option>
                        <option value="system-ui, sans-serif">System Font</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="lineSpacing" class="form-label d-flex justify-content-between">
                        <span>Line Spacing</span>
                        <span class="text-muted" id="lineSpacingValue">1.8</span>
                    </label>
                    <input type="range" class="form-range" min="1.2" max="2.5" step="0.1" id="lineSpacing" value="1.8">
                </div>
            </div>
            
            <div class="mb-4">
                <h5 class="mb-3"><i class="bi bi-palette me-2"></i>Display Settings</h5>
                <div class="mb-3">
                    <label class="form-label">Color Theme</label>
                    <div class="d-flex gap-3">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="colorTheme" id="themeLight" value="light" checked>
                            <label class="form-check-label" for="themeLight">Light</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="colorTheme" id="themeDark" value="dark">
                            <label class="form-check-label" for="themeDark">Dark</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="colorTheme" id="themeSepia" value="sepia">
                            <label class="form-check-label" for="themeSepia">Sepia</label>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="contentWidth" class="form-label d-flex justify-content-between">
                        <span>Content Width</span>
                        <span class="text-muted" id="contentWidthValue">768px</span>
                    </label>
                    <input type="range" class="form-range" min="500" max="1200" step="10" id="contentWidth" value="768">
                </div>
            </div>
            
            <div class="mb-4">
                <h5 class="mb-3"><i class="bi bi-volume-up me-2"></i>Reading Assistance</h5>
                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" id="enableScreenReader">
                    <label class="form-check-label" for="enableScreenReader">Optimize for Screen Readers</label>
                </div>
                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" id="enableDyslexicFont">
                    <label class="form-check-label" for="enableDyslexicFont">Enable Dyslexia-Friendly Font</label>
                </div>
                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" id="reducedMotion">
                    <label class="form-check-label" for="reducedMotion">Reduced Motion</label>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="highContrast">
                    <label class="form-check-label" for="highContrast">High Contrast Mode</label>
                </div>
            </div>
            
            <div class="d-flex justify-content-between">
                <button class="btn btn-outline-secondary" id="resetAccessibility">Reset to Defaults</button>
                <button class="btn btn-primary" id="saveAccessibility">Save Settings</button>
            </div>
        `;

        // Set up modal buttons
        cancelModal.textContent = 'Close';
        cancelModal.style.display = 'block';
        confirmModal.style.display = 'none';

        // Show modal
        ebookModal.show();

        // Setup live previews
        const fontSizeSlider = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        fontSizeSlider.addEventListener('input', function () {
            fontSizeValue.textContent = this.value + '%';
            document.documentElement.style.setProperty('--preview-font-size', this.value + '%');
            document.body.style.fontSize = this.value + '%';
        });

        const lineSpacingSlider = document.getElementById('lineSpacing');
        const lineSpacingValue = document.getElementById('lineSpacingValue');
        lineSpacingSlider.addEventListener('input', function () {
            lineSpacingValue.textContent = this.value;
            document.body.style.lineHeight = this.value;
        });

        const fontFamilySelect = document.getElementById('fontFamily');
        fontFamilySelect.addEventListener('change', function () {
            document.body.style.fontFamily = this.value;
        });

        const contentWidthSlider = document.getElementById('contentWidth');
        const contentWidthValue = document.getElementById('contentWidthValue');
        contentWidthSlider.addEventListener('input', function () {
            contentWidthValue.textContent = this.value + 'px';
            document.querySelector('.content-wrapper').style.maxWidth = this.value + 'px';
        });

        // Theme controls
        const themeRadios = document.querySelectorAll('input[name="colorTheme"]');
        themeRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.value === 'dark') {
                    document.documentElement.setAttribute('data-bs-theme', 'dark');
                    themeSwitcher.innerHTML = '<i class="bi bi-sun"></i>';
                } else if (this.value === 'light') {
                    document.documentElement.setAttribute('data-bs-theme', 'light');
                    themeSwitcher.innerHTML = '<i class="bi bi-moon"></i>';
                } else if (this.value === 'sepia') {
                    document.documentElement.setAttribute('data-bs-theme', 'light');
                    document.body.style.backgroundColor = '#f8f3e8';
                    document.body.style.color = '#5f4b32';
                }
            });
        });

        // Special accessibility features
        const dyslexicFontToggle = document.getElementById('enableDyslexicFont');
        dyslexicFontToggle.addEventListener('change', function () {
            if (this.checked) {
                // Simulate adding a dyslexia-friendly font
                document.body.style.fontFamily = "'OpenDyslexic', sans-serif";
                document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
                    el.style.fontFamily = "'OpenDyslexic', serif";
                });
                showToast('Dyslexia-friendly font enabled', 'info');
            } else {
                document.body.style.fontFamily = '';
                document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
                    el.style.fontFamily = '';
                });
            }
        });

        const highContrastToggle = document.getElementById('highContrast');
        highContrastToggle.addEventListener('change', function () {
            if (this.checked) {
                document.body.classList.add('high-contrast');
                document.body.style.backgroundColor = 'white';
                document.body.style.color = 'black';
                document.querySelectorAll('a, button').forEach(el => {
                    el.style.color = 'blue';
                });
                showToast('High contrast mode enabled', 'info');
            } else {
                document.body.classList.remove('high-contrast');
                document.body.style.backgroundColor = '';
                document.body.style.color = '';
                document.querySelectorAll('a, button').forEach(el => {
                    el.style.color = '';
                });
            }
        });

        const reducedMotionToggle = document.getElementById('reducedMotion');
        reducedMotionToggle.addEventListener('change', function () {
            if (this.checked) {
                document.body.classList.add('reduced-motion');
                document.querySelectorAll('.fade-in, .slide-up').forEach(el => {
                    el.style.animation = 'none';
                });
                showToast('Reduced motion enabled', 'info');
            } else {
                document.body.classList.remove('reduced-motion');
                document.querySelectorAll('.fade-in, .slide-up').forEach(el => {
                    el.style.animation = '';
                });
            }
        });

        // Reset button
        document.getElementById('resetAccessibility').addEventListener('click', function () {
            // Reset all form controls to defaults
            fontSizeSlider.value = 100;
            fontSizeValue.textContent = '100%';
            document.body.style.fontSize = '';

            lineSpacingSlider.value = 1.8;
            lineSpacingValue.textContent = '1.8';
            document.body.style.lineHeight = '';

            fontFamilySelect.value = "'Source Sans Pro', sans-serif";
            document.body.style.fontFamily = '';

            contentWidthSlider.value = 768;
            contentWidthValue.textContent = '768px';
            document.querySelector('.content-wrapper').style.maxWidth = '';

            document.getElementById('themeLight').checked = true;
            document.documentElement.setAttribute('data-bs-theme', 'light');
            themeSwitcher.innerHTML = '<i class="bi bi-moon"></i>';
            document.body.style.backgroundColor = '';
            document.body.style.color = '';

            dyslexicFontToggle.checked = false;
            document.body.style.fontFamily = '';
            document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
                el.style.fontFamily = '';
            });

            highContrastToggle.checked = false;
            document.body.classList.remove('high-contrast');
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
            document.querySelectorAll('a, button').forEach(el => {
                el.style.color = '';
            });

            reducedMotionToggle.checked = false;
            document.body.classList.remove('reduced-motion');
            document.querySelectorAll('.fade-in, .slide-up').forEach(el => {
                el.style.animation = '';
            });

            document.getElementById('enableScreenReader').checked = false;

            showToast('Settings reset to defaults', 'info');
        });

        // Save button
        document.getElementById('saveAccessibility').addEventListener('click', function () {
            // In a real implementation, we would save settings to localStorage here
            // For the demo, we'll just show a success message
            showToast('Accessibility settings saved', 'success');
            ebookModal.hide();
        });
    }

    // Initialize
    loadBookmarks();
    loadNotes();
    loadReadingPosition();

    // Show sidebar by default on large screens
    if (window.innerWidth >= 992) {
        body.classList.add('sidebar-visible');
    } else {
        body.classList.add('sidebar-hidden');
    }
});
