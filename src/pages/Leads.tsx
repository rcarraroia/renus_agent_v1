import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FileText, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { handleError } from "@/lib/error-handler";

interface Lead {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  nicho: string;
  data: string;
}

const LeadsPage: React.FC = () => {
  // Fetch leads from API
  const { data: leads, isLoading, error } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        return await apiClient.get<Lead[]>('/api/v1/leads');
      } catch (err) {
        handleError(err, 'Falha ao carregar leads');
        throw err;
      }
    },
  });
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Leads Coletados</h1>

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
                <SelectItem value="imobiliaria">Imobiliária</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-muted-foreground">Data:</label>
            <Button variant="outline" className="bg-card">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Filtrar por Data
            </Button>
          </div>
          <Button variant="secondary" className="ml-auto bg-primary hover:bg-primary/80 text-primary-foreground">
            <FileText className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="bg-secondary/30 border-primary/20">
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando leads...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar leads. Tente novamente.
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lead encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-secondary/50">
                  {["Nome", "E-mail", "WhatsApp", "Nicho", "Data", "Ações"].map((header) => (
                    <TableHead key={header} className="text-primary">{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-secondary/50">
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.whatsapp}</TableCell>
                    <TableCell>{lead.nicho}</TableCell>
                    <TableCell>{lead.data}</TableCell>
                    <TableCell>
                      <Button variant="link" className="text-primary p-0 h-auto">Visualizar</Button>
                    </TableCell>
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

export default LeadsPage;