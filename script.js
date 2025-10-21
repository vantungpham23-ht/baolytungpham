// ===== Auto Clear Cache =====
(function clearCacheOnLoad() {
    // Clear various types of cache
    if ('caches' in window) {
        caches.keys().then(function(names) {
            names.forEach(function(name) {
                caches.delete(name);
            });
        });
    }
    
    // Clear localStorage if needed (optional - uncomment if you want to clear user data)
    // localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Force reload images and resources with cache busting
    var images = document.querySelectorAll('img');
    images.forEach(function(img) {
        if (img.src && !img.src.includes('?')) {
            img.src += '?v=' + Date.now();
        }
    });
    
    console.log('Cache cleared on page load');
})();

document.addEventListener('DOMContentLoaded', function () {
    // Password validation
    const validPasswords = ['220302082206'];
    const passwordScreen = document.getElementById('password-screen');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordError = document.getElementById('password-error');
    const loader = document.querySelector('.loader');

    function hidePasswordScreen() {
        passwordScreen.classList.add('hidden');
        // Start the loading sequence after password screen is hidden
        setTimeout(function() {
            startLoadingSequence();
        }, 500);
    }

    function showPasswordError() {
        passwordError.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        passwordInput.style.borderColor = '#ff6b6b';
        setTimeout(function() {
            passwordInput.style.borderColor = 'rgba(232, 160, 191, 0.3)';
        }, 2000);
    }

    function validatePassword() {
        const enteredPassword = passwordInput.value.trim();
        
        if (validPasswords.includes(enteredPassword)) {
            // Only prepare audio context, DO NOT play music yet
            try {
                if (typeof ensureAudio === 'function') {
                    ensureAudio().then(function(){
                        if (typeof updateTrackDisplay === 'function') {
                            // Ensure we start with music.mp3
                            if (Array.isArray(trackList) && trackList.length > 0) {
                                currentTrackIndex = trackList.indexOf('music.mp3');
                                if (currentTrackIndex === -1) currentTrackIndex = 0;
                            }
                            updateTrackDisplay();
                        }
                        console.log('Audio context ready, music will play ONLY after loader completes');
                    });
                }
            } catch(_) {}
            hidePasswordScreen();
        } else {
            showPasswordError();
        }
    }

    // Event listeners for password
    passwordSubmit.addEventListener('click', validatePassword);
    
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            validatePassword();
        }
    });

    // Focus on input when page loads
    passwordInput.focus();

    // Start loading sequence function
    function startLoadingSequence() {
        var contentRoot = document.getElementById('content-root');
        var loader = document.querySelector('.loader');
        var bgMusic = document.getElementById('bg-music');
        var audioToggle = document.querySelector('.audio-toggle');
        var audioVolume = document.querySelector('.audio-volume');
        var steps = [
            document.querySelector('.loader .step-1'),
            document.querySelector('.loader .step-2'),
            document.querySelector('.loader .step-3'),
            document.querySelector('.loader .step-4')
        ];

        // Run 4 steps over ~10s total
        var totalMs = 10000; // total ~10s
        var perStep = Math.floor(totalMs / steps.length); // ~2500ms each
        // Pass step duration to CSS animation
        document.documentElement.style.setProperty('--step-duration', perStep + 'ms');
        var current = 0;

        function showStep(i) {
            steps.forEach(function (el, idx) {
                if (!el) return;
                if (idx === i) {
                    el.classList.add('active');
                    el.setAttribute('aria-hidden', 'false');
                } else {
                    el.classList.remove('active');
                    el.setAttribute('aria-hidden', 'true');
                }
            });
        }

        function finishLoading() {
            // First, hide loader and show content
            if (loader) loader.classList.add('fade-out');
            if (contentRoot) contentRoot.classList.remove('content-hidden');
            if (contentRoot) contentRoot.classList.add('content-visible');
            
            // Ensure we start at top and header/title is visible on first view
            try {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            } catch (_) {
                window.scrollTo(0, 0);
            }
            
            // Refresh AOS after reveal
            if (window.AOS && AOS.refreshHard) {
                AOS.refreshHard();
            } else if (window.AOS) {
                AOS.refresh();
            }
            
            // Only start music AFTER content is fully visible and loader is gone
            setTimeout(function() {
                console.log('Loader completed, content visible - now starting background music');
                
                // Resume audio context if suspended (from password validation)
                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume().then(function() {
                        console.log('Audio context resumed for music playback');
                        startMusicAfterLoading();
                    }).catch(function(e) {
                        console.warn('Failed to resume audio context:', e);
                        startMusicAfterLoading();
                    });
                } else {
                    startMusicAfterLoading();
                }
                
                function startMusicAfterLoading() {
                    // Double check that content is visible before playing music
                    if (contentRoot && contentRoot.classList.contains('content-visible')) {
                        var track = getCurrentTrackElement && getCurrentTrackElement();
                        if (track && !isPlaying) {
                            track.volume = 0.7; // Default volume
                            
                            // Enhanced autoplay handling for Safari and mobile
                            var playPromise = track.play();
                            
                            if (playPromise !== undefined) {
                                playPromise.then(function() {
                                    isPlaying = true;
                                    updatePlayButton();
                                    console.log('Background music started after loader completion');
                                }).catch(function(e) {
                                    console.warn('Auto-play blocked:', e);
                                    handleAutoplayBlocked();
                                });
                            } else {
                                // Fallback for older browsers
                                try {
                                    track.play();
                                    isPlaying = true;
                                    updatePlayButton();
                                    console.log('Background music started (fallback)');
                                } catch(e) {
                                    console.warn('Auto-play failed:', e);
                                    handleAutoplayBlocked();
                                }
                            }
                        }
                    } else {
                        console.log('Content not yet visible, skipping music start');
                    }
                }
                
                function handleAutoplayBlocked() {
                    // Detect Safari specifically
                    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                    var isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    
                    if (isSafari || isMobile) {
                        console.log('Showing audio prompt for Safari/Mobile');
                        showEnhancedAudioPrompt();
                    } else {
                        // For other browsers, show mobile prompt as fallback
                        showMobileAudioPrompt();
                    }
                }
            }, 800); // Wait a bit longer to ensure content is fully visible
        }

        if (loader && contentRoot) {
            // Ensure content hidden initially
            contentRoot.classList.add('content-hidden');
            showStep(0);
            var interval = setInterval(function () {
                current++;
                if (current < steps.length) {
                    showStep(current);
                } else {
                    clearInterval(interval);
                    finishLoading();
                }
            }, perStep);
        }
        
        // Initialize timeline items after loading
        initializeTimeline();
    }
    
    function initializeTimeline() {
        // Add staggered delay per item so they reveal gradually as you scroll
        var items = document.querySelectorAll('.timeline-item');
        // Hide all but the first
        items.forEach(function (it, idx) {
            if (idx !== 0) it.classList.add('hidden');
        });
        
        items.forEach(function (item, index) {
            // Keep existing animation type (fade-left/right) but add delay and anchor placement
            item.setAttribute('data-aos-delay', String(index * 120));
            item.setAttribute('data-aos-anchor-placement', 'top-bottom');

            // Wrap images into uniform frames and grid if multiple
            (function normalizeMedia(){
                var imgs = Array.prototype.slice.call(item.querySelectorAll('.timeline-content > img'));
                if (imgs.length === 1) {
                    var single = imgs[0];
                    if (!single.parentElement.classList.contains('media-frame')) {
                        var frame = document.createElement('div');
                        frame.className = 'media-frame';
                        single.parentNode.insertBefore(frame, single);
                        frame.appendChild(single);
                    }
                } else if (imgs.length > 1) {
                    var grid = document.createElement('div');
                    grid.className = 'media-grid';
                    imgs.forEach(function(im){
                        var frame = document.createElement('div');
                        frame.className = 'media-frame';
                        im.parentNode.insertBefore(frame, im);
                        frame.appendChild(im);
                        grid.appendChild(frame);
                    });
                    var content = item.querySelector('.timeline-content');
                    // Remove originals now wrapped (frames already inserted in DOM)
                    imgs.forEach(function(){});
                    // Ensure grid is placed after text (after .timeline-date or p)
                    content.appendChild(grid);
                }
            })();

            // If not already prepared, add letter overlay
            if (!item.classList.contains('prepared-letter')) {
                item.classList.add('prepared-letter', 'is-locked');
                var cover = document.createElement('div');
                cover.className = 'letter-cover';
                cover.innerHTML = '\n                    <div class="letter-paper">\n                        <div class="letter-title">Bạn có một bức thư 💌</div>\n                        <span class="letter-heart"></span>\n                        <div class="letter-description">Nhấn để mở và đọc kỷ niệm xinh xắn nhé!</div>\n                        <button type="button" class="open-btn">Mở thư</button>\n                    </div>\n                ';
                item.appendChild(cover);

                var button = cover.querySelector('.open-btn');
                if (button) {
                    button.addEventListener('click', function (e) {
                        e.stopPropagation();
                        // gentle chime when opening a letter
                        try {
                            if (typeof ensureAudio === 'function') {
                                if (!audioCtx) { ensureAudio().then(function(){ if (typeof playClickSound === 'function') playClickSound(330); }); }
                                else { if (typeof playClickSound === 'function') playClickSound(330); }
                            }
                        } catch(_){}
                        item.classList.remove('is-locked');
                        item.classList.add('is-open');

                        // After opening, scroll the timeline-content to center
                        setTimeout(function(){
                            var contentEl = item.querySelector('.timeline-content');
                            if (contentEl && typeof contentEl.scrollIntoView === 'function') {
                                contentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Make focusable briefly for accessibility then focus
                                var hadTabindex = contentEl.hasAttribute('tabindex');
                                if (!hadTabindex) contentEl.setAttribute('tabindex', '-1');
                                try { contentEl.focus({ preventScroll: true }); } catch(_) {}
                                // Clean up tabindex if we added it
                                setTimeout(function(){ if (!hadTabindex) contentEl.removeAttribute('tabindex'); }, 1000);
                            }
                        }, 120);

                        // Reveal next item progressively
                        var next = Array.prototype.indexOf.call(items, item) + 1;
                        if (items[next]) {
                            items[next].classList.remove('hidden');
                            // Recompute AOS when new item appears
                            if (window.AOS && AOS.refreshHard) {
                                AOS.refreshHard();
                            } else if (window.AOS) {
                                AOS.refresh();
                            }
                        } else {
                            // This is the last item, show footer and celebration
                            var footer = document.querySelector('.final-message');
                            if (footer) {
                                setTimeout(function() {
                                    footer.classList.add('show');
                                }, 500); // Small delay for better UX
                            }
                            
                            // Trigger celebration after footer appears
                            setTimeout(function() {
                                triggerCelebration();
                            }, 1000);
                        }
                    });
                }
            }
        });

        AOS.init({
            duration: 900,           // smoother, slightly longer animation
            easing: 'ease-out-cubic',
            offset: 120,             // trigger when the element is closer to viewport
            once: true,              // animate only once
            mirror: false,           // do not animate out when scrolling past
            anchorPlacement: 'top-bottom'
        });
    }

    // Celebration functions
    function triggerCelebration() {
        // Show fireworks
        var fireworks = document.getElementById('fireworks');
        if (fireworks) {
            fireworks.classList.add('active');
            
            // Hide fireworks after animation
            setTimeout(function() {
                fireworks.classList.remove('active');
            }, 3000);
        }
        
        // Show popup after fireworks start
        setTimeout(function() {
            showCelebrationPopup();
        }, 1500);
    }
    
    function showCelebrationPopup() {
        var popup = document.getElementById('celebration-popup');
        if (popup) {
            popup.classList.add('show');
            popup.setAttribute('aria-hidden', 'false');
        }
    }
    
    function hideCelebrationPopup() {
        var popup = document.getElementById('celebration-popup');
        if (popup) {
            popup.classList.remove('show');
            popup.setAttribute('aria-hidden', 'true');
        }
    }
    
    // Close popup event listeners
    // remove close button handler; close via overlay click only
    
    var popupOverlay = document.getElementById('celebration-popup');
    if (popupOverlay) {
        popupOverlay.addEventListener('click', function(e) {
            if (e.target === popupOverlay) {
                hideCelebrationPopup();
            }
        });
    }

    // Slider popup wiring
    var sliderPopup = document.getElementById('slider-popup');
    var openSliderBtns = document.querySelectorAll('.open-slider-btn');
    function spawnParticles(root) {
        var container = root.querySelector('.slider-particles');
        if (!container) return;
        var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var count = prefersReduced ? 8 : 20;
        var icons = ['💕','✨','🌸','💖','⭐','💞','🌟','💗'];
        for (var i = 0; i < count; i++) {
            var el = document.createElement('div');
            el.className = 'particle';
            var span = document.createElement('span');
            span.textContent = icons[Math.floor(Math.random() * icons.length)];
            el.style.left = Math.random() * 100 + '%';
            el.style.top = Math.random() * 100 + '%';
            el.style.setProperty('--x', (Math.random() * 20 - 10) + 'px');
            el.style.setProperty('--y', (Math.random() * 16 + 8) + 'px');
            el.style.animationDelay = (Math.random() * 0.8) + 's';
            el.appendChild(span);
            container.appendChild(el);
            // cleanup after animation
            (function(node){
                setTimeout(function(){ if (node.parentNode) node.parentNode.removeChild(node); }, 4200);
            })(el);
        }
    }

    if (openSliderBtns.length > 0 && sliderPopup) {
        openSliderBtns.forEach(function(btn) {
            btn.addEventListener('click', function(){
                sliderPopup.classList.add('show');
                sliderPopup.setAttribute('aria-hidden', 'false');
                // Title animation restarts by reflow
                var title = sliderPopup.querySelector('.slider-popup-title');
                if (title) { title.style.animation = 'none'; title.offsetHeight; title.style.animation = ''; }
                spawnParticles(sliderPopup);
                // gentle chime on open
                try {
                    if (!audioCtx) { ensureAudio().then(function(){ if (window.playChime) { playChime(); } else { /* will define later */ } }); }
                    else { if (window.playChime) { playChime(); } }
                } catch(_){}
                // refresh AOS if needed
                if (window.AOS && AOS.refreshHard) { AOS.refreshHard(); } else if (window.AOS) { AOS.refresh(); }
            });
        });
    }
    if (sliderPopup) {
        sliderPopup.addEventListener('click', function(e){
            if (e.target === sliderPopup) {
                sliderPopup.classList.remove('show');
                sliderPopup.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // Letter popup wiring
    var letterPopup = document.getElementById('celebration-popup');
    var openLetterBtn = document.querySelector('.open-letter-btn');
    if (openLetterBtn && letterPopup) {
        openLetterBtn.addEventListener('click', function(){
            letterPopup.classList.add('show');
            letterPopup.setAttribute('aria-hidden', 'false');
            // gentle chime on open
            try {
                if (!audioCtx) { ensureAudio().then(function(){ if (window.playChime) { playChime(); } }); }
                else { if (window.playChime) { playChime(); } }
            } catch(_){}
            // refresh AOS if needed
            if (window.AOS && AOS.refreshHard) { AOS.refreshHard(); } else if (window.AOS) { AOS.refresh(); }
        });
    }
    
    // ===== Enhanced Audio Prompt Functions =====
    function showEnhancedAudioPrompt() {
        // Create an enhanced audio prompt specifically for Safari and mobile
        var prompt = document.createElement('div');
        prompt.id = 'enhanced-audio-prompt';
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(15px);
            border-radius: 25px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.25);
            border: 3px solid rgba(232,160,191,0.4);
            z-index: 10004;
            max-width: 380px;
            width: 90%;
            animation: enhancedPromptSlideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        `;
        
        prompt.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 16px; animation: heartBeat 2s ease-in-out infinite;">🎵</div>
            <h3 style="font-family: var(--heading-font); color: #7a6071; margin-bottom: 16px; font-size: 1.4rem; font-weight: 600;">Bật nhạc nền</h3>
            <p style="color: #7a6071; font-size: 1rem; margin-bottom: 24px; line-height: 1.5;">Để có trải nghiệm tốt nhất, hãy bật nhạc nền bằng cách nhấn nút bên dưới</p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button id="enable-audio-enhanced" style="
                    background: linear-gradient(135deg, #E8A0BF, #BFA0E8);
                    color: white;
                    border: none;
                    border-radius: 30px;
                    padding: 14px 28px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(232,160,191,0.4);
                    transition: all 0.3s ease;
                    min-width: 140px;
                ">🎵 Bật nhạc</button>
                <button id="skip-audio-enhanced" style="
                    background: transparent;
                    color: #7a6071;
                    border: 2px solid rgba(122,96,113,0.3);
                    border-radius: 30px;
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 120px;
                ">Bỏ qua</button>
            </div>
            <p style="color: #999; font-size: 0.8rem; margin-top: 16px; line-height: 1.4;">Nhạc sẽ tự động phát sau khi bạn nhấn nút này</p>
        `;
        
        document.body.appendChild(prompt);
        
        // Add click handlers
        var enableBtn = document.getElementById('enable-audio-enhanced');
        var skipBtn = document.getElementById('skip-audio-enhanced');
        
        enableBtn.addEventListener('click', function() {
            enableAudioEnhanced();
        });
        
        skipBtn.addEventListener('click', function() {
            hideEnhancedAudioPrompt();
        });
        
        // Add touch handlers for better mobile support
        enableBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            enableAudioEnhanced();
        }, { passive: false });
        
        skipBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            hideEnhancedAudioPrompt();
        }, { passive: false });
        
        // Auto-hide after 20 seconds
        setTimeout(function() {
            if (document.getElementById('enhanced-audio-prompt')) {
                hideEnhancedAudioPrompt();
            }
        }, 20000);
    }
    
    function hideEnhancedAudioPrompt() {
        var prompt = document.getElementById('enhanced-audio-prompt');
        if (prompt) {
            prompt.style.opacity = '0';
            prompt.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(function() {
                if (prompt.parentNode) {
                    prompt.parentNode.removeChild(prompt);
                }
            }, 300);
        }
    }
    
    function enableAudioEnhanced() {
        hideEnhancedAudioPrompt();
        
        // Try to play music with enhanced user interaction handling
        var track = getCurrentTrackElement();
        if (track) {
            track.volume = 0.7;
            
            // Ensure audio context is resumed
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().then(function() {
                    console.log('Audio context resumed for enhanced playback');
                    playMusicWithRetry(track);
                }).catch(function(e) {
                    console.warn('Failed to resume audio context:', e);
                    playMusicWithRetry(track);
                });
            } else {
                playMusicWithRetry(track);
            }
        }
    }
    
    function playMusicWithRetry(track) {
        var playPromise = track.play();
        
        if (playPromise !== undefined) {
            playPromise.then(function() {
                isPlaying = true;
                updatePlayButton();
                console.log('Enhanced audio playback started successfully');
                
                // Show success message briefly
                showAudioSuccessMessage();
            }).catch(function(e) {
                console.warn('Enhanced playback failed:', e);
                showAudioErrorMessage();
            });
        } else {
            // Fallback for older browsers
            try {
                track.play();
                isPlaying = true;
                updatePlayButton();
                console.log('Enhanced audio playback started (fallback)');
                showAudioSuccessMessage();
            } catch(e) {
                console.warn('Enhanced playback failed (fallback):', e);
                showAudioErrorMessage();
            }
        }
    }
    
    function showAudioSuccessMessage() {
        var successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            z-index: 10005;
            box-shadow: 0 8px 20px rgba(76,175,80,0.3);
            animation: slideUpFade 0.3s ease-out;
        `;
        successMsg.textContent = '🎵 Nhạc đã được bật thành công!';
        document.body.appendChild(successMsg);
        
        setTimeout(function() {
            if (successMsg.parentNode) {
                successMsg.style.opacity = '0';
                successMsg.style.transform = 'translateX(-50%) translateY(-10px)';
                setTimeout(function() {
                    if (successMsg.parentNode) {
                        successMsg.parentNode.removeChild(successMsg);
                    }
                }, 300);
            }
        }, 3000);
    }
    
    function showAudioErrorMessage() {
        var errorMsg = document.createElement('div');
        errorMsg.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 107, 107, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            z-index: 10005;
            box-shadow: 0 8px 20px rgba(255,107,107,0.3);
            animation: slideUpFade 0.3s ease-out;
        `;
        errorMsg.textContent = '❌ Không thể phát nhạc. Vui lòng kiểm tra cài đặt âm thanh.';
        document.body.appendChild(errorMsg);
        
        setTimeout(function() {
            if (errorMsg.parentNode) {
                errorMsg.style.opacity = '0';
                errorMsg.style.transform = 'translateX(-50%) translateY(-10px)';
                setTimeout(function() {
                    if (errorMsg.parentNode) {
                        errorMsg.parentNode.removeChild(errorMsg);
                    }
                }, 300);
            }
        }, 5000);
    }

    // ===== Mobile Audio Prompt Functions =====
    function showMobileAudioPrompt() {
        // Create a mobile-friendly audio prompt
        var prompt = document.createElement('div');
        prompt.id = 'mobile-audio-prompt';
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            border: 2px solid rgba(232,160,191,0.3);
            z-index: 10003;
            max-width: 320px;
            width: 90%;
        `;
        
        prompt.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 12px;">🎵</div>
            <h3 style="font-family: var(--heading-font); color: #7a6071; margin-bottom: 12px; font-size: 1.2rem;">Bật nhạc nền</h3>
            <p style="color: #7a6071; font-size: 0.9rem; margin-bottom: 20px; line-height: 1.4;">Nhấn để bật nhạc nền cho trải nghiệm tốt nhất</p>
            <button id="enable-audio-btn" style="
                background: linear-gradient(135deg, #E8A0BF, #BFA0E8);
                color: white;
                border: none;
                border-radius: 25px;
                padding: 12px 24px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 8px 20px rgba(232,160,191,0.3);
                transition: all 0.3s ease;
            ">Bật nhạc</button>
        `;
        
        document.body.appendChild(prompt);
        
        // Add click handler
        var enableBtn = document.getElementById('enable-audio-btn');
        enableBtn.addEventListener('click', function() {
            enableAudioOnMobile();
        });
        
        // Add touch handler for better mobile support
        enableBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            enableAudioOnMobile();
        }, { passive: false });
        
        // Auto-hide after 15 seconds (increased time)
        setTimeout(function() {
            if (document.getElementById('mobile-audio-prompt')) {
                hideMobileAudioPrompt();
            }
        }, 15000);
    }
    
    function hideMobileAudioPrompt() {
        var prompt = document.getElementById('mobile-audio-prompt');
        if (prompt) {
            prompt.style.opacity = '0';
            prompt.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(function() {
                if (prompt.parentNode) {
                    prompt.parentNode.removeChild(prompt);
                }
            }, 300);
        }
    }
    
    function enableAudioOnMobile() {
        hideMobileAudioPrompt();
        
        // Only play music if user explicitly clicks the speaker button
        // This function is now only called from the mobile audio prompt
        var track = getCurrentTrackElement();
        if (track) {
            track.volume = 0.7;
            track.play().then(function() {
                isPlaying = true;
                updatePlayButton();
                console.log('Audio enabled by user interaction');
            }).catch(function(e) {
                console.warn('Still cannot play audio:', e);
                showAudioError();
            });
        }
    }
    
    function showAudioError() {
        var errorMsg = document.createElement('div');
        errorMsg.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 107, 107, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 0.9rem;
            z-index: 10004;
            box-shadow: 0 8px 20px rgba(255,107,107,0.3);
        `;
        errorMsg.textContent = 'Không thể phát nhạc. Vui lòng kiểm tra cài đặt âm thanh.';
        document.body.appendChild(errorMsg);
        
        setTimeout(function() {
            if (errorMsg.parentNode) {
                errorMsg.parentNode.removeChild(errorMsg);
            }
        }, 5000);
    }

    // ===== Pleasant click sound for interactive elements =====
    var audioCtx; var clickBuffer;
    
    function ensureAudio() {
        if (audioCtx) return Promise.resolve();
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created, state:', audioCtx.state);
            
            // Handle Safari's autoplay policy more gracefully
            if (audioCtx.state === 'suspended') {
                console.log('Audio context suspended - will resume on user interaction');
            }
        } catch(e) {
            console.warn('Audio not supported:', e);
            return Promise.resolve();
        }
        return Promise.resolve();
    }
    
    // Removed global audio enablement - music will only play after password and loading
    
    // ===== Simplified Mobile Audio System =====
    // Removed all automatic audio unlock systems
    // Music will ONLY play after password validation and loading completion
    function playClickSound(freq) {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq || 440, now); // Lower frequency, warmer tone
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01); // Much quieter
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }
    // expose gentle chime
    function playChime() {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

        var notes = [880, 1320, 1760];
        notes.forEach(function(freq, i){
            var o = audioCtx.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + i*0.03);
            o.connect(g);
            o.start(now + i*0.03);
            o.stop(now + 0.6 + i*0.03);
        });

        g.connect(audioCtx.destination);
    }
    window.playChime = playChime;
    
    function attachClickSounds() {
        var interactive = document.querySelectorAll('button, [role="button"], .open-btn, .letter-cover, .open-slider-btn, .open-letter-btn');
        interactive.forEach(function(el){
            el.addEventListener('click', function(){
                if (!audioCtx) { ensureAudio().then(function(){ playClickSound(); }); }
                else { playClickSound(); }
            });
            // ripple effect
            try {
                el.classList.add('ripple-container');
                el.addEventListener('click', function(e){
                    var r = document.createElement('span');
                    r.className = 'ripple';
                    var rect = el.getBoundingClientRect();
                    var x = e.clientX - rect.left; var y = e.clientY - rect.top;
                    r.style.left = x + 'px'; r.style.top = y + 'px';
                    el.appendChild(r);
                    setTimeout(function(){ if (r.parentNode) r.parentNode.removeChild(r); }, 700);
                });
            } catch(_){}
        });
    }
    attachClickSounds();

    // ===== Cursor trail animation =====
    (function initCursorTrail(){
        var trailRoot = document.querySelector('.cursor-trail');
        if (!trailRoot) return;
        var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        
        // Disable on touch devices to avoid performance issues
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
        
        var last = 0;
        var emojis = ['✨','💕','⭐','💖','🌸'];
        window.addEventListener('mousemove', function(e){
            var now = performance.now();
            if (now - last < 26) return; // throttle ~38fps
            last = now;
            // dot
            var dot = document.createElement('div');
            dot.className = 'trail-dot';
            dot.style.left = e.clientX + 'px';
            dot.style.top = e.clientY + 'px';
            document.body.appendChild(dot);
            setTimeout(function(){ if (dot.parentNode) dot.parentNode.removeChild(dot); }, 800);
            // occasional emoji
            if (Math.random() < 0.18) {
                var em = document.createElement('div');
                em.className = 'trail-emoji';
                em.textContent = emojis[(Math.random()*emojis.length)|0];
                em.style.left = (e.clientX + (Math.random()*10-5)) + 'px';
                em.style.top = (e.clientY + (Math.random()*10-5)) + 'px';
                document.body.appendChild(em);
                setTimeout(function(){ if (em.parentNode) em.parentNode.removeChild(em); }, 900);
            }
        }, { passive: true });
    })();
});

// ===== Infinite Memories Slider Builder =====
// Tries to discover images inside img/slide by probing common names and extensions
// If the folder/filenames differ, just ensure images exist and are referenced by any of the below patterns or extend the lists.
(function buildMemoriesSlider(){
    var track = document.getElementById('slider-track');
    var dup = document.getElementById('slider-track-dup');
    if (!track || !dup) return;

    // Candidate filenames: slide-1..60, img-1..60, photo-1..60, etc.
    var bases = ['slide', 'img', 'image', 'photo', 'mem', 'pic'];
    var exts = ['jpg','jpeg','png','webp','JPG','JPEG','PNG','WEBP'];
    var maxIndex = 60;

    var urls = [];
    for (var i = 1; i <= maxIndex; i++) {
        for (var b = 0; b < bases.length; b++) {
            for (var e = 0; e < exts.length; e++) {
                urls.push('img/slide/' + bases[b] + '-' + i + '.' + exts[e]);
            }
        }
    }

    // Also probe raw numbers (1..maxIndex) without base
    for (var j = 1; j <= maxIndex; j++) {
        for (var ee = 0; ee < exts.length; ee++) {
            urls.push('img/slide/' + j + '.' + exts[ee]);
        }
    }

    // Preload and append successfully loaded images
    var loaded = [];
    var pending = urls.length;
    if (pending === 0) pending = 0; // continue to fallback

    function buildFromSources(sources) {
        if (!sources || sources.length === 0) return;
        // Build primary track
        sources.forEach(function(src){
            var item = document.createElement('div');
            item.className = 'slider-item';
            var img = document.createElement('img');
            img.loading = 'lazy';
            img.decoding = 'async';
            img.src = src;
            img.alt = 'Kỷ niệm của chúng ta';
            item.appendChild(img);
            track.appendChild(item);
        });
        // Duplicate track for seamless loop
        sources.forEach(function(src){
            var item = document.createElement('div');
            item.className = 'slider-item';
            var img = document.createElement('img');
            img.loading = 'lazy';
            img.decoding = 'async';
            img.src = src;
            img.alt = '';
            item.appendChild(img);
            dup.appendChild(item);
        });

        // Position duplicate track exactly after primary
        requestAnimationFrame(function(){
            var width = track.scrollWidth;
            dup.style.transform = 'translateX(' + width + 'px)';
        });
    }

    function finalizeBuild() {
        if (loaded.length === 0) {
            // Fallback: use images already present in the page (timeline images)
            var pageImgs = Array.prototype.slice.call(document.querySelectorAll('.timeline-content img'))
                .map(function(el){ return el.getAttribute('src'); })
                .filter(function(src){ return !!src; });
            // Deduplicate while preserving order
            var seen = {};
            var unique = [];
            pageImgs.forEach(function(src){ if (!seen[src]) { seen[src] = true; unique.push(src); } });
            if (unique.length > 0) {
                buildFromSources(unique);
            }
            return;
        }
        buildFromSources(loaded);
    }

    if (urls.length === 0) {
        finalizeBuild(); // go straight to fallback
    } else {
        urls.forEach(function(src){
            var img = new Image();
            img.onload = function(){
                loaded.push(src);
                if (--pending === 0) finalizeBuild();
            };
            img.onerror = function(){
                if (--pending === 0) finalizeBuild();
            };
            img.src = src + '?v=' + Date.now(); // avoid caching false negatives
        });
    }
})();

// Music Player Controls - Simple System
var musicTracks = {}; // Will store audio elements
var trackList = []; // Will store discovered tracks
var currentTrackIndex = 0; // Current track index
var playBtn = document.querySelector('.play-btn');
var currentTrack = null;
var isPlaying = false;

// Track metadata with icons and names
var trackMetadata = {
    'music.mp3': { icon: '🎶', name: 'Một đời' }
};

// Discover music files in the music folder
function discoverMusicTracks() {
    // Only include one track
    return ['music.mp3'];
}

// Create audio elements for discovered tracks
function createAudioElements(tracks) {
    tracks.forEach(function(trackName) {
        var audio = document.createElement('audio');
        audio.id = trackName.replace('.mp3', '').replace('music', 'music-track');
        
        // Use absolute path for GitHub Pages compatibility
        var baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        audio.src = baseUrl + '/music/' + trackName;
        
        audio.preload = 'metadata'; // Changed from 'auto' for better mobile performance
        audio.loop = true;
        audio.volume = 0.7;
        audio.playsInline = true; // Critical for iOS Safari
        audio.muted = false; // Explicitly set
        audio.crossOrigin = 'anonymous'; // For better compatibility
        
        // Enhanced Safari compatibility
        audio.setAttribute('webkit-playsinline', 'true');
        audio.setAttribute('playsinline', 'true');
        
        // Add error handling for GitHub Pages
        audio.addEventListener('error', function(e) {
            console.warn('Audio load error for', trackName, ':', e);
            console.warn('Current src:', audio.src);
            console.warn('Network state:', audio.networkState);
            console.warn('Ready state:', audio.readyState);
            
            // Try fallback with relative path
            if (audio.src.includes('/music/')) {
                audio.src = './music/' + trackName;
                console.log('Trying fallback path:', audio.src);
            }
        });
        
        // Add load event listener
        audio.addEventListener('canplaythrough', function() {
            console.log('Audio loaded successfully:', trackName);
            console.log('Audio duration:', audio.duration);
        });
        
        // Add more detailed logging
        audio.addEventListener('loadstart', function() {
            console.log('Audio load started:', trackName);
        });
        
        audio.addEventListener('loadeddata', function() {
            console.log('Audio data loaded:', trackName);
        });
        
        audio.addEventListener('loadedmetadata', function() {
            console.log('Audio metadata loaded:', trackName);
        });
        
        // Store reference
        musicTracks[trackName] = audio;
        trackList.push(trackName);
        
        // Append to body (hidden)
        document.body.appendChild(audio);
    });
}

// Update current track display
function updateTrackDisplay() {
    if (trackList.length === 0) return;
    
    var trackName = trackList[currentTrackIndex];
    currentTrack = trackName;
}

// Initialize music player
function initMusicPlayer() {
    if (!playBtn) return;
    
    // Discover and create audio elements
    var tracks = discoverMusicTracks();
    createAudioElements(tracks);
    updateTrackDisplay();
    
    // Preload the first track for better performance
    if (trackList.length > 0) {
        var firstTrack = musicTracks[trackList[0]];
        if (firstTrack) {
            firstTrack.preload = 'auto';
            firstTrack.load(); // Force load
        }
    }
    
    // Play button click
    playBtn.addEventListener('click', function() {
        if (isPlaying) {
            pauseAllMusic();
        } else {
            playCurrentTrack();
        }
    });
    
    // Music will ONLY play after loader completes and content is visible
}

function playCurrentTrack() {
    pauseAllMusic();
    var track = getCurrentTrackElement();
    if (track) {
        // Set volume to default
        track.volume = 0.7;
        
        // Check if track is ready to play
        if (track.readyState >= 2) { // HAVE_CURRENT_DATA or higher
            playTrackDirectly(track);
        } else {
            // Wait for track to be ready
            track.addEventListener('canplay', function() {
                playTrackDirectly(track);
            }, { once: true });
            
            // Fallback timeout
            setTimeout(function() {
                if (!isPlaying) {
                    console.warn('Track not ready after timeout, trying anyway');
                    playTrackDirectly(track);
                }
            }, 3000);
        }
    }
}

function playTrackDirectly(track) {
    // Enhanced play handling for Safari and mobile
    var playPromise = track.play();
    
    if (playPromise !== undefined) {
        playPromise.then(function() {
            isPlaying = true;
            updatePlayButton();
            hideMobileAudioPrompt();
            hideEnhancedAudioPrompt();
            console.log('Music started playing successfully');
        }).catch(function(e) {
            console.warn('Could not play track:', e);
            handlePlaybackError();
        });
    } else {
        // Fallback for older browsers
        try {
            track.play();
            isPlaying = true;
            updatePlayButton();
            hideMobileAudioPrompt();
            hideEnhancedAudioPrompt();
            console.log('Music started playing (fallback)');
        } catch(e) {
            console.warn('Could not play track (fallback):', e);
            handlePlaybackError();
        }
    }
}

function handlePlaybackError() {
    // Detect Safari specifically
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isSafari || isMobile) {
        console.log('Showing enhanced audio prompt for Safari/Mobile');
        showEnhancedAudioPrompt();
    } else {
        // For other browsers, show mobile prompt as fallback
        showMobileAudioPrompt();
    }
}

function pauseAllMusic() {
    Object.values(musicTracks).forEach(function(audio) {
        audio.pause();
    });
    isPlaying = false;
    updatePlayButton();
}

// Removed switchTrack function as we only have one track

function getCurrentTrackElement() {
    return musicTracks[currentTrack] || null;
}

function updatePlayButton() {
    if (!playBtn) return;
    var icon = playBtn.querySelector('.play-icon');
    if (isPlaying) {
        icon.textContent = '🔇';
        playBtn.classList.add('playing');
        playBtn.setAttribute('aria-label', 'Tắt nhạc');
    } else {
        icon.textContent = '🔊';
        playBtn.classList.remove('playing');
        playBtn.setAttribute('aria-label', 'Bật nhạc');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
    initMusicPlayer();
}

