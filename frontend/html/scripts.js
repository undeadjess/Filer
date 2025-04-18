// check for jwt token in local storage
const jwt = localStorage.getItem('jwt');

if (!jwt) {
    console.log("No JWT found, redirecting to login");
    window.location.href = '/login.html';
} else {
    console.log("JWT found, validating...");

    fetch('http://localhost:3000/files/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            console.log("JWT valid, loading files");
            initFileViewer();
        } else {
            console.log("Invalid JWT, redirecting to login");
            window.location.href = '/login.html';
        }
    })
    .catch(error => {
        console.error("JWT validation error:", error);
        window.location.href = '/login.html';
    });
}


function initFileViewer() {
    const path = window.location.pathname;
    if (path === '/' || path === '') {
        fetchAndRender([]);
        return;
    };
    const initialPath = path.split('/').filter(Boolean);

    fetch(`http://localhost:3000/files/${initialPath.join('/')}`, {
        headers: {
            'Authorization': `Bearer ${jwt}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Invalid initial path');
        return res.json();
    })
    .then(data => {
        updatePathBar(initialPath);
        renderFiles(data.files);
        setupPopStateListener();
    })
    .catch(err => {
        console.warn('Initial path invalid, falling back to root:', err);
        updatePathBar([]);
        fetchAndRender([]);
        setupPopStateListener();
    });
}


function fetchAndRender(pathArray) {
    const path = pathArray.join('/');
    window.history.pushState({ path: pathArray }, '', `/${path}`);

    fetch(`http://localhost:3000/files/${path}`, {
        headers: {
            'Authorization': `Bearer ${jwt}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to load path');
        return res.json();
    })
    .then(data => renderFiles(data.files))
    .catch(err => console.error('Fetch/render error:', err));
}

function renderFiles(files) {
    const container = document.querySelector('.file-list');
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.classList.add('file-grid');

    files.forEach(file => {
        const item = document.createElement('div');
        item.classList.add('file-item');
        item.innerHTML = `
            <div class="file-icon">${file.type === 'folder' ? '📁' : '📄'}</div>
            <div class="file-name">${file.name}</div>
        `;

        item.addEventListener('click', () => {
            if (file.type === 'folder') {
                const currentPath = getCurrentPathArray();
                openFolder([...currentPath, file.name]);
            } else {
                previewFile(file.name);
            }
        });

        grid.appendChild(item);
    });

    container.appendChild(grid);
}

function openFolder(pathArray) {
    updatePathBar(pathArray);
    fetchAndRender(pathArray);
}

function updatePathBar(pathArray) {
    const pathBar = document.querySelector('.path-bar');
    pathBar.innerHTML = '';

    const rootSpan = document.createElement('span');
    rootSpan.classList.add('path-item');
    rootSpan.innerHTML = `<h2>My Files</h2>`;

    rootSpan.addEventListener('click', () => {
        updatePathBar([]);
        fetchAndRender([]);
    });

    pathBar.appendChild(rootSpan);

    if (pathArray.length > 0) {
        const separator = document.createElement('span');
        separator.textContent = ' / ';
        pathBar.appendChild(separator);
    }

    pathArray.forEach((part, index) => {
        const span = document.createElement('span');
        span.classList.add('path-item');
        span.dataset.name = part;
        span.innerHTML = `<h2>${part}</h2>`;

        span.addEventListener('click', () => {
            const newPath = pathArray.slice(0, index + 1);
            updatePathBar(newPath);
            fetchAndRender(newPath);
        });

        pathBar.appendChild(span);

        if (index < pathArray.length - 1) {
            const sep = document.createElement('span');
            sep.textContent = ' / ';
            pathBar.appendChild(sep);
        }
    });
}


function getCurrentPathArray() {
    const items = document.querySelectorAll('.path-bar .path-item');
    return Array.from(items).slice(1).map(el => el.dataset.name);
}


function setupPopStateListener() {
    window.addEventListener('popstate', (e) => {
        const pathArray = e.state?.path || [];
        updatePathBar(pathArray);
        fetchAndRender(pathArray);
    });
}

function previewFile(fileName) {
    // TODO
    console.log('Previewing file:', fileName);
}
