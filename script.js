document.addEventListener('DOMContentLoaded', function () {
    // Password validation
    const validPasswords = ['2203', '0208', '2206'];
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
            // Refresh AOS after reveal
            if (window.AOS && AOS.refreshHard) {
                AOS.refreshHard();
            } else if (window.AOS) {
                AOS.refresh();
            }
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

            // If not already prepared, add letter overlay
            if (!item.classList.contains('prepared-letter')) {
                item.classList.add('prepared-letter', 'is-locked');
                var cover = document.createElement('div');
                cover.className = 'letter-cover';
                cover.innerHTML = '\n                    <div class="letter-paper">\n                        <div class="letter-title">Bạn có một bức thư 💌</div>\n                        <span class="letter-heart"></span>\n                        <div style="margin: 10px 0 16px; color:#7a6071; font-size:0.95rem;">Nhấn để mở và đọc kỷ niệm xinh xắn nhé!</div>\n                        <button type="button" class="open-btn">Mở thư</button>\n                    </div>\n                ';
                item.appendChild(cover);

                var button = cover.querySelector('.open-btn');
                if (button) {
                    button.addEventListener('click', function (e) {
                        e.stopPropagation();
                        item.classList.remove('is-locked');
                        item.classList.add('is-open');

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
    var closeBtn = document.querySelector('.close-popup');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideCelebrationPopup);
    }
    
    var popupOverlay = document.getElementById('celebration-popup');
    if (popupOverlay) {
        popupOverlay.addEventListener('click', function(e) {
            if (e.target === popupOverlay) {
                hideCelebrationPopup();
            }
        });
    }
});

