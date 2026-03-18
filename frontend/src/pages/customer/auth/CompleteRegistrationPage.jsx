import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../../../api/auth.api';
import useAuthStore from '../../../store/auth.store';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Alert, AlertDescription } from '../../../components/ui/alert';

const CompleteRegistrationPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const res = await authApi.completeRegistration(form);
      updateUser({ ...res.data.data.user, registration_completed: true });
      navigate('/', { replace: true });
    } catch (err) {
      const data = err.response?.data?.error;
      if (data?.code === 'VALIDATION_ERROR' && Array.isArray(data.details)) {
        const fe = {};
        data.details.forEach((d) => { if (d.field) fe[d.field] = d.message; });
        setFieldErrors(fe);
      } else {
        setError(data?.message || 'Could not complete registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', placeholder = '', required = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={form[name]}
        onChange={handleChange}
        required={required}
      />
      {fieldErrors[name] && <p className="text-xs text-destructive">{fieldErrors[name]}</p>}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm p-8 max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Complete your profile</h1>
        <p className="text-sm text-muted-foreground mt-1">A few more details to get you started</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {field('first_name', 'First name', 'text', 'John', true)}
          {field('last_name', 'Last name', 'text', 'Doe', true)}
        </div>
        {field('phone', 'Phone', 'tel', '+91 98765 43210')}

        <hr className="border-border" />
        <p className="text-sm font-medium text-foreground">Shipping address</p>

        {field('address_line1', 'Address line 1', 'text', '123 Main Street', true)}
        {field('address_line2', 'Address line 2 (optional)', 'text', 'Apt 4B')}

        <div className="grid grid-cols-2 gap-3">
          {field('city', 'City', 'text', 'Mumbai', true)}
          {field('state', 'State', 'text', 'Maharashtra', true)}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field('postal_code', 'Postal code', 'text', '400001', true)}
          <div className="space-y-1.5">
            <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
            <select
              id="country"
              name="country"
              value={form.country}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="AE">UAE</option>
              <option value="SG">Singapore</option>
            </select>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Save and continue'}
        </Button>
      </form>
    </div>
  );
};

export default CompleteRegistrationPage;
