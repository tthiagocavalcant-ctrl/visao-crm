import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { BRAZILIAN_TIMEZONES } from '@/data/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowLeft, Copy, Check, ExternalLink, ChevronDown, AlertTriangle, Trash2, RefreshCw, Eye, EyeOff, QrCode, Unplug, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Account = Tables<'accounts'>;

const ConfigurarClientePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accountData, isLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('accounts').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [account, setAccount] = useState<Account | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (accountData) {
      setAccount({ ...accountData });
      const ws = accountData.whatsapp_status;
      setWhatsappStatus(ws === 'connected' ? 'connected' : 'disconnected');
    }
  }, [accountData]);

  const saveMutation = useMutation({
    mutationFn: async (updates: Partial<Account>) => {
      const { error } = await supabase.from('accounts').update(updates).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('accounts').delete().eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Cliente excluído' });
      navigate('/admin/clientes');
    },
  });

  if (isLoading) {
    return <div className="text-center py-16"><p className="text-muted-foreground">Carregando...</p></div>;
  }

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
    if (!account) return;
    saveMutation.mutate({
      name: account.name,
      whatsapp_link: account.whatsapp_link,
      n8n_webhook: account.n8n_webhook,
      followup_webhook: account.followup_webhook,
      sale_webhook: account.sale_webhook,
      facebook_pixel: account.facebook_pixel,
      google_ads_tag: account.google_ads_tag,
      timezone: account.timezone,
      responsible_name: account.responsible_name,
      phone: account.phone,
      status: account.status,
      evolution_url: account.evolution_url,
      evolution_key: account.evolution_key,
      evolution_instance: account.evolution_instance,
      plan: (account as any).plan,
      max_users: (account as any).max_users,
    } as any);
    toast({ title: `${section} salvo com sucesso!` });
  };

  const handleSaveWhatsApp = async () => {
    if (!account || !id) return;
    const { error } = await supabase
      .from('accounts')
      .update({
        evolution_url: account.evolution_url,
        evolution_key: account.evolution_key,
        evolution_instance: account.evolution_instance,
      })
      .eq('id', id);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['account', id] });
      toast({ title: 'Configurações salvas com sucesso' });
    }
  };

  const fetchQrCode = async () => {
    if (!account?.evolution_url || !account?.evolution_key || !account?.evolution_instance) return;
    setQrLoading(true);
    setQrCodeBase64(null);
    setWhatsappStatus('connecting');
    try {
      const url = `${account.evolution_url.replace(/\/$/, '')}/instance/connect/${account.evolution_instance}`;
      const res = await fetch(url, { headers: { apikey: account.evolution_key } });
      const json = await res.json();
      if (json.base64) {
        setQrCodeBase64(json.base64);
      } else if (json.instance?.state === 'open' || json.state === 'open') {
        // Already connected
        setWhatsappStatus('connected');
        await supabase.from('accounts').update({ whatsapp_status: 'connected' }).eq('id', id!);
        queryClient.invalidateQueries({ queryKey: ['account', id] });
        setShowQrModal(false);
        toast({ title: 'WhatsApp conectado!' });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar QR Code', description: err.message, variant: 'destructive' });
    } finally {
      setQrLoading(false);
    }
  };

  // Auto-refresh QR code every 20s
  useEffect(() => {
    if (!showQrModal || whatsappStatus === 'connected') return;
    fetchQrCode();
    const interval = setInterval(fetchQrCode, 20000);
    return () => clearInterval(interval);
  }, [showQrModal, whatsappStatus]);

  const handleDisconnect = async () => {
    if (!account?.evolution_url || !account?.evolution_key || !account?.evolution_instance || !id) return;
    setDisconnecting(true);
    try {
      const url = `${account.evolution_url.replace(/\/$/, '')}/instance/logout/${account.evolution_instance}`;
      await fetch(url, { method: 'DELETE', headers: { apikey: account.evolution_key } });
    } catch (err) {
      // continue even if logout API fails
    }
    await supabase.from('accounts').update({ whatsapp_status: 'disconnected' }).eq('id', id);
    setWhatsappStatus('disconnected');
    queryClient.invalidateQueries({ queryKey: ['account', id] });
    toast({ title: 'WhatsApp desconectado' });
    setDisconnecting(false);
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
          <TabsTrigger value="whatsappConfig">WhatsApp</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp & Forms</TabsTrigger>
          <TabsTrigger value="n8n">N8n / Webhook</TabsTrigger>
          <TabsTrigger value="pixels">Pixels & Tracking</TabsTrigger>
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
                  <Input value={account.responsible_name || ''} onChange={(e) => update('responsible_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={account.phone || ''} onChange={(e) => update('phone', e.target.value)} />
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
                <Select value={account.timezone || 'America/Sao_Paulo'} onValueChange={(v) => update('timezone', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Plano & Limites */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Plano & Limites</CardTitle>
              <CardDescription>Defina o plano e o limite de colaboradores deste cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select
                  value={(account as any).plan || 'basico'}
                  onValueChange={(v) => {
                    const maxMap: Record<string, number> = { basico: 3, profissional: 5, enterprise: 10 };
                    setAccount(p => p ? { ...p, plan: v as any, max_users: maxMap[v] ?? 3 } : p);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico — 3 colaboradores</SelectItem>
                    <SelectItem value="profissional">Profissional — 5 colaboradores</SelectItem>
                    <SelectItem value="enterprise">Enterprise — 10 colaboradores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Este plano permite até <strong className="text-foreground">{(account as any).max_users ?? 3}</strong> colaboradores ativos.
              </p>
            </CardContent>
          </Card>

          <Button onClick={() => handleSave('Dados')} disabled={saveMutation.isPending} className="w-full gap-2">
            {saveMutation.isPending ? 'Salvando...' : '💾 Salvar Dados'}
          </Button>
        </TabsContent>

        {/* TAB: WhatsApp Config (Evolution API) */}
        <TabsContent value="whatsappConfig" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5" /> Conexão Evolution API
              </CardTitle>
              <CardDescription>Configure a API Evolution para integração com o WhatsApp deste cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Evolution API URL</Label>
                <Input value={account.evolution_url || ''} onChange={e => update('evolution_url', e.target.value)} placeholder="https://evolution.example.com" />
              </div>
              <div className="space-y-2">
                <Label>Evolution API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={account.evolution_key || ''}
                    onChange={e => update('evolution_key', e.target.value)}
                    placeholder="Sua API Key"
                  />
                  <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)} className="shrink-0">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instance Name</Label>
                <Input value={account.evolution_instance || ''} onChange={e => update('evolution_instance', e.target.value)} placeholder="instance-name" />
              </div>
              <Button onClick={() => handleSave('WhatsApp Config')} disabled={saveMutation.isPending} className="w-full gap-2">
                {saveMutation.isPending ? 'Salvando...' : '💾 Salvar Configuração'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Status da Conexão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  whatsappStatus === 'connected' ? 'bg-success' :
                  whatsappStatus === 'connecting' ? 'bg-warning animate-pulse' :
                  'bg-destructive'
                }`} />
                <span className="text-sm font-medium text-foreground">
                  {whatsappStatus === 'connected' ? 'Conectado' :
                   whatsappStatus === 'connecting' ? 'Conectando...' :
                   'Desconectado'}
                </span>
              </div>
              {whatsappStatus === 'connected' && (
                <p className="text-xs text-muted-foreground">Última conexão: 12/03/2026 às 14:30</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQrModal(true)}
                  disabled={!account.evolution_url || !account.evolution_key || !account.evolution_instance}
                  className="gap-2"
                >
                  <QrCode className="w-4 h-4" /> Gerar QR Code
                </Button>
                {whatsappStatus === 'connected' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Unplug className="w-4 h-4" /> Desconectar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar WhatsApp</AlertDialogTitle>
                        <AlertDialogDescription>O cliente perderá a conexão com o WhatsApp e não poderá enviar/receber mensagens até reconectar.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setWhatsappStatus('disconnected'); toast({ title: 'WhatsApp desconectado' }); }} className="bg-destructive text-destructive-foreground">Desconectar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">WhatsApp</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Link do WhatsApp</Label>
                <div className="flex gap-2">
                  <Input value={account.whatsapp_link || ''} onChange={(e) => update('whatsapp_link', e.target.value)} placeholder="https://wa.me/5511999999999" />
                  {account.whatsapp_link && (
                    <Button variant="outline" size="sm" onClick={() => window.open(account.whatsapp_link!, '_blank')} className="shrink-0 gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Testar
                    </Button>
                  )}
                </div>
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
          <Button onClick={() => handleSave('WhatsApp & Forms')} disabled={saveMutation.isPending} className="w-full gap-2">
            {saveMutation.isPending ? 'Salvando...' : '💾 Salvar'}
          </Button>
        </TabsContent>

        {/* TAB: N8n / Webhook */}
        <TabsContent value="n8n" className="space-y-6 mt-6">
          <Card className="border-border bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-foreground font-medium">🔗 Endpoint de Recebimento (N8n → CRM)</p>
              <p className="text-xs text-muted-foreground">Use esta URL no seu workflow do N8n para enviar leads</p>
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
            <CardHeader><CardTitle className="text-lg">Webhooks de Saída (CRM → N8n)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'n8n_webhook' as const, label: 'Webhook Novo Lead', helper: 'Disparado quando um novo lead é recebido' },
                { key: 'followup_webhook' as const, label: 'Webhook Follow-Up / Não Compareceu', helper: "Disparado quando lead muda para 'Não compareceu'" },
                { key: 'sale_webhook' as const, label: 'Webhook Venda Realizada', helper: "Disparado quando lead muda para 'Venda realizada'" },
              ].map((wh) => (
                <div key={wh.key} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${account[wh.key] ? 'bg-emerald-400' : 'bg-muted-foreground/30'}`} />
                    <Label>{wh.label}</Label>
                  </div>
                  <Input value={account[wh.key] || ''} onChange={(e) => update(wh.key, e.target.value)} placeholder="https://n8n.example.com/webhook/..." />
                  <p className="text-xs text-muted-foreground">{wh.helper}</p>
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                      <ChevronDown className="w-3 h-3" /> Ver exemplo de payload
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="bg-background border border-border rounded-lg p-3 mt-2 text-xs font-mono text-muted-foreground overflow-x-auto">
{JSON.stringify({ lead_id: 'uuid-do-lead', account_id: account.id, name: 'Nome do Lead', phone: '5511999999999', status: wh.key === 'n8n_webhook' ? 'LEAD' : wh.key === 'followup_webhook' ? 'Não compareceu' : 'Venda realizada' }, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button onClick={() => handleSave('Webhooks')} disabled={saveMutation.isPending} className="w-full gap-2">
            {saveMutation.isPending ? 'Salvando...' : '💾 Salvar Webhooks'}
          </Button>
        </TabsContent>

        {/* TAB: Pixels & Tracking */}
        <TabsContent value="pixels" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">📊 Pixels & Tracking</CardTitle>
              <CardDescription>Configure os pixels de rastreamento e tags de conversão deste cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pixel do Facebook</Label>
                <Input value={account.facebook_pixel || ''} onChange={(e) => update('facebook_pixel', e.target.value)} placeholder="Ex: 123456789012345" />
                <p className="text-xs text-muted-foreground">ID do pixel do Facebook para rastreamento de conversões</p>
              </div>
              <div className="space-y-2">
                <Label>Tag de Conversão Google Ads</Label>
                <Input value={account.google_ads_tag || ''} onChange={(e) => update('google_ads_tag', e.target.value)} placeholder="AW-XXXXXXXXX/XXXXXXXXX" />
                <p className="text-xs text-muted-foreground">Tag de conversão do Google Ads. Formato: AW-XXXXXXXXXX</p>
              </div>
              <div className="space-y-2">
                <Label>Webhook Venda Realizada</Label>
                <Input value={account.sale_webhook || ''} onChange={(e) => update('sale_webhook', e.target.value)} placeholder="https://n8n.example.com/webhook/..." />
                <p className="text-xs text-muted-foreground">Disparado quando um lead é marcado como venda</p>
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => handleSave('Pixels & Tracking')} disabled={saveMutation.isPending} className="w-full gap-2">
            {saveMutation.isPending ? 'Salvando...' : '💾 Salvar'}
          </Button>
        </TabsContent>

        {/* TAB: Acesso */}
        <TabsContent value="acesso" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Credenciais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={account.email} readOnly className="opacity-60" />
              </div>
              <Button variant="outline" onClick={handleResetPassword} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Redefinir Senha
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Sessões Ativas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Último login: 12 de mar. de 2024, 14:30</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">Revogar Acesso</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revogar acesso</AlertDialogTitle>
                    <AlertDialogDescription>Isso desativará a conta do cliente imediatamente.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { update('status', 'inactive'); saveMutation.mutate({ status: 'inactive' }); toast({ title: 'Acesso revogado' }); }} className="bg-destructive text-destructive-foreground">Revogar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 border-2">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Esta ação é irreversível. Todos os dados serão permanentemente removidos.</p>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Digite <strong className="text-foreground">{account.name}</strong> para confirmar
                </Label>
                <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={account.name} />
              </div>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== account.name || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" /> Excluir Cliente
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

      {/* QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp — {account.name}</DialogTitle>
            <DialogDescription>Siga os passos para conectar o WhatsApp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="font-semibold text-foreground">1.</span> Abra o WhatsApp no celular do cliente</li>
              <li className="flex gap-2"><span className="font-semibold text-foreground">2.</span> Vá em Aparelhos conectados</li>
              <li className="flex gap-2"><span className="font-semibold text-foreground">3.</span> Toque em Conectar aparelho</li>
              <li className="flex gap-2"><span className="font-semibold text-foreground">4.</span> Escaneie o QR Code abaixo</li>
            </ol>
            <div className="flex items-center justify-center p-6 border border-border rounded bg-white">
              <div className="w-48 h-48 bg-muted rounded flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">QR Code atualiza automaticamente a cada 20s</p>
            <Button
              onClick={() => {
                setWhatsappStatus('connected');
                setShowQrModal(false);
                toast({ title: 'WhatsApp conectado!' });
              }}
              className="w-full gap-2"
            >
              ✓ Simular Conexão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfigurarClientePage;
