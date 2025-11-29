/* =========================================================
   LIEVITIAMO - Script JavaScript Completo
   ========================================================= */

/* =========================================================
   0) UTILITY FUNCTIONS
   ========================================================= */
function $(sel, root = document) {
    return root.querySelector(sel);
}

function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
}

/* Slug coerente con le etichette usate nei bottoni */
function prettySlug(title) {
    const t = String(title || '').toLowerCase();
    if (t.includes('classiche')) return 'classiche';
    if (t.includes('bianche')) return 'bianche';
    if (t.includes('speciali')) return 'speciali';
    if (t.includes('rosse')) return 'rosse';
    if (t.includes('stagion')) return 'di-stagione';
    if (t.includes('saltimbocca')) return 'saltimbocca';
    return t
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/* =========================================================
   1) HEADER: burger + link attivo
   ========================================================= */
(function headerNav() {
    const burger = $('.burger');
    const siteNav = $('.site-nav');
    const navList = $('#nav-list');
    const body = document.body;
    const burgerIcon = burger ? burger.querySelector('i') : null;

    if (!burger || !siteNav || !navList) return;

    function setIcon(isOpen) {
        if (!burgerIcon) return;
        if (isOpen) {
            burgerIcon.classList.remove('fa-bars');
            burgerIcon.classList.add('fa-xmark');
        } else {
            burgerIcon.classList.remove('fa-xmark');
            burgerIcon.classList.add('fa-bars');
        }
    }

    function openMenu() {
        siteNav.classList.add('is-open');
        burger.setAttribute('aria-expanded', 'true');
        body.classList.add('menu-open');
        setIcon(true);
    }

    function closeMenu() {
        siteNav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        body.classList.remove('menu-open');
        setIcon(false);
    }

    // Toggle menu al click hamburger
    burger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (siteNav.classList.contains('is-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Chiudi menu quando clicchi un link
    $all('.nav-link', navList).forEach(a => {
        a.addEventListener('click', () => {
            closeMenu();
        });
    });

    // Chiudi menu quando clicchi sul backdrop scuro
    siteNav.addEventListener('click', (e) => {
        if (e.target === siteNav && siteNav.classList.contains('is-open')) {
            closeMenu();
        }
    });

    // Chiudi menu con tasto ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && siteNav.classList.contains('is-open')) {
            closeMenu();
        }
    });

    // Evidenziazione link attivo su scroll
    const links = $all('.nav-link');
    const sections = links
        .map(a => document.querySelector(a.getAttribute('href')))
        .filter(Boolean);

    if (sections.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = '#' + entry.target.id;
                    links.forEach(a =>
                        a.classList.toggle('active', a.getAttribute('href') === id)
                    );
                }
            });
        }, { rootMargin: '-60% 0px -35% 0px', threshold: 0.01 });
        sections.forEach(sec => io.observe(sec));
    }
})();

/* =========================================================
   2) MENU CHOOSER (overlay PDF)
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const openBtn = $('#openMenuChooser');
    const chooser = $('#menuChooser');
    if (!chooser || !openBtn) return;

    const closeBtn = chooser.querySelector('.mc-close');
    const backdrop = chooser.querySelector('.mc-backdrop');

    const open = (ev) => {
        if (ev) ev.preventDefault();
        chooser.removeAttribute('hidden');
        const first = chooser.querySelector('#mcView') || chooser.querySelector('a,button,[tabindex]');
        if (first && first.focus) setTimeout(() => first.focus(), 10);
    };
    const close = () => chooser.setAttribute('hidden', '');
    // Chiudi automaticamente quando si clicca un link dentro il chooser
    chooser.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            chooser.setAttribute('hidden', '');
        });
    });


    openBtn.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    backdrop && backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !chooser.hasAttribute('hidden')) close();
    });
});

/* =========================================================
   3) RENDER MENU DA menu.json
   ========================================================= */
document.addEventListener('DOMContentLoaded', function() {
    const container = $('#menu-render');
    if (!container) return;

    container.classList.remove('menu-grid');

    fetch('menu.json', { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error('menu.json non trovato');
            return res.json();
        })
        .then(data => {
            const html = [];

            ((data && data.categories) || []).forEach(cat => {
                const items = (cat.items || []).filter(Boolean);
                if (!items.length) return;

                const slug = prettySlug(cat.title);
                html.push('<h3 id="' + slug + '" class="menu-cat-title">' + cat.title + '</h3>');
                html.push('<div class="menu-grid">');

                items.forEach(item => {
                    const title = item.title || '';
                    const desc = item.desc || '';

                    const tags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()) : [];
                    const explicitVegan = item.vegan === true || tags.includes('vegan');
                    const explicitVegetarian = item.vegetarian === true || tags.includes('vegetarian');

                    const rxVegan = /\bveg(an[oa]?|ana)\b/i;
                    const rxVeget = /\bvegetar(i|ia)n[oa]?\b/i;

                    // una pizza può essere sia vegana che vegetariana
                    const isVegan = explicitVegan || rxVegan.test(title) || rxVegan.test(desc);
                    const isVegetarian = explicitVegetarian || rxVeget.test(title) || rxVeget.test(desc);

                    const price = item.price ? '<span class="price">' + item.price + '</span>' : '';
                    const descP = item.desc ? '<p class="desc">' + item.desc + '</p>' : '';

                    const cleanAllergens = (item.allergens || '').replace(/[()]/g, '');
                    const allergens = cleanAllergens ?
                        '<div class="allergeni">' +
                        '<button type="button" class="allergen-trigger" data-allergeni="' + cleanAllergens + '">' +
                        'Allergeni: <span>' + cleanAllergens + '</span>' +
                        '</button>' +
                        '<div class="allergen-tooltip" aria-hidden="true"></div>' +
                        '</div>' :
                        '';

                    // BADGE: se è vegana e vegetariana mostriamo entrambi
                    let badges = '';
                    if (isVegan) {
                        badges += '<span class="badge badge-vegan">Vegana</span>';
                    }
                    if (isVegetarian) {
                        badges += '<span class="badge badge-vegetariana">Vegetariana</span>';
                    }

                    // CLASSI per i FILTRI
                    let dietClass = '';
                    if (isVegan) {
                        dietClass += ' menu-card--vegan';
                    }
                    if (isVegetarian) {
                        dietClass += ' menu-card--vegetarian';
                    }

                    html.push(
                        '<article class="menu-card' + dietClass + '">' +
                        '<div class="menu-info">' +
                        '<div class="menu-line"><h3>' + title + badges + '</h3>' + price + '</div>' +
                        descP +
                        allergens +
                        '</div>' +
                        '</article>'
                    );
                });

                html.push('</div>');
            });

            container.innerHTML = html.join('');

            alignMenuCategoryLinks();
            revealMenuCards();
            setupElegantMenuScroll();
            document.dispatchEvent(new Event('menuRendered'));
        })
        .catch(err => {
            console.warn('Errore nel rendering del menu:', err);
            container.innerHTML = '<p class="muted">Menu in aggiornamento. Torna a trovarci a breve.</p>';
        });
});

/* Helper: allinea i bottoni categoria agli id generati */
function alignMenuCategoryLinks() {
    const links = $all('.menu-controls a');
    if (!links.length) return;

    const heads = $all('.menu-cat-title');
    if (!heads.length) return;

    const map = {};
    heads.forEach(h => {
        const titleText = h.textContent || '';
        const slug = prettySlug(titleText);
        if (slug) map[slug] = h.id;
    });

    links.forEach(a => {
        const rawText = (a.dataset.cat || a.textContent || '').trim();
        if (!rawText) return;

        const slug = prettySlug(rawText);
        const id = map[slug];

        if (id) a.setAttribute('href', '#' + id);
    });
}

/* Helper: reveal card menu */
function revealMenuCards() {
    const cards = $all('.menu-card');
    if (!cards.length) return;

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        cards.forEach(c => io.observe(c));
    } else {
        cards.forEach(c => c.classList.add('is-visible'));
    }

    setTimeout(() => {
        const anyVisible = cards.some(c => c.classList.contains('is-visible'));
        if (!anyVisible) cards.forEach(c => c.classList.add('is-visible'));
    }, 300);
}

/* =========================================================
   4) FILTRO DIETA: Tutte / Vegetariane / Vegane
   ========================================================= */
let currentDietFilter = 'all';
let dietFilterInitialized = false;

