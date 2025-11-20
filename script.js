// 전자책 앱
class EBook {
    constructor() {
        this.currentPage = 0;
        this.pages = [];
        this.isAnimating = false;
        this.animationTimeout = null;
        this.stories = this.getStoryData();
        this.resizeTimeout = null;
        this.init();
    }

    getStoryData() {
        if (typeof stories !== 'undefined') {
            return stories;
        }
        return [
            { id: 1, title: "시간우체통", author: "곽민서", file: "1.곽민서.txt", image: "image/compressed/1.곽민서.jpeg" },
            { id: 2, title: "二", author: "김도연(2반)", file: "2.김도연(2반).txt", image: "image/compressed/2.김도연(2반).jpg" },
            { id: 3, title: "일주일", author: "김우성", file: "3.김우성.txt", image: "image/compressed/3.김우성.png" },
            { id: 4, title: "크리스마스의 기적", author: "김도연(3반)", file: "4.김도연(3반).txt", image: "image/compressed/4.김도연(3반).png" },
            { id: 5, title: "🌸 이야기", author: "심서율", file: "5.심서율.txt", image: "image/compressed/5.심서율.png" },
            { id: 6, title: "Creepy Smile", author: "고은준", file: "6.고은준.txt", image: "image/compressed/6.고은준.png" },
            { id: 7, title: "폐교의 그림자", author: "박지환", file: "7.박지환.txt", image: "image/compressed/7.박지환.png" },
            { id: 8, title: "그림자의 밤", author: "궉민아", file: "8.궉민아.txt", image: "image/compressed/8.궉민아.png" },
            { id: 9, title: "라이벌", author: "신인수", file: "9.신인수.txt", image: "image/compressed/9.신인수.png" },
            { id: 10, title: "노을 그리고, 달", author: "오민규", file: "10.오민규.txt", image: "image/compressed/10.오민규.png" },
            { id: 11, title: "명호지야(冥呼之夜)", author: "김가은", file: "11.김가은.txt", image: "image/compressed/11.김가은.png" },
            { id: 12, title: "오늘은 6월 14일", author: "김연지", file: "12.김연지.txt", image: "image/compressed/12.김연지.png" },
            { id: 13, title: "랜과 밴드", author: "한신", file: "13.한신.txt", image: "image/compressed/13.한신.jpeg" },
            { id: 14, title: "거울 속의 나", author: "문소희", file: "14.문소희.txt", image: "image/compressed/14.문소희.jpeg" },
            { id: 15, title: "종소리", author: "장연재", file: "15.장연재.txt", image: "image/compressed/15.장연재.png" },
            { id: 16, title: "봄을 건너, 너에게", author: "백시아", file: "16.백시아.txt", image: "image/compressed/16.백시아.jpeg" }
        ];
    }

    async init() {
        // 초기 페이지 설정 (표지, 목차, 뒤표지)
        this.setupPages();
        this.setupEventListeners();
        this.updateButtons();
        this.showPage(0); // 표지를 즉시 표시

        // 로딩 인디케이터 표시
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }

        // 백그라운드에서 스토리 텍스트 로드
        await this.loadStories();

        // 스토리 로드 후 페이지 렌더링
        this.renderAllPages();
        this.setupPages(); // 페이지 목록 갱신
        this.updateButtons();

