function makeDoiUrl(doi) {
  if (!doi || typeof doi !== "string") return "";
  const cleaned = doi.trim();
  if (!cleaned) return "";

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }

  return `https://doi.org/${cleaned.replace(/^doi:\s*/i, "")}`;
}

function displayDoiText(doi) {
  if (!doi || typeof doi !== "string") return "";
  return doi
    .trim()
    .replace(/^https?:\/\/doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
}

async function loadPublications() {
  const container = document.getElementById("publication-list");
  if (!container) return;

  try {
    const response = await fetch("publications.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const publications = await response.json();

    container.innerHTML = "";

    publications
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .forEach((pub) => {
        const article = document.createElement("article");
        article.className = "pub-card";

        const title = pub.title || "Untitled publication";
        const authors = pub.authors || "";
        const venue = pub.venue || "";
        const status = pub.status || "";
        const year = pub.year || "";
        const note = pub.note || "";
        const image = pub.image || "";
        const doiUrl = makeDoiUrl(pub.doi);
        const doiText = displayDoiText(pub.doi);

        article.innerHTML = `
          <div class="pub-figure">
            ${image ? `<img src="${image}" alt="Illustration for ${title}">` : ""}
          </div>
          <div class="pub-copy">
            <p class="pub-meta">${year}${status ? ` · ${status}` : ""}</p>
            <h3>${title}</h3>
            ${authors ? `<p>${authors}</p>` : ""}
            ${venue ? `<p><em>${venue}</em></p>` : ""}
            ${doiUrl ? `<p class="pub-note">DOI: <a href="${doiUrl}" target="_blank" rel="noopener noreferrer">${doiText}</a></p>` : ""}
            ${note ? `<p class="pub-note">${note}</p>` : ""}
          </div>
        `;

        container.appendChild(article);
      });
  } catch (error) {
    container.innerHTML =
      "<p>Unable to load publications.json. Check that the file is present in the repository root and that the JSON format is valid.</p>";
    console.error("Publication loading error:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
  loadPublications();
});
