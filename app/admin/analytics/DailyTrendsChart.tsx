'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors } from '@/lib/theme';

interface DailyTrend {
  date: string;
  logins: number;
  pageViews: number;
  activeUsers: number;
}

interface DailyTrendsChartProps {
  data: DailyTrend[];
}

export default function DailyTrendsChart({ data }: DailyTrendsChartProps) {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis
            dataKey="date"
            stroke={colors.textLight}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={colors.textLight}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: colors.textPrimary, fontWeight: '600' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Line
            type="monotone"
            dataKey="logins"
            stroke="#007bff"
            strokeWidth={2}
            name="Logins"
            dot={{ fill: '#007bff', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="pageViews"
            stroke="#28a745"
            strokeWidth={2}
            name="Page Views"
            dot={{ fill: '#28a745', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="activeUsers"
            stroke="#ffc107"
            strokeWidth={2}
            name="Active Users"
            dot={{ fill: '#ffc107', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
