import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../firebase/firebase';
import { format, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const DashboardContainer = styled.div`
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    margin-bottom: 2rem;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
`;

const Card = styled.div`
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 120px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    color: white;
    background: ${props => props.$isPaid ? '#4caf50' : '#f44336'};
    transition: transform 0.2s;

    &:hover {
        transform: translateY(-2px);
    }

    h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
    }

    .status {
        font-weight: bold;
        font-size: 1.2rem;
    }

    .details {
        font-size: 0.85rem;
        opacity: 0.9;
        margin-top: 5px;
    }
`;

const MonthSelector = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;

    button {
        padding: 5px 10px;
        cursor: pointer;
        border: 1px solid #ccc;
        background: #f9f9f9;
        border-radius: 5px;
    }
    
    span {
        font-weight: bold;
        text-transform: capitalize;
    }
`;

export default function DashboardImpuestosFijos({ currentDate, changeMonth }) {
    const [entities, setEntities] = useState([]);
    const [allExpenses, setAllExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getDatabase(app);

        // Fetch Payment Entities (Expected fixed taxes)
        const entitiesRef = ref(db, 'config/paymentEntities');
        onValue(entitiesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const entitiesArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setEntities(entitiesArray);
            }
        });

        // Fetch Gastos Empresa
        const gastosRef = ref(db, 'gastos_empresa');
        let tempGastos = [];
        onValue(gastosRef, (snapshot) => {
            tempGastos = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(key => {
                    const item = data[key];
                    tempGastos.push({
                        id: key,
                        company: item.nombre,
                        amount: item.monto,
                        // Parse YYYY-MM-DD
                        date: new Date(item.fecha + 'T12:00:00Z'), 
                        source: 'empresa'
                    });
                });
            }
            updateCombinedExpenses(tempGastos, null);
        });

        // Fetch Gastos Empleados
        const empleadosRef = ref(db, 'empleados');
        let tempEmpleadosExpenses = [];
        onValue(empleadosRef, (snapshot) => {
            tempEmpleadosExpenses = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(empId => {
                    const emp = data[empId];
                    if (emp.expenses) {
                        Object.keys(emp.expenses).forEach(expId => {
                            const exp = emp.expenses[expId];
                            tempEmpleadosExpenses.push({
                                id: expId,
                                company: exp.company,
                                amount: exp.amount,
                                date: new Date(exp.date), // Timestamp
                                source: 'empleado'
                            });
                        });
                    }
                });
            }
            updateCombinedExpenses(null, tempEmpleadosExpenses);
        });

        let currentGastos = [];
        let currentEmpleadosExpenses = [];

        function updateCombinedExpenses(gastos, empleadosExp) {
            if (gastos !== null) currentGastos = gastos;
            if (empleadosExp !== null) currentEmpleadosExpenses = empleadosExp;
            
            setAllExpenses([...currentGastos, ...currentEmpleadosExpenses]);
            setLoading(false);
        }

    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
    };

    // Process data for the current month
    const processedEntities = entities.map(entity => {
        // Find if there is any expense in the current month matching the entity name
        const payment = allExpenses.find(exp => {
            const isSame = isSameMonth(exp.date, currentDate);
            const matchesName = exp.company?.toLowerCase().includes(entity.name.toLowerCase()) || 
                                entity.name.toLowerCase().includes(exp.company?.toLowerCase());
            return isSame && matchesName;
        });

        return {
            ...entity,
            isPaid: !!payment,
            paymentData: payment
        };
    });

    if (loading) return <div style={{ padding: '1rem' }}>Cargando panel de impuestos...</div>;

    const today = new Date();
    const isCurrentMonth = currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();

    return (
        <DashboardContainer>
            <h3>Estado de Impuestos y Gastos Fijos</h3>
            
            <MonthSelector>
                <button onClick={() => changeMonth(-1)}>← Mes Anterior</button>
                <span>{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
                <button 
                    onClick={() => changeMonth(1)} 
                    disabled={isCurrentMonth}
                    style={{ opacity: isCurrentMonth ? 0.5 : 1, cursor: isCurrentMonth ? 'not-allowed' : 'pointer' }}
                >
                    Mes Siguiente →
                </button>
            </MonthSelector>

            {entities.length === 0 ? (
                <p style={{ color: '#666' }}>No tienes empresas de pago configuradas. Agrégalas al escanear facturas en un perfil de empleado.</p>
            ) : (
                <Grid>
                    {processedEntities.map(entity => (
                        <Card key={entity.id} $isPaid={entity.isPaid}>
                            <div>
                                <h4>{entity.name}</h4>
                                <div className="status">
                                    {entity.isPaid ? '✅ PAGADO' : '❌ PENDIENTE'}
                                </div>
                            </div>
                            {entity.isPaid && entity.paymentData && (
                                <div className="details">
                                    Monto: {formatCurrency(entity.paymentData.amount)}<br/>
                                    Fecha: {format(entity.paymentData.date, 'dd/MM/yyyy')}
                                </div>
                            )}
                        </Card>
                    ))}
                </Grid>
            )}
        </DashboardContainer>
    );
}
