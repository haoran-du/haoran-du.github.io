async function loadPublications() {
  const container = document.getElementById('publication-list');
  if (!container) return;

  try {
    const response = await fetch('publications.json', { cache: 'no-store' });
    const publications = await response.json();

    publications
      .sort((a, b) => b.year - a.year)
      .forEach((pub) => {
        const article = document.createElement('article');
        article.className = 'pub-card';
        article.innerHTML = `
          <div class="pub-figure">
            <img src="${pub.image}" alt="Illustration for ${pub.title}">
          </div>
          <div class="pub-copy">
            <p class="pub-meta">${pub.year} · ${pub.status}</p>
            <h3>${pub.title}</h3>
            <p>${pub.authors}</p>
            <p><em>${pub.venue}</em></p>
            <p class="pub-note">${pub.note}</p>
          </div>
        `;
        container.appendChild(article);
      });
  } catch (error) {
    container.innerHTML = '<p>Unable to load publications.json. Check that the file is present in the repository root.</p>';
  }
}

document.getElementById('year').textContent = new Date().getFullYear();
loadPublications();
