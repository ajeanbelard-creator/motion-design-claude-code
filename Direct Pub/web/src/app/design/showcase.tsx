"use client";
import { CalendarDays, Copy, Inbox, Moon, MoreHorizontal, Pencil, Plus, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogContent, DialogTrigger, DrawerContent } from "@/components/ui/overlay";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Tooltip } from "@/components/ui/menu";
import { SplitButton } from "@/components/ui/split-button";
import { NetworkMark, StatusBadge, Tag } from "@/components/ui/badges";
import { PostCard } from "@/components/ui/post-card";
import { MetricCard } from "@/components/ui/metric-card";
import { Avatar, EmptyState, Progress, Skeleton, Toast } from "@/components/ui/misc";
import { DataTable } from "@/components/ui/table";
import { NETWORKS, type Network, type PostStatus } from "@/lib/networks";

const COLORS = ["bg", "surface", "surface-raised", "border", "border-input", "text", "text-muted", "accent", "focus", "link",
  "danger", "success", "warning", "status-published", "status-scheduled", "status-draft", "status-failed", "status-autolist", "status-review"];
const TYPE = ["display", "xl", "lg", "md", "base", "sm", "xs"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border py-8">
      <h2 className="text-lg">{title}</h2>
      {children}
    </section>
  );
}

const posts = [
  { id: "1", date: "21/11", text: "Nouvelle collection en ligne", network: "Instagram", reach: 4210, interactions: 388 },
  { id: "2", date: "19/11", text: "Les coulisses de l'atelier", network: "TikTok", reach: 12840, interactions: 1022 },
  { id: "3", date: "18/11", text: "Offre de la semaine", network: "Facebook", reach: 1935, interactions: 64 },
];

