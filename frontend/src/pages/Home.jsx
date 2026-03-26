import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { Search, ShoppingCart } from 'lucide-react';
import Pagination from '../components/Pagination';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const { cart, addToCart, removeFromCart } = useCart();
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setPage(1); // Reset to page 1 on search/category change
  }, [search, category]);

  useEffect(() => {
    fetchProducts();
  }, [search, category, page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const res = await api.get(`/products?search=${search}&category=${category}&page=${page}&limit=12`);
    setProducts(res.data.products);
    setPages(res.data.pages);
  };

  const fetchCategories = async () => {
    const res = await api.get('/products/categories');
    setCategories(res.data.categories);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setStatusMessage(`${product.PRODUCT_DESC} added to cart`);
    setTimeout(() => setStatusMessage(''), 1800);
  };

  const handleRemoveFromCart = (productId, productDesc) => {
    removeFromCart(productId);
    setStatusMessage(`${productDesc} removed from cart`);
    setTimeout(() => setStatusMessage(''), 1800);
  };

  const isAdded = (productId) => cart.some((item) => item.PRODUCT_ID === productId);

  return (
    <div className="container fade-in">
      <section style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Discover Products</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          Explore our curated selection of high-quality goods with real-time stock tracking.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input
                type="text"
                placeholder="What are you looking for?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              style={{ flex: '0 0 200px' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.PRODUCT_CLASS_CODE} value={c.PRODUCT_CLASS_CODE}>{c.PRODUCT_CLASS_DESC}</option>
              ))}
            </select>
          </div>

          {statusMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                background: 'hsla(160, 84%, 39%, 0.15)', 
                color: 'var(--accent)', 
                border: '1px solid hsla(160, 84%, 39%, 0.2)',
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                alignSelf: 'center'
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
              {statusMessage}
            </motion.div>
          )}
        </div>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-4">
        {products.map((p, i) => (
          <motion.div
            key={p.PRODUCT_ID}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card product-card"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'calc(var(--radius-lg) - 4px)' }}>
              <img 
                src={p.IMAGE_URL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'} 
                alt={p.PRODUCT_DESC} 
                style={{ width: '100%', height: '220px', objectFit: 'cover' }} 
              />
              <span className="badge badge-pending" style={{ position: 'absolute', top: '10px', right: '10px', backdropFilter: 'blur(4px)' }}>
                {p.PRODUCT_CLASS_DESC}
              </span>
            </div>

            <div style={{ padding: '0.5rem 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.1rem' }}>{p.PRODUCT_DESC}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Stock: {p.STOCK} left</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text)' }}>${Number(p.PRICE).toFixed(2)}</span>
                
                {isAdded(p.PRODUCT_ID) ? (
                  <button
                    onClick={() => handleRemoveFromCart(p.PRODUCT_ID, p.PRODUCT_DESC)}
                    className="btn btn-ghost"
                    style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddToCart(p)}
                    className="btn btn-primary"
                    disabled={p.STOCK <= 0}
                  >
                    <ShoppingCart size={16} />
                    Add
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <Pagination 
        page={page} 
        pages={pages} 
        onPageChange={(p) => setPage(p)} 
      />
    </div>
  );
};

export default Home;
