import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import Pagination from '../components/Pagination';

const StatusIcon = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'pending': return <Clock size={20} color="#f59e0b" />;
    case 'processing': return <Package size={20} color="#6366f1" />;
    case 'shipping':
    case 'shipped': return <Truck size={20} color="#10b981" />;
    case 'delivered': return <CheckCircle size={20} color="#10b981" />;
    case 'cancelled': return <XCircle size={20} color="#ef4444" />;
    default: return <Clock size={20} />;
  }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchOrders(page).finally(() => setRefreshing(false));
    }, 10000); // Increased interval to 10s to reduce noise
    return () => clearInterval(interval);
  }, [page]);

  const fetchOrders = async (targetPage = page) => {
    try {
      const res = await api.get(`/orders?page=${targetPage}&limit=10`);
      setOrders(res.data.orders);
      setPages(res.data.pages);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>My Orders</h2>
        <button
          onClick={() => { setRefreshing(true); fetchOrders().finally(() => setRefreshing(false)); }}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.75rem' }}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {error && (
          <div className="glass-card" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', textAlign: 'center' }}>
            {error}
          </div>
        )}
        {orders.length === 0 && !error && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders yet.</p>}
        {orders.map((o, i) => (
          <motion.div 
            key={o.ORDER_ID}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card"
            style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 'bold' }}>Order #{o.ORDER_ID}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.ORDER_DATE).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0 }}><strong>Items:</strong> {o.ITEMS || 'N/A'}</p>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{o.SHIPPER_NAME ? `Shipped by ${o.SHIPPER_NAME}` : 'Shipper not assigned yet'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>${Number(o.TOTAL_AMOUNT || 0).toFixed(2)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                  <StatusIcon status={o.STATUS} />
                  <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{o.STATUS}</span>
                </div>
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

export default Orders;
