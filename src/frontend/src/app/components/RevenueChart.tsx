import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RevenueChartProps {
  data?: {
    dates: string[];
    revenue: number[];
    expenses: number[];
  };
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Transform data into chart format
  const chartData = data && data.dates && data.dates.length > 0
    ? data.dates.map((date, index) => ({
        mes: date,
        ingresos: data.revenue[index] || 0,
        gastos: data.expenses[index] || 0,
      }))
    : [
        { mes: 'Sin datos', ingresos: 0, gastos: 0 },
      ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Ingresos vs Gastos</h3>
        <p className="text-sm text-muted-foreground">Últimos 30 días</p>
      </div>
      
      {chartData.length === 1 && chartData[0].mes === 'Sin datos' ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No hay datos disponibles
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis 
              dataKey="mes" 
              stroke="#64748B"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748B"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Area 
              type="monotone" 
              dataKey="ingresos" 
              stroke="#2563EB" 
              fillOpacity={1} 
              fill="url(#colorIngresos)"
              name="Ingresos"
            />
            <Area 
              type="monotone" 
              dataKey="gastos" 
              stroke="#8B5CF6" 
              fillOpacity={1} 
              fill="url(#colorGastos)"
              name="Gastos"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}