function applyDietFilter() {
    const cards = $all('.menu-card');
    if (!cards.length) return;

    cards.forEach(card => {
        const isVegan = card.classList.contains('menu-card--vegan');
        const isVegetarian = card.classList.contains('menu-card--vegetarian') || isVegan;

        let visible = true;
        if (currentDietFilter === 'vegetarian') {
            visible = isVegetarian;
        } else if (currentDietFilter === 'vegan') {
            visible = isVegan;
        }

        card.style.display = visible ? '' : 'none';
    });
}

function setupDietFilterControls() {
    if (dietFilterInitialized) return;

    const buttons = $all('.menu-filter-btn');
    if (!buttons.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter || 'all';
            currentDietFilter = filter;

            buttons.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');

            applyDietFilter();
        });
    });

    dietFilterInitialized = true;
}

document.addEventListener('DOMContentLoaded', setupDietFilterControls);
document.addEventListener('menuRendered', applyDietFilter);

/* =========================================================
   5) SCROLL ELEGANTE CATEGORIE MENU
   ========================================================= */
function setupElegantMenuScroll() {
    const header = document.querySelector('header[role="banner"]');
    const categoryBar = document.querySelector('.menu-controls-wrap');
    const links = document.querySelectorAll('.menu-controls a');

    if (!links.length) return;

    function getOffset() {
        const h = header ? header.offsetHeight : 0;
        const b = categoryBar ? categoryBar.offsetHeight : 0;
        return h + b + 20;
    }

    links.forEach(a => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (!id || !id.startsWith('#')) return;

            const target = document.querySelector(id);
            if (!target) return;

            e.preventDefault();

            const offset = getOffset();
            const y = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({ top: y, behavior: 'smooth' });
        });
    });

    const heads = Array.from(links)
        .map(a => document.querySelector(a.getAttribute('href')))
        .filter(Boolean);

    if (!heads.length || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const id = '#' + entry.target.id;

            links.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === id);
            });
        });
    }, {
        rootMargin: '-55% 0px -35% 0px',
        threshold: 0.01
    });

    heads.forEach(h => io.observe(h));
}

/* =========================================================
   6) FIX OFFSET / REFRESH MENU
   ========================================================= */
function computeMenuOffsets() {
    const header = document.querySelector('header[role="banner"]');
    const bar = document.querySelector('.menu-head');
    const headerH = header ? header.offsetHeight : 0;
    const barH = bar ? bar.offsetHeight : 0;
    const offset = headerH + barH + 10;

    $all('.menu-cat-title').forEach(h => {
        h.style.scrollMarginTop = offset + 'px';
    });

    return offset;
}

function correctInitialScroll() {
    const offset = computeMenuOffsets();
    if (location.hash) {
        const el = document.querySelector(decodeURIComponent(location.hash));
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: 'auto' });
            return;
        }
    }

    const bar = document.querySelector('.menu-head');
    const firstHead = document.querySelector('.menu-cat-title');
    if (bar && firstHead) {
        const barBottom = bar.getBoundingClientRect().bottom;
        const headTop = firstHead.getBoundingClientRect().top;
        if (headTop < barBottom) {
            window.scrollBy({ top: headTop - barBottom - 10, behavior: 'auto' });
        }
    }
}

window.addEventListener('load', () => setTimeout(correctInitialScroll, 60));
window.addEventListener('resize', () => setTimeout(computeMenuOffsets, 50));
window.addEventListener('orientationchange', () => setTimeout(computeMenuOffsets, 120));
document.addEventListener('menuRendered', () => setTimeout(correctInitialScroll, 30));

/* =========================================================
   7) FILOSOFIA – animazione "fade up"
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const targets = $all('.philosophy.animate .point');
    if (!targets.length || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.15 });

    targets.forEach(el => io.observe(el));
});

/* =========================================================
   8) ALLERGENI - tooltip da data-allergeni
   ========================================================= */
const allergeniMap = {
    1: "Glutine",
    2: "Crostacei",
    3: "Uova",
    4: "Pesce",
    5: "Arachidi",
    6: "Soia",
    7: "Latte",
    8: "Frutta a guscio",
    9: "Sedano",
    10: "Senape",
    11: "Sesamo",
    12: "Solfiti",
    13: "Lupini",
    14: "Molluschi"
};

let allergenCloseListenerAttached = false;

