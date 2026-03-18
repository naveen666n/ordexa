import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertCircle, Loader2, Users, Copy, Check, X } from 'lucide-react';
import adminUsersApi from '../../../api/admin/users.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatDateTime } from '../../../lib/formatters';

const ROLE_STYLES = {
  admin:      'bg-red-50 text-red-700 border-red-200',
  customer:   'bg-blue-50 text-blue-700 border-blue-200',
  operations: 'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── CopyButton ───────────────────────────────────────────────────────────────

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// ─── PasswordModal ────────────────────────────────────────────────────────────

const PasswordModal = ({ title, password, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Copy and share this password securely. It will not be shown again.
      </p>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
        <span className="font-mono text-sm text-gray-900 flex-1 break-all">{password}</span>
        <CopyButton text={password} />
      </div>
      <Button className="w-full" onClick={onClose}>Done</Button>
    </div>
  </div>
);

// ─── CreateUserModal ──────────────────────────────────────────────────────────

const CreateUserModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'operations' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.role) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await adminUsersApi.create(form);
      const data = res.data.data;
      setResult(data);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Create Admin/Operations User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">First Name</Label>
                <Input className="h-8 text-sm" value={form.first_name} onChange={set('first_name')} placeholder="First name" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name</Label>
                <Input className="h-8 text-sm" value={form.last_name} onChange={set('last_name')} placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" className="h-8 text-sm" value={form.email} onChange={set('email')} placeholder="user@example.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <select
                value={form.role}
                onChange={set('role')}
                className="w-full h-8 rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="admin">Admin</option>
                <option value="operations">Operations</option>
              </select>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={12} /> {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button className="flex-1 gap-1.5" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Create User
              </Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 mb-1">User created successfully</p>
              <p className="text-xs text-green-700">
                {result.user.first_name} {result.user.last_name} ({result.user.email})
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Generated password (shown once):</p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <span className="font-mono text-sm text-gray-900 flex-1 break-all">{result.generated_password}</span>
                <CopyButton text={result.generated_password} />
              </div>
            </div>
            <Button className="w-full" onClick={onClose}>Done</Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── UsersListPage ────────────────────────────────────────────────────────────

const UsersListPage = () => {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null); // { title, password }
  const [togglingId, setTogglingId] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [error, setError] = useState('');

  const params = {};
  if (roleFilter !== 'all') params.role = roleFilter;
  if (statusFilter !== 'all') params.is_active = statusFilter === 'active';

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminUsersApi.list(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

  const users = data?.users ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const handleToggleStatus = async (user) => {
    setError('');
    setTogglingId(user.id);
    try {
      await adminUsersApi.toggleStatus(user.id, !user.is_active);
      refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleResetPassword = async (user) => {
    setError('');
    setResettingId(user.id);
    try {
      const res = await adminUsersApi.resetPassword(user.id);
      const { generated_password } = res.data.data;
      setPasswordModal({ title: `Password reset for ${user.first_name} ${user.last_name}`, password: generated_password });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reset password.');
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} shown</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
          <option value="operations">Operations</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No users found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Auth</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      ROLE_STYLES[user.role?.name] || 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {user.role?.name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">
                    {user.google_id ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                        Google
                      </span>
                    ) : 'Password'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={togglingId === user.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        user.is_active ? 'bg-primary' : 'bg-gray-200'
                      } ${togglingId === user.id ? 'opacity-50' : ''}`}
                      title={user.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        user.is_active ? 'translate-x-4' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {formatDateTime(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {!user.google_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleResetPassword(user)}
                        disabled={resettingId === user.id}
                      >
                        {resettingId === user.id ? <Loader2 size={11} className="animate-spin" /> : null}
                        Reset Password
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={refresh}
        />
      )}

      {passwordModal && (
        <PasswordModal
          title={passwordModal.title}
          password={passwordModal.password}
          onClose={() => setPasswordModal(null)}
        />
      )}
    </div>
  );
};

export default UsersListPage;