export function Showcase() {
  const [dark, setDark] = useState(false);
  const [text, setText] = useState("Notre atelier ouvre ses portes samedi de 10 h à 18 h. Venez découvrir la nouvelle collection !");
  const [auto, setAuto] = useState(true);
  const [shown, setShown] = useState({ reach: true, inter: true });
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  };

  return (
    <main className="mx-auto max-w-(--size-content-max) px-6 pb-24">
      <header className="flex h-(--size-header) items-center justify-between">
        <span className="text-md">Direct Pub · système de design</span>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? "Thème clair" : "Thème sombre"}>
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </header>

      <Section title="Couleurs (rôles)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {COLORS.map((c) => (
            <div key={c} className="flex flex-col gap-1.5">
              <div className="h-12 rounded-md border border-border" style={{ background: `var(--dp-${c})` }} />
              <span className="font-mono text-xs text-text-muted">{c}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typographie">
        {TYPE.map((t) => (
          <div key={t} className="flex items-baseline gap-6">
            <span className="w-16 font-mono text-xs text-text-muted">{t}</span>
            <span className={`text-${t}`}>Planifier, publier, mesurer</span>
          </div>
        ))}
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Planifier</Button>
          <Button variant="secondary">Enregistrer en brouillon</Button>
          <Button variant="ghost">Annuler</Button>
          <Button variant="danger">Supprimer</Button>
          <Button loading>Publication…</Button>
          <Button disabled>Indisponible</Button>
          <Button size="sm"><Plus className="size-4" />Créer un post</Button>
          <Button size="lg">Commencer</Button>
          <Tooltip label="Plus d'actions">
            <Button variant="ghost" size="icon" aria-label="Plus d'actions"><MoreHorizontal className="size-4" /></Button>
          </Tooltip>
          <SplitButton menuLabel="Autres options de publication" menu={<>
            <MenuItem>Enregistrer en brouillon</MenuItem>
            <MenuItem>Publier maintenant</MenuItem>
          </>}>Planifier</SplitButton>
        </div>
      </Section>

      <Section title="Champs">
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Nom de la marque" placeholder="Atelier Lumière" hint="Visible seulement par ton équipe." />
          <Input label="E-mail" defaultValue="contact@" error="Adresse e-mail incomplète." />
          <Select label="Fuseau horaire" defaultValue="Africa/Abidjan" options={[
            { value: "Africa/Abidjan", label: "Abidjan (UTC+0)" },
            { value: "Africa/Dakar", label: "Dakar (UTC+0)" },
            { value: "Europe/Paris", label: "Paris (UTC+1)" },
          ]} />
          <Input label="Date de publication" type="datetime-local" defaultValue="2026-11-28T18:00" />
          <div className="md:col-span-2">
            <Textarea label="Texte du post · Bluesky" value={text} onChange={(e) => setText(e.target.value)} maxChars={NETWORKS.bluesky.maxChars} />
          </div>
          <Textarea label="Texte trop long (exemple)" value={"a".repeat(310)} onChange={() => {}} maxChars={300} />
          <div className="flex flex-col gap-4">
            <Switch label="Publication automatique" hint="Sinon, tu reçois une notification pour publier toi-même." checked={auto} onCheckedChange={setAuto} />
            <Switch label="Option indisponible" disabled />
            <Checkbox label="Tous les réseaux" checked="indeterminate" />
            <Checkbox label="Instagram" defaultChecked />
          </div>
        </div>
      </Section>

      <Section title="Statuts, réseaux et étiquettes">
        <div className="flex flex-wrap gap-4">
          {(["published", "scheduled", "draft", "failed", "autolist", "review"] as PostStatus[]).map((s) => <StatusBadge key={s} status={s} />)}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(NETWORKS) as Network[]).map((n) => <NetworkMark key={n} network={n} />)}
          {(Object.keys(NETWORKS) as Network[]).map((n) => <NetworkMark key={`m-${n}`} network={n} muted />)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag>Lancement</Tag><Tag tone="success">Approuvé</Tag><Tag tone="warning">En attente</Tag><Tag tone="danger">Refusé</Tag><Tag tone="info">Campagne Noël</Tag>
        </div>
      </Section>

      <Section title="Cartes de post (calendrier)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PostCard time="09:00" status="published" networks={["instagram", "facebook"]} type="Carrousel" text="Les 5 pièces phares de la nouvelle collection, photographiées à l'atelier." />
          <PostCard time="12:30" status="scheduled" networks={["linkedin"]} text="Nous recrutons un ou une chargé·e de communication à Abidjan." hasUnreadNotes draggable />
          <PostCard time="18:00" status="failed" networks={["tiktok"]} type="Vidéo" text="Coulisses : la fabrication d'un sac en 60 secondes." />
          <PostCard time="20:00" status="draft" networks={["telegram", "whatsapp"]} text="Rappel : portes ouvertes samedi." density="condensed" />
        </div>
      </Section>

      <Section title="Statistiques">
        <div className="flex flex-wrap gap-3">
          <MetricCard label="Abonnés" value={18432} previous={17950} />
          <MetricCard label="Portée" value={52310} previous={61020} selected={shown.reach} onToggle={() => setShown((s) => ({ ...s, reach: !s.reach }))} />
          <MetricCard label="Interactions" value={3104} previous={2890} selected={shown.inter} onToggle={() => setShown((s) => ({ ...s, inter: !s.inter }))} />
          <MetricCard label="Taux d'engagement" value={5.9} suffix=" %" />
        </div>
        <DataTable caption="Posts de la période" rows={posts} columns={[
          { key: "date", label: "Date" },
          { key: "text", label: "Post" },
          { key: "network", label: "Réseau" },
          { key: "reach", label: "Portée", numeric: true, render: (r) => r.reach.toLocaleString("fr-FR") },
          { key: "interactions", label: "Interactions", numeric: true, render: (r) => r.interactions.toLocaleString("fr-FR") },
        ]} />
      </Section>

      <Section title="Onglets, menus, fenêtres">
        <Tabs defaultValue="unresolved">
          <TabsList items={[{ value: "unresolved", label: "Non résolus", count: 4 }, { value: "unread", label: "Non lus", count: 2 }, { value: "all", label: "Tous" }]} />
          <TabsContent value="unresolved" className="pt-4 text-sm text-text-muted">4 conversations attendent une réponse.</TabsContent>
          <TabsContent value="unread" className="pt-4 text-sm text-text-muted">2 messages non lus.</TabsContent>
          <TabsContent value="all" className="pt-4 text-sm text-text-muted">Toutes les conversations.</TabsContent>
        </Tabs>
        <div className="flex flex-wrap gap-3">
          <Menu>
            <MenuTrigger asChild><Button variant="secondary">Actions du post</Button></MenuTrigger>
            <MenuContent>
              <MenuItem icon={<Pencil className="size-4" />}>Modifier</MenuItem>
              <MenuItem icon={<Copy className="size-4" />}>Dupliquer</MenuItem>
              <MenuSeparator />
              <MenuItem danger icon={<Trash2 className="size-4" />}>Supprimer</MenuItem>
            </MenuContent>
          </Menu>
          <Dialog>
            <DialogTrigger asChild><Button variant="secondary">Ouvrir une modale</Button></DialogTrigger>
            <DialogContent title="Supprimer ce post ?" description="Il sera retiré du calendrier. Un post déjà publié reste en ligne sur le réseau."
              footer={<><DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose><Button variant="danger">Supprimer</Button></>} />
          </Dialog>
          <Dialog>
            <DialogTrigger asChild><Button variant="secondary">Ouvrir un panneau</Button></DialogTrigger>
            <DrawerContent title="Notes du post">
              <p className="text-sm text-text-muted">Aucune note pour l&apos;instant.</p>
            </DrawerContent>
          </Dialog>
        </div>
      </Section>

      <Section title="États">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState icon={<CalendarDays className="size-6" />} title="Rien de prévu cette semaine"
            text="Crée ton premier post, ou glisse une idée de la bibliothèque dans le calendrier."
            action={<Button size="sm"><Plus className="size-4" />Créer un post</Button>} />
          <EmptyState icon={<Inbox className="size-6" />} title="Tout est traité" text="Aucun message en attente de réponse." />
        </div>
        <div className="flex flex-col gap-3">
          <Toast tone="success">Post planifié pour samedi 28 novembre à 18:00.</Toast>
          <Toast tone="danger">La publication TikTok a échoué : vidéo trop longue (maximum 10 minutes).</Toast>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name="Awa Koné" /><Avatar name="Jean Belard" size={40} />
          <Skeleton className="h-9 w-48" /><Skeleton className="h-9 w-24" />
        </div>
        <div className="max-w-md"><Progress label="Objectif : 50 000 vues" value={68} /></div>
      </Section>
    </main>
  );
}
