import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SearchInput } from '@/components/ui/SearchInput';
import type { Patient } from '@/types';

export function PatientPicker({ value, onChange }: { value: string; onChange: (patientId: string) => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('patients').select('*').then(({ data }) => setPatients((data as Patient[]) ?? []));
  }, []);

  useEffect(() => {
    if (value && !search) {
      const match = patients.find((p) => p.id === value);
      if (match) setSearch(match.full_name ?? '');
    }
  }, [value, patients]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = patients.filter((p) =>
    `${p.full_name} ${p.phone ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <SearchInput placeholder="Search patient by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-full" />
      {search && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-brand-100">
          {filtered.slice(0, 8).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(p.id); setSearch(p.full_name); }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-brand-50 ${value === p.id ? 'bg-brand-50 font-medium' : ''}`}
            >
              {p.full_name} · {p.phone}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-brand-400">No matches</p>}
        </div>
      )}
    </div>
  );
}