function setupAllergenTooltips() {
    const triggers = $all('.allergen-trigger');
    if (!triggers.length) return;

    triggers.forEach(trigger => {
        const raw = trigger.dataset.allergeni || '';
        const codes = raw.split(',').map(c => c.trim()).filter(Boolean);

        const tooltip = trigger.nextElementSibling &&
            trigger.nextElementSibling.classList.contains('allergen-tooltip') ?
            trigger.nextElementSibling :
            null;

        if (!tooltip || !codes.length) return;

        const textParts = codes.map(code => {
            const label = allergeniMap[code];
            return label ? code + ' – ' + label : code;
        });

        tooltip.textContent = 'Contiene allergeni: ' + textParts.join(', ');

        const card = trigger.closest('.menu-card');

        trigger.addEventListener('click', (ev) => {
            ev.stopPropagation();

            const isOpen = tooltip.classList.contains('is-open');

            $all('.allergen-tooltip.is-open').forEach(t => t.classList.remove('is-open'));
            $all('.menu-card.menu-card--tooltip-open').forEach(c =>
                c.classList.remove('menu-card--tooltip-open')
            );

            if (!isOpen) {
                tooltip.classList.add('is-open');
                if (card) card.classList.add('menu-card--tooltip-open');
            }
        });
    });

    if (!allergenCloseListenerAttached) {
        document.addEventListener('click', (ev) => {
            if (!ev.target.closest('.allergeni')) {
                $all('.allergen-tooltip.is-open').forEach(t => t.classList.remove('is-open'));
                $all('.menu-card.menu-card--tooltip-open').forEach(c =>
                    c.classList.remove('menu-card--tooltip-open')
                );
            }
        });
        allergenCloseListenerAttached = true;
    }
}

document.addEventListener('DOMContentLoaded', setupAllergenTooltips);
document.addEventListener('menuRendered', setupAllergenTooltips);

/* =========================================================
   9) LINK DINAMICI — senza config.js
   ========================================================= */
/* =========================================================
   9) LINK DINAMICI — senza config.js
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    // 🔧 CONFIGURA QUI I TUOI DATI UNA VOLTA SOLA:
    const phone = "0543037252"; // telefono (solo numeri)
    const whatsapp = "393000000000"; // whatsapp senza +
    const addressLabel = "Via XXIV maggio 6, Forlì"; // testo da mostrare
    const mapsUrl = "https://www.google.com/maps/place/LievitiAmo+Pizzeria+-+Forli/@44.2173956,12.0422807,17z/data=!3m1!4b1!4m6!3m5!1s0x132b5738c6ccc94b:0x54237c9fa5bbfc35!8m2!3d44.2173918!4d12.0448556!16s%2Fg%2F11vj62ltxh?entry=ttu&g_ep=EgoyMDI1MTEyMy4xIKXMDSoASAFQAw%3D%3D";
    const email = "info@lievitiamo.it";
    const instagram = "https://www.instagram.com/lievitiamo_pizzeria_forli/";
    const facebook = "https://www.facebook.com/lievitiamopizzeria";

    // ☎ Telefono
    $all('[data-phone]').forEach(el => {
        el.setAttribute('href', 'tel:' + phone);
        if (!el.textContent.trim()) el.textContent = phone;
    });

    // 💬 WhatsApp
    const waMsg = 'Ciao! Vorrei ordinare una pizza.';
    $all('[data-whatsapp]').forEach(el => {
        el.setAttribute(
            'href',
            'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(waMsg)
        );
    });

    // 📍 Indirizzo
    // 📍 Indirizzo — TUTTI i data-address usano lo stesso link LievitiAmo
    $all('[data-address]').forEach(el => {
        el.setAttribute('href', mapsUrl);

        // Se l'elemento non ha testo, metto l'indirizzo leggibile
        if (!el.textContent.trim()) {
            el.textContent = addressLabel;
        }
    });


    // 📧 Email
    $all('[data-email]').forEach(el => {
        el.setAttribute('href', 'mailto:' + email);
        if (!el.textContent.trim()) el.textContent = email;
    });

    // 📱 Social
    const ig = $('[data-instagram]');
    if (ig) ig.setAttribute('href', instagram);

    const fb = $('[data-facebook]');
    if (fb) fb.setAttribute('href', facebook);
});