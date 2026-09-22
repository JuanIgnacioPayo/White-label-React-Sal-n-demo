import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ref, onValue, set, remove } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaPlus, FaTrash, FaFileAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal, { ModalButton, ModalButtonContainer } from '../Modal';

const ExpensesCard = ({ employeeId, employeeName }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({
        company: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (!employeeId) {
            setLoading(false);
            return;
        }

        const expensesRef = ref(database, `empleados/${employeeId}/expenses`);
        const unsubscribe = onValue(expensesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const expensesArray = Object.entries(data).map(([id, expense]) => ({
                    id,
                    ...expense
                }));

                // Sort by date descending
                expensesArray.sort((a, b) => b.date - a.date);
                setExpenses(expensesArray);
            } else {
                setExpenses([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [employeeId]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (timestamp) => {
        try {
            return format(new Date(timestamp), 'dd/MM/yyyy', { locale: es });
        } catch (e) {
            return '-';
        }
    };

    const getTotalExpenses = () => {
        return expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    };

    const handleAddExpense = () => {
        if (!newExpense.company.trim() || !newExpense.amount) {
            toast.error('Complete todos los campos');
            return;
        }

        const expenseRef = ref(database, `empleados/${employeeId}/expenses/${Date.now()}`);
        const expenseData = {
            company: newExpense.company.trim(),
            amount: parseFloat(newExpense.amount),
            date: new Date(newExpense.date).getTime(),
            createdAt: Date.now(),
            manual: true
        };

        set(expenseRef, expenseData)
            .then(() => {
                toast.success('Gasto agregado');
                setNewExpense({ company: '', amount: '', date: new Date().toISOString().split('T')[0] });
                setIsAddModalOpen(false);
            })
            .catch((error) => {
                console.error('Error adding expense:', error);
                toast.error('Error al agregar gasto');
            });
    };

    const handleDeleteExpense = (expenseId, company) => {
        if (!window.confirm(`¿Eliminar gasto de "${company}"?`)) return;

        const expenseRef = ref(database, `empleados/${employeeId}/expenses/${expenseId}`);
        remove(expenseRef)
            .then(() => toast.success('Gasto eliminado'))
            .catch((error) => {
                console.error('Error deleting expense:', error);
                toast.error('Error al eliminar gasto');
            });
    };

    if (!employeeId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>💰 Cargas Sociales y Gastos</CardTitle>
                </CardHeader>
                <EmptyState>Seleccioná un empleado para ver sus gastos</EmptyState>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>💰 Cargas Sociales y Gastos</CardTitle>
                    <AddButton onClick={() => setIsAddModalOpen(true)}>
                        <FaPlus /> Agregar Gasto
                    </AddButton>
                </CardHeader>

                {loading ? (
                    <EmptyState>Cargando gastos...</EmptyState>
                ) : expenses.length === 0 ? (
                    <EmptyState>
                        No hay gastos registrados.<br />
                        Hacé click en "Agregar Gasto" para crear uno.
                    </EmptyState>
                ) : (
                    <>
                        <ExpensesList>
                            {expenses.map((expense) => (
                                <ExpenseItem key={expense.id}>
                                    <ExpenseDate>{formatDate(expense.date)}</ExpenseDate>
                                    <ExpenseCompany>
                                        {expense.fileName && (
                                            <FaFileAlt style={{ marginRight: '6px', color: '#666' }} />
                                        )}
                                        {expense.company}
                                        {expense.manual && (
                                            <ManualBadge>Manual</ManualBadge>
                                        )}
                                    </ExpenseCompany>
                                    <ExpenseAmount>{formatCurrency(expense.amount)}</ExpenseAmount>
                                    <DeleteButton onClick={() => handleDeleteExpense(expense.id, expense.company)}>
                                        <FaTrash />
                                    </DeleteButton>
                                </ExpenseItem>
                            ))}
                        </ExpensesList>

                        <TotalRow>
                            <TotalLabel>Total Gastos:</TotalLabel>
                            <TotalAmount>{formatCurrency(getTotalExpenses())}</TotalAmount>
                        </TotalRow>
                    </>
                )}
            </Card>

            {/* Add Expense Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <h3>Agregar Gasto Manual</h3>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                    Para <strong>{employeeName}</strong>
                </p>
                <FormGrid>
                    <FormField>
                        <label>Empresa / Concepto *</label>
                        <input
                            type="text"
                            value={newExpense.company}
                            onChange={(e) => setNewExpense({ ...newExpense, company: e.target.value })}
                            placeholder="Ej: INACAP, OSDE, etc."
                        />
                    </FormField>
                    <FormField>
                        <label>Monto ($) *</label>
                        <input
                            type="number"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                            placeholder="0"
                            min="0"
                        />
                    </FormField>
                    <FormField style={{ gridColumn: '1 / -1' }}>
                        <label>Fecha</label>
                        <input
                            type="date"
                            value={newExpense.date}
                            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        />
                    </FormField>
                </FormGrid>
                <ModalButtonContainer>
                    <ModalButton onClick={handleAddExpense}>Agregar Gasto</ModalButton>
                    <ModalButton onClick={() => setIsAddModalOpen(false)} style={{ backgroundColor: '#ccc' }}>
                        Cancelar
                    </ModalButton>
                </ModalButtonContainer>
            </Modal>
        </>
    );
};

export default ExpensesCard;

// Styled Components
const Card = styled.div`
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    border: 1px solid #eee;
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
`;

const CardTitle = styled.h3`
    margin: 0;
    color: #555;
    font-size: 1.2rem;
`;

const AddButton = styled.button`
    background: #4caf50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    transition: 0.2s;

    &:hover {
        background: #45a049;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 3rem 1rem;
    color: #999;
    font-style: italic;
`;

const ExpensesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
`;

const ExpenseItem = styled.div`
    display: grid;
    grid-template-columns: 100px 1fr auto auto;
    align-items: center;
    padding: 12px;
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    transition: 0.2s;
    gap: 1rem;

    &:hover {
        background: #fafafa;
        border-color: #e0e0e0;
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }
`;

const ExpenseDate = styled.div`
    font-size: 0.9rem;
    color: #666;
    font-weight: 500;

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }
`;

const ExpenseCompany = styled.div`
    font-weight: 500;
    color: #333;
    display: flex;
    align-items: center;
`;

const ManualBadge = styled.span`
    background: #fff3cd;
    color: #856404;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    margin-left: 8px;
    font-weight: normal;
`;

const ExpenseAmount = styled.div`
    font-weight: bold;
    color: var(--primary-color);
    text-align: right;
    white-space: nowrap;
`;

const DeleteButton = styled.button`
    background: transparent;
    border: none;
    color: #dc3545;
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: 0.2s;

    &:hover {
        background: #ffe0e0;
    }
`;

const TotalRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 6px;
    margin-top: 1rem;
    border: 2px solid var(--primary-color);
`;

const TotalLabel = styled.div`
    font-weight: bold;
    font-size: 1.1rem;
    color: #333;
`;

const TotalAmount = styled.div`
    font-weight: bold;
    font-size: 1.3rem;
    color: var(--primary-color);
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const FormField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
        font-weight: 600;
        color: #555;
        font-size: 0.9rem;
    }

    input {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        width: 100%;
        box-sizing: border-box;

        &:focus {
            outline: none;
            border-color: var(--primary-color);
        }
    }
`;
