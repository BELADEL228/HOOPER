import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImageUp, Palette, RotateCcw, Save, ShieldCheck, Users, Wand2 } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { clubApi, type ApiClubMember, type ClubThemeInput } from '../../services/clubApi';
import { analyzeLogoFile } from '../../services/logoPalette';

const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
  reader.onload = () => resolve(String(reader.result));
  reader.readAsDataURL(file);
});

export function ClubAdministrationPanel() {
  const { activeClub, setActiveClub } = useClub();
  const clubId = activeClub.clubId || activeClub.id;
  const [members, setMembers] = useState<ApiClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);
  const [logoUrl, setLogoUrl] = useState(activeClub.logoUrl || '');
  const [theme, setTheme] = useState<ClubThemeInput>({
    primary: activeClub.primaryColor || '#475569', secondary: activeClub.secondaryColor || '#94a3b8', accent: activeClub.accentColor || '#38bdf8', themeType: 'dark', logoUrl: activeClub.logoUrl || undefined,
  });
  const token = (() => { try { return JSON.parse(localStorage.getItem('firestone-auth') || '{}').token || ''; } catch { return ''; } })();

  const load = async () => {
    setLoading(true); setError('');
    try { setMembers(await clubApi.getClubMembers(clubId, token)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Impossible de charger les membres.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [clubId]);

  const updateRole = async (member: ApiClubMember, role: string) => {
    try {
      const updated = await clubApi.updateClubMemberRole(member.clubId, member.userId, role, token);
      setMembers((all) => all.map((item) => item.id === updated.id ? { ...item, role: updated.role } : item));
    } catch (err) { setError(err instanceof Error ? err.message : 'Mise à jour impossible.'); }
  };

  const onLogoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Utilisez un logo PNG, JPEG ou WEBP.'); return; }
    if (file.size > 3_500_000) { setError('Le logo doit faire moins de 3,5 Mo.'); return; }
    try {
      // Analyse locale: no FastAPI process is required for the normal upload flow.
      const [dataUrl, analysis] = await Promise.all([readAsDataUrl(file), analyzeLogoFile(file)]);
      setLogoUrl(dataUrl);
      setTheme((current) => ({ ...current, logoUrl: dataUrl }));
      setTheme((current) => ({ ...current, ...analysis, logoUrl: dataUrl }));
      setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Analyse du logo impossible.'); }
  };

  const saveBrand = async () => {
    setSavingBrand(true); setError('');
    try {
      const saved = await clubApi.updateClubTheme(clubId, { ...theme, logoUrl }, token);
      setActiveClub({ ...activeClub, logoUrl: saved.club.logoUrl || logoUrl, primaryColor: saved.club.primaryColor || theme.primary, secondaryColor: saved.club.secondaryColor || theme.secondary, accentColor: saved.club.accentColor || theme.accent, themeType: saved.club.themeType || theme.themeType, themeJson: typeof saved.club.themeJson === 'string' ? saved.club.themeJson : JSON.stringify(theme) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement de l’identité impossible.'); }
    finally { setSavingBrand(false); }
  };

  return <div className="space-y-6">
    <section className="rounded-3xl p-7 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-950"><div className="flex items-start gap-4"><div className="p-3 rounded-2xl bg-emerald-500/15"><ShieldCheck className="w-7 h-7 text-emerald-300" /></div><div><h2 className="text-2xl font-black text-white">Administration de {activeClub.name}</h2><p className="mt-1 text-sm text-slate-400">Gérez les membres et l’identité visuelle de votre club.</p></div></div></section>

    <section className="glass-panel rounded-3xl border border-white/10 p-6 space-y-5">
      <div><h3 className="font-black text-white flex gap-2 items-center"><Palette className="w-5 h-5 text-cyan-300" /> Identité visuelle</h3><p className="mt-1 text-xs text-slate-400">Le logo, ses couleurs et les interfaces du club sont enregistrés ici.</p></div>
      <div className="flex flex-col sm:flex-row gap-5 items-start"><label className="w-28 h-28 rounded-2xl border border-dashed border-white/25 grid place-items-center overflow-hidden cursor-pointer bg-white/5">{logoUrl ? <img src={logoUrl} alt="Logo du club" className="w-full h-full object-contain" /> : <ImageUp className="w-7 h-7 text-slate-400" />}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onLogoSelect} /></label><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">{(['primary', 'secondary', 'accent'] as const).map((key) => <label key={key} className="text-xs text-slate-400 capitalize">{key === 'primary' ? 'Couleur principale' : key === 'secondary' ? 'Couleur secondaire' : 'Accent'}<input type="color" value={theme[key]} onChange={(event) => setTheme((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 block h-10 w-full rounded-lg bg-transparent cursor-pointer" /></label>)}</div></div>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={saveBrand} disabled={savingBrand} className="px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black flex gap-2 items-center disabled:opacity-50"><Save className="w-4 h-4" />{savingBrand ? 'Enregistrement…' : 'Appliquer au club'}</button><span className="text-xs text-slate-500 self-center flex gap-1.5 items-center"><Wand2 className="w-3.5 h-3.5" /> Les couleurs sont analysées à l’import du logo.</span></div>
    </section>

    <section className="glass-panel rounded-3xl border border-white/10 p-6"><div className="flex justify-between gap-4 mb-5"><div><h3 className="font-black text-white flex items-center gap-2"><Users className="w-5 h-5 text-emerald-300" /> Membres du club</h3><p className="text-xs text-slate-400 mt-1">Président, staff, coachs, joueurs et trésorerie.</p></div><button onClick={load} className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"><RotateCcw className="w-4 h-4" /></button></div>{error && <p className="mb-3 text-sm text-red-300">{error}</p>}<div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-500 uppercase border-b border-white/10"><tr><th className="p-3">Membre</th><th className="p-3">Rôle plateforme</th><th className="p-3">Rôle dans le club</th></tr></thead><tbody className="divide-y divide-white/5">{loading ? <tr><td colSpan={3} className="p-8 text-center text-slate-500">Chargement…</td></tr> : members.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-slate-500">Aucun membre.</td></tr> : members.map((member) => <tr key={member.id}><td className="p-3"><p className="font-bold text-white">{member.user.name}</p><p className="text-slate-500">{member.user.email}</p></td><td className="p-3 text-slate-400">{member.user.role}</td><td className="p-3"><select value={member.role} onChange={(event) => updateRole(member, event.target.value)} className="bg-slate-900 border border-white/15 rounded-lg p-2 text-white"><option>PRESIDENT</option><option>CLUB_ADMIN</option><option>COACH</option><option>TREASURER</option><option>PLAYER</option><option>MEMBER</option></select></td></tr>)}</tbody></table></div></section>
  </div>;
}
