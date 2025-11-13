document.addEventListener("DOMContentLoaded", () => {
    const addProjectsLink = document.getElementById("add-projects-link");
    if (addProjectsLink) {
        const isProduction = window.location.hostname !== "localhost";
        addProjectsLink.style.display = isProduction ? "none" : "block";
    }
    fetchProjects();
});

async function fetchProjects() {
    try {
        const response = await fetch("https://portfolio-yg0y.onrender.com/Portfolio/projects");
        // const response = await fetch("http://localhost:3002/Portfolio/projects");
        if (!response.ok) throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        const projects = await response.json();
        window.projects = projects;
        renderGrid(projects);
        wireModalHandlers();
    } catch (error) {
        console.error("Erro ao buscar projetos:", error.message);
    }
}

function sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function excerpt(text, max = 120) {
    const t = (text || '').trim();
    if (t.length <= max) return t;
    return t.slice(0, max - 3) + '...';
}

function linkify(text) {
    const safe = sanitize(text);
    // depois de sanitizar, reintroduzimos links com regex sobre a string segura
    return safe.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
                         .split('\n')
                         .map(line => `<p>${line}</p>`)
                         .join('');
}

function renderGrid(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!projects || projects.length === 0) {
        grid.innerHTML = '<div class="col-12"><div class="alert alert-info">Nenhum projeto encontrado ainda.</div></div>';
        return;
    }
    grid.innerHTML = projects.map((p, idx) => {
        const cover = Array.isArray(p.photos) ? (p.photos[0] || '') : (p.photos || '');
        return `
            <div class="col-12 col-sm-6 col-lg-4">
                <div class="project-card">
                    <img src="${cover}" alt="${sanitize(p.title)}" class="project-thumb" loading="lazy" decoding="async"/>
                    <div class="project-body">
                        <h3 class="project-title">${sanitize(p.title)}</h3>
                        <div class="project-excerpt">${sanitize(excerpt(p.description))}</div>
                        <div class="project-actions">
                            <button class="btn btn-primary btn-sm" data-project-index="${idx}" data-action="open-modal">Ver detalhes</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function wireModalHandlers() {
    const grid = document.getElementById('projectsGrid');
    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="open-modal"]');
        if (!btn) return;
        const index = Number(btn.getAttribute('data-project-index'));
        openProjectModal(index);
    });
}

function openProjectModal(index) {
    const project = window.projects?.[index];
    if (!project) return;

    const titleEl = document.getElementById('projectModalTitle');
    const descEl = document.getElementById('projectModalDescription');
    const photosEl = document.getElementById('projectModalPhotos');

    titleEl.textContent = project.title || '';
    descEl.innerHTML = linkify(project.description || '');

    const photos = Array.isArray(project.photos) ? project.photos : (project.photos ? [project.photos] : []);
    photosEl.innerHTML = photos.map((src, i) => `
        <div class="carousel-item ${i === 0 ? 'active' : ''}">
            <a href="${src}" target="_blank" rel="noopener noreferrer">
                <img src="${src}" class="d-block w-100" alt="${sanitize(project.title)}" loading="lazy" decoding="async">
            </a>
        </div>
    `).join('');

    // Indicadores (bolinhas) do carrossel
    const indicatorsEl = document.getElementById('projectModalIndicators');
    indicatorsEl.innerHTML = photos.map((_, i) => `
        <button type="button" data-bs-target="#projectModalCarousel" data-bs-slide-to="${i}" ${i === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${i+1}"></button>
    `).join('');

    // Thumbnails
    const thumbsEl = document.getElementById('projectModalThumbs');
    thumbsEl.innerHTML = photos.map((src, i) => `
        <button class="thumb ${i === 0 ? 'active' : ''}" type="button" data-index="${i}" aria-label="Miniatura ${i+1}">
            <img src="${src}" alt="Miniatura ${i+1} de ${sanitize(project.title)}" loading="lazy" decoding="async" />
        </button>
    `).join('');

    thumbsEl.onclick = (ev) => {
        const btn = ev.target.closest('.thumb');
        if (!btn) return;
        const slideTo = Number(btn.getAttribute('data-index'));
        const carousel = bootstrap.Carousel.getOrCreateInstance(document.getElementById('projectModalCarousel'));
        carousel.to(slideTo);
    };

    // Update active thumbnail when slide changes
    const carouselEl = document.getElementById('projectModalCarousel');
    if (carouselEl.__thumbHandler) {
        carouselEl.removeEventListener('slid.bs.carousel', carouselEl.__thumbHandler);
    }
    const thumbHandler = (e) => {
        const idx = e.to;
        thumbsEl.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
    };
    carouselEl.addEventListener('slid.bs.carousel', thumbHandler);
    carouselEl.__thumbHandler = thumbHandler;

    const modalEl = document.getElementById('projectModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}
