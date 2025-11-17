import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, TrendingUp, Loader2 } from "lucide-react";
import { useInsights } from "@/hooks/useInsights";

const InsightsPage: React.FC = () => {
  const { data: insights, isLoading, error } = useInsights();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando insights...</span>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="text-center py-8 text-destructive">
        Erro ao carregar insights. Tente novamente.
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Insights e Recomendações</h1>

      {/* Summary */}
      <Card className="bg-secondary/30 border-primary/20">
        <CardHeader>
          <CardTitle>Resumo Automático das Pesquisas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {insights.resumo}
          </p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-secondary/30 border-primary/20">
        <CardHeader>
          <CardTitle>Recomendações do RENUS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-background/50 rounded-lg border border-border">
            <p className="text-sm text-foreground">
              {insights.recomendacoes}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Trends List */}
      <Card className="bg-secondary/30 border-primary/20">
        <CardHeader className="flex flex-row items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Tendências Identificadas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.tendencias.map((trend, index) => (
              <li key={index} className="flex items-center text-foreground/80">
                <List className="h-4 w-4 mr-3 text-primary/70 flex-shrink-0" />
                {trend}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsPage;