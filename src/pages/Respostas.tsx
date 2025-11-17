import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Loader2 } from "lucide-react";
import { useRespostas } from "@/hooks/useRespostas";

const RespostasPage: React.FC = () => {
  const [nicho, setNicho] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  
  const { data: respostas, isLoading, error } = useRespostas({ 
    nicho: nicho || undefined, 
    keyword: keyword || undefined 
  });
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Respostas Coletadas</h1>

      {/* Filter Bar */}
      <Card className="bg-secondary/30 border-primary/20">
        <CardContent className="pt-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-muted-foreground">Nicho:</label>
            <Select>
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Selecione o Nicho" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mmn">MMN</SelectItem>
                <SelectItem value="saude">Saúde</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-muted-foreground">Palavra-chave:</label>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar..." 
                  className="pl-8 bg-card" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
            </div>
          </div>
          <Button variant="secondary" className="ml-auto bg-primary hover:bg-primary/80 text-primary-foreground">
            <FileText className="mr-2 h-4 w-4" />
            Exportar Tudo
          </Button>
        </CardContent>
      </Card>

      {/* Responses Table */}
      <Card className="bg-secondary/30 border-primary/20">
        <CardHeader>
          <CardTitle>Respostas Coletadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando respostas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar respostas. Tente novamente.
            </div>
          ) : !respostas || respostas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma resposta encontrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-secondary/50">
                  {["ID Lead", "Pergunta", "Resposta", "Nicho", "Data"].map((header) => (
                    <TableHead key={header} className="text-primary">{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {respostas.map((resp) => (
                  <TableRow key={resp.id} className="hover:bg-secondary/50">
                    <TableCell className="font-medium">{resp.leadId}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{resp.pergunta}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{resp.resposta}</TableCell>
                    <TableCell>{resp.nicho}</TableCell>
                    <TableCell>{resp.data}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RespostasPage;