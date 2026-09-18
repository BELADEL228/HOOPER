import { useState } from 'react';
import { Building2, CheckCircle2, Clock3, Send, XCircle } from 'lucide-react';
import { clubApi, type ApiClubRequest, type ClubRequestInput } from '../../services/clubApi';

export function ClubRequestForm({ token, request, onSubmitted }: { token: string; request?: ApiClubRequest | null; onSubmitted: (request: ApiClubRequest) => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ClubRequestInput>({ name: '', city: '', country: 'Togo', primaryColor: '#FF2A3B', secondaryColor: '#FFB800' });
  const update = (key: keyof ClubRequestInput, value: string) => setForm((old) => ({ ...old, [key]: value }));

  if (request?.status === 'PENDING') return <StatusCard icon={<Clock3 className="w-10 h-10 text-amber-400" />} title="Votre demande est en cours d’examen" text="L’équipe FIRE STONE examine les informations de votre club. Vous serez notifié dès qu’une décision sera prise." />;
  if (request?.status === 'APPROVED') return <StatusCard icon={<CheckCircle2 className="w-10 h-10 text-emerald-400" />} title="Votre club a été approuvé" text="Votre espace club est prêt. Rechargez cette page si vous venez d’être approuvé." />;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!form.name.trim() || !form.city.trim()) return setError('Le nom et la ville sont obligatoires.');
    setSaving(true);
    try { onSubmitted(await clubApi.submitClubRequest({ ...form, foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined }, token)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Impossible d’envoyer la demande.'); }
    finally { setSaving(false); }
  };
  return <div className="max-w-3xl mx-auto glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
    <div className="flex gap-4"><div className="p-3 rounded-2xl bg-red-500/15 text-red-300"><Building2 /></div><div><h2 className="text-2xl font-black text-white">Demander la création d’un club</h2><p className="text-sm text-slate-400 mt-1">Votre club sera créé après validation par un SUPER_ADMIN.</p></div></div>
    {request?.status === 'REJECTED' && <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"><div className="flex gap-2 font-bold"><XCircle className="w-5 h-5" /> Demande précédente refusée</div><p className="mt-2 text-red-100">{request.adminNote || 'Aucune précision fournie.'}</p></div>}
    <div className="flex gap-2 text-xs font-bold"><span className={step === 1 ? 'text-white bg-red-500 px-3 py-1 rounded-full' : 'text-slate-400'}>1. Informations</span><span className={step === 2 ? 'text-white bg-red-500 px-3 py-1 rounded-full' : 'text-slate-400'}>2. Identité & contact</span></div>
    <form onSubmit={submit} className="space-y-5">
      {step === 1 ? <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nom du club *" value={form.name} onChange={(v) => update('name', v)} /><Field label="Acronyme" value={form.shortName || ''} onChange={(v) => update('shortName', v)} />
        <Field label="Ville *" value={form.city} onChange={(v) => update('city', v)} /><Field label="Pays" value={form.country || ''} onChange={(v) => update('country', v)} />
        <label className="sm:col-span-2 text-xs font-bold text-slate-300">Description<textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} className="mt-1 w-full min-h-28 glass-input rounded-xl p-3" /></label>
      </div> : <div className="grid sm:grid-cols-2 gap-4">
        <Field label="URL du logo" value={form.logoUrl || ''} onChange={(v) => update('logoUrl', v)} /><Field label="Email" value={form.email || ''} onChange={(v) => update('email', v)} />
        <Field label="Téléphone" value={form.phoneNumber || ''} onChange={(v) => update('phoneNumber', v)} /><Field label="Site web" value={form.website || ''} onChange={(v) => update('website', v)} />
        <Field label="Année de fondation" type="number" value={form.foundedYear?.toString() || ''} onChange={(v) => update('foundedYear', v)} />
        <div className="grid grid-cols-2 gap-3"><Color label="Couleur principale" value={form.primaryColor || '#FF2A3B'} onChange={(v) => update('primaryColor', v)} /><Color label="Couleur secondaire" value={form.secondaryColor || '#FFB800'} onChange={(v) => update('secondaryColor', v)} /></div>
      </div>}
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex justify-between pt-2"><button type="button" onClick={() => setStep(1)} className={`px-4 py-2 text-sm text-slate-300 ${step === 1 ? 'invisible' : ''}`}>Retour</button>{step === 1 ? <button type="button" onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm">Continuer</button> : <button disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm disabled:opacity-60"><Send className="w-4 h-4" />{saving ? 'Envoi…' : 'Envoyer la demande'}</button>}</div>
    </form>
  </div>;
}
const Field = ({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) => <label className="text-xs font-bold text-slate-300">{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full glass-input rounded-xl p-3" /></label>;
const Color = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="text-[10px] font-bold text-slate-300">{label}<input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-10 rounded-lg bg-transparent" /></label>;
const StatusCard = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => <div className="max-w-xl mx-auto mt-16 glass-panel rounded-3xl border border-white/10 p-10 text-center space-y-4">{icon}<h2 className="text-2xl font-black text-white">{title}</h2><p className="text-sm text-slate-400">{text}</p></div>;
