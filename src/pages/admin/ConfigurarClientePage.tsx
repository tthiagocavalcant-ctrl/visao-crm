import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockAccounts, BRAZILIAN_TIMEZONES, Account } from '@/data/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowLeft, Copy, Check, ExternalLink, ChevronDown, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ConfigurarClientePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const accountData = mockAccounts.find((a) => a.id === id);
  const [account, setAccount] = useState<Account | null>(accountData ? { ...accountData } : null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [formActive, setFormActive] = useState(true);

  if (!account) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button variant="link" onClick={() => navigate('/admin/clientes')}>Voltar</Button>
      </div>
    );
  }

  const update = (field: keyof Account, value: any) => setAccount((p) => p ? { ...p, [field]: value } : p);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = (section: string) => {
    toast({ title: `${section} salvo com sucesso!` });
  };

  const handleResetPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    const pw = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setNewPassword(pw);
    setShowResetModal(true);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button variant="outline" size="sm" onClick={() => handleCopy(text, label)} className="shrink-0">
      {copied === label ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </Button>
  );

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/clientes')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Clientes
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{account.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure as integrações e dados deste cliente</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={account.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}
          >
            {account.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
          <Switch
            checked={account.status === 'active'}
            onCheckedChange={(v) => update('status', v ? 'active' : 'inactive')}
          />
        </div>
      </div>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="dados">Dados da Conta</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp & Forms</TabsTrigger>
          <TabsTrigger value="n8n">N8n / Webhook</TabsTrigger>
          <TabsTrigger value="acesso">Acesso</TabsTrigger>
        </TabsList>

        {/* TAB: Dados da Conta */}
        <TabsContent value="dados" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input value={account.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email de Acesso</Label>
                <Input value={account.email} readOnly className="opacity-60" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Responsável</Label>
                  <Input value={account.responsible_name} onChange={(e) => update('responsible_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={account.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
                  Arraste uma imagem ou clique para enviar<br />
                  <span className="text-xs">JPG, PNG, WEBP, GIF — máx. 5MB</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select value={account.timezone} onValueChange={(v) => update('timezone', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleSave('Dados')} className="w-full gap-2">💾 Salvar Dados</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: WhatsApp & Forms */}
        <TabsContent value="whatsapp" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Link do WhatsApp</Label>
                <div className="flex gap-2">
                  <Input value={account.whatsapp_link} onChange={(e) => update('whatsapp_link', e.target.value)} placeholder="https://wa.me/5511999999999" />
                  {account.whatsapp_link && (
                    <Button variant="outline" size="sm" onClick={() => window.open(account.whatsapp_link, '_blank')} className="shrink-0 gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Testar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Formato: https://wa.me/5511999999999</p>
                <Badge className={account.whatsapp_link ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>
                  {account.whatsapp_link ? 'Configurado' : 'Não configurado'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Formulário de Agendamento</CardTitle>
              <CardDescription>Configure o formulário público de agendamento deste cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Formulário</Label>
                <div className="flex gap-2">
                  <Input value={`https://app.crm.com/form/${account.id}`} readOnly className="font-mono text-xs" />
                  <CopyButton text={`https://app.crm.com/form/${account.id}`} label="formUrl" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label>Formulário ativo</Label>
                <Switch checked={formActive} onCheckedChange={setFormActive} />
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => handleSave('WhatsApp & Forms')} className="w-full gap-2">💾 Salvar</Button>
        </TabsContent>

        {/* TAB: N8n / Webhook */}
        <TabsContent value="n8n" className="space-y-6 mt-6">
          <Card className="border-border bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-foreground font-medium">🔗 Endpoint de Recebimento (N8n → CRM)</p>
              <p className="text-xs text-muted-foreground">Use esta URL no seu workflow do N8n para enviar leads e atualizar status automaticamente</p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">URL do Endpoint</Label>
                  <div className="flex gap-2">
                    <Input value="https://api.crm.com/functions/v1/update-lead-status" readOnly className="font-mono text-xs" />
                    <CopyButton text="https://api.crm.com/functions/v1/update-lead-status" label="endpoint" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Account ID</Label>
                  <div className="flex gap-2">
                    <Input value={account.id} readOnly className="font-mono text-xs" />
                    <CopyButton text={account.id} label="accountId" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">POST</Badge>
                  <span className="text-muted-foreground">Content-Type: application/json</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Webhooks de Saída (CRM → N8n)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'n8n_webhook' as const, label: 'Webhook Novo Lead', helper: 'Disparado quando um novo lead é recebido' },
                { key: 'followup_webhook' as const, label: 'Webhook Follow-Up / Não Compareceu', helper: "Disparado quando lead muda para status 'Não compareceu'" },
                { key: 'sale_webhook' as const, label: 'Webhook Venda Realizada', helper: "Disparado quando lead muda para status 'Venda realizada'" },
              ].map((wh) => (
                <div key={wh.key} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${account[wh.key] ? 'bg-emerald-400' : 'bg-muted-foreground/30'}`} />
                    <Label>{wh.label}</Label>
                  </div>
                  <Input value={account[wh.key]} onChange={(e) => update(wh.key, e.target.value)} placeholder="https://n8n.example.com/webhook/..." />
                  <p className="text-xs text-muted-foreground">{wh.helper}</p>

                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                      <ChevronDown className="w-3 h-3" />
                      Ver exemplo de payload
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="bg-background border border-border rounded-lg p-3 mt-2 text-xs font-mono text-muted-foreground overflow-x-auto">
{JSON.stringify({
  lead_id: 'uuid-do-lead',
  account_id: account.id,
  name: 'Nome do Lead',
  phone: '5511999999999',
  status: wh.key === 'n8n_webhook' ? 'LEAD' : wh.key === 'followup_webhook' ? 'Não compareceu' : 'Venda realizada',
}, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button onClick={() => handleSave('Webhooks')} className="w-full gap-2">💾 Salvar Webhooks</Button>
        </TabsContent>

        {/* TAB: Acesso */}
        <TabsContent value="acesso" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Credenciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={account.email} readOnly className="opacity-60" />
              </div>
              <Button variant="outline" onClick={handleResetPassword} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Redefinir Senha
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Sessões Ativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Último login: 12 de mar. de 2024, 14:30</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">Revogar Acesso</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revogar acesso</AlertDialogTitle>
                    <AlertDialogDescription>Isso desativará a conta do cliente imediatamente. O cliente não poderá mais acessar o sistema.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { update('status', 'inactive'); toast({ title: 'Acesso revogado' }); }} className="bg-destructive text-destructive-foreground">
                      Revogar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 border-2">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Esta ação é irreversível. Todos os dados do cliente serão permanentemente removidos.
              </p>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Digite <strong className="text-foreground">{account.name}</strong> para confirmar
                </Label>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={account.name}
                />
              </div>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== account.name}
                onClick={() => { toast({ title: 'Cliente excluído' }); navigate('/admin/clientes'); }}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Cliente
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Password Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova senha gerada</DialogTitle>
            <DialogDescription>Compartilhe a nova senha com o cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label className="text-xs text-muted-foreground">Nova Senha</Label>
            <div className="flex gap-2">
              <Input value={newPassword} readOnly className="font-mono" />
              <CopyButton text={newPassword} label="newPw" />
            </div>
          </div>
          <Button onClick={() => setShowResetModal(false)} className="w-full">Fechar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfigurarClientePage;
