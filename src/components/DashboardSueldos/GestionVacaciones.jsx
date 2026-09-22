import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, onValue, push, remove, set } from "firebase/database";
import { app } from "../../firebase/firebase";
import { format, differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function GestionVacaciones() {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [vacationData, setVacationData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const database = getDatabase(app);

    useEffect(() => {
        const employeesRef = ref(database, 'empleados');
        onValue(employeesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setEmployees(list);
            }
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedEmployeeId) return;

        const vacationsRef = ref(database, `vacaciones/${selectedEmployeeId}/${currentYear}`);
        onValue(vacationsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setVacationData(list);
            } else {
                setVacationData([]);
            }
        });
    }, [selectedEmployeeId, currentYear]);

    const getSeniorityData = (fechaIngreso) => {
        if (!fechaIngreso) return { years: 0, months: 0, daysTotal: 0 };

        const ingreso = parseISO(fechaIngreso);
        const cutoffDate = new Date(currentYear, 11, 31); // 31 de Diciembre del año actual

        // Calculate diff to cutoff date
        let years = differenceInYears(cutoffDate, ingreso);

        // Logic CCT 130/75
        // < 6 months: 1 day per 20 worked (approx, usually calculated manually but we can default to 0 or pro-rate)
        // 6m - 5y: 14 days
        // 5y - 10y: 21 days
        // 10y - 20y: 28 days
        // +20y: 35 days

        let daysTotal = 0;

        // Check if less than 6 months by end of year
        const months = differenceInMonths(cutoffDate, ingreso);

        if (months < 6) {
            // 1 day for every 20 days worked approx.
            // Exact calculation is: days worked / 20.
            const daysWorked = Math.floor((cutoffDate - ingreso) / (1000 * 60 * 60 * 24));
            daysTotal = Math.floor(daysWorked / 20);
        } else if (years < 5) {
            daysTotal = 14;
        } else if (years < 10) {
            daysTotal = 21;
        } else if (years < 20) {
            daysTotal = 28;
        } else {
            daysTotal = 35;
        }

        return { years, months, daysTotal };
    };

    const handleAddVacation = async () => {
        if (!startDate || !endDate || !selectedEmployeeId) return;

        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const daysTaken = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (daysTaken <= 0) {
            alert("La fecha de fin debe ser posterior a la de inicio.");
            return;
        }

        const vacationsRef = ref(database, `vacaciones/${selectedEmployeeId}/${currentYear}`);
        await push(vacationsRef, {
            startDate,
            endDate,
            daysTaken,
            createdAt: new Date().toISOString()
        });

        setStartDate('');
        setEndDate('');
    };

    const handleDeleteVacation = async (vacationId) => {
        if (window.confirm("¿Eliminar este registro de vacaciones?")) {
            const vacationRef = ref(database, `vacaciones/${selectedEmployeeId}/${currentYear}/${vacationId}`);
            await remove(vacationRef);
        }
    };

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
    const seniority = selectedEmployee ? getSeniorityData(selectedEmployee.fechaIngreso) : { years: 0, daysTotal: 0 };
    const daysUsed = vacationData.reduce((acc, curr) => acc + curr.daysTaken, 0);
    const daysRemaining = seniority.daysTotal - daysUsed;

    return (
        <Container>
            <h3>Gestión de Vacaciones (CCT 130/75)</h3>

            <ControlBar>
                <SelectGroup>
                    <label>Año:</label>
                    <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))}>
                        {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </SelectGroup>

                <SelectGroup>
                    <label>Empleado:</label>
                    <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nombreCompleto}</option>
                        ))}
                    </select>
                </SelectGroup>
            </ControlBar>

            {selectedEmployee && (
                <>
                    <SummaryCard>
                        <InfoItem>
                            <span>Fecha Ingreso:</span>
                            <strong>{selectedEmployee.fechaIngreso ? format(parseISO(selectedEmployee.fechaIngreso), 'dd/MM/yyyy') : '-'}</strong>
                        </InfoItem>
                        <InfoItem>
                            <span>Antigüedad (al 31/12):</span>
                            <strong>{seniority.years} años ({seniority.months} meses)</strong>
                        </InfoItem>
                        <InfoItem>
                            <span>Corresponden:</span>
                            <strong style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>{seniority.daysTotal} días</strong>
                        </InfoItem>
                        <InfoItem>
                            <span>Tomados:</span>
                            <strong>{daysUsed}</strong>
                        </InfoItem>
                        <InfoItem>
                            <span>Restantes:</span>
                            <strong style={{ color: daysRemaining < 0 ? 'red' : 'green' }}>{daysRemaining}</strong>
                        </InfoItem>
                    </SummaryCard>

                    <FormContainer>
                        <h4>Registrar Vacaciones</h4>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                            <FormGroup>
                                <label>Desde:</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </FormGroup>
                            <FormGroup>
                                <label>Hasta:</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </FormGroup>
                            <Button onClick={handleAddVacation} disabled={!startDate || !endDate}>Agregar</Button>
                        </div>
                    </FormContainer>

                    <Table>
                        <thead>
                            <tr>
                                <th>Desde</th>
                                <th>Hasta</th>
                                <th>Días</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vacationData.length > 0 ? vacationData.map(v => (
                                <tr key={v.id}>
                                    <td>{format(parseISO(v.startDate), 'dd/MM/yyyy')}</td>
                                    <td>{format(parseISO(v.endDate), 'dd/MM/yyyy')}</td>
                                    <td>{v.daysTaken}</td>
                                    <td>
                                        <DeleteButton onClick={() => handleDeleteVacation(v.id)}>Eliminar</DeleteButton>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>No hay vacaciones registradas este año.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </>
            )}
        </Container>
    );
}

