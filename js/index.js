document.addEventListener('DOMContentLoaded', function () {
            document.getElementById('formContato').addEventListener('submit', function (e) {
                e.preventDefault();

                const nome = document.getElementById('nome').value;
                const email = document.getElementById('email').value;
                const mensagem = document.getElementById('mensagem').value;

                const errorMessages = document.querySelectorAll('.error-message');
                errorMessages.forEach(msg => msg.remove());

                let hasError = false;

                if (!nome) {
                    const nomeField = document.getElementById('nome');
                    const errorMessage = document.createElement('div');
                    errorMessage.classList.add('error-message');
                    errorMessage.textContent = 'O nome é obrigatório!';
                    nomeField.parentNode.appendChild(errorMessage);
                    hasError = true;
                }

                if (!email) {
                    const emailField = document.getElementById('email');
                    const errorMessage = document.createElement('div');
                    errorMessage.classList.add('error-message');
                    errorMessage.textContent = 'O e-mail é obrigatório!';
                    emailField.parentNode.appendChild(errorMessage);
                    hasError = true;
                }

                if (!mensagem) {
                    const mensagemField = document.getElementById('mensagem');
                    const errorMessage = document.createElement('div');
                    errorMessage.classList.add('error-message');
                    errorMessage.textContent = 'A mensagem é obrigatória!';
                    mensagemField.parentNode.appendChild(errorMessage);
                    hasError = true;
                }

                if (hasError) {
                    return;
                }

                fetch('/formContato', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome: nome,
                        email: email,
                        mensagem: mensagem
                    }),
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

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });