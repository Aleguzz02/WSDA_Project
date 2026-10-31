document.addEventListener("DOMContentLoaded", () => {
    // --- STATO DELL'APPLICAZIONE ---
    const cart = [];

    let products = [];

    // --- ELEMENTI DEL DOM ---
    const productsContainer = document.getElementById("products");
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    const categoryFilter = document.getElementById("category-filter");
    const btnResetFilters = document.getElementById("btn-reset-filters");
    const btnLoadMore = document.getElementById("btn-load-more");

    // Elementi del carrello
    const cartContainer = document.getElementById("cart-items-container");
    const cartTotalAmount = document.getElementById("cart-total-amount");
    const btnCartCheckout = document.getElementById("btn-cart-checkout");

    // Modali
    const modalInfo = document.getElementById("modal-info");
    const modalInfoTitle = document.getElementById("modal-info-title");
    const modalInfoImg = document.getElementById("modal-info-img");
    const modalInfoDesc = document.getElementById("modal-info-desc");
    const modalInfoPrice = document.getElementById("modal-info-price");
    const btnCloseInfo = document.getElementById("btn-close-info");

    const modalCart = document.getElementById("modal-cart");
    const modalCartMsg = document.getElementById("modal-cart-msg");
    const btnCloseCart = document.getElementById("btn-close-cart");

    // ==========================================================================
    // FUNZIONI GESTIONE CARRELLO
    // ==========================================================================

    /**
     * Aggiunge un prodotto al carrello o incrementa la quantità se già presente
     * @param {number} productId
     */
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const cartItem = cart.find(item => item.productId === productId);

        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cart.push({
                productId: productId,
                quantity: 1
            });
        }

        renderCart();

        // Feedback utente tramite modale
        modalCartMsg.textContent = `"${product.name}" è stato aggiunto al carrello (Quantità: ${cartItem ? cartItem.quantity : 1}).`;
        modalCart.showModal();
    }

    /**
     * Rimuove completamente un prodotto dal carrello
     * @param {number} productId
     */
    function removeFromCart(productId) {
        const itemIndex = cart.findIndex(item => item.productId === productId);
        if (itemIndex !== -1) {
            cart.splice(itemIndex, 1);
            renderCart();
        }
    }

    /**
     * Modifica la quantità (+1 o -1); se scende a 0 rimuove il prodotto
     * @param {number} productId
     * @param {number} amount
     */
    function changeQuantity(productId, amount) {
        const cartItem = cart.find(item => item.productId === productId);
        if (!cartItem) return;

        cartItem.quantity += amount;

        if (cartItem.quantity <= 0) {
            removeFromCart(productId);
        } else {
            renderCart();
        }
    }

    /**
     * Genera il contenuto del carrello nel pannello laterale
     */
    function renderCart() {
        cartContainer.innerHTML = "";

        if (cart.length === 0) {
            cartContainer.innerHTML = `<p class="cart-empty-msg">Il carrello è vuoto.</p>`;
            cartTotalAmount.textContent = "0.00";
            btnCartCheckout.disabled = true;
            return;
        }

        let total = 0;

        cart.forEach((item) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return;

            const subtotal = product.price * item.quantity;
            total += subtotal;

            const row = document.createElement("div");
            row.className = "cart-row";
            row.innerHTML = `
                <div class="cart-row-header">
                    <span class="cart-row-title">${product.name}</span>
                    <button type="button" class="cart-row-remove" title="Rimuovi" data-id="${item.productId}">✕</button>
                </div>
                <div class="cart-row-meta">
                    Prezzo: € ${product.price.toFixed(2)}
                </div>
                <div class="cart-row-controls">
                    <div class="qty-stepper">
                        <button type="button" class="btn-qty-minus" data-id="${item.productId}">-</button>
                        <span>${item.quantity}</span>
                        <button type="button" class="btn-qty-plus" data-id="${item.productId}">+</button>
                    </div>
                    <span class="cart-row-subtotal">€ ${subtotal.toFixed(2)}</span>
                </div>
            `;

            cartContainer.appendChild(row);
        });

        cartTotalAmount.textContent = total.toFixed(2);
        btnCartCheckout.disabled = false;

        attachCartEvents();
    }

    /**
     * Assegna i listener ai pulsanti dinamici (+, -, X) del carrello
     */
    function attachCartEvents() {
        // Tasto +
        cartContainer.querySelectorAll(".btn-qty-plus").forEach(btn => {
            btn.addEventListener("click", () => {
                changeQuantity(parseInt(btn.dataset.id, 10), 1);
            });
        });

        // Tasto -
        cartContainer.querySelectorAll(".btn-qty-minus").forEach(btn => {
            btn.addEventListener("click", () => {
                changeQuantity(parseInt(btn.dataset.id, 10), -1);
            });
        });

        // Tasto Rimuovi (X)
        cartContainer.querySelectorAll(".cart-row-remove").forEach(btn => {
            btn.addEventListener("click", () => {
                removeFromCart(parseInt(btn.dataset.id, 10));
            });
        });
    }

    // ==========================================================================
    // FUNZIONI CATALOGO E FILTRI
    // ==========================================================================

    function loadProductsFromXML(xmlUrl, callback = null) {
        fetch(xmlUrl)
            .then(response => {
                if (!response.ok) throw new Error("Errore di rete");
                return response.text();
            })
            .then(xmlString => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, "application/xml");
                const productNodes = xmlDoc.querySelectorAll("product");

                productNodes.forEach(item => {
                    products.push({
                        id: parseInt(item.getAttribute("id"), 10),
                        name: item.querySelector("name").textContent,
                        category: item.querySelector("category").textContent,
                        price: parseFloat(item.querySelector("price").textContent),
                        stock: parseInt(item.querySelector("stock").textContent, 10),
                        image: item.querySelector("image").textContent,
                        description: item.querySelector("description").textContent
                    });
                });

                filterProducts();
                if (callback) callback();
            })
            .catch(() => {
                alert("Errore durante il caricamento del catalogo prodotti (" + xmlUrl + ").");
            });
    }

    function renderProducts(items) {
        productsContainer.innerHTML = "";

        if (!items || items.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-results">
                    <h4>Nessun prodotto trovato</h4>
                    <p>Nessun articolo corrisponde ai filtri impostati.</p>
                </div>
            `;
            return;
        }

        items.forEach((item) => {
            const article = document.createElement("article");
            article.className = "product-card";
            article.dataset.id = item.id;

            article.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <h4>${item.name}</h4>
                <p class="desc">${item.description}</p>
                <p class="price">€ ${item.price.toFixed(2)}</p>
                <p class="stock"><small>Disponibilità: ${item.stock} pz | Cat: ${item.category}</small></p>
                <div class="card-actions">
                    <button type="button" class="btn-info">Maggiori informazioni</button>
                    <button type="button" class="btn-add">Aggiungi al carrello</button>
                </div>
            `;

            productsContainer.appendChild(article);
        });

        attachProductCardEvents();
    }

    function filterProducts() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCategory = categoryFilter.value;

        const filtered = products.filter((product) => {
            const matchesName = product.name.toLowerCase().includes(searchTerm);
            const matchesCategory = (selectedCategory === "all") || (product.category.toLowerCase() === selectedCategory.toLowerCase());
            return matchesName && matchesCategory;
        });

        renderProducts(filtered);
    }

    function resetFilters() {
        searchInput.value = "";
        categoryFilter.value = "all";
        renderProducts(products);
    }

    function attachProductCardEvents() {
        // Maggiori informazioni
        productsContainer.querySelectorAll(".btn-info").forEach((button) => {
            button.addEventListener("click", (e) => {
                const card = e.target.closest(".product-card");
                const productId = parseInt(card.dataset.id, 10);
                const product = products.find(p => p.id === productId);

                if (product) {
                    modalInfoTitle.textContent = product.name;
                    modalInfoImg.src = product.image;
                    modalInfoDesc.textContent = product.description;
                    modalInfoPrice.textContent = "€ " + product.price.toFixed(2);
                    modalInfo.showModal();
                }
            });
        });

        // Aggiungi al carrello (invoca addToCart)
        productsContainer.querySelectorAll(".btn-add").forEach((button) => {
            button.addEventListener("click", (e) => {
                const card = e.target.closest(".product-card");
                const productId = parseInt(card.dataset.id, 10);
                addToCart(productId);
            });
        });
    }

    // ==========================================================================
    // LISTENERS GENERALI E AVVIO
    // ==========================================================================

    searchInput.addEventListener("input", filterProducts);
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        filterProducts();
    });
    categoryFilter.addEventListener("change", filterProducts);
    btnResetFilters.addEventListener("click", resetFilters);

    btnCloseInfo.addEventListener("click", () => modalInfo.close());
    btnCloseCart.addEventListener("click", () => modalCart.close());

    if (btnLoadMore) {
        btnLoadMore.addEventListener("click", () => {
            loadProductsFromXML("data/products-data2.xml", () => {
                btnLoadMore.disabled = true;
                btnLoadMore.textContent = "Tutti i prodotti caricati";
            });
        });
    }

    // Caricamento iniziale
    loadProductsFromXML("data/products-data1.xml");
    renderCart();
});