const Container = styled.div`
    padding: 1rem;
    font-family: 'product_sansregular';
`;

const ControlBar = styled.div`
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    
    @media (max-width: 768px) {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }
`;

const SelectGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
        font-weight: bold;
        color: #555;
    }

    select {
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid #ced4da;
        min-width: 200px;
        width: 100%;
        box-sizing: border-box;
    }
    
    @media (max-width: 768px) {
        select {
            min-width: unset;
        }
    }
`;

const SummaryCard = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    margin-bottom: 2rem;
    border: 1px solid #e0e0e0;
    
    @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        padding: 1rem;
        gap: 0.8rem;
    }
    
    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
`;

const InfoItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    text-align: center;

    span {
        font-size: 0.9rem;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    strong {
        font-size: 1.1rem;
        color: #333;
    }
`;

const FormContainer = styled.div`
    background: #e8f5e9;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 1px solid #c8e6c9;

    h4 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #2e7d32;
    }
    
    > div {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
        
        @media (max-width: 768px) {
            flex-direction: column;
            align-items: stretch;
        }
    }
    
    @media (max-width: 768px) {
        padding: 1rem;
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;

    input {
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid #ccc;
        width: 100%;
        box-sizing: border-box;
    }
`;

const Button = styled.button`
    padding: 0.5rem 1.5rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    height: 38px;
    white-space: nowrap;

    &:hover {
        opacity: 0.9;
    }
    
    &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }
    
    @media (max-width: 768px) {
        width: 100%;
        height: auto;
        padding: 0.75rem;
    }
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    display: block;
    overflow-x: auto;

    th, td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #eee;
        white-space: nowrap;
    }

    th {
        background-color: #f1f3f5;
        font-weight: bold;
        color: #495057;
    }

    td {
        color: #333;
    }
    
    @media (max-width: 768px) {
        th, td {
            padding: 0.75rem 0.5rem;
            font-size: 0.9rem;
        }
    }
`;

const DeleteButton = styled.button`
    background: #ffcdd2;
    color: #c62828;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;

    &:hover {
        background: #ef9a9a;
    }
`;
