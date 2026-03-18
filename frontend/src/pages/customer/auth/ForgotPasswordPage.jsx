import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import authApi from '../../../api/auth.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Alert, AlertDescription } from '../../../components/ui/alert';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-lg border border-border shadow-sm p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-sm text-muted-foreground mb-6">
          If an account with <strong>{email}</strong> exists, we sent a password reset link. Check your inbox (and spam folder).
        </p>
        <Link to="/login" className="text-primary text-sm font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm p-8">
      <Link
        to="/login"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={14} /> Back to sign in
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Forgot password?</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we'll send a reset link.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
