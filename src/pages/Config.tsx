import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Save } from "lucide-react";
import RenusCoreConfig from "@/components/config/RenusCoreConfig";

const ConfigPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema RENUS</h1>

      {/* Bloco 1: Agente Principal (RENUS Core) */}
      <RenusCoreConfig />

      <Separator className="bg-border/50" />

      {/* Bloco 2: Sub-Agentes Section */}
      <Card className="bg-secondary/30 border-primary/20">
        <CardHeader>
          <CardTitle>Sub-Agentes (Nichos)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Nome do Nicho */}
            <div className="space-y-2">
              <Label htmlFor="niche-name">Nome do Nicho</Label>
              <Input id="niche-name" placeholder="Ex: MMN" className="bg-card" />
            </div>
            
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="niche-description">Descrição</Label>
              <Textarea id="niche-description" placeholder="Breve descrição do público alvo..." className="bg-card min-h-[80px]" />
            </div>

            {/* Prompt Base */}
            <div className="space-y-2">
              <Label htmlFor="base-prompt">Prompt Base</Label>
              <Textarea id="base-prompt" placeholder="Instruções iniciais para o agente conversacional..." className="bg-card min-h-[150px]" />
            </div>

            {/* Ativo Toggle */}
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50">
                <Label htmlFor="active-toggle" className="font-medium">Ativo</Label>
                <Switch id="active-toggle" />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Nicho
            </Button>
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-border/50" />

      {/* Bloco 3: Sistema Section */}
      <Card className="bg-secondary/30 border-primary/20">
        <CardHeader>
          <CardTitle>Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Idioma */}
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select defaultValue="pt-BR">
                <SelectTrigger id="language" className="bg-card">
                  <SelectValue placeholder="Selecione o Idioma" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="pt-BR">Português (pt-BR)</SelectItem>
                  <SelectItem value="en-US">English (en-US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Tempo Máximo de Sessão */}
            <div className="space-y-2">
              <Label htmlFor="max-session">Tempo Máximo de Sessão (min)</Label>
              <Input id="max-session" type="number" defaultValue={60} className="bg-card" />
            </div>

            {/* Cor Tema Principal (Color Picker Placeholder) */}
            <div className="space-y-2">
              <Label htmlFor="theme-color">Cor Tema Principal</Label>
              <Input id="theme-color" type="color" defaultValue="#00d8ff" className="h-10 w-full p-1 bg-card border-border rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigPage;