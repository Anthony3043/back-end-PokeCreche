/**
 * CrecheApp - Sistema de Gerenciamento
 * Main JavaScript File
 * Versão: 2.0.0
 */

class CrecheApp {
    constructor() {
        this.config = window.CrecheAppConfig || {};
        this.init();
    }

    init() {
        console.log(`👶 CrecheApp ${this.config.version} inicializado`);
        console.log(`📍 Ambiente: ${this.config.environment}`);
        console.log(`🌐 Base URL: ${this.config.baseUrl}`);
        
        this.setupEventListeners();
        this.setupGlobalHandlers();
        this.animateElements();
        this.checkSystemStatus();
    }

    setupEventListeners() {
        // Forms específicos serão tratados individualmente



        // Animações de hover
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('nav-link') || 
                e.target.classList.contains('footer-link')) {
                this.animateHover(e.target);
            }
        });

        // Sistema de notificações
        this.setupNotifications();
    }

    setupGlobalHandlers() {
        // Handler global de erros
        window.addEventListener('error', (e) => {
            console.error('Erro global capturado:', e.error);
            this.showNotification('Ocorreu um erro inesperado', 'error');
        });

        // Handler para promises não tratadas
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promise rejeitada não tratada:', e.reason);
            this.showNotification('Erro na operação', 'error');
            e.preventDefault();
        });

        // Service Worker removido para evitar erros 404
    }

    async handleFormSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const submitBtn = form.querySelector('.btn-submit');
        const messageDiv = form.nextElementSibling?.classList.contains('message') 
            ? form.nextElementSibling 
            : this.createMessageDiv(form);

        try {
            this.setButtonLoading(submitBtn, true);
            messageDiv.innerHTML = '';

            const endpoint = this.getFormEndpoint(form);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.handleFormSuccess(form, result, messageDiv);
            } else {
                throw result;
            }
        } catch (error) {
            this.handleFormError(error, messageDiv);
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    getFormEndpoint(form) {
        const formId = form.id;
        const baseUrl = this.config.baseUrl;

        switch (formId) {
            case 'form-aluno':
                return `${baseUrl}/register/aluno`;
            case 'form-docente':
                return `${baseUrl}/register/docente`;
            case 'form-login':
                return `${baseUrl}/login`;
            default:
                return `${baseUrl}/api/${formId.replace('form-', '')}`;
        }
    }

    handleFormSuccess(form, result, messageDiv) {
        const successMessage = result.message || 'Operação realizada com sucesso!';
        
        messageDiv.innerHTML = `
            <div class="success">
                <strong>✅ Sucesso!</strong> ${successMessage}
            </div>
        `;

        // Animação de confete para sucesso
        this.createConfetti();

        // Reset do form após sucesso
        setTimeout(() => {
            form.reset();
            // Manter a mensagem por 5 segundos
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 5000);
        }, 1000);

        // Log do sucesso
        console.log('Formulário processado com sucesso:', result);
    }

    handleFormError(error, messageDiv) {
        const errorMessage = error.message || 'Erro ao processar a solicitação';
        
        messageDiv.innerHTML = `
            <div class="error">
                <strong>❌ Erro!</strong> ${errorMessage}
            </div>
        `;

        console.error('Erro no formulário:', error);

        // Vibrar o formulário em caso de erro (se suportado)
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            const originalText = button.innerHTML;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = `
                <span class="loading-spinner">⏳</span>
                Processando...
            `;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
            }
            button.classList.remove('loading');
        }
    }

    createMessageDiv(form) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        form.parentNode.insertBefore(messageDiv, form.nextSibling);
        return messageDiv;
    }

    setupNotifications() {
        // Criar container de notificações
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(notificationContainer);
    }

    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem;
            margin-bottom: 0.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideInRight 0.3s ease-out;
        `;

        container.appendChild(notification);

        // Auto-remover após duração
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || colors.info;
    }

    animateElements() {
        // Animar elementos com classe .animate-on-scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        // Efeito de digitação para títulos
        this.typeWriterEffect();
    }

    typeWriterEffect() {
        const titles = document.querySelectorAll('.typewriter');
        titles.forEach(title => {
            const text = title.textContent;
            title.textContent = '';
            let i = 0;
            
            const type = () => {
                if (i < text.length) {
                    title.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, 100);
                }
            };
            
            type();
        });
    }

    createConfetti() {
        // Efeito de confetti simples
        const confettiCount = 50;
        const colors = ['#c4680b', '#e67e22', '#f39c12', '#e74c3c', '#3498db'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}vw;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
            `;

            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 5000);
        }

        // Adicionar CSS da animação se não existir
        if (!document.getElementById('confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    async checkSystemStatus() {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/health`);
            if (response.ok) {
                console.log('✅ Sistema está saudável');
            }
        } catch (error) {
            console.log('ℹ️ Verificação de status ignorada');
        }
    }



    animateHover(element) {
        element.style.transform = 'translateY(-2px) scale(1.05)';
        setTimeout(() => {
            element.style.transform = '';
        }, 300);
    }

    // Utilitários globais
    formatCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR');
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.CrecheApp = new CrecheApp();
});

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrecheApp;
}