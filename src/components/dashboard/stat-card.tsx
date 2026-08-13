'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Percentage trend; null hides the indicator. */
  trend?: number | null;
  /** Tone used for the icon chip. */
  tone?: 'green' | 'blue' | 'yellow' | 'purple' | 'red' | 'indigo' | 'slate';
  sublabel?: string;
  loading?: boolean;
  index?: number;
  /** Comparison period label shown next to the trend badge. */
  trendLabel?: string;
}

const TONES: Record<string, string> = {
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  yellow: 'bg-amber-100 text-amber-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  slate: 'bg-slate-100 text-slate-600',
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend = null,
  tone = 'green',
  sublabel,
  loading = false,
  index = 0,
  trendLabel = 'vs yesterday',
}: StatCardProps) {
  const trendUp = (trend ?? 0) > 0;
  const trendDown = (trend ?? 0) < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
              )}
              {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', TONES[tone])}>
              <Icon className="w-6 h-6" />
            </div>
          </div>

          {trend !== null && !loading && (
            <div className="flex items-center gap-1 mt-3">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5',
                  trendUp ? 'bg-green-50 text-green-600' : trendDown ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                )}
              >
                {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : trendDown ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {Math.abs(trend ?? 0)}%
              </span>
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
