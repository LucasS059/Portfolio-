document.addEventListener("DOMContentLoaded", function () {
    const addProjectsLink = document.getElementById("add-projects-link");
    if (addProjectsLink) {
        const isProduction = window.location.hostname !== "localhost";
        addProjectsLink.style.display = isProduction ? "none" : "block";
    }
});

async function fetchProjects() {
    try {
        console.log("Tentando buscar projetos...");
        const response = await fetch("https://portfolio-yg0y.onrender.com/Portfolio/projects");
        // const response = await fetch("http://localhost:3002/Portfolio/projects");
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        const projects = await response.json();
        console.log("Projetos recebidos:", projects);
        window.projects = projects;
        renderCarousel(projects);
    } catch (error) {
        console.error("Erro ao buscar projetos:", error.message);
    }
}

function renderCarousel(projects) {
    const carouselInner = document.querySelector("#mainCarousel .carousel-inner");
    carouselInner.innerHTML = projects.map((project, index) => `
    <div class="carousel-item ${index === 0 ? 'active' : ''}">
        <img src="${Array.isArray(project.photos) ? project.photos[0] : project.photos}" class="d-block w-100 rounded-3" alt="${project.title}" onclick="showDetails(${index})">
    </div>
    `).join("");
}

function formatDescription(description) {
    return description.split('\n').map(line => {
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        line = line.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
        return `<p>${line}</p>`;
    }).join('');
}

function showDetails(index) {
    const project = window.projects[index];
    document.getElementById("project-title").textContent = project.title;
    document.getElementById("project-description").innerHTML = formatDescription(project.description);
    const photosContainer = document.getElementById("project-photos");
    photosContainer.innerHTML = project.photos.map((photo, i) => `
    <div class="carousel-item ${i === 0 ? 'active' : ''}">
        <img src="${photo}" class="d-block w-100" alt="${project.title}">
    </div>
    `).join("");
    document.getElementById("project-details").style.display = "block";
}

function hideDetails() {
    document.getElementById("project-details").style.display = "none";
}

document.addEventListener("DOMContentLoaded", fetchProjects);
