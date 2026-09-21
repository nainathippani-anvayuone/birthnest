import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from '@/utils/roles';
import { Badge } from '@/components/ui/Badge';
import type { Doctor } from '@/types';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'doctor') {
      supabase.from('doctors').select('*').eq('id', profile.id).single().then(({ data }) => setDoctorInfo(data as Doctor));
    }
  }, [profile]);

  if (!profile) return null;

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const saveDoctorInfo = async () => {
    if (!doctorInfo) return;
    setSaving(true);
    await supabase
      .from('doctors')
      .update({
        specialization: doctorInfo.specialization,
        qualifications: doctorInfo.qualifications,
        experience_years: doctorInfo.experience_years,
        bio: doctorInfo.bio,
        consultation_fee: doctorInfo.consultation_fee,
      })
      .eq('id', profile.id);
    setSaving(false);
  };

  const changePassword = async () => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPassword('');
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="My Profile" description="Manage your personal details and account security." />

      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={ROLE_BADGE_CLASSES[profile.role]}>{ROLE_LABELS[profile.role]}</Badge>
            <span className="text-sm text-brand-400">{profile.email}</span>
          </div>
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Phone" value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} />
          <div className="flex items-center gap-3">
            <Button loading={saving} onClick={saveProfile}>Save Changes</Button>
            {saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
          </div>
        </CardContent>
      </Card>

      {profile.role === 'doctor' && doctorInfo && (
        <Card>
          <CardHeader><CardTitle>Professional Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Specialization" value={doctorInfo.specialization} onChange={(e) => setDoctorInfo({ ...doctorInfo, specialization: e.target.value })} />
            <Input label="Qualifications" value={doctorInfo.qualifications} onChange={(e) => setDoctorInfo({ ...doctorInfo, qualifications: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Experience (years)" type="number" value={doctorInfo.experience_years} onChange={(e) => setDoctorInfo({ ...doctorInfo, experience_years: Number(e.target.value) })} />
              <Input label="Consultation Fee (₹)" type="number" value={doctorInfo.consultation_fee} onChange={(e) => setDoctorInfo({ ...doctorInfo, consultation_fee: Number(e.target.value) })} />
            </div>
            <Textarea label="Bio" value={doctorInfo.bio ?? ''} onChange={(e) => setDoctorInfo({ ...doctorInfo, bio: e.target.value })} />
            <Button loading={saving} onClick={saveDoctorInfo}>Save Professional Details</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="New Password" type="password" hint="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          {passwordError && <p className="text-sm font-medium text-rose-600">{passwordError}</p>}
          <div className="flex items-center gap-3">
            <Button loading={passwordSaving} onClick={changePassword}>Update Password</Button>
            {passwordSaved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Updated</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
