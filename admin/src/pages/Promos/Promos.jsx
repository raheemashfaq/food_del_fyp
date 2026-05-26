import { useState, useEffect, useContext } from 'react';
import './Promos.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../Context/AdminContext';
import Skeleton from '../../components/Skeleton/Skeleton';

const Promos = () => {
  const { url } = useContext(AdminContext);
  const [promos, setPromos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [foodList, setFoodList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    expiresAt: '',
    applicableProduct: '',
    minQuantity: ''
  });

  const fetchPromos = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${url}/api/promo/list`);
      if (response.data.success) {
        setPromos(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch promo codes");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFoodList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) {
        setFoodList(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch food list");
    }
  };

  useEffect(() => {
    fetchPromos();
    fetchFoodList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        expiresAt: formData.expiresAt || null,
        applicableProducts: formData.applicableProduct ? [formData.applicableProduct] : [],
        minQuantity: formData.minQuantity ? Number(formData.minQuantity) : 0
      };

      const response = await axios.post(`${url}/api/promo/create`, payload);
      if (response.data.success) {
        toast.success("Promo code created!");
        setFormData({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '', applicableProduct: '', minQuantity: '' });
        setShowForm(false);
        fetchPromos();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to create promo code");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.post(`${url}/api/promo/delete`, { id });
      if (response.data.success) {
        toast.success("Promo code deleted");
        fetchPromos();
      }
    } catch (error) {
      toast.error("Failed to delete promo code");
    }
  };

  const handleToggle = async (id) => {
    try {
      const response = await axios.post(`${url}/api/promo/toggle`, { id });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchPromos();
      }
    } catch (error) {
      toast.error("Failed to toggle promo code");
    }
  };

  return (
    <div className="promos-page add">
      <div className="promos-header">
        <p>Promo Codes</p>
        <button className="promos-add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Promo Code"}
        </button>
      </div>

      {showForm && (
        <form className="promo-form" onSubmit={handleSubmit}>
          <div className="promo-form-row">
            <div className="promo-form-field">
              <label>Code *</label>
              <input type="text" placeholder="e.g. SAVE20" value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
            </div>
            <div className="promo-form-field">
              <label>Discount Type *</label>
              <select value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs.)</option>
              </select>
            </div>
            <div className="promo-form-field">
              <label>Discount Value *</label>
              <input type="number" placeholder={formData.discountType === 'percentage' ? "e.g. 20" : "e.g. 500"}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} required />
            </div>
          </div>
          <div className="promo-form-row">
            <div className="promo-form-field">
              <label>Min Order Amount</label>
              <input type="number" placeholder="e.g. 1000" value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })} />
            </div>
            <div className="promo-form-field">
              <label>Max Discount (for %)</label>
              <input type="number" placeholder="e.g. 500" value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })} />
            </div>
            <div className="promo-form-field">
              <label>Usage Limit</label>
              <input type="number" placeholder="Unlimited" value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })} />
            </div>
            <div className="promo-form-field">
              <label>Expiry Date</label>
              <input type="date" value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="promo-form-row">
            <div className="promo-form-field">
              <label>Apply on Specific Product (optional)</label>
              <select
                value={formData.applicableProduct}
                onChange={(e) => setFormData({ ...formData, applicableProduct: e.target.value })}
              >
                <option value="">All Products</option>
                {foodList.map((food) => (
                  <option key={food._id} value={food._id}>{food.name} — Rs.{food.price}</option>
                ))}
              </select>
            </div>
            <div className="promo-form-field">
              <label>Min Quantity Required</label>
              <input type="number" placeholder="e.g. 5" value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="promo-submit-btn">Create Promo Code</button>
        </form>
      )}

      <div className="promos-table">
        <div className="promos-table-header">
          <p>Code</p>
          <p>Discount</p>
          <p>Products / Qty</p>
          <p>Min Order</p>
          <p>Used / Limit</p>
          <p>Expires</p>
          <p>Status</p>
          <p>Actions</p>
        </div>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="promos-table-row">
              <Skeleton width="80px" height="16px" radius="4px" />
              <Skeleton width="60%" height="14px" />
              <Skeleton width="70%" height="14px" />
              <Skeleton width="50%" height="14px" />
              <Skeleton width="50%" height="14px" />
              <Skeleton width="60%" height="14px" />
              <Skeleton width="60px" height="20px" radius="10px" />
              <Skeleton width="60px" height="28px" radius="6px" />
            </div>
          ))
        ) : promos.length === 0 ? (
          <p className="no-promos">No promo codes yet. Create one above!</p>
        ) : (
          promos.map((promo) => (
            <div key={promo._id} className="promos-table-row">
              <p className="promo-code-cell">{promo.code}</p>
              <p>
                {promo.discountType === 'percentage'
                  ? `${promo.discountValue}%${promo.maxDiscount ? ` (max Rs.${promo.maxDiscount})` : ''}`
                  : `Rs.${promo.discountValue}`}
              </p>
              <p className="promo-products-cell">
                {promo.applicableProducts && promo.applicableProducts.length > 0
                  ? <>
                      {(() => {
                        const food = foodList.find(f => f._id === promo.applicableProducts[0]);
                        return food ? food.name : '-';
                      })()}
                      {promo.minQuantity > 0 && <span className="promo-min-qty"> (Buy {promo.minQuantity}+)</span>}
                    </>
                  : 'All'}
              </p>
              <p>{promo.minOrderAmount > 0 ? `Rs.${promo.minOrderAmount}` : '-'}</p>
              <p>{promo.usedCount} / {promo.usageLimit || 'Unlimited'}</p>
              <p>{promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : 'Never'}</p>
              <p>
                <span className={`promo-status ${promo.isActive ? 'active' : 'inactive'}`}
                  onClick={() => handleToggle(promo._id)} style={{ cursor: 'pointer' }}>
                  {promo.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p className="promo-actions">
                <button className="promo-delete-btn" onClick={() => handleDelete(promo._id)}>Delete</button>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Promos;
