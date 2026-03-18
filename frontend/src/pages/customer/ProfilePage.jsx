import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, MapPin, Plus, Pencil, Trash2, Star, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../store/auth.store';
import addressesApi from '../../api/addresses.api';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

// ─── Address Form ─────────────────────────────────────────────────────────────

const AddressForm = ({ initial = null, onSaved, onCancel }) => {
  const [form, setForm] = useState(initial || {
    full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: 'India', label: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (initial?.id) {
        res = await addressesApi.update(initial.id, form);
      } else {
        res = await addressesApi.create(form);
      }
      onSaved(res.data.data.address);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, required, placeholder = '', colSpan = '') => (
    <div className={colSpan}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        value={form[key] || ''}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mt-3">
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {field('Full Name', 'full_name', true)}
        {field('Phone', 'phone', false)}
      </div>
      {field('Address Line 1', 'address_line1', true, '', '')}
      {field('Address Line 2', 'address_line2', false, 'Apartment, suite, etc.', '')}
      <div className="grid grid-cols-3 gap-3">
        {field('City', 'city', true)}
        {field('State', 'state', true)}
        {field('Postal Code', 'postal_code', true)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field('Country', 'country', false)}
        {field('Label', 'label', false, 'Home / Office')}
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
          {initial?.id ? 'Update' : 'Save'} Address
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

// ─── Address Card ─────────────────────────────────────────────────────────────

const AddressCard = ({ address, onEdit, onDelete, onSetDefault, settingDefault }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 text-sm space-y-0.5">
        <p className="font-semibold text-gray-900">
          {address.full_name}
          {address.label && (
            <span className="ml-2 text-[10px] font-medium text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full uppercase">
              {address.label}
            </span>
          )}
          {address.is_default && (
            <span className="ml-2 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
              Default
            </span>
          )}
        </p>
        {address.phone && <p className="text-gray-500">{address.phone}</p>}
        <p className="text-gray-600">
          {address.address_line1}
          {address.address_line2 ? `, ${address.address_line2}` : ''}
        </p>
        <p className="text-gray-600">{address.city}, {address.state} – {address.postal_code}</p>
        <p className="text-gray-500">{address.country}</p>
      </div>
    </div>

    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
      {!address.is_default && (
        <button
          onClick={() => onSetDefault(address.id)}
          disabled={settingDefault}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {settingDefault ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
          Set Default
        </button>
      )}
      <button
        onClick={() => onEdit(address)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
      >
        <Pencil size={12} /> Edit
      </button>
      <button
        onClick={() => onDelete(address.id)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
      >
        <Trash2 size={12} /> Remove
      </button>
    </div>
  </div>
);

// ─── ProfilePage ──────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [editingAddress, setEditingAddress] = useState(null); // address object or 'new'
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list().then((r) => r.data.data.addresses),
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['addresses'] });

  const handleSaved = () => {
    setEditingAddress(null);
    refetch();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await addressesApi.remove(id);
      refetch();
    } catch {
      // silently fail
    }
  };

  const handleSetDefault = async (id) => {
    setSettingDefaultId(id);
    try {
      await addressesApi.setDefault(id);
      refetch();
    } catch {
      // silently fail
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

      {/* Account Info */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <User size={16} className="text-primary" />
          Account Details
        </h2>
        <div className="flex items-center gap-4">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.first_name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
              {user?.first_name?.[0]?.toUpperCase() || <User size={20} />}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.role && (
              <p className="text-xs font-medium text-primary mt-0.5 capitalize">{user.role}</p>
            )}
          </div>
        </div>
      </section>

      {/* Addresses */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            Saved Addresses
          </h2>
          {editingAddress !== 'new' && (
            <button
              onClick={() => setEditingAddress('new')}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus size={14} /> Add New
            </button>
          )}
        </div>

        {/* New address form */}
        {editingAddress === 'new' && (
          <AddressForm
            onSaved={handleSaved}
            onCancel={() => setEditingAddress(null)}
          />
        )}

        {addressesLoading ? (
          <div className="space-y-3 mt-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {(!addresses || addresses.length === 0) && editingAddress !== 'new' && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No saved addresses yet.
              </p>
            )}
            {addresses?.map((address) => (
              editingAddress?.id === address.id ? (
                <AddressForm
                  key={address.id}
                  initial={editingAddress}
                  onSaved={handleSaved}
                  onCancel={() => setEditingAddress(null)}
                />
              ) : (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={setEditingAddress}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                  settingDefault={settingDefaultId === address.id}
                />
              )
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
