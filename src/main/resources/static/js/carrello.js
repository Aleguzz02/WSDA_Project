document.addEventListener("DOMContentLoaded", () => {
    // --- STATO DEL CARRELLO ---
    let cartItems = [];

    // --- RIFERIMENTI DOM ---
    const cartList = document.getElementById("cart-list");
    const totalItemsSpan = document.getElementById("total-items");
    const cartTotalSpan = document.getElementById("cart-total");
    const btnCheckout = document.getElementById("btn-checkout");

    /**
     * Carica i dati iniziali del carrello dal file XML
     */
    function loadCartFromXML(xmlUrl) {
        fetch(xmlUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Errore di rete durante il caricamento del carrello");
                }
                return response.text();
            })
            .then(xmlString => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, "application/xml");
                const items = xmlDoc.querySelectorAll("item");

                cartItems = [];
                items.forEach(node => {
                    cartItems.push({
                        productId: parseInt(node.getAttribute("productId"), 10),
                        name: node.querySelector("name").textContent,
                        price: parseFloat(node.querySelector("price").textContent),
                        quantity: parseInt(node.querySelector("quantity").textContent, 10),
                        image: node.querySelector("image").textContent,
                        desc: node.querySelector("desc") ? node.querySelector("desc").textContent : ""
                    });
                });

                renderCart();
            })
            .catch(() => {
                cartList.innerHTML = '<p class="cart-empty-msg">Impossibile caricare i dati del carrello.</p>';
            });
    }

    /**
     * Incrementa o decrementa la quantità di un prodotto
     */
    function changeQuantity(productId, amount) {
        const item = cartItems.find(i => i.productId === productId);
        if (!item) return;

        item.quantity += amount;

        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            renderCart();
        }
    }

    /**
     * Rimuove un articolo dal carrello
     */
    function removeFromCart(productId) {
        cartItems = cartItems.filter(i => i.productId !== productId);
        renderCart();
    }

    /**
     * Genera dinamicamente le righe del carrello e aggiorna i totali
     */
    function renderCart() {
        cartList.innerHTML = "";

        if (cartItems.length === 0) {
            cartList.innerHTML = '<p class="cart-empty-msg" style="padding: 30px 0; text-align: center; color: var(--text-muted);">Il tuo carrello è vuoto.</p>';
            totalItemsSpan.textContent = "0";
            cartTotalSpan.textContent = "0.00";
            if (btnCheckout) btnCheckout.disabled = true;
            return;
        }

        let totalQty = 0;
        let grandTotal = 0;

        cartItems.forEach(item => {
            const subtotal = item.price * item.quantity;
            totalQty += item.quantity;
            grandTotal += subtotal;

            const article = document.createElement("article");
            article.className = "cart-item";
            article.dataset.productId = item.productId;

            article.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="desc">${item.desc}</p>
                    <p class="unit-price">Prezzo unitario: € <span>${item.price.toFixed(2)}</span></p>
                </div>
                <div class="cart-item-quantity">
                    <label>Quantità:</label>
                    <div class="qty-stepper">
                        <button type="button" class="btn-qty-minus" data-id="${item.productId}">-</button>
                        <span>${item.quantity}</span>
                        <button type="button" class="btn-qty-plus" data-id="${item.productId}">+</button>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-subtotal">
                        <p>Subtotale: <strong>€ <span class="subtotal-val">${subtotal.toFixed(2)}</span></strong></p>
                    </div>
                    <button type="button" class="btn-remove-item" data-id="${item.productId}">Rimuovi</button>
                </div>
            `;

            cartList.appendChild(article);
        });

        // Aggiornamento riepilogo laterale
        totalItemsSpan.textContent = totalQty;
        cartTotalSpan.textContent = grandTotal.toFixed(2);
        if (btnCheckout) btnCheckout.disabled = false;

        attachEvents();
    }

    /**
     * Associa gli ascoltatori agli elementi interattivi (+, -, Rimuovi)
     */
    function attachEvents() {
        cartList.querySelectorAll(".btn-qty-plus").forEach(btn => {
            btn.addEventListener("click", () => {
                changeQuantity(parseInt(btn.dataset.id, 10), 1);
            });
        });

        cartList.querySelectorAll(".btn-qty-minus").forEach(btn => {
            btn.addEventListener("click", () => {
                changeQuantity(parseInt(btn.dataset.id, 10), -1);
            });
        });

        cartList.querySelectorAll(".btn-remove-item").forEach(btn => {
            btn.addEventListener("click", () => {
                removeFromCart(parseInt(btn.dataset.id, 10));
            });
        });
    }

    // Caricamento iniziale dal file XML
    loadCartFromXML("data/cart-data.xml");
});