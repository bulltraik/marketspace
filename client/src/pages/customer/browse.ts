// pages/customer/browse.ts
// Browse all active shops and their products.

import { api } from '../../services/api'
import type { Shop } from '../../types'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = '<p style="text-align:center; padding: 2rem;">Loading...</p>'

  try {
    const res = await api.get('/shops')
    const shops: Shop[] = await res.json()

    // Using shops to represent the "products/shops" list in the layout empty state
    // For now we render the hero + empty state (since we assume no items yet)
    
    app.innerHTML = `
      <section class="hero-section" id="hero-carousel">
        <!-- Slides will be injected here via JS -->
      </section>

      <section class="products-section">
        <div class="products-header">
          <h2>Discover Products</h2>
          <div class="products-filter">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            <span class="filter-pill">All</span>
          </div>
        </div>

        ${shops.length === 0 ? `
          <div class="empty-state-card">
            <p>No products available at the moment.</p>
            <span>Check back later for new arrivals!</span>
          </div>
        ` : `
          <div id="shop-grid">
            ${shops.map(s => `
              <a href="/shop/${s.slug}" class="shop-card" data-shop-id="${s.id}">
                ${s.banner_url ? `<img src="${s.banner_url}" alt="${s.name} banner" class="shop-banner" />` : '<div class="shop-banner"></div>'}
                <div class="shop-info">
                  <h2>${s.name}</h2>
                  <p>${s.bio || ''}</p>
                </div>
              </a>
            `).join('')}
          </div>
        `}
      </section>
    `

    // Carousel Logic: dynamically generate ads from shops with banners
    const heroAds = shops
      .filter(s => s.banner_url)
      .slice(0, 5)
      .map(s => ({
        shopName: s.name,
        title: s.name,
        description: s.bio || 'Discover our unique collection of products.',
        image: s.banner_url,
        link: `/shop/${s.slug}`
      }));

    // Fallback if no shops have banners yet
    if (heroAds.length === 0) {
      heroAds.push({
        shopName: 'MarketSpace',
        title: 'Welcome to MarketSpace',
        description: 'Discover unique goods from independent creators directly from the makers.',
        image: '/images/coffee.png', // Default placeholder
        link: '/products'
      });
    }

    const carouselEl = document.getElementById('hero-carousel');
    if (carouselEl) {
      let currentSlide = 0;

      // Build slides
      const slidesHTML = heroAds.map((ad, idx) => `
        <div class="carousel-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${ad.image}')" data-index="${idx}">
          <div class="carousel-overlay"></div>
          <div class="carousel-content">
            <span class="carousel-badge">Featured Shop: ${ad.shopName}</span>
            <h1>${ad.title}</h1>
            <p>${ad.description}</p>
            <div class="hero-actions">
              <a href="${ad.link}" class="btn btn-primary">Shop Collection</a>
            </div>
          </div>
        </div>
      `).join('');

      // Build indicators & controls
      const controlsHTML = `
        <div class="carousel-indicators">
          ${heroAds.map((_, idx) => `<div class="indicator ${idx === 0 ? 'active' : ''}" data-index="${idx}"></div>`).join('')}
        </div>
        <div class="carousel-controls">
          <button class="carousel-btn" id="carousel-prev">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <button class="carousel-btn" id="carousel-next">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      `;

      carouselEl.innerHTML = slidesHTML + controlsHTML;

      const slides = carouselEl.querySelectorAll('.carousel-slide');
      const indicators = carouselEl.querySelectorAll('.indicator');

      const goToSlide = (index: number) => {
        slides[currentSlide].classList.remove('active');
        indicators[currentSlide].classList.remove('active');
        
        currentSlide = (index + slides.length) % slides.length;
        
        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
      };

      const nextSlide = () => goToSlide(currentSlide + 1);
      const prevSlide = () => goToSlide(currentSlide - 1);

      document.getElementById('carousel-next')?.addEventListener('click', nextSlide);
      document.getElementById('carousel-prev')?.addEventListener('click', prevSlide);

      indicators.forEach(ind => {
        ind.addEventListener('click', (e) => {
          const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
          goToSlide(idx);
        });
      });

      // Auto-play
      const autoPlayInterval = setInterval(nextSlide, 5000);

      // Cleanup when navigating away (though full page reload clears it, SPA navigation needs it)
      // For simplicity in this demo, we'll let it be, but ideally store the interval ID and clear it on route change.
      (window as any)._carouselInterval = autoPlayInterval;
    }

  } catch (err) {
    app.innerHTML = '<p style="text-align:center; padding: 2rem;">Failed to load data.</p>'
  }
}
