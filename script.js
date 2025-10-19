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
            // Prepare audio playback to satisfy mobile browser gesture requirement
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
                        // Pre-play muted so that after loading we can raise volume
                        var trackEl = (typeof getCurrentTrackElement === 'function') ? getCurrentTrackElement() : null;
                        if (trackEl && typeof trackEl.play === 'function') {
                            var prevVol = trackEl.volume;
                            trackEl.volume = 0;
                            var p = trackEl.play();
                            if (p && typeof p.then === 'function') {
                                p.then(function(){
                                    isPlaying = true;
                                    if (typeof updatePlayButton === 'function') updatePlayButton();
                                    // restore previous volume after loader completes in finishLoading()
                                }).catch(function(){ 
                                    // Mobile browsers block autoplay - will handle in finishLoading
                                    console.log('Audio autoplay blocked - will require user interaction');
                                });
                            }
                        }
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
            // Start/continue music after loading
            setTimeout(function() {
                var track = getCurrentTrackElement && getCurrentTrackElement();
                // If already playing (muted), simply raise volume now
                if (track && isPlaying) {
                    track.volume = 0.7;
                    updatePlayButton && updatePlayButton();
                    return;
                }
                if (currentTrack && !isPlaying) {
                    // Ensure we start with music.mp3
                    currentTrackIndex = trackList.indexOf('music.mp3');
                    if (currentTrackIndex === -1) currentTrackIndex = 0;
                    updateTrackDisplay();
                    
                    var tryPlay = function(){
                        var track = getCurrentTrackElement();
                        if (track) {
                            track.volume = 0.7; // Default volume
                            var p = track.play();
                            if (p && typeof p.catch === 'function') {
                                p.then(function(){
                                    isPlaying = true;
                                    updatePlayButton();
                                    // Hide any mobile audio prompt if it exists
                                    hideMobileAudioPrompt();
                                }).catch(function(){
                                    // Autoplay was prevented, show mobile-friendly prompt
                                    showMobileAudioPrompt();
                                });
                            }
                        }
                    };
                    tryPlay();
                }
            }, 1000); // Small delay to ensure UI is ready
            // Audio controls are now handled by the music player system
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
        
        // Auto-hide after 10 seconds
        setTimeout(function() {
            if (document.getElementById('mobile-audio-prompt')) {
                hideMobileAudioPrompt();
            }
        }, 10000);
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
        
        // Try to play current track
        var track = getCurrentTrackElement();
        if (track) {
            track.volume = 0.7;
            track.play().then(function() {
                isPlaying = true;
                updatePlayButton();
                console.log('Audio enabled successfully on mobile');
            }).catch(function(e) {
                console.warn('Still cannot play audio:', e);
                // Show a more persistent message
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
            // Safari requires user gesture to start audio context
            if (audioCtx.state === 'suspended') {
                return new Promise(function(resolve) {
                    var resume = function() {
                        audioCtx.resume().then(resolve);
                        document.removeEventListener('touchstart', resume);
                        document.removeEventListener('click', resume);
                    };
                    document.addEventListener('touchstart', resume, { once: true });
                    document.addEventListener('click', resume, { once: true });
                });
            }
        } catch(e) {
            console.warn('Audio not supported:', e);
            return Promise.resolve();
        }
        return Promise.resolve();
    }
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

// Music Player Controls - Dynamic System
var musicTracks = {}; // Will store audio elements
var trackList = []; // Will store discovered tracks
var currentTrackIndex = 0; // Current track index
var playBtn = document.querySelector('.play-btn');
var prevBtn = document.querySelector('.prev-btn');
var nextBtn = document.querySelector('.next-btn');
var volumeSlider = document.querySelector('.volume-slider');
var currentTrackName = document.getElementById('current-track-name');
var currentTrack = null;
var isPlaying = false;

// Track metadata with icons and names
var trackMetadata = {
    'music.mp3': { icon: '🎶', name: 'Một đời' },
    'music2.mp3': { icon: '💕', name: 'Giai điệu ngọt ngào' },
    'music3.mp3': { icon: '✨', name: 'Còn gì đẹp hơn' }
};

// Discover music files in the music folder
function discoverMusicTracks() {
    // Only include three tracks
    return ['music.mp3', 'music2.mp3', 'music3.mp3'];
}

// Create audio elements for discovered tracks
function createAudioElements(tracks) {
    tracks.forEach(function(trackName) {
        var audio = document.createElement('audio');
        audio.id = trackName.replace('.mp3', '').replace('music', 'music-track');
        audio.src = 'music/' + trackName;
        audio.preload = 'auto';
        audio.loop = true;
        audio.volume = 0.7;
        
        // Store reference
        musicTracks[trackName] = audio;
        trackList.push(trackName);
        
        // Append to body (hidden)
        document.body.appendChild(audio);
    });
}

// Update current track display
function updateTrackDisplay() {
    if (!currentTrackName || trackList.length === 0) return;
    
    var trackName = trackList[currentTrackIndex];
    var metadata = trackMetadata[trackName] || { 
        icon: '🎵', 
        name: 'Bài hát ' + (currentTrackIndex + 1) 
    };
    
    currentTrackName.textContent = metadata.name;
    currentTrack = trackName;
}

// Initialize music player
function initMusicPlayer() {
    if (!playBtn || !volumeSlider || !prevBtn || !nextBtn) return;
    
    // Discover and create audio elements
    var tracks = discoverMusicTracks();
    createAudioElements(tracks);
    updateTrackDisplay();
    
    // Play button click
    playBtn.addEventListener('click', function() {
        if (isPlaying) {
            pauseAllMusic();
        } else {
            playCurrentTrack();
        }
    });
    
    // Previous button click
    prevBtn.addEventListener('click', function() {
        if (trackList.length === 0) return;
        currentTrackIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
        updateTrackDisplay();
        if (isPlaying) {
            playCurrentTrack();
        }
    });
    
    // Next button click
    nextBtn.addEventListener('click', function() {
        if (trackList.length === 0) return;
        currentTrackIndex = (currentTrackIndex + 1) % trackList.length;
        updateTrackDisplay();
        if (isPlaying) {
            playCurrentTrack();
        }
    });
    
    // Volume slider
    volumeSlider.addEventListener('input', function() {
        var volume = this.value / 100;
        Object.values(musicTracks).forEach(function(audio) {
            audio.volume = volume;
        });
    });
    
    // Don't auto-play here - will be triggered after password validation
}

function playCurrentTrack() {
    pauseAllMusic();
    var track = getCurrentTrackElement();
    if (track) {
        track.play().then(function() {
            isPlaying = true;
            updatePlayButton();
            hideMobileAudioPrompt(); // Hide any existing prompts
        }).catch(function(e) {
            console.warn('Could not play track:', e);
            // On mobile, show the audio prompt
            if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                showMobileAudioPrompt();
            }
        });
    }
}

function pauseAllMusic() {
    Object.values(musicTracks).forEach(function(audio) {
        audio.pause();
    });
    isPlaying = false;
    updatePlayButton();
}

function switchTrack(trackName) {
    pauseAllMusic();
    currentTrackIndex = trackList.indexOf(trackName);
    if (currentTrackIndex === -1) currentTrackIndex = 0;
    updateTrackDisplay();
    playCurrentTrack();
}

function getCurrentTrackElement() {
    return musicTracks[currentTrack] || null;
}

function updatePlayButton() {
    if (!playBtn) return;
    var icon = playBtn.querySelector('.play-icon');
    if (isPlaying) {
        icon.textContent = '⏸️';
        playBtn.setAttribute('aria-label', 'Tạm dừng');
    } else {
        icon.textContent = '▶️';
        playBtn.setAttribute('aria-label', 'Phát nhạc');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
    initMusicPlayer();
}

