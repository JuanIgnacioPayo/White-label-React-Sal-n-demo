import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../../firebase/firebase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';

export default function GlobalPriceChart({ activeMonthsList, getBucketForMonth }) {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            if (!activeMonthsList || activeMonthsList.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const db = getDatabase(app);
            
            // Tomar hasta los últimos 12 meses
            const recentMonths = activeMonthsList.slice(-12);
            const dataPromises = recentMonths.map(async (yearMonthStr) => {
                const bucket = getBucketForMonth(yearMonthStr);
                const dbRef = ref(db, `datosId/${bucket}`);
                const snapshot = await get(dbRef);
                
                const [yStr, mStr] = yearMonthStr.split('-');
                const dateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1);
                const displayName = format(dateObj, 'MMM yy', { locale: es }).toUpperCase();

                let seña = 0;
                let precio4hs = 0;
                let ipc = '';

                if (snapshot.exists()) {
                    const val = snapshot.val();
                    seña = parseFloat(String(val['l_seña_'] || '0').replace(/[^\d.-]/g, '')) || 0;
                    precio4hs = parseFloat(String(val['a_precio_4hs_'] || '0').replace(/[^\d.-]/g, '')) || 0;
                    ipc = val['m_ipc_'] || '';
                }

                return {
                    name: displayName,
                    sortDate: dateObj,
                    'Seña': seña,
                    'Precio 4hs': precio4hs,
                    'IPC': ipc
                };
            });

            const results = await Promise.all(dataPromises);
            
            // Ordenar cronológicamente (aunque ya deberían estar ordenados)
            results.sort((a, b) => a.sortDate - b.sortDate);

            setChartData(results);
            setLoading(false);
        };

        fetchChartData();
    }, [activeMonthsList, getBucketForMonth]);

    if (loading) {
        return <ChartContainer><p>Cargando gráfico global...</p></ChartContainer>;
    }

    if (chartData.length === 0) {
        return null;
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <TooltipContainer>
                    <p className="label">{`${label}`}</p>
                    <p className="intro">IPC Estimado: {data.IPC || 'N/A'}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: ${entry.value.toLocaleString('es-AR')}
                        </p>
                    ))}
                </TooltipContainer>
            );
        }
        return null;
    };

    return (
        <ChartContainer>
            <h3>Evolución de Precios (Últimos 12 Meses)</h3>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis 
                            tickFormatter={(value) => `$${value / 1000}k`} 
                            tick={{ fontSize: 12 }} 
                            width={60} 
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="Precio 4hs" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={3} />
                        <Line type="monotone" dataKey="Seña" stroke="#82ca9d" strokeWidth={3} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </ChartContainer>
    );
}

const ChartContainer = styled.div`
    background-color: #ffffff;
    border-radius: 12px;
    padding: 20px;
    margin-top: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border: 1px solid rgba(0,0,0,0.05);

    h3 {
        text-align: center;
        color: #333;
        margin-bottom: 20px;
        font-family: 'product_sansbold', sans-serif;
    }

    .chart-wrapper {
        width: 100%;
        height: 300px;
    }
`;

const TooltipContainer = styled.div`
    background-color: rgba(255, 255, 255, 0.95);
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);

    .label {
        font-weight: bold;
        margin-bottom: 5px;
        color: #333;
    }

    .intro {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 5px;
    }

    p {
        margin: 0;
        font-size: 0.9rem;
        font-weight: bold;
    }
`;
