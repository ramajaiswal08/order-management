import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { Plus, Check, ChevronRight } from 'lucide-react';

const Checkout = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: '', line1: '', line2: '', city: '', pincode: '', state: '', isDefault: false });
  const [addressStatus, setAddressStatus] = useState('');
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    const res = await api.get('/addresses');
    setAddresses(res.data.addresses);
    setSelectedAddress(prev => prev || (res.data.addresses.length > 0 ? res.data.addresses[0].ADDRESS_ID : null));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const body = {
        label: newAddr.label || 'Home',
        line1: newAddr.line1,
        line2: newAddr.line2,
        city: newAddr.city,
        state: newAddr.state,
        pincode: newAddr.pincode,
        isDefault: newAddr.isDefault || addresses.length === 0
      };
      const res = await api.post('/addresses', body);
      setAddressStatus('Address saved successfully');
      setShowAdd(false);
      setNewAddr({ label: '', line1: '', line2: '', city: '', pincode: '', state: '', isDefault: false });
      await fetchAddresses();
      if (res.data.addressId) setSelectedAddress(res.data.addressId);
      setTimeout(() => setAddressStatus(''), 2500);
    } catch (err) {
      setAddressStatus(err.message || 'Unable to save address');
      setTimeout(() => setAddressStatus(''), 3000);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/addresses/${addressId}`);
      const res = await api.get('/addresses');
      // res.data is { addresses }
      const refreshed = res.data.addresses;
      setAddresses(refreshed);
      if (addressId === selectedAddress) {
        setSelectedAddress(refreshed.length > 0 ? refreshed[0].ADDRESS_ID : null);
      }
      setAddressStatus('Address removed');
      setTimeout(() => setAddressStatus(''), 2500);
    } catch (err) {
      setAddressStatus(err.message || 'Unable to delete address');
      setTimeout(() => setAddressStatus(''), 3000);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const items = cart.map(it => ({ productId: it.PRODUCT_ID, quantity: it.quantity, price: it.PRICE }));
      await api.post('/orders', { items, totalAmount: total, shippingAddressId: selectedAddress });
      clearCart();
      navigate('/orders');
    } catch (err) {
      alert(err.message || 'Order failed');
    }
  };

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: '2rem' }}>Checkout</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Shipping Address</h3>
            <button onClick={() => setShowAdd(!showAdd)} className="btn" style={{ color: 'var(--primary)' }}>
              <Plus size={20} /> Add New
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleAddAddress} className="glass-card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input placeholder="Label (Home/Work)" value={newAddr.label} onChange={e => setNewAddr({...newAddr, label: e.target.value})} style={{ gridColumn: 'span 2', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }} />
                <input placeholder="Address Line 1" required value={newAddr.line1} onChange={e => setNewAddr({...newAddr, line1: e.target.value})} style={{ gridColumn: 'span 2', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }} />
                <input placeholder="Address Line 2" value={newAddr.line2} onChange={e => setNewAddr({...newAddr, line2: e.target.value})} style={{ gridColumn: 'span 2', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }} />
                <input placeholder="City" required value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }} />
                <input placeholder="State" value={newAddr.state} onChange={e => setNewAddr({...newAddr, state: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }} />
                <input placeholder="Pincode" required value={newAddr.pincode} onChange={e => setNewAddr({...newAddr, pincode: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }} />
                <label style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={newAddr.isDefault} onChange={e => setNewAddr({...newAddr, isDefault: e.target.checked})} /> Set as default
                </label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Address</button>
            </form>
          )}

          {addressStatus && (
            <div className="glass-card" style={{ marginBottom: '1rem', border: '1px solid var(--accent)', color: 'var(--accent)', animation: 'fade-in 0.3s' }}>
              {addressStatus}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {addresses.map(addr => (
              <div 
                key={addr.ADDRESS_ID} 
                onClick={() => setSelectedAddress(addr.ADDRESS_ID)}
                className="glass-card" 
                style={{ 
                  cursor: 'pointer', 
                  border: selectedAddress === addr.ADDRESS_ID ? '2px solid var(--primary)' : '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ color: 'var(--primary)' }}>{addr.LABEL}</h4>
                  <p>{addr.ADDRESS_LINE1}, {addr.CITY}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{addr.STATE} - {addr.PINCODE}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedAddress === addr.ADDRESS_ID && <Check color="var(--primary)" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(addr.ADDRESS_ID);
                    }}
                    className="btn btn-danger"
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.6rem', borderRadius: '0.4rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Order Review</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{cart.length} Items</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <span>Total Payable</span>
            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handlePlaceOrder} 
            disabled={!selectedAddress || cart.length === 0}
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', opacity: selectedAddress ? 1 : 0.5 }}
          >
            Place Order <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
