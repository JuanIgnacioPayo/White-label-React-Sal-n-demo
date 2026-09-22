import { useState, useRef } from 'react';
import { toast } from 'react-toastify';

export const initialFormData = {
    nombreCliente: '',
    telefono: '',
    descripcionEvento: '',
    precioAlquilerPersonalizado: '',
    descuento: '',
    tipoDescuento: 'porcentaje',
    motivoDescuento: '',
    seña: '',
    inicioEvento: '',
    finEvento: '',
    horasPrevias: '',
    agregadoManual: '',
    precioAgregadoManual: '',
    cuit: '',
    razonSocial: '',
    razonSocialCuit: '',
    domicilio: '',
    condicionIva: '',
    cantidadInvitados: '',
    notaAlquiler: '',
};

export default function usePresupuestoForm() {
    const [formData, setFormData] = useState(initialFormData);
    const [newDepositAmount, setNewDepositAmount] = useState('');
    const [lastDeposit, setLastDeposit] = useState(0);

    const nombreClienteRef = useRef(null);
    const telefonoRef = useRef(null);
    const descripcionEventoRef = useRef(null);
    const precioAlquilerPersonalizadoRef = useRef(null);
    const descuentoRef = useRef(null);
    const motivoDescuentoRef = useRef(null);
    const señaRef = useRef(null);
    const inicioEventoRef = useRef(null);
    const finEventoRef = useRef(null);
    const agregadoManualRef = useRef(null);
    const precioAgregadoManualRef = useRef(null);
    const generarResumenBtnRef = useRef(null);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        if (name === 'nombreCliente') {
            newValue = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        } else if (name === 'descripcionEvento') {
            newValue = value.charAt(0).toUpperCase() + value.slice(1);
        } else if (name === 'agregadoManual') {
            newValue = value.charAt(0).toUpperCase() + value.slice(1);
        }

        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const handleNewDeposit = (setGenerateReceiptOnSave, setShouldSave, directDepositAmount = null) => {
        const deposit = directDepositAmount !== null ? parseFloat(directDepositAmount) : parseFloat(newDepositAmount);
        if (isNaN(deposit) || deposit <= 0) {
            toast.error("Ingresa un monto válido para la seña adicional.");
            return;
        }

        setLastDeposit(deposit);

        setFormData(prev => {
            const currentSena = parseFloat(prev.seña || 0);
            const newSena = currentSena + deposit;
            return {
                ...prev,
                seña: newSena.toFixed(0),
            };
        });
        setNewDepositAmount('');
        toast.success(`Seña adicional de $${deposit.toFixed(0)} agregada.`);
        setGenerateReceiptOnSave(true);
        setShouldSave(true);
    };

    return {
        formData,
        setFormData,
        newDepositAmount,
        setNewDepositAmount,
        lastDeposit,
        setLastDeposit,
        refs: {
            nombreClienteRef,
            telefonoRef,
            descripcionEventoRef,
            precioAlquilerPersonalizadoRef,
            descuentoRef,
            motivoDescuentoRef,
            señaRef,
            inicioEventoRef,
            finEventoRef,
            agregadoManualRef,
            precioAgregadoManualRef,
            generarResumenBtnRef,
        },
        handleFormChange,
        handleNewDeposit
    };
}
