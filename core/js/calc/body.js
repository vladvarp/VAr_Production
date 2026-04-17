document.addEventListener('readystatechange', event => {
            if (event.target.readyState === 'complete') {
                if (!window.calconic.calculator.landingPageCustomization) {
                    return;
                }

                if (window.calconic.calculator.landingPageCustomization.pageLayout === '0') {
                    return;
                }

                const verticalContainer = document.querySelector('.layout-vertical');

                setTimeout(() => {
                    Array.from(document.querySelectorAll('.loader-active')).forEach(el => {
                        el.style.display = 'none';
                    });
                    Array.from(document.querySelectorAll('.calconic-calculator')).forEach(el => {
                        el.classList.add('resizing');
                        setTimeout(function() {
                            el.classList.remove('resizing');
                            el.style.opacity = '1';
                        }, 100);
                    });
                }, 2000)
            }});