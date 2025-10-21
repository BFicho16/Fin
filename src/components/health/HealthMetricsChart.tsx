'use client';

import { useState, useEffect } from 'react';
import { useHealthDataRealtime } from '@/lib/supabase/realtime';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface HealthMetric {
  id: string;
  metric_type: string;
  value: number;
  unit: string;
  logged_at: string;
}

interface HealthMetricsChartProps {
  userId: string;
}

export default function HealthMetricsChart({ userId }: HealthMetricsChartProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('weight');
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30');

  useEffect(() => {
    fetchMetrics();
  }, [userId, selectedMetric, timeRange]);

  // Set up realtime subscriptions
  useHealthDataRealtime(userId, {
    onHealthMetricsUpdate: () => {
      fetchMetrics();
    }
  });

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `/api/health-metrics/${userId}?metric_type=${selectedMetric}&start_date=${startDate}&end_date=${endDate}&limit=100`
      );
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Transform data for chart
  const chartData = metrics
    .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
    .map(metric => ({
      date: new Date(metric.logged_at).toLocaleDateString(),
      value: metric.value,
      unit: metric.unit,
      fullDate: metric.logged_at
    }));

  const availableMetrics = Array.from(new Set(metrics.map(m => m.metric_type)));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Health Metrics Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No health metrics data available.</p>
            <p className="text-sm">Use the chat to log your weight, height, and other health metrics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Health Metrics Trends
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                {availableMetrics.map(metric => (
                  <SelectItem key={metric} value={metric}>
                    {metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value} ${props.payload.unit}`,
                  selectedMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                ]}
                labelFormatter={(label: string, payload: any) => {
                  if (payload && payload[0]) {
                    return new Date(payload[0].payload.fullDate).toLocaleDateString();
                  }
                  return label;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              Showing {chartData.length} data points over the last {timeRange} days
            </p>
            <p>
              Latest: {chartData[chartData.length - 1]?.value} {chartData[chartData.length - 1]?.unit} 
              ({chartData[chartData.length - 1]?.date})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
