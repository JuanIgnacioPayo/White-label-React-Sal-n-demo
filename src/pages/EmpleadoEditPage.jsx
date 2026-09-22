import { useLoading } from '../contexts/LoadingContext';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { ref, get, set, update, remove, onValue } from 'firebase/database';
import { uploadToFirebaseStorage } from '../utils/storageUpload';
import { database, storage } from '../firebase/firebase';
import { useAuth } from '../contexts/authContext';
import { useGoogleLogin } from '@react-oauth/google';
import PaymentEntitiesManager from '../components/GoogleDriveDropzone/PaymentEntitiesManager';
import GoogleDriveBrowser from '../components/GoogleDriveDropzone/GoogleDriveBrowser';
import defaultImage from '../assets/ilustracion-joven-sonriente_1308-174669.jpg';
import { safeStorage } from '../utils/safeStorage';

const PageContainer = styled.div`
    max-width: 1200px;
    margin: 2rem auto;
    padding: 2rem;
    background: var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    
    @media (max-width: 768px) {
        padding: 1rem;
        margin: 1rem;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    
    h1 {
        margin: 0;
        color: #333;
        font-size: 1.8rem;
    }
`;

const BackButton = styled.button`
    background: #6c757d;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: 0.2s;
    
    &:hover {
        background: #5a6268;
    }
`;

