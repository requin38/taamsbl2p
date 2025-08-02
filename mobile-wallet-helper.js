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
                universalLink: 'metamask://dapp/',
                downloadUrl: 'https://metamask.io/download/'
            },
            trustwallet: {
                name: 'Trust Wallet',
                deepLink: 'https://link.trustwallet.com/open_url?coin_id=60&url=',
                universalLink: 'trust://open_url?coin_id=60&url=',
                downloadUrl: 'https://trustwallet.com/download'
            },
            coinbase: {
                name: 'Coinbase Wallet',
                deepLink: 'https://go.cb-w.com/dapp?cb_url=',
                universalLink: 'cbwallet://dapp?cb_url=',
                downloadUrl: 'https://www.coinbase.com/wallet'
            }
        };
        this.init();
    }

    detectMobile() {
        // Détection mobile simplifiée
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.ethereum?.isMetaMask;  // Considérer comme mobile si dans MetaMask
    }

    init() {
        // Mode simplifié - toujours actif si wallet détecté
        if (this.isMobile || window.ethereum) {
            this.addMobileStyles();
            this.addSimpleNotification();
            this.forceWalletDetection();
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

            .debug-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                border: none;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                font-size: 20px;
                cursor: pointer;
                z-index: 10000;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(255, 0, 0, 0.4);
            }

            .debug-panel {
                position: fixed;
                bottom: 90px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                max-width: 300px;
                border: 1px solid #ff0000;
                font-size: 12px;
                line-height: 1.4;
            }
        `;
        document.head.appendChild(style);
    }

    addDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.className = 'debug-button';
        debugBtn.innerHTML = '🐛';
        debugBtn.title = 'Debug Mobile Wallet';
        
        let debugPanel = null;
        
        debugBtn.onclick = () => {
            if (debugPanel) {
                debugPanel.remove();
                debugPanel = null;
                return;
            }
            
            const wallets = this.detectInstalledWallets();
            
            debugPanel = document.createElement('div');
            debugPanel.className = 'debug-panel';
            debugPanel.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: #ff0000;">🐛 DEBUG INFO</h4>
                <div><strong>Mobile:</strong> ${this.isMobile}</div>
                <div><strong>User Agent:</strong> ${navigator.userAgent.substring(0, 50)}...</div>
                <div><strong>window.ethereum:</strong> ${!!window.ethereum}</div>
                <div><strong>Wallets détectés:</strong> ${wallets.join(', ') || 'Aucun'}</div>
                <div><strong>URL actuelle:</strong> ${window.location.href}</div>
                <br>
                <button onclick="testDeepLinks()" style="width: 100%; padding: 5px; background: #ff0000; color: white; border: none; border-radius: 3px;">
                    🔗 Tester Deep Links
                </button>
                <button onclick="this.parentElement.remove()" style="width: 100%; margin-top: 5px; padding: 5px; background: #333; color: white; border: none; border-radius: 3px;">
                    Fermer
                </button>
            `;
            
            document.body.appendChild(debugPanel);
            
            window.testDeepLinks = () => {
                const currentUrl = window.location.href;
                Object.keys(this.supportedWallets).forEach((key, index) => {
                    setTimeout(() => {
                        console.log(`🧪 Test ${key}...`);
                        this.openWalletApp(key, currentUrl);
                    }, index * 2000);
                });
            };
        };
        
        document.body.appendChild(debugBtn);
    }

    addSimpleNotification() {
        // Notification simple seulement si wallet détecté
        if (window.ethereum) {
            const notice = document.createElement('div');
            notice.className = 'mobile-wallet-notice';
            notice.innerHTML = `
                <button class="close-button" onclick="this.parentElement.classList.add('hidden')">&times;</button>
                ✅ Wallet détecté - Prêt pour l'airdrop !<br>
                <small>Cliquez sur "CONNECT WALLET" puis "S'enregistrer"</small>
            `;
            notice.style.background = 'rgba(0, 255, 136, 0.95)';
            notice.style.color = 'black';
            document.body.appendChild(notice);

            // Auto-hide after 4 seconds
            setTimeout(() => {
                if (!notice.classList.contains('hidden')) {
                    notice.classList.add('hidden');
                }
            }, 4000);
        } else {
            // Pas de wallet - afficher guide simple
            const notice = document.createElement('div');
            notice.className = 'mobile-wallet-notice';
            notice.innerHTML = `
                <button class="close-button" onclick="this.parentElement.classList.add('hidden')">&times;</button>
                📱 Utilisez le navigateur de votre app wallet<br>
                <small>MetaMask → Menu → Navigateur → Tapez l'URL</small>
            `;
            document.body.appendChild(notice);
        }
    }

    forceWalletDetection() {
        // Force la détection immédiate
        if (window.ethereum) {
            console.log('✅ Wallet DÉTECTÉ dans le navigateur wallet');
            
            // Créer l'événement wallet connecté pour le site
            window.dispatchEvent(new CustomEvent('walletDetected', {
                detail: { 
                    provider: window.ethereum,
                    isMetaMask: window.ethereum.isMetaMask,
                    isMobile: this.isMobile
                }
            }));

            // Améliorer la connexion pour les transactions
            this.enhanceTransactionFlow();
            
            return true;
        } else {
            // Attendre un peu plus sur mobile
            let attempts = 0;
            const checkWallet = () => {
                attempts++;
                if (window.ethereum) {
                    console.log('✅ Wallet détecté après attente');
                    this.forceWalletDetection();
                    return;
                }
                
                if (attempts < 5) {
                    setTimeout(checkWallet, 1000);
                } else {
                    console.log('❌ Aucun wallet - affichage guide');
                    this.showSimpleGuide();
                }
            };
            
            setTimeout(checkWallet, 500);
            return false;
        }
    }

    enhanceTransactionFlow() {
        // Optimiser pour les transactions (airdrop)
        if (window.ethereum) {
            // Réduire les timeouts pour des transactions plus rapides
            window.ethereum.timeout = 30000;
            
            // Assurer la network Polygon
            this.ensurePolygonNetwork();
            
            console.log('🔧 Flow transactionnel optimisé pour l\'airdrop');
        }
    }

    async ensurePolygonNetwork() {
        try {
            // Vérifier si on est sur Polygon
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            if (chainId !== '0x89') {
                console.log('🔄 Changement vers Polygon...');
                
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x89' }],
                    });
                } catch (switchError) {
                    // Ajouter Polygon si pas encore ajouté
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
            }
            
            console.log('✅ Réseau Polygon configuré');
        } catch (error) {
            console.log('⚠️ Erreur réseau:', error);
        }
    }

    showSimpleGuide() {
        const guide = document.createElement('div');
        guide.className = 'mobile-wallet-options';
        guide.innerHTML = `
            <button class="close-button" onclick="this.parentElement.remove()">&times;</button>
            <h3 style="color: white; margin-bottom: 15px; font-size: 18px;">🦊 Comment se connecter</h3>
            
            <div style="background: rgba(255, 102, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="color: #ff6600; font-weight: bold; margin-bottom: 10px;">📱 Méthode SIMPLE :</p>
                <ol style="color: white; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                    <li><strong>Ouvrez votre app MetaMask</strong></li>
                    <li>Appuyez sur <strong>"Navigateur"</strong> (en bas)</li>
                    <li>Tapez : <code style="background: #333; padding: 3px 6px; border-radius: 3px; font-size: 12px;">${window.location.href}</code></li>
                    <li>Cliquez <strong>"CONNECT WALLET"</strong></li>
                    <li>Cliquez <strong>"S'enregistrer pour l'airdrop"</strong></li>
                </ol>
            </div>
            
            <button onclick="copyUrl()" class="wallet-button" style="background: #00ff88; color: black; font-size: 16px;">
                📋 Copier l'URL du site
            </button>
            
            <button onclick="downloadMetaMask()" class="wallet-button" style="background: #f6851b; border-color: #f6851b;">
                📥 Télécharger MetaMask
            </button>
            
            <div style="margin-top: 15px; font-size: 13px; color: #00ff88; text-align: center; font-weight: bold;">
                ⚡ Cette méthode fonctionne à 100% pour l'airdrop !
            </div>
        `;
        
        document.body.appendChild(guide);

        window.copyUrl = () => {
            navigator.clipboard.writeText(window.location.href);
            this.showSuccessMessage('✅ URL copiée ! Collez dans MetaMask');
        };

        window.downloadMetaMask = () => {
            window.open('https://metamask.io/download/', '_blank');
        };
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
                🦊 Ouvrir MetaMask App
            </button>
            
            <button onclick="openTrustWallet()" class="wallet-button" style="background: #3375bb; border-color: #3375bb;">
                🛡️ Ouvrir Trust Wallet App
            </button>
            
            <button onclick="openCoinbaseWallet()" class="wallet-button" style="background: #0052ff; border-color: #0052ff;">
                🔵 Ouvrir Coinbase Wallet App
            </button>
            
            <button onclick="tryManualConnect()" class="wallet-button" style="background: #00ff88; color: black;">
                🔗 Connexion Manuelle (si apps installées)
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
        window.tryManualConnect = () => this.tryManualConnection();
    }

    openWalletApp(walletType, url) {
        const wallet = this.supportedWallets[walletType];
        if (!wallet) return;

        // Nettoyer l'URL et s'assurer qu'elle est complète
        const cleanUrl = url.startsWith('http') ? url : 'https://' + url.replace(/^\/+/, '');
        
        console.log(`🔗 Tentative ouverture ${wallet.name} avec URL:`, cleanUrl);

        // Méthode améliorée avec fallbacks multiples
        const tryOpenWallet = () => {
            // Essai 1: Deep link universel (protocole custom)
            if (wallet.universalLink) {
                const universalLink = wallet.universalLink + encodeURIComponent(cleanUrl);
                console.log('🚀 Essai Universal Link:', universalLink);
                
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = universalLink;
                document.body.appendChild(iframe);
                
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }

            // Essai 2: Deep link HTTPS (après délai)
            setTimeout(() => {
                const httpsLink = wallet.deepLink + encodeURIComponent(cleanUrl);
                console.log('🌐 Essai HTTPS Link:', httpsLink);
                
                window.open(httpsLink, '_blank');
            }, 500);

            // Essai 3: Redirection directe pour certains wallets
            setTimeout(() => {
                if (walletType === 'metamask') {
                    // Lien MetaMask alternatif
                    const metamaskAlt = `https://metamask.app.link/dapp/${cleanUrl.replace(/^https?:\/\//, '')}`;
                    console.log('🦊 Essai MetaMask alternatif:', metamaskAlt);
                    window.open(metamaskAlt, '_blank');
                }
            }, 1000);
        };

        tryOpenWallet();
        
        // Afficher un message de confirmation
        this.showSuccessMessage(`Ouverture de ${wallet.name}...`);
        
        // Fallback : si l'app ne s'ouvre pas, proposer le téléchargement
        setTimeout(() => {
            const shouldDownload = confirm(
                `${wallet.name} ne s'est pas ouvert automatiquement.\n\n` +
                `💡 Astuce: Si l'app est installée, essayez de:\n` +
                `1. Ouvrir manuellement ${wallet.name}\n` +
                `2. Aller dans le navigateur intégré\n` +
                `3. Taper: ${cleanUrl}\n\n` +
                `Voulez-vous télécharger l'application ?`
            );
            
            if (shouldDownload) {
                window.open(wallet.downloadUrl, '_blank');
            }
        }, 3000);
    }

    downloadWalletApp() {
        const metamask = this.supportedWallets.metamask;
        window.open(metamask.downloadUrl, '_blank');
        this.showSuccessMessage('Redirection vers le téléchargement MetaMask...');
    }

    tryManualConnection() {
        // Essayer de se connecter directement si un wallet est déjà injecté
        if (window.ethereum) {
            console.log('🔗 Tentative connexion manuelle avec wallet détecté');
            
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then(accounts => {
                    if (accounts && accounts.length > 0) {
                        this.showSuccessMessage('✅ Connexion réussie !');
                        // Fermer les options
                        document.querySelectorAll('.mobile-wallet-options').forEach(el => el.remove());
                        
                        // Déclencher l'événement de connexion pour le terminal
                        if (window.connectWallet) {
                            window.connectWallet();
                        }
                    }
                })
                .catch(error => {
                    console.error('Erreur connexion manuelle:', error);
                    this.showSuccessMessage('❌ Échec de la connexion. Utilisez le navigateur intégré de votre wallet.');
                });
        } else {
            // Instructions pour connexion manuelle
            const instructions = `
📱 CONNEXION MANUELLE :

1. Ouvrez votre app wallet (MetaMask, Trust, etc.)
2. Trouvez le "Navigateur" ou "Browser" dans l'app
3. Tapez cette URL : ${window.location.href}
4. Cliquez sur "CONNECT WALLET"

💡 Cette méthode fonctionne à 100% !
            `;
            
            alert(instructions);
        }
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

    // Méthode de connexion SIMPLIFIÉE pour mobile
    static async connectMobileWallet() {
        console.log('🔗 Connexion wallet simplifiée...');
        
        // Attendre un peu si nécessaire
        if (!window.ethereum) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!window.ethereum) {
            console.log('❌ Pas de wallet détecté');
            const helper = new MobileWalletHelper();
            helper.showSimpleGuide();
            return null;
        }

        try {
            console.log('✅ Wallet trouvé - demande de connexion...');
            
            // Demande de connexion simple
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts && accounts.length > 0) {
                console.log('🎉 Connexion réussie:', accounts[0]);
                
                // Assurer Polygon network
                const helper = new MobileWalletHelper();
                await helper.ensurePolygonNetwork();
                
                return accounts[0];
            } else {
                console.log('❌ Aucun compte retourné');
                return null;
            }
                
        } catch (error) {
            console.error('❌ Erreur connexion wallet:', error);
            
            if (error.code === 4001) {
                alert('❌ Connexion refusée. Veuillez accepter la connexion dans votre wallet.');
            } else {
                alert('❌ Erreur de connexion. Essayez de rafraîchir la page.');
            }
            
            return null;
        }
    }

    // Auto-connect ULTRA-SIMPLIFIÉ
    static async autoConnectWallet() {
        console.log('� Auto-connect simplifié...');
        
        // Vérification immédiate
        if (window.ethereum) {
            console.log('✅ Wallet détecté immédiatement');
            return await MobileWalletHelper.connectMobileWallet();
        }
        
        // Attendre max 2 secondes pour mobile
        let attempts = 0;
        while (attempts < 4 && !window.ethereum) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
            console.log(`⏳ Tentative ${attempts}/4...`);
        }
        
        if (window.ethereum) {
            console.log('✅ Wallet détecté après attente');
            return await MobileWalletHelper.connectMobileWallet();
        } else {
            console.log('❌ Aucun wallet - affichage guide');
            const helper = new MobileWalletHelper();
            helper.showSimpleGuide();
            return null;
        }
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

    // Méthode spéciale pour les transactions d'airdrop
    static async executeAirdropTransaction(contractAddress, abi, methodName, params = []) {
        console.log('💰 Préparation transaction airdrop...');
        
        if (!window.ethereum) {
            alert('❌ Wallet non détecté. Utilisez le navigateur de votre app wallet.');
            return null;
        }

        try {
            // S'assurer qu'on est connecté
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (!accounts || accounts.length === 0) {
                console.log('🔗 Connexion requise...');
                const connected = await MobileWalletHelper.connectMobileWallet();
                if (!connected) return null;
            }

            // Préparer la transaction
            const account = accounts[0] || (await window.ethereum.request({ method: 'eth_accounts' }))[0];
            
            console.log('📝 Envoi transaction depuis:', account);
            console.log('📄 Contrat:', contractAddress);
            console.log('⚙️ Méthode:', methodName);

            // Transaction optimisée pour mobile
            const txParams = {
                from: account,
                to: contractAddress,
                data: '0x', // Sera encodée par le site principal
                gas: '0x1C9C380', // Gas élevé pour éviter les échecs
                gasPrice: '0x2540BE400' // Prix gas adapté
            };

            console.log('📡 Envoi transaction...');
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txParams]
            });

            console.log('✅ Transaction envoyée:', txHash);
            alert('✅ Transaction envoyée ! Hash: ' + txHash.substring(0, 10) + '...');
            return txHash;

        } catch (error) {
            console.error('❌ Erreur transaction:', error);
            
            if (error.code === 4001) {
                alert('❌ Transaction annulée par l\'utilisateur.');
            } else if (error.code === -32603) {
                alert('❌ Erreur de réseau. Vérifiez que vous êtes sur Polygon.');
            } else {
                alert('❌ Erreur transaction: ' + (error.message || 'Inconnue'));
            }
            
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
