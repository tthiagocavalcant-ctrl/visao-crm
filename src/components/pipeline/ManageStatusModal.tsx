import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface PipelineStatus {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

const AVAILABLE_COLORS = [
  { id: 'purple', label: 'Roxo' },
  { id: 'primary', label: 'Azul' },
  { id: 'success', label: 'Verde' },
  { id: 'destructive', label: 'Vermelho' },
  { id: 'warning', label: 'Amarelo' },
];

const colorToCss: Record<string, string> = {
  purple: 'bg-purple',
  primary: 'bg-primary',
  success: 'bg-success',
  destructive: 'bg-destructive',
  warning: 'bg-warning',
};

interface Props {
  open: boolean;
  onClose: () => void;
  statuses: PipelineStatus[];
  onSave: (statuses: PipelineStatus[]) => void;
  leadCountByStatus: Record<string, number>;
}

const ManageStatusModal = ({ open, onClose, statuses, onSave, leadCountByStatus }: Props) => {
  const [items, setItems] = useState<PipelineStatus[]>(statuses);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const updateItem = (index: number, updates: Partial<PipelineStatus>) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const deleteItem = (index: number) => {
    const item = items[index];
    const count = leadCountByStatus[item.id] || 0;
    if (count > 0) {
      toast({ title: 'Mova os leads antes de excluir', description: `Existem ${count} leads neste status.`, variant: 'destructive' });
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const addStatus = () => {
    const id = `custom_${Date.now()}`;
    setItems(prev => [...prev, { id, name: '', color: 'primary', visible: true }]);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, moved);
    setItems(newItems);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  const handleSave = () => {
    const hasEmpty = items.some(i => !i.name.trim());
    if (hasEmpty) {
      toast({ title: 'Preencha todos os nomes de status', variant: 'destructive' });
      return;
    }
    onSave(items);
    toast({ title: 'Status atualizados com sucesso' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Status do Pipeline</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto py-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-2 rounded-md border border-border bg-card transition-opacity ${dragIndex === index ? 'opacity-50' : ''}`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />

              {/* Color picker */}
              <div className="relative group shrink-0">
                <span className={`w-4 h-4 rounded-full block cursor-pointer ${colorToCss[item.color] || 'bg-muted-foreground'}`} />
                <div className="absolute left-0 top-6 z-10 hidden group-hover:flex bg-popover border border-border rounded-md p-1.5 gap-1.5 shadow-lg">
                  {AVAILABLE_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => updateItem(index, { color: c.id })}
                      className={`w-5 h-5 rounded-full ${colorToCss[c.id]} ${item.color === c.id ? 'ring-2 ring-ring ring-offset-1 ring-offset-background' : ''}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <Input
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                className="h-8 text-sm flex-1"
                placeholder="Nome do status..."
                autoFocus={!item.name}
              />

              <Switch
                checked={item.visible}
                onCheckedChange={(v) => updateItem(index, { visible: v })}
              />

              <button
                onClick={() => deleteItem(index)}
                className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                title={(leadCountByStatus[item.id] || 0) > 0 ? 'Mova os leads antes de excluir' : 'Excluir'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addStatus} className="w-full gap-2">
          <Plus className="w-4 h-4" /> Adicionar Status
        </Button>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>💾 Salvar Ordem e Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageStatusModal;
