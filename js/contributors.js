// GitHub Repository Configuration
const REPO_OWNER = 'sayeeg-11';
const REPO_NAME = 'Pixel_Phantoms';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

// State
let allContributors = [];
let currentPage = 1;
const itemsPerPage = 8;

document.addEventListener('DOMContentLoaded', () => {
    fetchRepoStats();
    fetchContributors();
    fetchRecentActivity();
});

// 1. Fetch Stats (Stars, Forks, PRs)
async function fetchRepoStats() {
    try {
        const [repoRes, pullsRes] = await Promise.all([
            fetch(API_BASE),
            fetch(`${API_BASE}/pulls?state=all&per_page=1`) // Just to get header link for count
        ]);

        const repoData = await repoRes.json();
        
        // Extract Total PRs from Link Header (GitHub API trick) or simplified approximation
        // For simplicity in static sites without backend, we might not get exact total > 100 easily without traversing
        // We will use a simplified visual estimation or specific endpoint if available. 
        // Here we display what we can directly access or placeholder logic.
        
        // Display Stars & Forks
        document.getElementById('total-stars').textContent = repoData.stargazers_count;
        document.getElementById('total-forks').textContent = repoData.forks_count;

        // Note: Accurate Total PR count requires traversing pages. 
        // For now, we will simulate dynamic calculation based on contributor activity in next step.

    } catch (error) {
        console.error('Error fetching repo stats:', error);
    }
}

// 2. Fetch Contributors & Logic
async function fetchContributors() {
    try {
        const response = await fetch(`${API_BASE}/contributors?per_page=100`);
        const data = await response.json();
        
        const leadAvatar = document.getElementById('lead-avatar');
        
        // STATS CALCULATIONS
        let totalCommits = 0;
        let totalPoints = 0; // Points = Commits * 10 (Simple gamification logic)

        data.forEach(contributor => {
            totalCommits += contributor.contributions;
            totalPoints += contributor.contributions * 10;

            if(contributor.login.toLowerCase() === REPO_OWNER.toLowerCase()) {
                if(leadAvatar) leadAvatar.src = contributor.avatar_url;
            }
        });

        // Update DOM Stats
        document.getElementById('total-contributors').textContent = data.length;
        document.getElementById('total-commits').textContent = totalCommits;
        document.getElementById('total-points').textContent = totalPoints;
        document.getElementById('total-prs').textContent = Math.floor(totalCommits / 3); // Approximation: ~1 PR per 3 commits

        // FILTER: Remove Lead
        allContributors = data.filter(contributor => 
            contributor.login.toLowerCase() !== REPO_OWNER.toLowerCase()
        );

        // Render
        renderContributors(1);

    } catch (error) {
        console.error('Error fetching contributors:', error);
        document.getElementById('contributors-grid').innerHTML = '<p>Failed to load contributors.</p>';
    }
}

// Helper: Get Badge based on Points (Score)
function getBadge(commits) {
    const score = commits * 10;
    if (score >= 500) {
        return { text: 'Gold 🏆', class: 'badge-gold', tier: 'tier-gold', label: 'Gold League' };
    } else if (score >= 200) {
        return { text: 'Silver 🥈', class: 'badge-silver', tier: 'tier-silver', label: 'Silver League' };
    } else if (score >= 100) {
        return { text: 'Bronze 🥉', class: 'badge-bronze', tier: 'tier-bronze', label: 'Bronze League' };
    } else {
        return { text: 'Contributor 🚀', class: 'badge-contributor', tier: 'tier-contributor', label: 'Contributor' };
    }
}

// 3. Render Grid
function renderContributors(page) {
    const grid = document.getElementById('contributors-grid');
    grid.innerHTML = '';

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = allContributors.slice(start, end);

    if (paginatedItems.length === 0) {
        grid.innerHTML = '<p>No contributors found.</p>';
        return;
    }

    paginatedItems.forEach((contributor, index) => {
        const globalRank = start + index + 1; // Rank in the list
        const badgeData = getBadge(contributor.contributions);

        const card = document.createElement('div');
        card.className = `contributor-card ${badgeData.tier}`;
        card.onclick = () => openModal(contributor, badgeData, globalRank);

        card.innerHTML = `
            <img src="${contributor.avatar_url}" alt="${contributor.login}">
            <span class="cont-name">${contributor.login}</span>
            <span class="cont-commits-badge ${badgeData.class}">
                ${badgeData.text}
            </span>
        `;
        grid.appendChild(card);
    });

    renderPaginationControls(page);
}

function renderPaginationControls(page) {
    const container = document.getElementById('pagination-controls');
    const totalPages = Math.ceil(allContributors.length / itemsPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="changePage(${page - 1})">
            <i class="fas fa-chevron-left"></i> Prev
        </button>
        <span class="page-info">Page ${page} of ${totalPages}</span>
        <button class="pagination-btn" ${page === totalPages ? 'disabled' : ''} onclick="changePage(${page + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

window.changePage = function(newPage) {
    currentPage = newPage;
    renderContributors(newPage);
};

// 4. MODAL LOGIC (Updated Fields)
function openModal(contributor, badgeData, rank) {
    const modal = document.getElementById('contributor-modal');
    
    document.getElementById('modal-avatar').src = contributor.avatar_url;
    document.getElementById('modal-name').textContent = contributor.login;
    document.getElementById('modal-id').textContent = `ID: ${contributor.id}`; // GitHub ID
    
    document.getElementById('modal-rank').textContent = `#${rank}`;
    document.getElementById('modal-score').textContent = contributor.contributions * 10; // Score Logic
    document.getElementById('modal-league').textContent = badgeData.label.split(' ')[0]; // "Gold", "Silver"

    const prLink = `https://github.com/${REPO_OWNER}/${REPO_NAME}/pulls?q=is%3Apr+author%3A${contributor.login}`;
    document.getElementById('modal-pr-link').href = prLink;
    document.getElementById('modal-profile-link').href = contributor.html_url;

    modal.classList.add('active');
}

window.closeModal = function() {
    document.getElementById('contributor-modal').classList.remove('active');
}

document.getElementById('contributor-modal').addEventListener('click', (e) => {
    if(e.target.id === 'contributor-modal') closeModal();
});

// 5. Recent Activity
async function fetchRecentActivity() {
    try {
        const response = await fetch(`${API_BASE}/commits?per_page=10`);
        const commits = await response.json();
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = '';

        commits.forEach(item => {
            const date = new Date(item.commit.author.date).toLocaleDateString();
            const message = item.commit.message;
            const author = item.commit.author.name;

            const row = document.createElement('div');
            row.className = 'activity-item';
            row.innerHTML = `
                <div class="activity-marker"></div>
                <div class="commit-msg">
                    <span style="color: var(--accent-color)">${author}</span>: ${message}
                </div>
                <div class="commit-date">${date}</div>
            `;
            activityList.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
    }
}