document.addEventListener("DOMContentLoaded", () => {
    fetchProjects();
    initModal();
    initNavToggle();
});

function initNavToggle() {
    const navToggleButton = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggleButton && navMenu) {
        navToggleButton.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

async function fetchProjects() {
    try {
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) {
            console.error('Projects grid element not found');
            return;
        }
        
        const response = await fetch("/Portfolio/projects");
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const projects = await response.json();
        window.projects = projects || [];
        renderGrid(window.projects);
    } catch (error) {
        console.error("Error fetching projects:", error.message);
        renderError();
    }
}

function sanitizeText(text) {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text || '';
    return tempDiv.innerHTML;
}

function createExcerpt(text, maxLength = 150) {
    const trimmedText = (text || '').trim();
    if (trimmedText.length <= maxLength) return trimmedText;
    return trimmedText.slice(0, maxLength - 3) + '...';
}

function linkifyText(text) {
    const sanitizedText = sanitizeText(text);
    return sanitizedText
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '')
        .join('');
}

function renderGrid(projects) {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;
    
    if (!projects || projects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum projeto encontrado</h3>
                <p>Novos projetos serão adicionados em breve!</p>
            </div>
        `;
        return;
    }
    
    projectsGrid.innerHTML = projects.map((project, projectIndex) => {
        const coverImage = Array.isArray(project.photos) && project.photos.length > 0
            ? project.photos[0]
            : '/assets/Images/code.jpg';
        const projectDescription = createExcerpt(project.description || 'Sem descrição disponível.', 120);
        const projectTitle = project.title || 'Projeto';
        
        return `
            <article class="project-card" data-project-index="${projectIndex}">
                <div class="project-image-wrapper">
                    <img src="${coverImage}" alt="${sanitizeText(projectTitle)}" class="project-image" loading="lazy" decoding="async" />
                    <div class="project-overlay">
                        <span class="overlay-text">Ver Detalhes</span>
                    </div>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${sanitizeText(projectTitle)}</h3>
                    <p class="project-description">${projectDescription}</p>
                    <div class="project-footer">
                        <button class="view-details" data-project-index="${projectIndex}">
                            Ver detalhes
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
    
    attachCardHandlers();
}

function renderError() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (projectsGrid) {
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <h3>Erro ao carregar projetos</h3>
                <p>Tente recarregar a página mais tarde.</p>
            </div>
        `;
    }
}

function attachCardHandlers() {
    const projectCards = document.querySelectorAll('.project-card[data-project-index]');
    const detailButtons = document.querySelectorAll('.view-details[data-project-index]');
    
    projectCards.forEach(card => {
        card.addEventListener('click', (event) => {
            if (event.target.closest('.view-details')) return;
            
            const projectIndex = parseInt(card.getAttribute('data-project-index'));
            if (!isNaN(projectIndex)) {
                openModal(projectIndex);
            }
        });
    });
    
    detailButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const projectIndex = parseInt(button.getAttribute('data-project-index'));
            if (!isNaN(projectIndex)) {
                openModal(projectIndex);
            }
        });
    });
}

function initModal() {
    const projectModal = document.getElementById('projectModal');
    if (!projectModal) return;
    
    const modalOverlay = document.getElementById('modalOverlay');
    const modalCloseButton = document.getElementById('modalClose');
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }
    
    document.addEventListener('keydown', (keyboardEvent) => {
        if (keyboardEvent.key === 'Escape' && projectModal.classList.contains('active')) {
            closeModal();
        }
    });
}

function openModal(projectIndex) {
    if (!window.projects || !Array.isArray(window.projects)) {
        console.error('Projects not loaded');
        return;
    }
    
    const selectedProject = window.projects[projectIndex];
    if (!selectedProject) {
        console.error('Project not found at index:', projectIndex);
        return;
    }
    
    const projectModal = document.getElementById('projectModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const carouselMain = document.getElementById('carouselMain');
    const carouselIndicators = document.getElementById('carouselIndicators');
    const modalThumbs = document.getElementById('modalThumbs');
    
    if (!projectModal) return;
    
    if (modalTitle) {
        modalTitle.textContent = selectedProject.title || 'Projeto';
    }
    
    if (modalDescription) {
        modalDescription.innerHTML = linkifyText(selectedProject.description || 'Sem descrição disponível.');
    }
    
    const projectPhotos = Array.isArray(selectedProject.photos) && selectedProject.photos.length > 0
        ? selectedProject.photos
        : ['/assets/Images/code.jpg'];
    
    if (carouselMain) {
        carouselMain.innerHTML = projectPhotos.map((imageSrc, imageIndex) => `
            <div class="carousel-slide ${imageIndex === 0 ? 'active' : ''}" data-slide="${imageIndex}">
                <img src="${imageSrc}" alt="${sanitizeText(selectedProject.title || 'Projeto')} - Imagem ${imageIndex + 1}" loading="lazy" onerror="this.src='/assets/Images/code.jpg'" />
            </div>
        `).join('');
    }
    
    if (carouselIndicators && projectPhotos.length > 1) {
        carouselIndicators.innerHTML = projectPhotos.map((_, imageIndex) => `
            <button class="carousel-indicator ${imageIndex === 0 ? 'active' : ''}" data-slide="${imageIndex}" aria-label="Slide ${imageIndex + 1}"></button>
        `).join('');
    } else if (carouselIndicators) {
        carouselIndicators.innerHTML = '';
    }
    
    if (modalThumbs && projectPhotos.length > 1) {
        modalThumbs.innerHTML = projectPhotos.map((imageSrc, imageIndex) => `
            <button class="modal-thumb ${imageIndex === 0 ? 'active' : ''}" data-slide="${imageIndex}" aria-label="Miniatura ${imageIndex + 1}">
                <img src="${imageSrc}" alt="Miniatura ${imageIndex + 1}" loading="lazy" onerror="this.src='/assets/Images/code.jpg'" />
            </button>
        `).join('');
    } else if (modalThumbs) {
        modalThumbs.innerHTML = '';
    }
    
    projectModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (projectPhotos.length > 1) {
        initCarousel(projectPhotos.length);
        attachThumbHandlers();
    }
}

function closeModal() {
    const projectModal = document.getElementById('projectModal');
    if (projectModal) {
        projectModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

let currentSlideIndex = 0;
let totalSlidesCount = 0;

function initCarousel(totalSlides) {
    totalSlidesCount = totalSlides;
    currentSlideIndex = 0;
    
    const previousButton = document.getElementById('carouselPrev');
    const nextButton = document.getElementById('carouselNext');
    
    if (previousButton) {
        previousButton.onclick = () => navigateCarouselSlide(-1);
        previousButton.disabled = totalSlides <= 1;
    }
    
    if (nextButton) {
        nextButton.onclick = () => navigateCarouselSlide(1);
        nextButton.disabled = totalSlides <= 1;
    }
    
    updateCarouselDisplay();
}

function navigateCarouselSlide(direction) {
    currentSlideIndex += direction;
    
    if (currentSlideIndex < 0) {
        currentSlideIndex = totalSlidesCount - 1;
    } else if (currentSlideIndex >= totalSlidesCount) {
        currentSlideIndex = 0;
    }
    
    updateCarouselDisplay();
}

function updateCarouselDisplay() {
    const slides = document.querySelectorAll('.carousel-slide');
    slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === currentSlideIndex);
    });
    
    const indicators = document.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, indicatorIndex) => {
        indicator.classList.toggle('active', indicatorIndex === currentSlideIndex);
    });
    
    const thumbs = document.querySelectorAll('.modal-thumb');
    thumbs.forEach((thumb, thumbIndex) => {
        thumb.classList.toggle('active', thumbIndex === currentSlideIndex);
    });
    
    const prevButton = document.getElementById('carouselPrev');
    const nextButton = document.getElementById('carouselNext');
    
    if (prevButton) prevButton.disabled = totalSlidesCount <= 1;
    if (nextButton) nextButton.disabled = totalSlidesCount <= 1;
}

function attachThumbHandlers() {
    const thumbnails = document.querySelectorAll('.modal-thumb, .carousel-indicator');
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            const slideIndex = parseInt(thumbnail.getAttribute('data-slide'));
            if (!isNaN(slideIndex)) {
                currentSlideIndex = slideIndex;
                updateCarouselDisplay();
            }
        });
    });
}