        // 로딩 완료 후 인디케이터 숨기기
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 300);
        }

        // 리사이즈 이벤트 리스너 추가
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.handleResize(), 200);
        });
    }

    async loadStories() {
        for (const story of this.stories) {
            if (story.content) continue; // 이미 내용이 있으면 스킵

            try {
                const content = await this.loadTextFile(story.file);
                story.content = content; // 텍스트 저장
            } catch (error) {
                console.error(`스토리 로드 실패: ${story.file}`, error);
                story.content = "내용을 불러올 수 없습니다.";
            }
        }
    }

    async loadTextFile(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) throw new Error('파일을 찾을 수 없습니다');
            const text = await response.text();
            return this.processTextContent(text);
        } catch (error) {
            console.error(`파일 로드 오류: ${filename}`, error);
            return "내용을 불러올 수 없습니다.";
        }
    }

    processTextContent(text) {
        let lines = text.split('\n');
        let processedLines = [];
        let inContent = false;

        for (let line of lines) {
            if (line.includes('→제목')) continue;
            line = line.replace(/^\s*\d+→/, '');

            if (line.trim()) {
                processedLines.push(line.trim());
            } else if (inContent) {
                processedLines.push('');
            }

            if (line.trim()) {
                inContent = true;
            }
        }

        let result = [];
        let prevEmpty = false;
        for (let line of processedLines) {
            if (line === '') {
                if (!prevEmpty) result.push(line);
                prevEmpty = true;
            } else {
                result.push(line);
                prevEmpty = false;
            }
        }

        return result; // 배열로 반환하여 처리가 쉽게 함
    }

    renderAllPages() {
        const storyPagesContainer = document.getElementById('story-pages');
        storyPagesContainer.innerHTML = ''; // 기존 페이지 초기화

        // 현재 보고 있는 스토리 ID 저장 (리사이즈 시 위치 유지용)
        let currentStoryId = null;
        if (this.pages[this.currentPage] && this.pages[this.currentPage].dataset.storyId) {
            currentStoryId = parseInt(this.pages[this.currentPage].dataset.storyId);
        }

        this.stories.forEach(story => {
            if (story.content) {
                this.createDynamicStoryPages(story, storyPagesContainer);
            }
        });

        // 페이지 목록 다시 설정
        this.setupPages();

        // 위치 복원
        if (currentStoryId) {
            this.goToStory(currentStoryId);
        } else if (this.currentPage >= this.pages.length) {
            this.showPage(this.pages.length - 1);
        } else {
            this.showPage(this.currentPage);
        }
    }

    createDynamicStoryPages(story, container) {
        const paragraphs = Array.isArray(story.content) ? story.content : story.content.split('\n\n').filter(p => p.trim());

        // 임시 페이지 생성하여 높이 측정 준비
        let currentPageIndex = 0;
        let currentPage = this.createPageElement(story, currentPageIndex);
        container.appendChild(currentPage); // DOM에 추가해야 높이 측정 가능

        let contentContainer = currentPage.querySelector('.story-content');
        let pageContent = currentPage.querySelector('.page-content');

        // 페이지 높이 제한 (패딩 등 고려)
        // page-content의 높이는 CSS에서 100%로 설정됨.
        // 실제 사용 가능한 높이를 계산해야 함.

        // 첫 페이지는 제목과 이미지가 있어서 공간이 더 적음

        let currentParagraphs = [];

        for (let i = 0; i < paragraphs.length; i++) {
            const pText = paragraphs[i];
            if (!pText.trim()) continue; // 빈 줄 건너뛰기

            const pElement = document.createElement('p');
            pElement.innerHTML = this.escapeHtml(pText);
            contentContainer.appendChild(pElement);

            // 오버플로우 체크
            // contentContainer(.story-content)의 scrollHeight가 clientHeight보다 크면 넘친 것임
            if (contentContainer.scrollHeight > contentContainer.clientHeight + 1) {
                // 넘쳤으므로 방금 추가한 문단 제거
                contentContainer.removeChild(pElement);

                // 현재 페이지 번호 업데이트
                const totalPagesSpan = currentPage.querySelector('.page-number');
                if (totalPagesSpan) totalPagesSpan.textContent = `Page ${currentPageIndex + 1}`;

                // 새 페이지 생성
                currentPageIndex++;
                currentPage = this.createPageElement(story, currentPageIndex);
                container.appendChild(currentPage);

                contentContainer = currentPage.querySelector('.story-content');
                pageContent = currentPage.querySelector('.page-content');

                // 문단 다시 추가
                contentContainer.appendChild(pElement);
            }
        }

        // 마지막 페이지 번호 업데이트 (전체 페이지 수는 나중에 계산하거나 생략)
        // 여기서는 "Page X" 형태로만 표시하고 전체 페이지 수는 표시하지 않거나,
        // 모든 페이지 생성 후 다시 업데이트해야 함. 
        // 성능상 일단 "Page X"만 표시하거나, 전체 페이지 수를 알고 싶다면 
        // 생성된 페이지들을 다시 순회해야 함.

        // 생성된 페이지들에 전체 페이지 수 업데이트
        const generatedPages = container.querySelectorAll(`.story-page[data-story-id="${story.id}"]`);
        generatedPages.forEach((page, idx) => {
            const numDiv = page.querySelector('.page-number');
            if (numDiv) {
                numDiv.textContent = `Page ${idx + 1} / ${generatedPages.length}`;
            }
        });
    }

    createPageElement(story, pageIndex) {
        const page = document.createElement('div');
        page.className = 'page story-page';
        page.dataset.storyId = story.id;
        page.dataset.pageNum = pageIndex;

        // 초기에는 보이지 않게 설정 (측정용)
        // 하지만 DOM에 있어야 측정이 정확함.
        // CSS 클래스로 제어되므로 추가적인 스타일은 필요 없음.

        if (pageIndex === 0) {
            page.innerHTML = `
                <div class="page-content">
                    <h2 class="story-title">${this.escapeHtml(story.title)}</h2>
                    <img src="${story.image}" alt="${this.escapeHtml(story.title)}" class="story-image" onerror="this.style.display='none'">
                    <div class="story-content"></div>
                    <div class="page-number"></div>
                </div>
            `;
        } else {
            page.innerHTML = `
                <div class="page-content">
                    <div class="story-content"></div>
                    <div class="page-number"></div>
                </div>
            `;
        }
        return page;
    }

    handleResize() {
        // 리사이즈 시 페이지 재계산
        this.renderAllPages();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupPages() {
        this.pages = Array.from(document.querySelectorAll('.page'));
        this.updatePageIndicator();
    }

    setupEventListeners() {
        // 네비게이션 버튼
        document.getElementById('prevBtn').addEventListener('click', () => this.prevPage());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextPage());
        document.getElementById('homeBtn').addEventListener('click', () => this.goToTOC());

        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevPage();
            if (e.key === 'ArrowRight') this.nextPage();
            if (e.key === 'Home') this.goToTOC();
        });

        // 목차 링크
        document.querySelectorAll('.table-of-contents a').forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const storyId = parseInt(link.dataset.story);
                this.goToStory(storyId);
            });
        });

        // 스와이프 제스처 (모바일)
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        });

        const handleSwipe = () => {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            if (absDeltaX > absDeltaY * 2 && absDeltaX > 50) {
                if (deltaX < 0) {
                    this.nextPage();
                } else {
                    this.prevPage();
                }
            }
        };
        this.handleSwipe = handleSwipe;
    }

    showPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.pages.length) return;

        if (this.currentPage === pageIndex) {
            this.pages[pageIndex].classList.add('active');
            this.updatePageIndicator();
            this.updateButtons();
            return;
        }

        if (this.isAnimating && this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            const oldCurrentPage = this.pages[this.currentPage];
            if (oldCurrentPage) {
                oldCurrentPage.classList.remove('active', 'turning-next', 'turning-prev');
                oldCurrentPage.style.transform = '';
                oldCurrentPage.style.visibility = '';
                oldCurrentPage.style.opacity = '';
                oldCurrentPage.style.zIndex = '';
            }
        }

        this.isAnimating = true;
        const currentPageEl = this.pages[this.currentPage];
        const nextPageEl = this.pages[pageIndex];

        // 페이지 요소가 존재하는지 확인
        if (!currentPageEl || !nextPageEl) {
            this.isAnimating = false;
            this.currentPage = pageIndex;
            this.updatePageIndicator();
            this.updateButtons();
            return;
        }

        if (pageIndex > this.currentPage) {
            nextPageEl.style.visibility = 'visible';
            nextPageEl.style.opacity = '1';
            nextPageEl.style.zIndex = '10';
            nextPageEl.classList.add('active');

            requestAnimationFrame(() => {
                currentPageEl.style.zIndex = '20';
                currentPageEl.classList.add('turning-next');
            });

            this.animationTimeout = setTimeout(() => {
                currentPageEl.classList.remove('active', 'turning-next');
                currentPageEl.style.transform = '';
                currentPageEl.style.visibility = '';
                currentPageEl.style.opacity = '';
                currentPageEl.style.zIndex = '';
                this.currentPage = pageIndex;
                this.updatePageIndicator();
                this.updateButtons();
                this.isAnimating = false;
                this.animationTimeout = null;

                const pageContent = nextPageEl.querySelector('.page-content');
                if (pageContent) pageContent.scrollTop = 0;
            }, 300);
        } else {
            nextPageEl.style.visibility = 'visible';
            nextPageEl.style.opacity = '0';
            nextPageEl.style.zIndex = '20';
            nextPageEl.classList.add('active');

            requestAnimationFrame(() => {
                nextPageEl.classList.add('turning-prev');
            });

            this.animationTimeout = setTimeout(() => {
                currentPageEl.classList.remove('active');
                currentPageEl.style.visibility = '';
                currentPageEl.style.opacity = '';
                currentPageEl.style.zIndex = '';
                nextPageEl.classList.remove('turning-prev');
                nextPageEl.style.transform = '';
                nextPageEl.style.opacity = '';
                nextPageEl.style.zIndex = '';
                this.currentPage = pageIndex;
                this.updatePageIndicator();
                this.updateButtons();
                this.isAnimating = false;
                this.animationTimeout = null;

                const pageContent = nextPageEl.querySelector('.page-content');
                if (pageContent) pageContent.scrollTop = 0;
            }, 300);
        }
    }

    nextPage() {
        if (this.currentPage < this.pages.length - 1) {
            this.showPage(this.currentPage + 1);
        }
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.showPage(this.currentPage - 1);
        }
    }

    goToTOC() {
        this.showPage(1);
    }

    goToStory(storyId) {
        const storyPage = this.pages.find(page =>
            page.dataset.storyId && parseInt(page.dataset.storyId) === storyId
        );
        if (storyPage) {
            const pageIndex = this.pages.indexOf(storyPage);
            this.showPage(pageIndex);
        }
    }

    updatePageIndicator() {
        const currentEl = document.getElementById('currentPage');
        const totalEl = document.getElementById('totalPages');
        if (currentEl) currentEl.textContent = this.currentPage + 1;
        if (totalEl) totalEl.textContent = this.pages.length;
    }

    updateButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) prevBtn.disabled = this.currentPage === 0;
        if (nextBtn) nextBtn.disabled = this.currentPage === this.pages.length - 1;
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    new EBook();
});
