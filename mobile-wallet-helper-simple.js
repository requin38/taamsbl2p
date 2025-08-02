/**
 * Mobile Wallet Connection Helper for TAAMS Protocol - VERSION SIMPLE
 * Guide l'utilisateur pour se connecter via MetaMask mobile
 */

class MobileWalletHelper {
    constructor() {
        this.isMobile = this.detectMobile();
        this.init();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
        if (this.isMobile) {
            this.addMobileStyles();
            this.showMobileGuide();
        }
    }

    addMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-guide {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 25px;
                border-radius: 15px;
                z-index: 10000;
                max-width: 350px;
                border: 2px solid #00ff88;
                box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
                text-align: center;
            }

            .guide-button {
                width: 100%;
                padding: 12px;
                margin: 8px 0;
                background: #00ff88;
                color: black;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
            }

            .guide-button:hover {
                background: #00cc66;
                transform: scale(1.02);
            }

            .guide-button.secondary {
                background: #333;
                color: white;
            }

            .guide-text {
                color: #00ff88;
                font-size: 14px;
                line-height: 1.6;
                margin: 15px 0;
            }

            .mobile-success {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 255, 136, 0.95);
                color: black;
                padding: 15px 25px;
                border-radius: 8px;
                font-weight: bold;
                z-index: 10001;
                box-shadow: 0 4px 20px rgba(0, 255, 136, 0.5);
            }
        `;
        document.head.appendChild(style);
    }

    showMobileGuide() {
        // Attendre un peu avant d'afficher le guide
        setTimeout(() => {
            if (!window.ethereum) {
                const guide = document.createElement('div');
                guide.className = 'mobile-guide';
                guide.innerHTML = `
                    <h3 style="color: #00ff88; margin-bottom: 20px;">🚀 CONNEXION MOBILE</h3>
                    
                    <div class="guide-text">
                        <strong>Pour vous connecter à TAAMS Protocol :</strong>
                    </div>
                    
                    <div style="background: rgba(0,255,136,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <div style="font-size: 16px; margin-bottom: 10px;"><strong>📱 MÉTHODE SIMPLE :</strong></div>
                        <ol style="text-align: left; padding-left: 20px; font-size: 14px;">
                            <li><strong>Ouvrez MetaMask App</strong></li>
                            <li>Appuyez sur <strong>"Navigateur"</strong> (en bas)</li>
                            <li>Copiez cette URL et collez-la</li>
                            <li>Cliquez <strong>"CONNECT WALLET"</strong></li>
                            <li><strong>Signez</strong> pour vous authentifier</li>
                        </ol>
                    </div>
                    
                    <button onclick="copyUrlToClipboard()" class="guide-button">
                        📋 COPIER L'URL DU SITE
                    </button>
                    
                    <button onclick="openMetaMaskDownload()" class="guide-button secondary">
                        📥 Télécharger MetaMask
                    </button>
                    
                    <button onclick="closeGuide()" class="guide-button secondary">
                        ✕ Fermer
                    </button>
                    
                    <div style="margin-top: 15px; font-size: 12px; color: #888;">
                        ⚡ Cette méthode garantit une connexion sécurisée !
                    </div>
                `;
                
                document.body.appendChild(guide);

                // Fonctions pour les boutons
                window.copyUrlToClipboard = () => {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        this.showSuccess('✅ URL copiée ! Collez dans MetaMask');
                    }).catch(() => {
                        // Fallback pour les navigateurs qui ne supportent pas clipboard API
                        prompt('Copiez cette URL dans MetaMask:', window.location.href);
                    });
                };

                window.openMetaMaskDownload = () => {
                    window.open('https://metamask.io/download/', '_blank');
                };

                window.closeGuide = () => {
                    guide.remove();
                };
            }
        }, 1000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'mobile-success';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    // Méthode simplifiée pour connexion
    static async connectMobileWallet() {
        if (!window.ethereum) {
            alert('❌ MetaMask non détecté.\n\nVeuillez utiliser le navigateur intégré de MetaMask:\n1. Ouvrez MetaMask\n2. Menu → Navigateur\n3. Tapez cette URL\n4. Cliquez CONNECT WALLET');
            return null;
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts && accounts.length > 0) {
                return accounts[0];
            }
            
            return null;
        } catch (error) {
            console.error('Erreur connexion:', error);
            return null;
        }
    }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.mobileWalletHelper = new MobileWalletHelper();
});

// Export for use in other scripts
window.MobileWalletHelper = MobileWalletHelper;
