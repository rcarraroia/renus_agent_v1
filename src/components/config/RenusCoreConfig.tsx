import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, Plus, Upload, FileText, Settings, Zap, GitBranch, BookOpen, Send } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

// --- Sub-Components for Tabs ---

const InstructionsTab: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="prompt-principal">Prompt Principal</Label>
      <Textarea 
        id="prompt-principal" 
        placeholder="Defina o prompt base e as regras de comportamento do Agente Principal..." 
        className="bg-background/50 min-h-[200px] border-primary/20" 
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="identidade">Identidade do Agente</Label>
        <Input id="identidade" placeholder="Ex: RENUS AI, Assistente de Requisitos" className="bg-background/50 border-primary/20" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="objetivo">Objetivo Operacional</Label>
        <Input id="objetivo" placeholder="Ex: Coletar e analisar dados de mercado" className="bg-background/50 border-primary/20" />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="comunicacao">Modo de Comunicação</Label>
      <Select defaultValue="texto">
        <SelectTrigger id="comunicacao" className="bg-background/50 border-primary/20">
          <SelectValue placeholder="Selecione o Modo" />
        </SelectTrigger>
        <SelectContent className="bg-card">
          <SelectItem value="voz">Voz</SelectItem>
          <SelectItem value="texto">Texto</SelectItem>
          <SelectItem value="hibrido">Híbrido</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const ToolsTab: React.FC = () => {
  const mockTools = [
    { name: "Google Search API", status: "Conectado", icon: Settings },
    { name: "Internal DB Query", status: "Desconectado", icon: Zap },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Ferramenta
        </Button>
      </div>
      <div className="space-y-2">
        {mockTools.map((tool, index) => (
          <Card key={index} className="bg-background/50 border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <tool.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{tool.name}</span>
              </div>
              <span className={cn("text-sm", tool.status === "Conectado" ? "text-green-400" : "text-red-400")}>
                {tool.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const IntegrationsTab: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">Conecte o RENUS Core a serviços externos para expandir suas capacidades operacionais.</p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {["GitHub", "Google Drive", "N8N", "Slack"].map(app => (
        <Card key={app} className="bg-background/50 border-primary/20 p-4 text-center hover:bg-secondary/50 transition-colors cursor-pointer">
          <GitBranch className="h-8 w-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-medium">{app}</p>
          <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground">Configurar</Button>
        </Card>
      ))}
    </div>
  </div>
);

const KnowledgeTab: React.FC = () => {
  const mockKnowledge = [
    { title: "Manual de MMN 2024", date: "2024-09-01", size: "1.2MB", type: "PDF" },
    { title: "Requisitos Iniciais", date: "2024-10-15", size: "50KB", type: "YAML" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <Upload className="mr-2 h-4 w-4" />
          + Adicionar Conhecimento
        </Button>
        <p className="text-sm text-muted-foreground">Máximo de 50MB por arquivo.</p>
      </div>
      
      <Card className="bg-background/50 border-primary/20 p-4">
        <h3 className="text-lg font-semibold mb-3">Bases Carregadas</h3>
        <div className="space-y-2">
          {mockKnowledge.map((item, index) => (
            <div key={index} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-b-0">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{item.title}</span>
              </div>
              <div className="text-xs text-muted-foreground space-x-4">
                <span>{item.type}</span>
                <span>{item.size}</span>
                <span>{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const TriggersTab: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">Defina os eventos que iniciam a execução do Agente Principal.</p>
    
    <div className="space-y-4">
      <Card className="bg-background/50 border-primary/20 p-4">
        <CardTitle className="text-base mb-2">Gatilho 1: Entrada de Dados</CardTitle>
        <p className="text-sm text-muted-foreground">Inicia quando um novo lead é inserido no sistema.</p>
      </Card>
      <Card className="bg-background/50 border-primary/20 p-4">
        <CardTitle className="text-base mb-2">Gatilho 2: Evento Externo</CardTitle>
        <p className="text-sm text-muted-foreground">Inicia via webhook após a conclusão de uma venda.</p>
      </Card>
    </div>

    <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full">
      <Plus className="mr-2 h-4 w-4" />
      + Adicionar Trigger
    </Button>
  </div>
);


const tabComponents: Record<string, React.FC> = {
  instructions: InstructionsTab,
  tools: ToolsTab,
  integrations: IntegrationsTab,
  knowledge: KnowledgeTab,
  triggers: TriggersTab,
};

const tabItems = [
  { value: "instructions", label: "Instructions", icon: FileText },
  { value: "tools", label: "Tools", icon: Settings },
  { value: "integrations", label: "Integrations", icon: GitBranch },
  { value: "knowledge", label: "Knowledge", icon: BookOpen },
  { value: "triggers", label: "Triggers", icon: Zap },
];

const RenusCoreConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState("instructions");

  const handleSave = () => {
    showSuccess("Configurações do RENUS Core atualizadas com sucesso!");
  };

  return (
    <Card className="bg-secondary/30 border-primary/20">
      <CardHeader>
        <CardTitle>Configurações do Agente Principal (RENUS Core)</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto bg-background/50 border border-border/50 mb-6">
            {tabItems.map(item => (
              <TabsTrigger 
                key={item.value} 
                value={item.value} 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md transition-colors duration-200"
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            {tabItems.map(item => {
              if (item.value === activeTab) {
                const TabComponent = tabComponents[item.value];
                return (
                  <motion.div
                    key={item.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TabsContent value={item.value} className="mt-0">
                      <TabComponent />
                    </TabsContent>
                  </motion.div>
                );
              }
              return null;
            })}
          </AnimatePresence>
        </Tabs>
        
        <div className="flex justify-end pt-6">
          <Button 
            className="bg-primary hover:bg-primary/80 text-primary-foreground"
            onClick={handleSave}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações do Agente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RenusCoreConfig;