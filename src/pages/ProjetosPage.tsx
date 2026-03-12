import { mockProjects } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { FolderKanban } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const ProjetosPage = () => {
  const { user } = useAuth();
  const projects = mockProjects.filter(p => p.account_id === (user?.account_id || 'acc-1'));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-page-title text-foreground">Projetos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visualize e gerencie seus projetos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => {
          const pct = project.total_tasks > 0 ? Math.round((project.completed_tasks / project.total_tasks) * 100) : 0;
          return (
            <div key={project.id} className="glass-card border border-border rounded p-4 space-y-3 hover:bg-card-hover cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{project.name}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.completed_tasks}/{project.total_tasks} tarefas</span>
                  <span>{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded ${project.status === 'active' ? 'bg-primary/20 text-primary' : project.status === 'completed' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                {project.status === 'active' ? 'Ativo' : project.status === 'completed' ? 'Concluído' : 'Arquivado'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjetosPage;
