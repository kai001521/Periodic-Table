const table = document.getElementById("table");
const filtersBox = document.getElementById("filters");
const infoRight = document.getElementById("info-right");
const backBtn = document.getElementById("back-btn");

let activeFilters = new Set();
let elementNodes = []; 

/* CATEGORY MAP */
const catClass = {
    "nonmetal": "nonmetal",
    "alkali metal": "alkali",
    "alkaline earth metal": "alkaline",
    "metalloid": "metalloid",
    "noble gas": "noble",
    "transition metal": "transition",
    "post-transition metal": "post",
    "halogen": "halogen",
    "lanthanide": "lanth",
    "actinide": "act"
};

/* LABELS */
const catLabels = {
    "nonmetal": "Non-Metals",
    "alkali metal": "Alkali Metals",
    "alkaline earth metal": "Alkaline Earth",
    "metalloid": "Metalloids",
    "noble gas": "Noble Gases",
    "transition metal": "Transition Metals",
    "post-transition metal": "Basic Metals",
    "halogen": "Halogens",
    "lanthanide": "Lanthanides",
    "actinide": "Actinides"
};

/* INIT RENDER */
function initTable(data) {
    table.innerHTML = "";
    elementNodes = [];

    data.forEach(el => {
        const d = document.createElement("div");
        const cls = catClass[el.category] || "transition";

        d.className = `element ${cls}`;
        d.style.gridColumn = el.col;
        d.style.gridRow = el.row;

        d.innerHTML = `
          <div class="atomic">${el.number}</div>
          <div class="symbol">${el.symbol}</div>
          <div class="name">${el.name}</div>
        `;

        // NEW: Enter globe mode on click
        d.onclick = (e) => {
            e.stopPropagation();
            if (!document.body.classList.contains("globe-active")) {
                enterGlobeMode(el, d);
            }
        };
        
        table.appendChild(d);
        elementNodes.push({ node: d, category: el.category });
    });

    // Inject Gap Placeholders for UI clarity
    const lanthPlaceholder = document.createElement("div");
    lanthPlaceholder.className = "element placeholder lanth";
    lanthPlaceholder.style.gridColumn = 3;
    lanthPlaceholder.style.gridRow = 6;
    lanthPlaceholder.innerHTML = `<span>57-71</span>`;
    table.appendChild(lanthPlaceholder);

    const actPlaceholder = document.createElement("div");
    actPlaceholder.className = "element placeholder act";
    actPlaceholder.style.gridColumn = 3;
    actPlaceholder.style.gridRow = 7;
    actPlaceholder.innerHTML = `<span>89-103</span>`;
    table.appendChild(actPlaceholder);
}

/* FILTERS */
function initFilters() {
    Object.keys(catLabels).forEach(cat => {
        const btn = document.createElement("div");
        btn.className = "filter";
        btn.innerText = catLabels[cat];

        btn.onclick = () => {
            if (activeFilters.has(cat)) {
                activeFilters.delete(cat);
                btn.classList.remove("active");
            } else {
                activeFilters.add(cat);
                btn.classList.add("active");
            }
            applyFilters();
        };

        filtersBox.appendChild(btn);
    });
}

function applyFilters() {
    if (activeFilters.size === 0) {
        elementNodes.forEach(item => {
            item.node.classList.remove("faded");
        });
        return;
    }
    
    elementNodes.forEach(item => {
        if (activeFilters.has(item.category)) {
            item.node.classList.remove("faded");
        } else {
            item.node.classList.add("faded");
        }
    });
}

/* NEW: GLOBE MODE LOGIC */
function enterGlobeMode(el, card) {
    if (card.classList.contains("faded")) return; 

    // Trigger state change
    document.body.classList.add("globe-active");
    
    // Add routing state for Native Back Button / Swipes
    history.pushState({ globe: true }, "");

    // 1. Build Right Information Panel
    const color = getComputedStyle(card).color;
    infoRight.style.setProperty('--panel-color', color);
    
    infoRight.innerHTML = `
      <div class="panel-header">
        <div class="clone" style="color:${color}; border-color:${color}; box-shadow: 0 0 25px ${color}60;">
          ${el.number}${el.symbol}
        </div>
        <div class="panel-titles">
          <strong style="color:${color};">${el.name}</strong><br>
          <small>${catLabels[el.category]}</small>
        </div>
      </div>
      <h3>Description</h3>
      <p>${el.desc}</p>
      <h3>Uses</h3>
      <p>${el.uses}</p>
      <h3>Pros</h3>
      <p>${el.pros}</p>
      <h3>Cons</h3>
      <p>${el.cons}</p>
    `;

    // 2. Setup the 3D Sphere for non-selected elements
    // Determine responsive radius
    const isMobile = window.innerWidth <= 768;
    const radius = isMobile ? 120 : (window.innerHeight < 700 ? 180 : 260);
    
    // Only map visible (unfiltered) nodes to the sphere
    const activeSphereItems = elementNodes.filter(n => n.node !== card && !n.node.classList.contains("faded"));
    const hiddenSphereItems = elementNodes.filter(n => n.node !== card && n.node.classList.contains("faded"));
    
    const N = activeSphereItems.length;

    card.classList.add("hidden-globe-target");

    // Hide faded items completely from the sphere
    hiddenSphereItems.forEach(item => {
        item.node.style.transform = `scale(0)`;
    });

    // Fibonacci Sphere Math mapping
    activeSphereItems.forEach((item, i) => {
        const node = item.node;
        const phi = Math.acos(1 - 2 * (i + 0.5) / N);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        
        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(theta) * Math.sin(phi);
        
        node.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
    });
}

function exitGlobeMode() {
    document.body.classList.remove("globe-active");
    
    // Reset all inline styles so elements snap back to Grid CSS
    elementNodes.forEach(item => {
        const node = item.node;
        node.classList.remove("hidden-globe-target");
        node.style.transform = "";
    });
}

// Visual Back Button listener
backBtn.addEventListener("click", () => {
    history.back(); // Triggers the popstate event natively
});

// Native Browser Back / Swipe Event listener
window.addEventListener("popstate", (e) => {
    if (document.body.classList.contains("globe-active")) {
        exitGlobeMode();
    }
});

/* INIT RUN */
initTable(elements);
initFilters();