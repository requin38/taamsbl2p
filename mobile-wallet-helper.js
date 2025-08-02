/**
 * Mobile Wallet Connection Helper for TAAMS Protocol
 * Améliore la compatibilité avec les wallets mobiles
 */

class MobileWalletHelper {
    constructor() {
        this.isMobile = this.detectMobile();
        this.supportedWallets = {
            metamask: {
                name: 'MetaMask',
                deepLink: 'https://metamask.app.link/dapp/',
                downloadUrl: 'https://metamask.io/download/'
            },
            trustwallet: {
                name: 'Trust Wallet',
                deepLink: 'https://link.trustwallet.com/open_url?coin_id=60&url=',
                downloadUrl: 'https://trustwallet.com/download'
            },
            coinbase: {
                name: 'Coinbase Wallet',
                deepLink: 'https://go.cb-w.com/dapp?cb_url=',
                downloadUrl: 'https://www.coinbase.com/wallet'
            }
        };
        this.init();
    }

    detectMobile() {
        // Pour les tests, on peut forcer l'affichage
        // return true; // Décommentez cette ligne pour forcer le mode mobile sur desktop
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
        if (this.isMobile) {
            this.addMobileStyles();
            this.addMobileNotification();
            this.enhanceWalletConnection();
        }
    }

    addMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-wallet-notice {
                position: fixed;
                top: 70px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 102, 0, 0.95);
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 102, 0, 0.5);
                max-width: 90vw;
                text-align: center;
                animation: slideDown 0.5s ease-out;
            }

            .mobile-wallet-notice.hidden {
                animation: slideUp 0.5s ease-out forwards;
            }

            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }

            @keyframes slideUp {
                from { transform: translateX(-50%) translateY(0); opacity: 1; }
                to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            }

            .mobile-wallet-options {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 255, 136, 0.95);
                padding: 15px;
                border-radius: 12px;
                z-index: 10000;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(0, 255, 136, 0.5);
                max-width: 90vw;
            }

            .wallet-button {
                display: block;
                width: 100%;
                padding: 12px;
                margin: 5px 0;
                background: rgba(0, 0, 0, 0.7);
                color: #00ff88;
                border: 1px solid #00ff88;
                border-radius: 8px;
                text-decoration: none;
                text-align: center;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .wallet-button:hover {
                background: rgba(0, 255, 136, 0.2);
                transform: scale(1.02);
            }

            .close-button {
                position: absolute;
                top: 5px;
                right: 10px;
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    addMobileNotification() {
        const notice = document.createElement('div');
        notice.className = 'mobile-wallet-notice';
        notice.innerHTML = `
            <button class="close-button" onclick="this.parentElement.classList.add('hidden')">&times;</button>
            📱 Appareil mobile détecté<br>
            <small>Utilisez le navigateur intégré de votre wallet pour une meilleure connexion</small>
        `;
        document.body.appendChild(notice);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (!notice.classList.contains('hidden')) {
                notice.classList.add('hidden');
            }
        }, 5000);
    }

    enhanceWalletConnection() {
        // Override window.ethereum detection for mobile
        this.improveEthereumDetection();
        
        // Add mobile-specific wallet connection methods
        this.addMobileWalletOptions();
    }

    improveEthereumDetection() {
        // Wait for wallet injection on mobile (can take longer)
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkEthereum = () => {
            attempts++;
            
            if (window.ethereum) {
                console.log('✅ Wallet detected on mobile');
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(checkEthereum, 500);
            } else {
                console.log('⚠️ No wallet detected - showing mobile options');
                this.showMobileWalletOptions();
            }
        };

        // Start checking after a short delay
        setTimeout(checkEthereum, 1000);
    }

    showMobileWalletOptions() {
        const currentUrl = window.location.href;
        
        const walletOptions = document.createElement('div');
        walletOptions.className = 'mobile-wallet-options';
        walletOptions.innerHTML = `
            <button class="close-button" onclick="this.parentElement.remove()">&times;</button>
            <h3 style="color: white; margin-bottom: 15px; font-size: 18px;">🔗 Choisissez votre Wallet</h3>
            <p style="color: #ccc; font-size: 14px; margin-bottom: 15px;">Cliquez sur un bouton pour ouvrir directement l'app</p>
            
            <button onclick="openMetaMask()" class="wallet-button" style="background: #f6851b; border-color: #f6851b;">
                🦊 Ouvrir MetaMask
            </button>
            
            <button onclick="openTrustWallet()" class="wallet-button" style="background: #3375bb; border-color: #3375bb;">
                🛡️ Ouvrir Trust Wallet
            </button>
            
            <button onclick="openCoinbaseWallet()" class="wallet-button" style="background: #0052ff; border-color: #0052ff;">
                🔵 Ouvrir Coinbase Wallet
            </button>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
                <p style="color: #ccc; font-size: 12px; margin-bottom: 10px;">Pas de wallet installé ?</p>
                <button onclick="downloadWallet()" class="wallet-button" style="background: #00ff88; color: black;">
                    📥 Télécharger MetaMask
                </button>
            </div>
            
            <div style="margin-top: 10px; font-size: 12px; color: #888;">
                💡 <strong>Astuce :</strong> Une fois dans l'app wallet, naviguez vers notre site dans leur navigateur intégré
            </div>
        `;
        
        document.body.appendChild(walletOptions);

        // Ajouter les fonctions globales pour les boutons
        window.openMetaMask = () => this.openWalletApp('metamask', currentUrl);
        window.openTrustWallet = () => this.openWalletApp('trustwallet', currentUrl);
        window.openCoinbaseWallet = () => this.openWalletApp('coinbase', currentUrl);
        window.downloadWallet = () => this.downloadWalletApp();
    }

    openWalletApp(walletType, url) {
        const wallet = this.supportedWallets[walletType];
        if (!wallet) return;

        // Essayer d'ouvrir l'app directement
        const deepLink = wallet.deepLink + encodeURIComponent(url);
        
        // Créer un lien invisible et le cliquer
        const link = document.createElement('a');
        link.href = deepLink;
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Afficher un message de confirmation
        this.showSuccessMessage(`Ouverture de ${wallet.name}...`);
        
        // Fallback : si l'app ne s'ouvre pas, proposer le téléchargement
        setTimeout(() => {
            if (confirm(`${wallet.name} ne s'est pas ouvert automatiquement.\n\nVoulez-vous télécharger l'application ?`)) {
                window.open(wallet.downloadUrl, '_blank');
            }
        }, 3000);
    }

    downloadWalletApp() {
        const metamask = this.supportedWallets.metamask;
        window.open(metamask.downloadUrl, '_blank');
        this.showSuccessMessage('Redirection vers le téléchargement MetaMask...');
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 136, 0.95);
            color: black;
            padding: 20px;
            border-radius: 12px;
            font-weight: bold;
            z-index: 10001;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.5);
            text-align: center;
            max-width: 300px;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 2000);
    }

    // Method to manually trigger wallet connection for mobile
    static async connectMobileWallet() {
        const helper = new MobileWalletHelper();
        
        if (!window.ethereum && helper.isMobile) {
            helper.showMobileWalletOptions();
            return null;
        }

        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                // Ensure we're on Polygon network
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x89' }], // Polygon Mainnet
                    });
                } catch (switchError) {
                    // Network not added, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x89',
                                chainName: 'Polygon Mainnet',
                                nativeCurrency: {
                                    name: 'MATIC',
                                    symbol: 'MATIC',
                                    decimals: 18
                                },
                                rpcUrls: ['https://polygon-rpc.com/'],
                                blockExplorerUrls: ['https://polygonscan.com/']
                            }]
                        });
                    }
                }
                
                return accounts[0];
            }
        } catch (error) {
            console.error('Mobile wallet connection error:', error);
            return null;
        }
    }

    // Nouvelle méthode : Auto-connect magique
    static async autoConnectWallet() {
        const helper = new MobileWalletHelper();
        
        console.log('🔍 Démarrage auto-connect...');
        console.log('📱 Mobile détecté:', helper.isMobile);
        console.log('🔗 window.ethereum existe:', !!window.ethereum);
        
        if (window.ethereum) {
            console.log('✅ Ethereum provider trouvé');
            console.log('🔍 Détails provider:', {
                isMetaMask: window.ethereum.isMetaMask,
                isTrust: window.ethereum.isTrust,
                isCoinbaseWallet: window.ethereum.isCoinbaseWallet,
                providers: window.ethereum.providers?.length || 0
            });
        }
        
        // Essayer de détecter les wallets installés
        const wallets = helper.detectInstalledWallets();
        console.log('💰 Wallets trouvés:', wallets);
        
        if (wallets.length === 0 && helper.isMobile) {
            console.log('❌ Aucun wallet détecté - affichage guide');
            helper.showSmartWalletGuide();
            return null;
        }
        
        if (wallets.length >= 1) {
            console.log('✅ Wallet(s) détecté(s) - tentative connexion directe');
            // Essayer la connexion directe
            try {
                const result = await MobileWalletHelper.connectMobileWallet();
                if (result) {
                    console.log('🎉 Connexion réussie:', result);
                    return result;
                } else {
                    console.log('⚠️ Connexion échouée - affichage options');
                    helper.showInstalledWalletsOnly(wallets);
                    return null;
                }
            } catch (error) {
                console.log('❌ Erreur connexion:', error);
                helper.showInstalledWalletsOnly(wallets);
                return null;
            }
        }
        
        // Fallback standard
        console.log('🔄 Fallback connexion standard');
        return await MobileWalletHelper.connectMobileWallet();
    }

    showInstalledWalletsOnly(wallets) {
        console.log('📋 Affichage options pour wallets:', wallets);
        
        const options = document.createElement('div');
        options.className = 'mobile-wallet-options';
        options.innerHTML = `
            <button class="close-button" onclick="this.parentElement.remove()">&times;</button>
            <h3 style="color: white; margin-bottom: 15px; font-size: 18px;">💰 Wallets Détectés</h3>
            <p style="color: #00ff88; font-size: 14px; margin-bottom: 15px;">Cliquez pour vous connecter :</p>
            
            ${wallets.includes('metamask') || wallets.includes('unknown') ? `
                <button onclick="connectDirectWallet()" class="wallet-button" style="background: #f6851b; border-color: #f6851b;">
                    🦊 Se connecter maintenant
                </button>
            ` : ''}
            
            ${wallets.includes('trustwallet') ? `
                <button onclick="connectDirectWallet()" class="wallet-button" style="background: #3375bb; border-color: #3375bb;">
                    🛡️ Connecter Trust Wallet
                </button>
            ` : ''}
            
            ${wallets.includes('coinbase') ? `
                <button onclick="connectDirectWallet()" class="wallet-button" style="background: #0052ff; border-color: #0052ff;">
                    🔵 Connecter Coinbase Wallet
                </button>
            ` : ''}
            
            <div style="margin-top: 15px; font-size: 12px; color: #888; text-align: center;">
                🔄 Si ça ne marche pas, essayez de rafraîchir la page
            </div>
        `;
        
        document.body.appendChild(options);

        // Fonction de connexion directe
        window.connectDirectWallet = async () => {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts && accounts.length > 0) {
                    options.remove();
                    helper.showSuccessMessage('Connexion réussie ! 🎉');
                    
                    // Déclencher l'événement de connexion pour le terminal
                    if (window.connectWallet) {
                        window.connectWallet();
                    }
                }
            } catch (error) {
                console.error('Erreur connexion directe:', error);
                helper.showSuccessMessage('Erreur de connexion. Réessayez...');
            }
        };
    }

    detectInstalledWallets() {
        const installed = [];
        
        if (window.ethereum) {
            // Vérification plus robuste des wallets
            if (window.ethereum.isMetaMask || 
                (window.ethereum.providers && window.ethereum.providers.some(p => p.isMetaMask))) {
                installed.push('metamask');
            }
            
            if (window.ethereum.isTrust || 
                (window.ethereum.providers && window.ethereum.providers.some(p => p.isTrust))) {
                installed.push('trustwallet');
            }
            
            if (window.ethereum.isCoinbaseWallet || 
                (window.ethereum.providers && window.ethereum.providers.some(p => p.isCoinbaseWallet))) {
                installed.push('coinbase');
            }
            
            // Si window.ethereum existe mais aucun wallet spécifique détecté, 
            // on assume qu'il y a au moins un wallet
            if (installed.length === 0) {
                installed.push('unknown');
            }
        }
        
        console.log('Wallets détectés:', installed);
        return installed;
    }

    showSmartWalletGuide() {
        const guide = document.createElement('div');
        guide.className = 'mobile-wallet-options';
        guide.innerHTML = `
            <button class="close-button" onclick="this.parentElement.remove()">&times;</button>
            <h3 style="color: white; margin-bottom: 15px; font-size: 18px;">🚀 Configuration Rapide</h3>
            
            <div style="background: rgba(0,255,136,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="color: #00ff88; font-weight: bold; margin-bottom: 10px;">📱 Étapes simples :</p>
                <ol style="color: white; font-size: 14px; line-height: 1.6; padding-left: 20px;">
                    <li>Téléchargez une app wallet (recommandé: MetaMask)</li>
                    <li>Créez votre compte dans l'app</li>
                    <li>Ouvrez notre site DANS l'app wallet</li>
                    <li>Connectez-vous directement !</li>
                </ol>
            </div>
            
            <button onclick="quickSetupMetaMask()" class="wallet-button" style="background: #f6851b; border-color: #f6851b; font-size: 16px;">
                🦊 Configuration MetaMask (Recommandé)
            </button>
            
            <button onclick="quickSetupTrust()" class="wallet-button" style="background: #3375bb; border-color: #3375bb;">
                🛡️ Configuration Trust Wallet
            </button>
            
            <div style="margin-top: 15px; font-size: 12px; color: #888; text-align: center;">
                💡 <strong>Après installation :</strong> Ouvrez l'app → Menu → Navigateur → Tapez notre URL
            </div>
        `;
        
        document.body.appendChild(guide);

        window.quickSetupMetaMask = () => {
            window.open('https://metamask.io/download/', '_blank');
            this.showSetupInstructions('MetaMask');
        };

        window.quickSetupTrust = () => {
            window.open('https://trustwallet.com/download', '_blank');
            this.showSetupInstructions('Trust Wallet');
        };
    }

    showSetupInstructions(walletName) {
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 25px;
            border-radius: 15px;
            z-index: 10002;
            max-width: 350px;
            border: 2px solid #00ff88;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
        `;
        
        instructions.innerHTML = `
            <h3 style="color: #00ff88; margin-bottom: 15px; text-align: center;">📱 Instructions ${walletName}</h3>
            <div style="font-size: 14px; line-height: 1.6;">
                <p><strong>1.</strong> Installer ${walletName} depuis le store</p>
                <p><strong>2.</strong> Créer/Importer votre wallet</p>
                <p><strong>3.</strong> Dans l'app ${walletName} :</p>
                <ul style="margin-left: 20px; margin-top: 5px;">
                    <li>Chercher "Navigateur" ou "Browser"</li>
                    <li>Taper : <code style="background: #333; padding: 2px 4px; border-radius: 3px;">${window.location.href}</code></li>
                    <li>Cliquer "CONNECT WALLET"</li>
                </ul>
            </div>
            <button onclick="this.parentElement.remove()" style="width: 100%; margin-top: 15px; padding: 10px; background: #00ff88; color: black; border: none; border-radius: 5px; font-weight: bold;">
                Compris ! 👍
            </button>
        `;
        
        document.body.appendChild(instructions);
    }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.mobileWalletHelper = new MobileWalletHelper();
});

// Export for use in other scripts
window.MobileWalletHelper = MobileWalletHelper;
