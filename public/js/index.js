document.addEventListener("DOMContentLoaded", function () {
  // Back to top visibility
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 350) backToTop.classList.add('show');
      else backToTop.classList.remove('show');
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Active nav link highlight on scroll
  const sections = ['sobre','habilidades','formacao','certificados','projetos','area-contatos'];
  const navLinks = Array.from(document.querySelectorAll('.navbar .nav-link'));
  const map = new Map(sections.map(id => [id, document.getElementById(id)]));
  function updateActive() {
    let activeId = null;
    const offset = 120;
    sections.forEach(id => {
      const el = map.get(id);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = rect.top - offset;
      if (top <= 0) activeId = id;
    });
    navLinks.forEach(a => {
      const isActive = a.getAttribute('href') === `#${activeId}`;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
  // Copy email button
  const copyBtn = document.getElementById('copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const email = copyBtn.getAttribute('data-email');
      navigator.clipboard.writeText(email).then(() => {
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => (copyBtn.textContent = 'Copiar email'), 1500);
      });
    });
  }

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


  // Função para sanitizar entrada e prevenir XSS
  function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Função para validar email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Função para validar nome (apenas letras e espaços)
  function isValidName(name) {
    const nameRegex = /^[A-Za-zÀ-ÿ\s]{2,100}$/;
    return nameRegex.test(name);
  }

  const formEl = document.getElementById('formContato');
  if (!formEl) return; // guard if form removed
  formEl.addEventListener('submit', function (e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const mensagem = document.getElementById('mensagem').value.trim();

    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());

    let hasError = false;

    // Validação do nome
    if (!nome) {
      const nomeField = document.getElementById('nome');
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message');
      errorMessage.textContent = 'O nome é obrigatório!';
      nomeField.parentNode.appendChild(errorMessage);
      hasError = true;
    } else if (!isValidName(nome)) {
      const nomeField = document.getElementById('nome');
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message');
      errorMessage.textContent = 'Nome deve conter apenas letras (2-100 caracteres)';
      nomeField.parentNode.appendChild(errorMessage);
      hasError = true;
    }

    // Validação do email
    if (!email) {
      const emailField = document.getElementById('email');
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message');
      errorMessage.textContent = 'O e-mail é obrigatório!';
      emailField.parentNode.appendChild(errorMessage);
      hasError = true;
    } else if (!isValidEmail(email)) {
      const emailField = document.getElementById('email');
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message');
      errorMessage.textContent = 'Por favor, insira um e-mail válido!';
      emailField.parentNode.appendChild(errorMessage);
      hasError = true;
    }

    // Validação da mensagem
    if (!mensagem) {
      const mensagemField = document.getElementById('mensagem');
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message');
      errorMessage.textContent = 'A mensagem é obrigatória!';
      mensagemField.parentNode.appendChild(errorMessage);
      hasError = true;
    } else if (mensagem.length < 10) {
      const mensagemField = document.getElementById('mensagem');
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message');
      errorMessage.textContent = 'A mensagem deve ter pelo menos 10 caracteres!';
      mensagemField.parentNode.appendChild(errorMessage);
      hasError = true;
    } else if (mensagem.length > 1000) {
      const mensagemField = document.getElementById('mensagem');
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message');
      errorMessage.textContent = 'A mensagem não pode exceder 1000 caracteres!';
      mensagemField.parentNode.appendChild(errorMessage);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Sanitizar dados antes de enviar
    const dadosSanitizados = {
      nome: sanitizeInput(nome),
      email: sanitizeInput(email),
      mensagem: sanitizeInput(mensagem)
    };

    fetch('/formContato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosSanitizados),
    })
      .then(response => response.json())
      .then(data => {
        const feedbackElement = document.getElementById('mensagem-feedback');
        if (data.message) {
          feedbackElement.textContent = data.message;
          feedbackElement.className = 'alert alert-success';
          document.getElementById('formContato').reset();
        } else {
          feedbackElement.textContent = 'Erro ao enviar formulário';
          feedbackElement.className = 'alert alert-danger';
        }

        feedbackElement.style.display = 'block';
        setTimeout(() => {
          feedbackElement.style.display = 'none';
        }, 3000);
      })
      .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao enviar formulário');
      });
  });
});