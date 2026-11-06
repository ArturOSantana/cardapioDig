const menu = [
  {
    id: "hamburgueres",
    title: "Hambúrgueres",
    items: [
      {
        id: "burger-individual",
        name: "Hambúrguer artesanal",
        detail: "Individual",
        price: 18,
      },
      {
        id: "burger-combo-1",
        name: "Hambúrguer artesanal",
        detail: "Combo 1 · sem refrigerante",
        price: 25,
      },
      {
        id: "burger-combo-2",
        name: "Hambúrguer artesanal",
        detail: "Combo 2 · com refrigerante lata",
        price: 30,
      },
    ],
  },
  {
    id: "porcoes",
    title: "Porções · 300 g",
    items: [
      {
        id: "calabresa",
        name: "Calabresa acebolada",
        detail: "Porção · 300 g",
        price: 15,
      },
      {
        id: "bolinho-mandioca",
        name: "Bolinho de mandioca",
        detail: "Porção · 300 g",
        price: 15,
      },
      {
        id: "frango",
        name: "Frango a passarinho",
        detail: "Porção · 300 g",
        price: 15,
      },
      {
        id: "combo-calabresa-mandioca",
        name: "Calabresa + mandioca",
        detail: "Combo",
        price: 25,
      },
    ],
  },
  {
    id: "outros",
    title: "Pra beliscar",
    items: [
      { id: "batata", name: "Batata", price: 10 },
      { id: "pastel", name: "Pastel", price: 12 },
      { id: "churros", name: "Churros", price: 10 },
      {
        id: "sorvete",
        name: "Sorvete",
        detail: "Consulte o valor no local",
        price: null,
      },
    ],
  },
  {
    id: "bebidas",
    title: "Bebidas",
    items: [
      { id: "refri-2l", name: "Refrigerante · 2 L", price: 15 },
      { id: "refri-lata", name: "Refrigerante · lata", price: 5 },
    ],
  },
];

const STORAGE_KEY = "baile-order-v1";
const allItems = menu.flatMap((category) => category.items);
const itemById = new Map(allItems.map((item) => [item.id, item]));
const quantities = loadOrder();
const menuContainer = document.querySelector("#menu-items");
const orderLines = document.querySelector("#order-lines");
const orderTotal = document.querySelector("#order-total");

function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const valid = {};
    for (const [id, quantity] of Object.entries(saved.quantities || {})) {
      if (itemById.has(id) && Number.isInteger(quantity) && quantity > 0) {
        valid[id] = Math.min(quantity, 99);
      }
    }
    return valid;
  } catch {
    return {};
  }
}

function saveOrder() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ quantities }));
  } catch {
    console.error("Não foi possível salvar a prévia neste aparelho.");
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function renderMenu() {
  menuContainer.innerHTML = menu
    .map(
      (category) => `
        <section class="menu-category" id="${category.id}" aria-labelledby="title-${category.id}">
          <h2 class="category-title" id="title-${category.id}">${category.title}</h2>
          ${category.items.map(renderMenuItem).join("")}
        </section>
      `,
    )
    .join("");
}

function renderMenuItem(item) {
  const quantity = quantities[item.id] || 0;
  const price = item.price === null
    ? '<span class="menu-price">A consultar</span>'
    : `<span class="menu-price">${formatPrice(item.price)}${item.id.startsWith("burger-") ? `<small>${item.id === "burger-individual" ? "individual" : "cada"}</small>` : ""}</span>`;
  const control = quantity === 0
    ? `<button class="add-button" type="button" data-action="add" data-id="${item.id}" aria-label="Adicionar ${item.name}${item.detail ? `, ${item.detail}` : ""}">+</button>`
    : `<div class="item-control">
         <button class="quantity-button" type="button" data-action="decrease" data-id="${item.id}" aria-label="Diminuir ${item.name}">−</button>
         <span class="quantity" aria-label="Quantidade: ${quantity}">${quantity}</span>
         <button class="quantity-button" type="button" data-action="increase" data-id="${item.id}" aria-label="Aumentar ${item.name}">+</button>
       </div>`;

  return `
    <article class="menu-card">
      <div class="menu-card-info">
        <h3>${item.name}</h3>
        ${item.detail ? `<p>${item.detail}</p>` : ""}
      </div>
      ${price}
      ${control}
    </article>
  `;
}

function getOrderEntries() {
  return Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => ({ item: itemById.get(id), quantity }));
}

function getTotal() {
  return getOrderEntries().reduce(
    (total, { item, quantity }) => total + (item.price || 0) * quantity,
    0,
  );
}

function renderOrder() {
  const entries = getOrderEntries();
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  if (entries.length === 0) {
    orderLines.innerHTML = `
      <div class="empty-order">
        <span class="empty-order-mark">+</span>
        <p>Marque seus favoritos.<br />O total aparece aqui.</p>
      </div>
    `;
  } else {
    orderLines.innerHTML = entries
      .map(({ item, quantity }) => `
        <div class="order-line">
          <span class="order-line-name">${quantity}× ${item.name}${item.detail ? ` <span>(${item.detail})</span>` : ""}</span>
          <span class="order-line-price">${item.price === null ? "A consultar" : formatPrice(item.price * quantity)}</span>
          <span class="order-line-sub">${item.price === null ? "Não incluído no total" : `${formatPrice(item.price)} cada`}</span>
        </div>
      `)
      .join("");
  }

  orderTotal.textContent = formatPrice(getTotal());
  document.querySelector("#header-count").textContent = String(totalQuantity);
  document.querySelector("#mobile-count").textContent =
    `${totalQuantity} ${totalQuantity === 1 ? "item" : "itens"}`;
  document.querySelector("#mobile-total").textContent = formatPrice(getTotal());
  document.querySelector("#clear-order").hidden = entries.length === 0;
}

function updateOrder() {
  renderMenu();
  renderOrder();
  saveOrder();
}

function changeQuantity(id, amount) {
  const current = quantities[id] || 0;
  const next = Math.max(0, Math.min(99, current + amount));
  if (next === 0) {
    delete quantities[id];
  } else {
    quantities[id] = next;
  }
  updateOrder();
}

menuContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const amount = button.dataset.action === "decrease" ? -1 : 1;
  changeQuantity(button.dataset.id, amount);
});

document.querySelector("#clear-order").addEventListener("click", () => {
  for (const id of Object.keys(quantities)) delete quantities[id];
  updateOrder();
});

renderMenu();
renderOrder();

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Não foi possível ativar o modo offline.", error);
    });
  });
}
