
const App = (function(){
  // Mock product database
  const PRODUCTS_KEY = 'aurora_products_v1';
  const CART_KEY = 'aurora_cart_v1';
  const ORDERS_KEY = 'aurora_orders_v1';

  const sampleProducts = [
    {id: 'p1', title: 'Linen Summer Shirt', price: 199000, stock: {S:5, M:8, L:4}, img:'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=60', desc:'Lightweight linen shirt, perfect for summer.'},
    {id: 'p2', title: 'Relaxed Fit Tee', price: 129000, stock: {S:10, M:6, L:6}, img:'https://images.unsplash.com/photo-1520975698518-0b3c3bf8fbe5?auto=format&fit=crop&w=800&q=60', desc:'Soft cotton tee with relaxed fit.'},
    {id: 'p3', title: 'Everyday Hoodie', price: 249000, stock: {S:3, M:5, L:2}, img:'https://images.unsplash.com/photo-1520975698528-0c3c3bf8fbe5?auto=format&fit=crop&w=800&q=60', desc:'Cozy hoodie for daily wear.'},
    {id: 'p4', title: 'Tailored Chino', price: 179000, stock: {S:7, M:7, L:7}, img:'https://images.unsplash.com/photo-1556909216-5e0c1f5b7f0b?auto=format&fit=crop&w=800&q=60', desc:'Smart casual chinos.'}
  ];

  // Helpers
  function formatIDR(n){ return 'Rp' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function loadProducts(){
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if(raw) return JSON.parse(raw);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(sampleProducts));
    return sampleProducts;
  }
  function saveProducts(products){ localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }

  function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
  function clearCart(){ localStorage.removeItem(CART_KEY); }

  function getOrders(){ return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
  function saveOrders(o){ localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }

  // Catalog
  function initCatalog(){
    const products = loadProducts();
    renderCatalog(products);
  }

  function renderCatalog(products){
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = '';
    products.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'bg-white rounded-2xl p-4 shadow';
      card.innerHTML = `
        <a href="product.html?id=${p.id}" class="block">
          <img src="${p.img}" alt="${p.title}" class="w-full h-48 object-cover rounded-lg mb-3">
          <h4 class="font-semibold">${p.title}</h4>
        </a>
        <div class="mt-2 flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">Starting</div>
            <div class="font-bold">${formatIDR(p.price)}</div>
          </div>
          <button data-id="${p.id}" class="add-to-cart px-3 py-1 bg-indigo-600 text-white rounded-md">Add</button>
        </div>
      `;
      grid.appendChild(card);
    });

    // attach handlers
    document.querySelectorAll('.add-to-cart').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id; addToCart(id, 'M', 1); // default size M
        App.updateNavCartCount();
        btn.textContent = 'Added'; setTimeout(()=>btn.textContent='Add',900);
      });
    });
  }

  function sortCatalog(mode){
    let products = loadProducts();
    if(mode==='price-asc') products.sort((a,b)=>a.price-b.price);
    if(mode==='price-desc') products.sort((a,b)=>b.price-a.price);
    renderCatalog(products);
  }

  // Product page
  function initProductPage(){
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const products = loadProducts();
    const p = products.find(x=>x.id===id) || products[0];
    const container = document.getElementById('product-detail');
    container.innerHTML = `
      <div class=\"grid md:grid-cols-2 gap-6\">
        <div>
          <img src=\"${p.img}\" class=\"w-full h-96 object-cover rounded-lg\" />
        </div>
        <div>
          <h2 class=\"text-2xl font-bold\">${p.title}</h2>
          <p class=\"text-gray-600 mt-2\">${p.desc}</p>
          <div class=\"mt-4\"><span class=\"text-2xl font-semibold\">${formatIDR(p.price)}</span></div>

          <div class=\"mt-4\">
            <label class=\"block text-sm font-medium\">Size</label>
            <select id=\"size-select\" class=\"mt-1 border rounded-md px-3 py-2\">
            </select>
          </div>

          <div class=\"mt-6 flex gap-3\">
            <button id=\"add-btn\" class=\"px-4 py-2 bg-indigo-600 text-white rounded-md\">Add to Cart</button>
            <button id=\"preorder-btn\" class=\"px-4 py-2 border rounded-md\">Pre-order (DP)</button>
          </div>
          <div id=\"stock-note\" class=\"mt-4 text-sm text-gray-600\"></div>
        </div>
      </div>
    `;

    // populate sizes and stock
    const sel = document.getElementById('size-select');
    sel.innerHTML = '';
    Object.keys(p.stock).forEach(s=>{
      sel.innerHTML += <option value="${s}">${s} — ${p.stock[s]} available</option>;
    });

    document.getElementById('add-btn').addEventListener('click', ()=>{
      const size = sel.value; addToCart(p.id, size, 1); App.updateNavCartCount();
      document.getElementById('stock-note').textContent = 'Item added to cart.';
    });

    document.getElementById('preorder-btn').addEventListener('click', ()=>{
      const size = sel.value; addToCart(p.id, size, 1, true); App.updateNavCartCount();
      document.getElementById('stock-note').textContent = 'Pre-order placed to cart (DP).';
    });
  }

  // Cart functions
  function addToCart(id, size, qty=1, preorder=false){
    const products = loadProducts();
    const p = products.find(x=>x.id===id);
    if(!p) return alert('Product not found');
    const cart = getCart();
    const existing = cart.find(i=>i.id===id && i.size===size && i.preorder===preorder);
    if(existing){ existing.qty += qty; }
    else { cart.push({id, size, qty, preorder}); }
    saveCart(cart);
  }

  function renderCart(){
    const cart = getCart();
    const products = loadProducts();
    const list = document.getElementById('cart-list');
    const totalEl = document.getElementById('cart-total');
    if(!list) return;
    list.innerHTML = '';
    let total = 0;
    if(cart.length===0){ list.innerHTML = '<p class="text-gray-600">Your cart is empty.</p>'; totalEl.textContent='Rp0'; document.getElementById('checkout-btn').classList.add('opacity-50'); }
    cart.forEach(item=>{
      const p = products.find(x=>x.id===item.id);
      const row = document.createElement('div');
      row.className = 'flex items-center gap-4 border-b pb-4';
      const lineTotal = p.price * item.qty;
      total += lineTotal;
      row.innerHTML = `
        <img src="${p.img}" class="w-20 h-20 object-cover rounded">
        <div class="flex-1">
          <div class="font-semibold">${p.title} <span class="text-sm text-gray-500">(${item.size}${item.preorder?', Pre-order':''})</span></div>
          <div class="text-sm text-gray-600">${formatIDR(p.price)} x ${item.qty} = ${formatIDR(lineTotal)}</div>
        </div>
        <div class="flex items-center gap-2">
          <button class="qty-dec px-3 py-1 border rounded" data-id="${item.id}" data-size="${item.size}" data-pre="${item.preorder}">-</button>
          <div>${item.qty}</div>
          <button class="qty-inc px-3 py-1 border rounded" data-id="${item.id}" data-size="${item.size}" data-pre="${item.preorder}">+</button>
          <button class="remove px-3 py-1 text-sm text-red-600" data-id="${item.id}" data-size="${item.size}" data-pre="${item.preorder}">Remove</button>
        </div>
      `;
      list.appendChild(row);
    });
    totalEl.textContent = formatIDR(total);

    // attach handlers
    document.querySelectorAll('.qty-inc').forEach(btn=> btn.addEventListener('click', ()=>{ modifyQty(btn.dataset,1); }));
    document.querySelectorAll('.qty-dec').forEach(btn=> btn.addEventListener('click', ()=>{ modifyQty(btn.dataset,-1); }));
    document.querySelectorAll('.remove').forEach(btn=> btn.addEventListener('click', ()=>{ removeItem(btn.dataset); }));
  }

  function modifyQty(dataset, delta){
    const id = dataset.id; const size = dataset.size; const pre = (dataset.pre==='true');
    const cart = getCart();
    const item = cart.find(i=>i.id===id && i.size===size && i.preorder===pre);
    if(!item) return;
    item.qty += delta; if(item.qty<=0) { const idx = cart.indexOf(item); cart.splice(idx,1); }
    saveCart(cart); renderCart(); updateNavCartCount();
  }
  function removeItem(dataset){ modifyQty(dataset, -999); }

  function updateNavCartCount(){
    const cart = getCart();
    const total = cart.reduce((s,i)=>s+i.qty,0);
    document.querySelectorAll('#nav-cart-count, #nav-cart-count-2').forEach(el=>el.textContent = total);
  }

  // Checkout
  function initCheckout(){
    const cart = getCart();
    const total = cart.reduce((s,i)=>{
      const p = loadProducts().find(x=>x.id===i.id); return s + (p.price * i.qty);
    },0);
    document.getElementById('checkout-total').textContent = formatIDR(total);

    document.getElementById('checkout-form').addEventListener('submit', (e)=>{
      e.preventDefault();
      if(cart.length===0) return alert('Cart empty');
      const fd = new FormData(e.target);
      const order = {
        id: 'ORD' + Math.random().toString(36).slice(2,9).toUpperCase(),
        name: fd.get('name'), phone: fd.get('phone'), address: fd.get('address'), courier: fd.get('courier'),
        items: cart, total: total, status: 'Processing', createdAt: new Date().toISOString()
      };
      // reduce stock for non-preorder items
      const products = loadProducts();
      order.items.forEach(it=>{
        if(!it.preorder){
          const prod = products.find(p=>p.id===it.id);
          if(prod && prod.stock[it.size]!==undefined) prod.stock[it.size] = Math.max(0, prod.stock[it.size] - it.qty);
        }
      });
      saveProducts(products);

      const orders = getOrders(); orders.push(order); saveOrders(orders);
      clearCart(); updateNavCartCount();
      document.getElementById('checkout-result').classList.remove('hidden');
      document.getElementById('order-id').textContent = order.id;
      document.getElementById('go-to-order').addEventListener('click', ()=> location.href = 'order.html?order=' + order.id);
    });
  }

  // Order tracking
  function initOrderTrack(){
    const form = document.getElementById('track-form');
    form.addEventListener('submit', (e)=>{
      e.preventDefault(); const id = document.getElementById('track-input').value.trim(); showTrack(id);
    });
    // If order id in query param
    const params = new URLSearchParams(location.search); const q = params.get('order'); if(q) showTrack(q);
  }
  function showTrack(id){
    const orders = getOrders(); const order = orders.find(o=>o.id===id);
    const container = document.getElementById('track-result');
    if(!order){ container.className='mt-6'; container.innerHTML = '<div class="p-4 bg-red-50 border rounded">Order not found</div>'; return; }
    container.className='mt-6';
    container.innerHTML = `
      <div class="p-4 bg-white border rounded">
        <div class="flex justify-between items-center">
          <div>
            <div class="text-sm text-gray-500">Order</div>
            <div class="font-semibold">${order.id}</div>
            <div class="text-sm text-gray-600">${new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-500">Status</div>
            <div class="font-semibold">${order.status}</div>
          </div>
        </div>
        <hr class="my-3">
        <div>
          ${order.items.map(it=>{
            const p = loadProducts().find(x=>x.id===it.id);
            return <div class="flex items-center gap-3\">
              <img src= "${p.img}" class= "w-16 h-16 object-cover rounded"/><div>
              <div class= "font-semibold">${p.title}</div>
              <div class= "text-sm text-gray-600">${it.size} x ${it.qty}${it.preorder? ' (Pre-order)' : ''}</div>
            </div>
          </div>
          }).join('<hr class="my-3">')}
        </div>
        <div class="mt-4 text-sm text-gray-600">Courier: ${order.courier}</div>
      </div>
    `;
  }

  // Admin
  function initAdmin(){
    const products = loadProducts();
    const prodEl = document.getElementById('admin-products');
    prodEl.innerHTML = '';
    products.forEach(p=>{
      const el = document.createElement('div'); el.className='border p-4 rounded';
      el.innerHTML = `
        <div class="flex items-center gap-4">
          <img src="${p.img}" class="w-20 h-20 object-cover rounded">
          <div class="flex-1">
            <div class="font-semibold">${p.title}</div>
            <div class="text-sm text-gray-600">${formatIDR(p.price)}</div>
            <div class="text-sm mt-2">Stock: S:${p.stock.S} M:${p.stock.M} L:${p.stock.L}</div>
          </div>
          <div class="flex flex-col gap-2">
            <button class="increase-stock px-3 py-1 border rounded" data-id="${p.id}">+Stock</button>
            <button class="decrease-stock px-3 py-1 border rounded" data-id="${p.id}">-Stock</button>
          </div>
        </div>
      `;
      prodEl.appendChild(el);
    });

    document.querySelectorAll('.increase-stock').forEach(b=> b.addEventListener('click', ()=>{
      const id = b.dataset.id; changeStock(id,1);
    }));
    document.querySelectorAll('.decrease-stock').forEach(b=> b.addEventListener('click', ()=>{
      const id = b.dataset.id; changeStock(id,-1);
    }));

    renderAdminOrders();
  }
  function changeStock(id, delta){
    const products = loadProducts(); const p = products.find(x=>x.id===id);
    if(!p) return; p.stock.S = Math.max(0,p.stock.S + delta); p.stock.M = Math.max(0,p.stock.M + delta); p.stock.L = Math.max(0,p.stock.L + delta); saveProducts(products); initAdmin();
  }
  function renderAdminOrders(){
    const orders = getOrders(); 
    const el = document.getElementById('admin-orders'); 
    el.innerHTML='';

    if(orders.length===0) {
      el.innerHTML = '<div class="text-sm text-gray-600">No orders yet.</div>';
      return;
    }

    orders.slice().reverse().forEach(o => {
      const div = document.createElement('div'); 
      div.className='border p-3 rounded';

      div.innerHTML = `
        <div class= "flex justify-between items-center">
          <div>
            <div class="font-semibold">${o.id}</div>
            <div class="text-sm text-gray-600">${o.name} • ${formatIDR(o.total)}</div>
        </div>
      <div>
        <select data-id= "${o.id}" class= "status-select border rounded px-2 py-1 text-sm">
        <option value="Processing" ${o.status==='Processing'?'selected':''}> Processing < option>
        <option value="Packed" ${o.status==='Packed'?'selected':''}>Packed</option>
        <option value="Shipped" ${o.status==='Shipped'?'selected':''}>Shipped</option>
        <option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option>
        </select>
        </div>
      </div>
      `;

      el.appendChild(div);
    });
    document.querySelectorAll('.status-select').forEach(s=> s.addEventListener('change', ()=>{
      const id = s.dataset.id; const orders = getOrders(); const o = orders.find(x=>x.id===id); o.status = s.value; saveOrders(orders); alert('Status updated');
    }));
  }

  return {
    initCatalog, initProductPage, renderCart, initCheckout, initOrderTrack, initAdmin, sortCatalog, updateNavCartCount
  };
})();
