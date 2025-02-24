document.addEventListener("DOMContentLoaded", function () {
  // fetch("http://localhost:3002/Portfolio/certificates")
  fetch("https://portfolio-yg0y.onrender.com/Portfolio/certificates")
    .then((response) => response.json())
    .then((certificates) => {
      const carouselInner = document.querySelector(".carousel-inner");
      carouselInner.innerHTML = "";
      if (certificates.length === 0) {
        carouselInner.innerHTML =
          '<div class="carousel-item active"><p class="text-center">Nenhum certificado encontrado.</p></div>';
        return;
      }
      certificates.forEach((certificate, index) => {
        const activeClass = index === 0 ? " active" : "";
        const slide = document.createElement("div");
        slide.className = "carousel-item" + activeClass;
        slide.innerHTML = `
                <div class="card-certificados mx-auto">
                  <h3>${certificate.title}</h3>
                  <p>${certificate.description}</p>
                  <div class="btn-container">
                    <a href="${certificate.certificateUrl}" target="_blank" class="btn btn-primary">Visualizar Certificado</a>
                    <a href="${certificate.authenticityUrl}" target="_blank" class="btn btn-secondary">Verificar Autenticidade</a>
                  </div>
                </div>
              `;
        carouselInner.appendChild(slide);
      });
    })
    .catch((error) => {
      console.error("Erro ao carregar certificados:", error);
    });
});