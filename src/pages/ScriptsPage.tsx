import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Star, FileText, Image as ImageIcon, Video, Pencil, Trash2, SendHorizonal,
  FolderOpen, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface ScriptCategory {
  id: string;
  account_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

interface Script {
  id: string;
  account_id: string;
  category_id: string | null;
  title: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  is_favorite: boolean;
  position: number;
  created_at: string;
  script_categories: { name: string; color: string } | null;
}

const COLOR_OPTIONS = [
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
  { value: 'green', label: 'Verde', class: 'bg-emerald-500' },
  { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
  { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
  { value: 'gray', label: 'Cinza', class: 'bg-gray-500' },
];

const colorToClass = (color: string) =>
  COLOR_OPTIONS.find(c => c.value === color)?.class ?? 'bg-purple-500';

const ScriptsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const accountId = user?.account_id;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null=all, 'favorites', or id
  const [scriptModal, setScriptModal] = useState<{ open: boolean; editing?: Script }>({ open: false });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing?: ScriptCategory }>({ open: false });

  // Script form
  const [scriptForm, setScriptForm] = useState({ title: '', category_id: '', content: '', media_type: 'none' as string, media_url: '' });
  // Category form
  const [catForm, setCatForm] = useState({ name: '', color: 'purple' });

  // ── Queries ──
  const { data: categories = [] } = useQuery<ScriptCategory[]>({
    queryKey: ['script_categories', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('script_categories')
        .select('*')
        .eq('account_id', accountId!)
        .order('position');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!accountId,
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ['scripts', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scripts')
        .select('*, script_categories(name, color)')
        .eq('account_id', accountId!)
        .order('position');
      if (error) throw error;
      return (data ?? []) as Script[];
    },
    enabled: !!accountId,
  });

  // ── Mutations ──
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['scripts', accountId] });
    queryClient.invalidateQueries({ queryKey: ['script_categories', accountId] });
  };

  const saveScriptMut = useMutation({
    mutationFn: async (isEdit: boolean) => {
      const payload = {
        account_id: accountId!,
        title: scriptForm.title,
        category_id: scriptForm.category_id || null,
        content: scriptForm.content,
        media_type: scriptForm.media_type === 'none' ? null : scriptForm.media_type,
        media_url: scriptForm.media_type === 'none' ? null : scriptForm.media_url || null,
      };
      if (isEdit && scriptModal.editing) {
        const { error } = await supabase.from('scripts').update(payload).eq('id', scriptModal.editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('scripts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { invalidateAll(); setScriptModal({ open: false }); toast.success('Script salvo!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteScriptMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scripts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success('Script excluído'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFavMut = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase.from('scripts').update({ is_favorite: !current }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
  });

  const saveCategoryMut = useMutation({
    mutationFn: async (isEdit: boolean) => {
      const payload = { account_id: accountId!, name: catForm.name, color: catForm.color };
      if (isEdit && categoryModal.editing) {
        const { error } = await supabase.from('script_categories').update(payload).eq('id', categoryModal.editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('script_categories').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { invalidateAll(); setCategoryModal({ open: false }); toast.success('Categoria salva!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCategoryMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('script_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); if (selectedCategory === 'deleted') setSelectedCategory(null); toast.success('Categoria excluída'); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Filtered scripts ──
  const filteredScripts = useMemo(() => {
    if (selectedCategory === 'favorites') return scripts.filter(s => s.is_favorite);
    if (selectedCategory && selectedCategory !== 'favorites') return scripts.filter(s => s.category_id === selectedCategory);
    return scripts;
  }, [scripts, selectedCategory]);

  // ── Open modals ──
  const openNewScript = () => {
    setScriptForm({ title: '', category_id: '', content: '', media_type: 'none', media_url: '' });
    setScriptModal({ open: true });
  };
  const openEditScript = (s: Script) => {
    setScriptForm({
      title: s.title,
      category_id: s.category_id ?? '',
      content: s.content ?? '',
      media_type: s.media_type ?? 'none',
      media_url: s.media_url ?? '',
    });
    setScriptModal({ open: true, editing: s });
  };
  const openNewCategory = () => {
    setCatForm({ name: '', color: 'purple' });
    setCategoryModal({ open: true });
  };
  const openEditCategory = (c: ScriptCategory) => {
    setCatForm({ name: c.name, color: c.color });
    setCategoryModal({ open: true, editing: c });
  };

  const mediaIcon = (type: string | null) => {
    if (type === 'image') return <ImageIcon className="w-4 h-4 text-muted-foreground" />;
    if (type === 'video') return <Video className="w-4 h-4 text-muted-foreground" />;
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Scripts</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openNewCategory}>
            <Plus className="w-4 h-4 mr-1" /> Nova Categoria
          </Button>
          <Button size="sm" onClick={openNewScript}>
            <Plus className="w-4 h-4 mr-1" /> Novo Script
          </Button>
        </div>
      </div>

      {/* Two columns */}
      <div className="flex gap-6 min-h-[calc(100vh-200px)]">
        {/* Left — Categories */}
        <div className="w-[30%] shrink-0 space-y-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCategory === null ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <FolderOpen className="w-4 h-4" /> Todos
            <span className="ml-auto text-xs text-muted-foreground">{scripts.length}</span>
          </button>
          <button
            onClick={() => setSelectedCategory('favorites')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCategory === 'favorites' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Heart className="w-4 h-4" /> Favoritos
            <span className="ml-auto text-xs text-muted-foreground">{scripts.filter(s => s.is_favorite).length}</span>
          </button>

          <div className="my-2 border-t border-border" />

          {categories.map(cat => (
            <div
              key={cat.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                selectedCategory === cat.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <div className={`w-3 h-3 rounded-full shrink-0 ${colorToClass(cat.color)}`} />
              <span className="flex-1 truncate">{cat.name}</span>
              <span className="text-xs text-muted-foreground">{scripts.filter(s => s.category_id === cat.id).length}</span>
              <div className="hidden group-hover:flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEditCategory(cat)} className="p-0.5 hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => deleteCategoryMut.mutate(cat.id)} className="p-0.5 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Right — Scripts grid */}
        <div className="flex-1 min-w-0">
          {filteredScripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum script encontrado</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openNewScript}>
                <Plus className="w-4 h-4 mr-1" /> Criar Script
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredScripts.map(script => (
                <div
                  key={script.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {mediaIcon(script.media_type)}
                      <h3 className="text-sm font-semibold text-foreground truncate">{script.title}</h3>
                    </div>
                    <button
                      onClick={() => toggleFavMut.mutate({ id: script.id, current: script.is_favorite })}
                      className="shrink-0 ml-1"
                    >
                      <Star className={`w-4 h-4 ${script.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    </button>
                  </div>

                  {script.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{script.content}</p>
                  )}

                  {script.media_url && script.media_type === 'image' && (
                    <div className="mb-3 rounded overflow-hidden">
                      <img src={script.media_url} alt="" className="w-full h-24 object-cover" />
                    </div>
                  )}

                  {script.script_categories && (
                    <Badge variant="secondary" className="text-[10px] mb-3">
                      <div className={`w-2 h-2 rounded-full mr-1 ${colorToClass(script.script_categories.color)}`} />
                      {script.script_categories.name}
                    </Badge>
                  )}

                  <div className="flex items-center gap-1 pt-2 border-t border-border">
                    <button onClick={() => openEditScript(script)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteScriptMut.mutate(script.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-accent">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent opacity-50 cursor-not-allowed" title="Disponível nas conversas">
                      <SendHorizonal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Script Modal ── */}
      <Dialog open={scriptModal.open} onOpenChange={open => !open && setScriptModal({ open: false })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{scriptModal.editing ? 'Editar Script' : 'Novo Script'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={scriptForm.title} onChange={e => setScriptForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Boas-vindas" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={scriptForm.category_id} onValueChange={v => setScriptForm(p => ({ ...p, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colorToClass(c.color)}`} /> {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={scriptForm.content}
                onChange={e => setScriptForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Texto da mensagem..."
                rows={4}
              />
            </div>
            <div>
              <Label>Mídia</Label>
              <RadioGroup
                value={scriptForm.media_type}
                onValueChange={v => setScriptForm(p => ({ ...p, media_type: v, media_url: v === 'none' ? '' : p.media_url }))}
                className="flex gap-4 mt-1"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="none" id="media-none" />
                  <Label htmlFor="media-none" className="text-xs">Sem mídia</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="image" id="media-image" />
                  <Label htmlFor="media-image" className="text-xs">Imagem</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="video" id="media-video" />
                  <Label htmlFor="media-video" className="text-xs">Vídeo</Label>
                </div>
              </RadioGroup>
              {scriptForm.media_type !== 'none' && (
                <div className="mt-2 space-y-2">
                  <Input
                    value={scriptForm.media_url}
                    onChange={e => setScriptForm(p => ({ ...p, media_url: e.target.value }))}
                    placeholder="URL da mídia"
                  />
                  {scriptForm.media_url && scriptForm.media_type === 'image' && (
                    <img src={scriptForm.media_url} alt="Preview" className="w-full h-32 object-cover rounded" />
                  )}
                  {scriptForm.media_url && scriptForm.media_type === 'video' && (
                    <video src={scriptForm.media_url} controls className="w-full h-32 rounded" />
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => saveScriptMut.mutate(!!scriptModal.editing)}
              disabled={!scriptForm.title.trim() || saveScriptMut.isPending}
            >
              {saveScriptMut.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Category Modal ── */}
      <Dialog open={categoryModal.open} onOpenChange={open => !open && setCategoryModal({ open: false })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{categoryModal.editing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Vendas" />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCatForm(p => ({ ...p, color: c.value }))}
                    className={`w-8 h-8 rounded-full ${c.class} transition-all ${
                      catForm.color === c.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => saveCategoryMut.mutate(!!categoryModal.editing)}
              disabled={!catForm.name.trim() || saveCategoryMut.isPending}
            >
              {saveCategoryMut.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScriptsPage;
