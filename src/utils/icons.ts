import {
  BookOpen, Rocket, PenTool, ShoppingBag, Users, Plug,
  BarChart2, Globe, CreditCard, HelpCircle, Tag, Star,
  Zap, Mail, Settings, FileText, LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Rocket,
  PenTool,
  ShoppingBag,
  Users,
  Plug,
  BarChart2,
  Globe,
  CreditCard,
  HelpCircle,
  Tag,
  Star,
  Zap,
  Mail,
  Settings,
  FileText,
};

export function getCategoryIcon(name: string): LucideIcon {
  return iconMap[name] ?? BookOpen;
}
