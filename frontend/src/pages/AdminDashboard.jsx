import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, ShoppingBag, TrendingUp } from 'lucide-react';
import Pagination from '../components/Pagination';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0 });
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    fetchOrders();
    fetchShippers();
  }, [page]);

  const fetchShippers = async () => {
    try {
      const res = await api.get('/shippers');
      // res is { success, data: { shippers } }
      setShippers(res.data.shippers);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/orders/admin?page=${page}&limit=10`);
      // res is { success, data: { orders, total, page, pages } }
      const fetchedOrders = res.data.orders || [];
      setOrders(fetchedOrders);
      
      // We still use total from the response for stats
      setStats({ 
        totalOrders: res.data.total, 
        revenue: fetchedOrders.reduce((acc, o) => acc + Number(o.TOTAL_AMOUNT || 0), 0) 
      });
      setPages(res.data.pages);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    }
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    fetchOrders();
  };

  const assignShipper = async (id, shipperId) => {
    await api.patch(`/orders/${id}/shipper`, { shipperId });
    fetchOrders();
  };

  return (
    <div className="container fade-in" style={{ paddingTop: '1rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <LayoutDashboard size={28} color="var(--primary)" />
          <h2 style={{ fontSize: '1.75rem' }}>Dashboard Overview</h2>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Monitor store performance and manage customer orders.</p>
        {error && (
          <div className="glass-card" style={{ marginTop: '1rem', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-4" style={{ marginBottom: '3rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Orders</p>
              <h4 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{stats.totalOrders}</h4>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'hsl(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)' }}>
              <ShoppingBag size={20} color="var(--primary)" />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Revenue</p>
              <h4 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>${stats.revenue.toLocaleString()}</h4>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'hsla(160, 84%, 39%, 0.1)' }}>
              <TrendingUp size={20} color="var(--accent)" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem' }}>Recent Orders</h3>
        <button className="btn btn-ghost" onClick={fetchOrders} style={{ padding: '0.4rem 0.8rem' }}>Refresh</button>
      </div>

      <div className="responsive-table glass">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th className="hide-on-mobile">Shipper</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.ORDER_ID}>
                <td>
                  <span style={{ fontWeight: '600', color: 'var(--primary)' }}>#{o.ORDER_ID}</span>
                </td>
                <td>{o.USERNAME}</td>
                <td className="hide-on-mobile" style={{ fontSize: '0.85rem' }}>{o.SHIPPER_NAME || '---'}</td>
                <td style={{ fontWeight: '600' }}>${Number(o.TOTAL_AMOUNT || 0).toFixed(2)}</td>
                <td>
                  <span className={`badge badge-${o.STATUS}`}>
                    {o.STATUS}
                  </span>
                </td>
                <td>
                  <select 
                    value={o.STATUS === 'shipped' ? 'shipped' : o.STATUS} // handles both mapping
                    onChange={(e) => updateStatus(o.ORDER_ID, e.target.value)}
                    className="input"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipping">Shipping</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination 
        page={page} 
        pages={pages} 
        onPageChange={(p) => setPage(p)} 
      />
    </div>
  );
};

export default AdminDashboard;
