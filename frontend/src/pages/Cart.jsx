import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go Shopping</Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: '2rem' }}>Shopping Cart</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.map(item => (
            <div key={item.PRODUCT_ID} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={item.IMAGE_URL || 'https://via.placeholder.com/100'} alt={item.PRODUCT_DESC} style={{ width: '80px', height: '80px', borderRadius: '0.5rem', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: '0.25rem' }}>{item.PRODUCT_DESC}</h4>
                <p style={{ color: 'var(--accent)', fontWeight: 'bold' }}>${item.PRICE}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', padding: '0.25rem' }}>
                  <button onClick={() => updateQuantity(item.PRODUCT_ID, item.quantity - 1)} className="btn" style={{ padding: '0.25rem' }}><Minus size={16} /></button>
                  <span style={{ width: '30px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.PRODUCT_ID, item.quantity + 1)} className="btn" style={{ padding: '0.25rem' }}><Plus size={16} /></button>
                </div>
                <button onClick={() => removeFromCart(item.PRODUCT_ID)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span>Shipping</span>
            <span style={{ color: 'var(--accent)' }}>Free</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <span style={{ fontWeight: 'bold' }}>Total</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--primary)' }}>${total.toFixed(2)}</span>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Checkout <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