const FormSection = styled.div`
    background: white;
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow-x: hidden;
    
    @media (max-width: 768px) {
        padding: 1rem;
    }
    
    h2 {
        margin-top: 0;
        color: #333;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 10px;
        margin-bottom: 20px;
        word-break: break-word;
    }
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const FormField = styled.div`
    display: flex;
    flex-direction: column;
    
    label {
        font-weight: 600;
        margin-bottom: 8px;
        color: #555;
        font-size: 0.9rem;
    }
    
    input {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        
        &:focus {
            outline: none;
            border-color: #4caf50;
        }
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-top: 2rem;
    
    button {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
        font-size: 1rem;
        
        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }
    
    .save-btn {
        background: #4caf50;
        color: white;
        
        &:hover:not(:disabled) {
            background: #45a049;
        }
    }
    
    .delete-btn {
        background: #dc3545;
        color: white;
        
        &:hover:not(:disabled) {
            background: #c82333;
        }
    }
`;

const LoginButton = styled.button`
    background: #4285f4;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 auto 20px;
    transition: 0.2s;
    
    &:hover {
        background: #3367d6;
    }
`;

const MetricsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
`;

const MetricCard = styled.div`
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);

    h4 {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
    }
    
    .value {
        font-size: 1.5rem;
        font-weight: bold;
        color: #333;
        margin-top: 5px;
    }

    .value.danger {
        color: #d32f2f;
    }
`;

const TableContainer = styled.div`
    overflow-x: auto;
    
    table {
        width: 100%;
        border-collapse: collapse;
        min-width: 600px;
    }
    
    th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    
    th {
        background: #f1f1f1;
        font-weight: 600;
        color: #444;
    }
    
    tr:hover {
        background: #fafafa;
    }
    
    .danger-row {
        background-color: #ffebee;
    }
    
    .danger-row:hover {
        background-color: #ffcdd2;
    }
    
    .action-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: bold;
        margin-right: 5px;
    }
    
    .btn-pay {
        background: #2196F3;
        color: white;
    }
    
    .btn-pay:hover {
        background: #1976D2;
    }
    
    .btn-done {
        background: #4CAF50;
        color: white;
    }
    
    .btn-done:hover {
        background: #388E3C;
    }
`;

const EmpleadoEditPage = () => {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();

    const employeeId = searchParams.get('id');
    const isEditMode = !!employeeId;

    const [loading, setLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState({
        nombreCompleto: '',
        nombreCorto: '',
        cuit: '',
        fechaIngreso: '',
        googleDriveFolderId: '',
        foto: null
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        if (!currentUser) {
            navigate('/loginReciboPage');
            return;
        }

        let unsubscribe = null;
        if (isEditMode && employeeId) {
            fetchEmployeeData();
            
            const invoicesRef = ref(database, `employeeInvoices/${employeeId}`);
            unsubscribe = onValue(invoicesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const invList = Object.values(data);
                    invList.sort((a, b) => {
                        if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    });
                    setInvoices(invList);
                } else {
                    setInvoices([]);
                }
            });
        }
        
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser, isEditMode, employeeId]);
    const fetchEmployeeData = async () => {
        try {
            const employeeRef = ref(database, `empleados/${employeeId}`);
            const snapshot = await get(employeeRef);

            if (snapshot.exists()) {
                setEmployeeData(snapshot.val());
            } else {
                toast.error('Empleado no encontrado');
                navigate('/recibo');
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
            toast.error('Error al cargar datos del empleado');
        }
    };

    // Metrics Calculations
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    let nearestDueDate = null;
    let isNearestOverdue = false;
    let isNearestSoon = false;
    
    if (pendingInvoices.length > 0) {
        const sortedDates = [...pendingInvoices]
            .filter(inv => inv.dueDate)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            
        if (sortedDates.length > 0) {
            nearestDueDate = sortedDates[0].dueDate;
            // Get today at midnight local time to avoid timezone edge cases with simple MS diff
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Parse dueDate string ('YYYY-MM-DD') in local time
            const [ceYear, ceMonth, ceDay] = nearestDueDate.split('-').map(Number);
            const due = new Date(ceYear, ceMonth - 1, ceDay);
            
            const msDiff = due - today;
            const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 0) isNearestOverdue = true;
            else if (daysDiff <= 3) isNearestSoon = true;
        }
    }

    const handleMarkAsPaid = async (invoiceId) => {
        try {
            await update(ref(database, `employeeInvoices/${employeeId}/${invoiceId}`), {
                status: 'paid',
                paidAt: Date.now()
            });
            toast.success("Factura marcada como pagada");
        } catch (error) {
            console.error("Error marking invoice as paid:", error);
            toast.error("Error al actualizar la factura");
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'foto') {
            setPhotoFile(files[0]);
        } else if (name === 'googleDriveFolderId') {
            // Extract ID from URL if needed
            let cleanId = value;
            if (value.includes('drive.google.com')) {
                const match = value.match(/folders\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) cleanId = match[1];
            }
            setEmployeeData(prev => ({ ...prev, [name]: cleanId }));
        } else {
            setEmployeeData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!employeeData.nombreCorto || !employeeData.nombreCompleto) {
            toast.error('Complete los campos obligatorios');
            return;
        }

        setLoading(true);

        try {
            let photoUrl = employeeData.foto;

            // Upload photo if changed
            if (photoFile) {
                photoUrl = await uploadToFirebaseStorage(photoFile);
            }

            const dataToSave = {
                ...employeeData,
                foto: photoUrl || ""
            };

            // Firebase throws an error if any value is undefined. Convert undefined to null.
            Object.keys(dataToSave).forEach(key => {
                if (dataToSave[key] === undefined) {
                    dataToSave[key] = null;
                }
            });

            if (isEditMode) {
                // Update existing
                const employeeRef = ref(database, `empleados/${employeeId}`);
                await update(employeeRef, dataToSave);
                toast.success('Empleado actualizado exitosamente');
            } else {
                // Create new
                const employeesRef = ref(database, 'empleados');
                const newEmployeeRef = ref(database, `empleados/${Date.now()}`);
                await set(newEmployeeRef, dataToSave);
                toast.success('Empleado creado exitosamente');
            }

            navigate('/recibo');
        } catch (error) {
            console.error('Error saving employee:', error);
            toast.error('Error al guardar empleado');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`¿Eliminar empleado "${employeeData.nombreCompleto}"?`)) return;

        setLoading(true);

        try {
            const employeeRef = ref(database, `empleados/${employeeId}`);
            await remove(employeeRef);
            toast.success('Empleado eliminado');
            navigate('/recibo');
        } catch (error) {
            console.error('Error deleting employee:', error);
            toast.error('Error al eliminar empleado');
        } finally {
            setLoading(false);
        }
    };

    // Google Drive Authentication State
    const [accessToken, setAccessToken] = useState(() => safeStorage.getItem('googleAccessToken') || null);
    const [tokenExpiry, setTokenExpiry] = useState(() => {
        const expiry = safeStorage.getItem('googleTokenExpiry');
        return expiry ? parseInt(expiry, 10) : null;
    });

    // Check if token is expired
    useEffect(() => {
        if (tokenExpiry && Date.now() > tokenExpiry) {
            setAccessToken(null);
            safeStorage.removeItem('googleAccessToken');
            safeStorage.removeItem('googleTokenExpiry');
        }
    }, [tokenExpiry]);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            const expiryTime = Date.now() + tokenResponse.expires_in * 1000;
            setAccessToken(tokenResponse.access_token);
            setTokenExpiry(expiryTime);
            safeStorage.setItem('googleAccessToken', tokenResponse.access_token);
            safeStorage.setItem('googleTokenExpiry', expiryTime.toString());
            toast.success('Conectado a Google Drive');
        },
        onError: () => toast.error('Error al conectar con Google Drive'),
        scope: 'https://www.googleapis.com/auth/drive'
    });

    const handleForceLogin = () => {
        setAccessToken(null);
        safeStorage.removeItem('googleAccessToken');
        safeStorage.removeItem('googleTokenExpiry');
        setTimeout(() => handleGoogleLogin(), 100);
    };

    return (
        <PageContainer>
            <Header>
                <h1>{isEditMode ? 'Editar Empleado' : 'Nuevo Empleado'}</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        style={{ background: '#2196F3', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                        onClick={() => navigate('/dashboard-sueldos')}
                    >
                        📊 Ver Dashboard de Sueldos
                    </button>
                    <BackButton onClick={() => navigate('/recibo')}>
                        ← Volver
                    </BackButton>
                </div>
            </Header>

            <FormSection>
                <h2>📋 Datos del Empleado</h2>
                <form onSubmit={handleSave}>
                    <FormGrid>
                        <FormField>
                            <label>Nombre Corto *</label>
                            <input
                                name="nombreCorto"
                                value={employeeData.nombreCorto}
                                onChange={handleChange}
                                placeholder="Ej: Lorena"
                                required
                            />
                        </FormField>

                        <FormField>
                            <label>Nombre Completo *</label>
                            <input
                                name="nombreCompleto"
                                value={employeeData.nombreCompleto}
                                onChange={handleChange}
                                placeholder="Ej: Lorena Perez"
                                required
                            />
                        </FormField>

                        <FormField>
                            <label>CUIT</label>
                            <input
                                name="cuit"
                                value={employeeData.cuit}
                                onChange={handleChange}
                                placeholder="27-12345678-9"
                            />
                        </FormField>

                        <FormField>
                            <label>Fecha de Ingreso</label>
                            <input
                                type="date"
                                name="fechaIngreso"
                                value={employeeData.fechaIngreso}
                                onChange={handleChange}
                            />
                        </FormField>

                        <FormField style={{ gridColumn: '1 / -1' }}>
                            <label>ID Carpeta Drive</label>
                            <input
                                name="googleDriveFolderId"
                                value={employeeData.googleDriveFolderId}
                                onChange={handleChange}
                                placeholder="Ej: 1wymjfH... o URL completa"
                            />
                        </FormField>

                        <FormField>
                            <label>Foto</label>
                            <input
                                type="file"
                                name="foto"
                                accept="image/*"
                                onChange={handleChange}
                            />
                        </FormField>
                    </FormGrid>

                    <ButtonGroup>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? (isEditMode ? 'Guardando...' : 'Creando...') : (isEditMode ? 'Guardar Cambios' : 'Crear Empleado')}
                        </button>

                        {isEditMode && (
                            <button type="button" className="delete-btn" onClick={handleDelete} disabled={loading}>
                                Eliminar Empleado
                            </button>
                        )}
                    </ButtonGroup>
                </form>
            </FormSection>

            {/* Payment Entities Manager */}
            <FormSection>
                <PaymentEntitiesManager />
            </FormSection>

            {/* Google Drive Browser */}
            {isEditMode && employeeData.googleDriveFolderId && (
                <FormSection>
                    <h2>📁 Archivos de Google Drive</h2>
                    {!accessToken ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p style={{ marginBottom: '1rem', color: '#666' }}>
                                Conectá tu cuenta de Google para gestionar archivos de Drive.
                                <br/>
                                <small style={{ color: '#999' }}>(Por reglas de seguridad de Google, la conexión expira cada 1 hora y deberás volver a conectar)</small>
                            </p>
                            <LoginButton onClick={handleGoogleLogin}>
                                🔐 Conectar con Google Drive
                            </LoginButton>
                        </div>
                    ) : (
                        <GoogleDriveBrowser
                            rootFolderId={employeeData.googleDriveFolderId}
                            accessToken={accessToken}
                            employeeName={employeeData.nombreCompleto}
                            employeeId={employeeId}
                            onAuthError={handleForceLogin}
                        />
                    )}
                </FormSection>
            )}

            {/* Facturas Pendientes Section */}
            {isEditMode && (
                <FormSection>
                    <h2>🧾 Facturas Pendientes ({pendingInvoices.length})</h2>
                    
                    <MetricsGrid>
                        <MetricCard>
                            <h4>Facturas Pendientes</h4>
                            <div className="value">{pendingInvoices.length}</div>
                        </MetricCard>
                        <MetricCard>
                            <h4>Monto Total</h4>
                            <div className="value">${totalPendingAmount.toLocaleString('es-AR')}</div>
                        </MetricCard>
                        <MetricCard>
                            <h4>Próximo Vencimiento</h4>
                            <div className={`value ${isNearestOverdue || isNearestSoon ? 'danger' : ''}`}>
                                {nearestDueDate ? (() => {
                                    const [y, m, d] = nearestDueDate.split('-');
                                    return `${d}/${m}/${y}`;
                                })() : 'Ninguno'}
                                {isNearestOverdue && ' (Vencido)'}
                                {isNearestSoon && !isNearestOverdue && ' (Pronto)'}
                            </div>
                        </MetricCard>
                    </MetricsGrid>

                    {pendingInvoices.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No hay facturas pendientes de pago.</p>
                    ) : (
                        <TableContainer>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Empresa</th>
                                        <th>Vencimiento</th>
                                        <th>Monto</th>
                                        <th>Archivo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingInvoices.map((inv) => {
                                        let isDanger = false;
                                        let formattedDate = 'N/A';
                                        if (inv.dueDate) {
                                            const now = new Date();
                                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                            const [y, m, d] = inv.dueDate.split('-').map(Number);
                                            const due = new Date(y, m - 1, d);
                                            const msDiff = due - today;
                                            const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
                                            isDanger = daysDiff <= 3;
                                            formattedDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
                                        }
                                        
                                        return (
                                            <tr key={inv.id} className={isDanger ? 'danger-row' : ''}>
                                                <td>{inv.entityName || 'Desconocida'}</td>
                                                <td style={{ color: isDanger ? '#d32f2f' : 'inherit', fontWeight: isDanger ? 'bold' : 'normal' }}>
                                                    {formattedDate}
                                                </td>
                                                <td>${(inv.amount || 0).toLocaleString('es-AR')}</td>
                                                <td>
                                                    {inv.driveFileLink && (
                                                        <a href={inv.driveFileLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>
                                                            Ver Factura
                                                        </a>
                                                    )}
                                                </td>
                                                <td>
                                                    <button 
                                                        className="action-btn btn-pay"
                                                        onClick={() => {
                                                            if (inv.barcode) navigator.clipboard.writeText(inv.barcode).catch(()=>{});
                                                            const url = inv.paymentEndpoint || 'https://www.mercadopago.com.ar/sp/recurrent/entities-search?type=oneshot';
                                                            window.open(url, '_blank');
                                                            handleMarkAsPaid(inv.id);
                                                        }}
                                                        title={inv.barcode ? "Copia el código, abre MP y marca como pagada" : "Abre Mercado Pago y marca como pagada"}
                                                    >
                                                        Pagar en MP
                                                    </button>
                                                    <button 
                                                        className="action-btn btn-done"
                                                        onClick={() => handleMarkAsPaid(inv.id)}
                                                    >
                                                        ✔ Pagada
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </TableContainer>
                    )}
                </FormSection>
            )}
        </PageContainer>
    );
};

export default EmpleadoEditPage;
