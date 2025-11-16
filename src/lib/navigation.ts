import { Home, Users, MessageSquare, List, Lightbulb, Send, Settings, LucideIcon, FileText, Mic } from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  route: string;
}

export const navItems: NavItem[] = [
  { icon: Home, label: "Visão Geral", route: "/dashboard" },
  { icon: Mic, label: "Voice Agent", route: "/voice" },
  { icon: Users, label: "Leads", route: "/dashboard/leads" },
  { icon: MessageSquare, label: "Respostas", route: "/dashboard/respostas" },
  { icon: List, label: "Funcionalidades", route: "/dashboard/funcionalidades" },
  { icon: Lightbulb, label: "Insights", route: "/dashboard/insights" },
  { icon: Send, label: "Feedbacks", route: "/dashboard/feedbacks" },
  { icon: FileText, label: "Documento Técnico", route: "/dashboard/documento-tecnico" },
  { icon: Settings, label: "Configurações", route: "/dashboard/config" },
];